from rest_framework import serializers
from .models import Customer, Product, WeeklyOrder, OrderItem, Debt, SalesEntry, Giveaway, Expense


class CustomerSerializer(serializers.ModelSerializer):
    total_debt = serializers.SerializerMethodField()

    class Meta:
        model = Customer
        fields = ['id', 'name', 'phone', 'birthday', 'anniversary', 'notes',
                 'created_at', 'updated_at', 'total_debt']
        read_only_fields = ['created_at', 'updated_at']

    def get_total_debt(self, obj):
        return sum(debt.outstanding_amount for debt in obj.debts.filter(status__in=['outstanding', 'partial']))


class ProductSerializer(serializers.ModelSerializer):
    default_profit_margin = serializers.ReadOnlyField()

    class Meta:
        model = Product
        fields = ['id', 'name', 'default_cost_price', 'default_sell_price',
                 'default_profit_margin', 'is_active', 'created_at']
        read_only_fields = ['created_at']


class SalesEntrySerializer(serializers.ModelSerializer):
    total_revenue = serializers.ReadOnlyField()
    total_cost = serializers.ReadOnlyField()
    actual_profit = serializers.ReadOnlyField()
    quantity_remaining = serializers.ReadOnlyField()
    sell_through_rate = serializers.ReadOnlyField()
    planned_vs_actual_variance = serializers.ReadOnlyField()
    notes = serializers.CharField(required=False, allow_blank=True, default='')

    class Meta:
        model = SalesEntry
        fields = ['id', 'quantity_sold', 'actual_sell_price', 'notes',
                 'total_revenue', 'total_cost', 'actual_profit',
                 'quantity_remaining', 'sell_through_rate',
                 'planned_vs_actual_variance', 'date_recorded', 'updated_at']
        read_only_fields = ['date_recorded', 'updated_at']


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    total_cost = serializers.ReadOnlyField()
    total_revenue = serializers.ReadOnlyField()
    total_profit = serializers.ReadOnlyField()
    profit_per_unit = serializers.ReadOnlyField()
    sales = SalesEntrySerializer(read_only=True)
    has_sales = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_name', 'quantity', 'cost_price',
                 'sell_price', 'total_cost', 'total_revenue', 'total_profit',
                 'profit_per_unit', 'sales', 'has_sales']

    def get_has_sales(self, obj):
        return hasattr(obj, 'sales')


class GiveawaySerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    order_date = serializers.DateField(source='order.date', read_only=True)
    total_cost = serializers.ReadOnlyField()

    class Meta:
        model = Giveaway
        fields = ['id', 'order', 'product', 'product_name', 'order_date', 'quantity',
                 'recipient', 'cost_price', 'total_cost', 'notes', 'date_given', 'created_at']
        read_only_fields = ['created_at']


class ExpenseSerializer(serializers.ModelSerializer):
    order_date = serializers.DateField(source='order.date', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = Expense
        fields = ['id', 'order', 'order_date', 'category', 'category_display', 'amount',
                 'description', 'date', 'notes', 'created_at']
        read_only_fields = ['created_at']


class WeeklyOrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    giveaways = GiveawaySerializer(many=True, read_only=True)
    expenses = ExpenseSerializer(many=True, read_only=True)
    total_cost = serializers.ReadOnlyField()
    total_revenue = serializers.ReadOnlyField()
    total_profit = serializers.ReadOnlyField()
    actual_total_revenue = serializers.ReadOnlyField()
    actual_total_cost = serializers.ReadOnlyField()
    actual_total_profit = serializers.ReadOnlyField()
    total_giveaway_cost = serializers.ReadOnlyField()
    total_expenses = serializers.ReadOnlyField()
    true_net_profit = serializers.ReadOnlyField()
    planned_net_profit = serializers.ReadOnlyField()
    has_sales_data = serializers.ReadOnlyField()
    sales_completion_percentage = serializers.ReadOnlyField()

    class Meta:
        model = WeeklyOrder
        fields = ['id', 'date', 'notes', 'items', 'giveaways', 'expenses', 'total_cost', 'total_revenue',
                 'total_profit', 'actual_total_revenue', 'actual_total_cost',
                 'actual_total_profit', 'total_giveaway_cost', 'total_expenses',
                 'true_net_profit', 'planned_net_profit', 'has_sales_data', 'sales_completion_percentage',
                 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class WeeklyOrderCreateSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)

    class Meta:
        model = WeeklyOrder
        fields = ['id', 'date', 'notes', 'items']

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        order = WeeklyOrder.objects.create(**validated_data)

        for item_data in items_data:
            OrderItem.objects.create(order=order, **item_data)

        return order

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', [])

        # Update order fields
        instance.date = validated_data.get('date', instance.date)
        instance.notes = validated_data.get('notes', instance.notes)
        instance.save()

        # Clear existing items and create new ones
        instance.items.all().delete()
        for item_data in items_data:
            OrderItem.objects.create(order=instance, **item_data)

        return instance


class DebtSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    outstanding_amount = serializers.ReadOnlyField()

    class Meta:
        model = Debt
        fields = ['id', 'customer', 'customer_name', 'amount', 'amount_paid',
                 'outstanding_amount', 'description', 'date_created', 'date_paid',
                 'status', 'notes', 'created_at', 'updated_at']
        read_only_fields = ['status', 'created_at', 'updated_at']


class DebtPaymentSerializer(serializers.Serializer):
    amount_paid = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=0)
    payment_date = serializers.DateField()
    notes = serializers.CharField(required=False, allow_blank=True)


class SalesEntryCreateSerializer(serializers.ModelSerializer):
    notes = serializers.CharField(required=False, allow_blank=True, default='')

    class Meta:
        model = SalesEntry
        fields = ['order_item', 'quantity_sold', 'actual_sell_price', 'notes']

    def validate_quantity_sold(self, value):
        if self.instance:
            order_item = self.instance.order_item
        else:
            order_item = self.initial_data.get('order_item')
            if isinstance(order_item, int):
                try:
                    order_item = OrderItem.objects.get(id=order_item)
                except OrderItem.DoesNotExist:
                    raise serializers.ValidationError("Invalid order item")

        if value > order_item.quantity:
            raise serializers.ValidationError(
                f"Cannot sell more than planned quantity ({order_item.quantity})"
            )
        return value


class BulkSalesEntrySerializer(serializers.Serializer):
    """Serializer for bulk sales entry for a weekly order"""
    sales_entries = serializers.ListField(
        child=serializers.DictField()
    )

    def validate_sales_entries(self, value):
        validated_entries = []
        for entry in value:
            try:
                order_item_id = int(entry.get('order_item_id'))
                quantity_sold = int(entry.get('quantity_sold', 0))
                actual_sell_price = float(entry.get('actual_sell_price', 0))
                notes = entry.get('notes', '')

                # Validate order item exists
                try:
                    order_item = OrderItem.objects.get(id=order_item_id)
                except OrderItem.DoesNotExist:
                    raise serializers.ValidationError(f"Order item {order_item_id} not found")

                # Validate quantity
                if quantity_sold > order_item.quantity:
                    raise serializers.ValidationError(
                        f"Cannot sell {quantity_sold} of {order_item.product.name}, only {order_item.quantity} planned"
                    )

                validated_entries.append({
                    'order_item': order_item,
                    'quantity_sold': quantity_sold,
                    'actual_sell_price': actual_sell_price,
                    'notes': notes
                })
            except (ValueError, TypeError) as e:
                raise serializers.ValidationError(f"Invalid data format: {str(e)}")

        return validated_entries
