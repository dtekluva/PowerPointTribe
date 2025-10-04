from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal


class Customer(models.Model):
    name = models.CharField(max_length=100)
    phone = models.CharField(max_length=20, blank=True)
    birthday = models.DateField(null=True, blank=True)
    anniversary = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['name']


class Product(models.Model):
    name = models.CharField(max_length=100, unique=True)
    default_cost_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    default_sell_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    @property
    def default_profit_margin(self):
        return self.default_sell_price - self.default_cost_price

    class Meta:
        ordering = ['name']


class WeeklyOrder(models.Model):
    date = models.DateField()  # Sunday date
    notes = models.TextField(blank=True)
    cash_received = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    transfer_received = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Order for {self.date}"

    @property
    def total_cost(self):
        return sum(item.total_cost for item in self.items.all())

    @property
    def total_revenue(self):
        return sum(item.total_revenue for item in self.items.all())

    @property
    def total_profit(self):
        return self.total_revenue - self.total_cost

    @property
    def actual_total_revenue(self):
        """Calculate actual revenue from sales entries"""
        return sum(
            item.sales.total_revenue if hasattr(item, 'sales') and item.sales else 0
            for item in self.items.all()
        )

    @property
    def actual_total_cost(self):
        """Calculate actual cost from sales entries"""
        return sum(
            item.sales.total_cost if hasattr(item, 'sales') and item.sales else 0
            for item in self.items.all()
        )

    @property
    def actual_total_profit(self):
        """Calculate actual profit from sales entries"""
        return self.actual_total_revenue - self.actual_total_cost

    @property
    def has_sales_data(self):
        """Check if any sales data has been entered for this order"""
        return any(hasattr(item, 'sales') for item in self.items.all())

    @property
    def sales_completion_percentage(self):
        """Calculate what percentage of items have sales data entered"""
        total_items = self.items.count()
        if total_items == 0:
            return 0
        items_with_sales = sum(1 for item in self.items.all() if hasattr(item, 'sales'))
        return (items_with_sales / total_items) * 100

    @property
    def total_giveaway_cost(self):
        """Calculate total cost of items given away"""
        return sum(giveaway.total_cost for giveaway in self.giveaways.all())

    @property
    def total_expenses(self):
        """Calculate total operational expenses"""
        return sum(expense.amount for expense in self.expenses.all())

    @property
    def true_net_profit(self):
        """Calculate true net profit after deducting giveaways and expenses"""
        return self.actual_total_profit - self.total_giveaway_cost - self.total_expenses

    @property
    def planned_net_profit(self):
        """Calculate planned net profit after deducting estimated giveaways and expenses"""
        return self.total_profit - self.total_giveaway_cost - self.total_expenses

    @property
    def total_payments_received(self):
        """Calculate total payments received (cash + transfer)"""
        return self.cash_received + self.transfer_received

    @property
    def total_debt(self):
        """Calculate total debt - sum of actual debt records or calculated debt"""
        # First, try to get sum of actual debt records associated with this order
        actual_debts = self.debts.filter(status__in=['outstanding', 'partial'])
        if actual_debts.exists():
            return sum(debt.outstanding_amount for debt in actual_debts)

        # Fallback to calculated debt (sales revenue - payments received)
        sales_revenue = self.actual_total_revenue if self.has_sales_data else self.total_revenue
        return max(Decimal('0.00'), sales_revenue - self.total_payments_received)

    @property
    def effective_sales_revenue(self):
        """Get effective sales revenue (actual if available, otherwise planned)"""
        return self.actual_total_revenue if self.has_sales_data else self.total_revenue

    class Meta:
        ordering = ['-date']
        unique_together = ['date']


class OrderItem(models.Model):
    order = models.ForeignKey(WeeklyOrder, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    cost_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    sell_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )

    def __str__(self):
        return f"{self.quantity} x {self.product.name} for {self.order.date}"

    @property
    def total_cost(self):
        return self.quantity * self.cost_price

    @property
    def total_revenue(self):
        return self.quantity * self.sell_price

    @property
    def profit_per_unit(self):
        return self.sell_price - self.cost_price

    @property
    def total_profit(self):
        return self.quantity * self.profit_per_unit

    class Meta:
        unique_together = ['order', 'product']


class Debt(models.Model):
    DEBT_STATUS_CHOICES = [
        ('outstanding', 'Outstanding'),
        ('paid', 'Paid'),
        ('partial', 'Partially Paid'),
    ]

    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='debts')
    order = models.ForeignKey('WeeklyOrder', on_delete=models.CASCADE, related_name='debts', null=True, blank=True)
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    amount_paid = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    description = models.CharField(max_length=200, blank=True)
    date_created = models.DateField()
    date_paid = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=DEBT_STATUS_CHOICES, default='outstanding')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.customer.name} - ₦{self.amount} ({self.status})"

    @property
    def outstanding_amount(self):
        return self.amount - self.amount_paid

    def save(self, *args, **kwargs):
        # Auto-update status based on payment
        if self.amount_paid >= self.amount:
            self.status = 'paid'
        elif self.amount_paid > 0:
            self.status = 'partial'
        else:
            self.status = 'outstanding'
        super().save(*args, **kwargs)

    class Meta:
        ordering = ['-date_created']


class SalesEntry(models.Model):
    """
    Tracks actual sales for each order item
    """
    order_item = models.OneToOneField(OrderItem, on_delete=models.CASCADE, related_name='sales')
    quantity_sold = models.PositiveIntegerField(default=0)
    actual_sell_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    notes = models.TextField(blank=True)
    date_recorded = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Sales for {self.order_item} - {self.quantity_sold} sold"

    @property
    def total_revenue(self):
        return self.quantity_sold * self.actual_sell_price

    @property
    def total_cost(self):
        return self.quantity_sold * self.order_item.cost_price

    @property
    def actual_profit(self):
        return self.total_revenue - self.total_cost

    @property
    def quantity_remaining(self):
        return max(0, self.order_item.quantity - self.quantity_sold)

    @property
    def sell_through_rate(self):
        if self.order_item.quantity == 0:
            return 0
        return (self.quantity_sold / self.order_item.quantity) * 100

    @property
    def planned_vs_actual_variance(self):
        planned_revenue = self.order_item.total_revenue
        return self.total_revenue - planned_revenue

    class Meta:
        ordering = ['-date_recorded']

    def __str__(self):
        return f"Sales Entry for {self.order_item.product.name} - {self.order_item.order.date}"


class Giveaway(models.Model):
    """
    Tracks items given away for free from weekly orders
    """
    order = models.ForeignKey(WeeklyOrder, on_delete=models.CASCADE, related_name='giveaways')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    recipient = models.CharField(max_length=100)  # e.g., "Pastor", "Church", "Charity"
    cost_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    notes = models.TextField(blank=True)
    date_given = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def total_cost(self):
        """Total cost of items given away"""
        return self.quantity * self.cost_price

    def __str__(self):
        return f"{self.quantity}x {self.product.name} to {self.recipient} - {self.date_given}"

    class Meta:
        ordering = ['-date_given']


class Expense(models.Model):
    """
    Tracks operational expenses associated with weekly orders
    """
    EXPENSE_CATEGORIES = [
        ('logistics', 'Logistics'),
        ('transportation', 'Transportation'),
        ('packaging', 'Packaging'),
        ('utilities', 'Utilities'),
        ('marketing', 'Marketing'),
        ('supplies', 'Supplies'),
        ('other', 'Other'),
    ]

    order = models.ForeignKey(WeeklyOrder, on_delete=models.CASCADE, related_name='expenses', null=True, blank=True)
    category = models.CharField(max_length=20, choices=EXPENSE_CATEGORIES)
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    description = models.CharField(max_length=200)
    date = models.DateField()
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.get_category_display()}: {self.description} - {self.amount}"

    class Meta:
        ordering = ['-date']
