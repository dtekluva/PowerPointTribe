from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Q, F, Count, Case, When, IntegerField
from django.utils import timezone
from datetime import datetime, timedelta
from .models import Customer, Product, WeeklyOrder, OrderItem, Debt, SalesEntry, Giveaway, Expense, CustomerOrder, CustomerOrderItem
from .serializers import (
    CustomerSerializer, ProductSerializer, WeeklyOrderSerializer,
    WeeklyOrderCreateSerializer, DebtSerializer, DebtPaymentSerializer,
    SalesEntrySerializer, SalesEntryCreateSerializer, BulkSalesEntrySerializer,
    GiveawaySerializer, ExpenseSerializer, CustomerOrderSerializer, CustomerOrderCreateSerializer
)


class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer

    @action(detail=True, methods=['get'])
    def debts(self, request, pk=None):
        customer = self.get_object()
        debts = customer.debts.filter(status__in=['outstanding', 'partial'])
        serializer = DebtSerializer(debts, many=True)
        return Response(serializer.data)


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.filter(is_active=True)
    serializer_class = ProductSerializer

    @action(detail=False, methods=['get'])
    def with_stock(self, request):
        """Get products with current stock levels from active weekly orders"""
        # Get the most recent active weekly order (current week's stock)
        active_order = WeeklyOrder.objects.filter(
            date__lte=timezone.now().date()
        ).order_by('-date').first()

        if not active_order:
            # No active order, return products with 0 stock
            products = self.get_queryset()
            products_data = []
            for product in products:
                product_data = ProductSerializer(product).data
                product_data['current_stock'] = 0
                product_data['reserved_stock'] = 0
                product_data['available_stock'] = 0
                products_data.append(product_data)
            return Response(products_data)

        # Get all products with their stock information
        products = self.get_queryset()
        products_data = []

        for product in products:
            # Get the order item for this product in the active weekly order
            order_item = OrderItem.objects.filter(
                order=active_order,
                product=product
            ).first()

            if not order_item:
                # Product not in current weekly order
                product_data = ProductSerializer(product).data
                product_data['current_stock'] = 0
                product_data['reserved_stock'] = 0
                product_data['available_stock'] = 0
                products_data.append(product_data)
                continue

            # Calculate sold quantity from sales entries
            sales_entry = SalesEntry.objects.filter(order_item=order_item).first()
            sold_quantity = sales_entry.quantity_sold if sales_entry else 0

            # Calculate reserved quantity from pending customer orders
            reserved_quantity = CustomerOrderItem.objects.filter(
                product=product,
                order__status__in=['pending', 'preparing', 'ready']
            ).aggregate(
                total_reserved=Sum('quantity')
            )['total_reserved'] or 0

            # Calculate available stock
            current_stock = order_item.quantity - sold_quantity
            available_stock = max(0, current_stock - reserved_quantity)

            # Add stock information to product data
            product_data = ProductSerializer(product).data
            product_data['current_stock'] = current_stock
            product_data['reserved_stock'] = reserved_quantity
            product_data['available_stock'] = available_stock
            product_data['weekly_order_id'] = active_order.id
            product_data['weekly_order_date'] = active_order.date

            products_data.append(product_data)

        return Response(products_data)


class WeeklyOrderViewSet(viewsets.ModelViewSet):
    queryset = WeeklyOrder.objects.all()

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return WeeklyOrderCreateSerializer
        return WeeklyOrderSerializer

    @action(detail=False, methods=['get'])
    def current_week(self, request):
        # Get the most recent Sunday
        today = timezone.now().date()
        days_since_sunday = today.weekday() + 1 if today.weekday() != 6 else 0
        last_sunday = today - timedelta(days=days_since_sunday)

        try:
            order = WeeklyOrder.objects.get(date=last_sunday)
            serializer = self.get_serializer(order)
            return Response(serializer.data)
        except WeeklyOrder.DoesNotExist:
            return Response({'detail': 'No order found for current week'},
                          status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['post'])
    def copy_from_previous(self, request):
        date_str = request.data.get('date')
        if not date_str:
            return Response({'error': 'Date is required'},
                          status=status.HTTP_400_BAD_REQUEST)

        try:
            new_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response({'error': 'Invalid date format. Use YYYY-MM-DD'},
                          status=status.HTTP_400_BAD_REQUEST)

        # Find the most recent order before the new date
        previous_order = WeeklyOrder.objects.filter(
            date__lt=new_date
        ).order_by('-date').first()

        if not previous_order:
            return Response({'error': 'No previous order found'},
                          status=status.HTTP_404_NOT_FOUND)

        # Create new order with same items
        new_order = WeeklyOrder.objects.create(
            date=new_date,
            notes=f"Copied from {previous_order.date}"
        )

        for item in previous_order.items.all():
            OrderItem.objects.create(
                order=new_order,
                product=item.product,
                quantity=item.quantity,
                cost_price=item.cost_price,
                sell_price=item.sell_price
            )

        serializer = self.get_serializer(new_order)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def enter_sales(self, request, pk=None):
        """Enter sales data for a weekly order"""
        order = self.get_object()
        serializer = BulkSalesEntrySerializer(data=request.data)

        if serializer.is_valid():
            sales_entries = serializer.validated_data['sales_entries']
            created_entries = []

            for entry_data in sales_entries:
                # Check if sales entry already exists
                sales_entry, created = SalesEntry.objects.get_or_create(
                    order_item=entry_data['order_item'],
                    defaults={
                        'quantity_sold': entry_data['quantity_sold'],
                        'actual_sell_price': entry_data['actual_sell_price'],
                        'notes': entry_data['notes']
                    }
                )

                if not created:
                    # Update existing entry
                    sales_entry.quantity_sold = entry_data['quantity_sold']
                    sales_entry.actual_sell_price = entry_data['actual_sell_price']
                    sales_entry.notes = entry_data['notes']
                    sales_entry.save()

                created_entries.append(sales_entry)

            # Return updated order with sales data
            order_serializer = self.get_serializer(order)
            return Response(order_serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def sales_summary(self, request, pk=None):
        """Get sales summary for a weekly order"""
        order = self.get_object()

        summary = {
            'order_date': order.date,
            'planned_revenue': order.total_revenue,
            'planned_cost': order.total_cost,
            'planned_profit': order.total_profit,
            'actual_revenue': order.actual_total_revenue,
            'actual_cost': order.actual_total_cost,
            'actual_profit': order.actual_total_profit,
            'has_sales_data': order.has_sales_data,
            'completion_percentage': order.sales_completion_percentage,
            'variance': {
                'revenue': order.actual_total_revenue - order.total_revenue,
                'cost': order.actual_total_cost - order.total_cost,
                'profit': order.actual_total_profit - order.total_profit,
            }
        }

        return Response(summary)


class SalesEntryViewSet(viewsets.ModelViewSet):
    queryset = SalesEntry.objects.all()

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return SalesEntryCreateSerializer
        return SalesEntrySerializer

    def get_queryset(self):
        queryset = SalesEntry.objects.all()
        order_id = self.request.query_params.get('order', None)

        if order_id:
            queryset = queryset.filter(order_item__order_id=order_id)

        return queryset


class DebtViewSet(viewsets.ModelViewSet):
    queryset = Debt.objects.all()
    serializer_class = DebtSerializer

    def get_queryset(self):
        queryset = Debt.objects.all()
        status_filter = self.request.query_params.get('status', None)
        customer_id = self.request.query_params.get('customer', None)

        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)

        return queryset

    @action(detail=False, methods=['get'])
    def outstanding(self, request):
        debts = Debt.objects.filter(status__in=['outstanding', 'partial'])
        serializer = self.get_serializer(debts, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def make_payment(self, request, pk=None):
        debt = self.get_object()
        serializer = DebtPaymentSerializer(data=request.data)

        if serializer.is_valid():
            amount_paid = serializer.validated_data['amount_paid']
            payment_date = serializer.validated_data['payment_date']
            notes = serializer.validated_data.get('notes', '')

            # Update debt
            debt.amount_paid += amount_paid
            debt.date_paid = payment_date
            if notes:
                debt.notes = f"{debt.notes}\n{payment_date}: Payment of ₦{amount_paid} - {notes}".strip()
            debt.save()

            return Response(DebtSerializer(debt).data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        total_outstanding = Debt.objects.filter(
            status__in=['outstanding', 'partial']
        ).aggregate(
            total=Sum('amount') - Sum('amount_paid')
        )['total'] or 0

        total_customers_with_debt = Debt.objects.filter(
            status__in=['outstanding', 'partial']
        ).values('customer').distinct().count()

        return Response({
            'total_outstanding': total_outstanding,
            'customers_with_debt': total_customers_with_debt
        })


class DashboardViewSet(viewsets.ViewSet):
    """
    Dashboard statistics and summary data
    """

    @action(detail=False, methods=['get'])
    def stats(self, request):
        # Get current week stats
        today = timezone.now().date()
        days_since_sunday = today.weekday() + 1 if today.weekday() != 6 else 0
        current_sunday = today - timedelta(days=days_since_sunday)
        last_sunday = current_sunday - timedelta(days=7)

        current_week_order = WeeklyOrder.objects.filter(date=current_sunday).first()
        last_week_order = WeeklyOrder.objects.filter(date=last_sunday).first()

        # Calculate stats
        current_week_revenue = current_week_order.total_revenue if current_week_order else 0
        current_week_profit = current_week_order.total_profit if current_week_order else 0
        last_week_revenue = last_week_order.total_revenue if last_week_order else 0

        # Outstanding debts
        total_debt = Debt.objects.filter(
            status__in=['outstanding', 'partial']
        ).aggregate(
            total=Sum('amount') - Sum('amount_paid')
        )['total'] or 0

        # Top selling items (last 4 weeks)
        four_weeks_ago = current_sunday - timedelta(days=28)
        top_items = OrderItem.objects.filter(
            order__date__gte=four_weeks_ago
        ).values('product__name').annotate(
            total_quantity=Sum('quantity'),
            total_profit=Sum('quantity') * (Sum('sell_price') - Sum('cost_price'))
        ).order_by('-total_quantity')[:5]

        return Response({
            'current_week': {
                'revenue': current_week_revenue,
                'profit': current_week_profit,
                'date': current_sunday
            },
            'last_week': {
                'revenue': last_week_revenue,
                'date': last_sunday
            },
            'total_outstanding_debt': total_debt,
            'top_items': list(top_items)
        })


class GiveawayViewSet(viewsets.ModelViewSet):
    queryset = Giveaway.objects.all()
    serializer_class = GiveawaySerializer

    def get_queryset(self):
        queryset = Giveaway.objects.all()
        order_id = self.request.query_params.get('order', None)
        recipient = self.request.query_params.get('recipient', None)

        if order_id:
            queryset = queryset.filter(order_id=order_id)
        if recipient:
            queryset = queryset.filter(recipient__icontains=recipient)

        return queryset

    @action(detail=False, methods=['get'])
    def by_order(self, request):
        """Get giveaways grouped by order"""
        order_id = request.query_params.get('order')
        if not order_id:
            return Response({'error': 'Order ID is required'},
                          status=status.HTTP_400_BAD_REQUEST)

        giveaways = Giveaway.objects.filter(order_id=order_id)
        serializer = self.get_serializer(giveaways, many=True)
        return Response(serializer.data)


class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer

    def get_queryset(self):
        queryset = Expense.objects.all()
        order_id = self.request.query_params.get('order', None)
        category = self.request.query_params.get('category', None)

        if order_id:
            queryset = queryset.filter(order_id=order_id)
        if category:
            queryset = queryset.filter(category=category)

        return queryset

    @action(detail=False, methods=['get'])
    def by_order(self, request):
        """Get expenses grouped by order"""
        order_id = request.query_params.get('order')
        if not order_id:
            return Response({'error': 'Order ID is required'},
                          status=status.HTTP_400_BAD_REQUEST)

        expenses = Expense.objects.filter(order_id=order_id)
        serializer = self.get_serializer(expenses, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def categories(self, request):
        """Get available expense categories"""
        categories = [{'value': choice[0], 'label': choice[1]}
                     for choice in Expense.EXPENSE_CATEGORIES]
        return Response(categories)


class CustomerOrderViewSet(viewsets.ModelViewSet):
    queryset = CustomerOrder.objects.all()

    def get_serializer_class(self):
        if self.action in ['create']:
            return CustomerOrderCreateSerializer
        return CustomerOrderSerializer

    def create(self, request, *args, **kwargs):
        """Override create to validate stock and return full order data after creation"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Validate stock availability before creating order
        items_data = request.data.get('items', [])
        stock_errors = []

        # Get the most recent active weekly order
        active_order = WeeklyOrder.objects.filter(
            date__lte=timezone.now().date()
        ).order_by('-date').first()

        if not active_order:
            return Response(
                {'error': 'No active stock order found. Cannot process customer orders.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        for item_data in items_data:
            product_id = item_data.get('id')
            requested_quantity = item_data.get('quantity', 0)

            try:
                product = Product.objects.get(id=product_id)

                # Get the order item for this product in the active weekly order
                order_item = OrderItem.objects.filter(
                    order=active_order,
                    product=product
                ).first()

                if not order_item:
                    stock_errors.append(f"{product.name} is not available in current stock order")
                    continue

                # Calculate current available stock
                sales_entry = SalesEntry.objects.filter(order_item=order_item).first()
                sold_quantity = sales_entry.quantity_sold if sales_entry else 0

                # Calculate reserved quantity from other pending customer orders
                reserved_quantity = CustomerOrderItem.objects.filter(
                    product=product,
                    order__status__in=['pending', 'preparing', 'ready']
                ).aggregate(
                    total_reserved=Sum('quantity')
                )['total_reserved'] or 0

                current_stock = order_item.quantity - sold_quantity
                available_stock = max(0, current_stock - reserved_quantity)

                if requested_quantity > available_stock:
                    stock_errors.append(
                        f"{product.name}: Requested {requested_quantity}, but only {available_stock} available"
                    )

            except Product.DoesNotExist:
                stock_errors.append(f"Product with ID {product_id} not found")

        if stock_errors:
            return Response(
                {'error': 'Stock validation failed', 'details': stock_errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        # If stock validation passes, create the order
        order = serializer.save()

        # Return the full order data using the read serializer
        read_serializer = CustomerOrderSerializer(order)
        headers = self.get_success_headers(read_serializer.data)
        return Response(read_serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def get_queryset(self):
        queryset = CustomerOrder.objects.all()

        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date:
            queryset = queryset.filter(order_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(order_date__lte=end_date)

        # Filter by status
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)

        # Filter by customer name
        customer_name = self.request.query_params.get('customer_name')
        if customer_name:
            queryset = queryset.filter(customer_name__icontains=customer_name)

        # Filter by today's orders
        today = self.request.query_params.get('today')
        if today == 'true':
            today_date = timezone.now().date()
            queryset = queryset.filter(order_date=today_date)

        return queryset.order_by('-created_at')

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """Update order status"""
        order = self.get_object()
        new_status = request.data.get('status')

        if new_status not in dict(CustomerOrder.ORDER_STATUS_CHOICES):
            return Response(
                {'error': 'Invalid status'},
                status=status.HTTP_400_BAD_REQUEST
            )

        order.status = new_status

        # If marking as completed, record collection details
        if new_status == 'completed':
            order.collected_at = timezone.now()
            order.collected_by = request.data.get('collected_by', '')

        order.save()

        serializer = self.get_serializer(order)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def status_counts(self, request):
        """Get count of orders by status"""
        from django.db.models import Count

        # Get today's date for filtering
        today = timezone.now().date()

        # Count by status for today
        today_counts = CustomerOrder.objects.filter(
            order_date=today
        ).values('status').annotate(
            count=Count('id')
        ).order_by('status')

        # Count by status for all time
        all_counts = CustomerOrder.objects.values('status').annotate(
            count=Count('id')
        ).order_by('status')

        return Response({
            'today': {item['status']: item['count'] for item in today_counts},
            'all_time': {item['status']: item['count'] for item in all_counts}
        })

    @action(detail=False, methods=['get'])
    def daily_summary(self, request):
        """Get daily order summary"""
        date = request.query_params.get('date', timezone.now().date())

        orders = CustomerOrder.objects.filter(order_date=date)

        summary = {
            'date': date,
            'total_orders': orders.count(),
            'total_revenue': orders.aggregate(Sum('total_amount'))['total_amount__sum'] or 0,
            'total_items': sum(order.total_items for order in orders),
            'status_breakdown': {},
            'payment_method_breakdown': {}
        }

        # Status breakdown
        for status_choice in CustomerOrder.ORDER_STATUS_CHOICES:
            status_code = status_choice[0]
            count = orders.filter(status=status_code).count()
            summary['status_breakdown'][status_code] = count

        # Payment method breakdown
        for payment_choice in CustomerOrder.PAYMENT_METHOD_CHOICES:
            payment_code = payment_choice[0]
            count = orders.filter(payment_method=payment_code).count()
            summary['payment_method_breakdown'][payment_code] = count

        return Response(summary)
