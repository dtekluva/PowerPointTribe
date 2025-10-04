from django.contrib import admin
from .models import Customer, Product, WeeklyOrder, OrderItem, Debt, SalesEntry, Giveaway, Expense


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ['name', 'phone', 'birthday', 'anniversary', 'created_at']
    search_fields = ['name', 'phone']
    list_filter = ['created_at']


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'default_cost_price', 'default_sell_price', 'default_profit_margin', 'is_active']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name']


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0


@admin.register(WeeklyOrder)
class WeeklyOrderAdmin(admin.ModelAdmin):
    list_display = ['date', 'total_cost', 'total_revenue', 'total_profit', 'created_at']
    list_filter = ['date', 'created_at']
    inlines = [OrderItemInline]
    readonly_fields = ['total_cost', 'total_revenue', 'total_profit']


@admin.register(Debt)
class DebtAdmin(admin.ModelAdmin):
    list_display = ['customer', 'amount', 'amount_paid', 'outstanding_amount', 'status', 'date_created']
    list_filter = ['status', 'date_created', 'date_paid']
    search_fields = ['customer__name', 'description']
    readonly_fields = ['outstanding_amount']


@admin.register(SalesEntry)
class SalesEntryAdmin(admin.ModelAdmin):
    list_display = ['order_item', 'quantity_sold', 'actual_sell_price', 'total_revenue', 'actual_profit', 'date_recorded']
    list_filter = ['date_recorded', 'order_item__order__date']
    search_fields = ['order_item__product__name', 'order_item__order__date']
    readonly_fields = ['total_revenue', 'total_cost', 'actual_profit', 'quantity_remaining', 'sell_through_rate']

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('order_item__product', 'order_item__order')


@admin.register(Giveaway)
class GiveawayAdmin(admin.ModelAdmin):
    list_display = ['order', 'product', 'quantity', 'recipient', 'total_cost', 'date_given']
    list_filter = ['date_given', 'recipient', 'order__date']
    search_fields = ['product__name', 'recipient', 'order__date']
    readonly_fields = ['total_cost']

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('order', 'product')


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ['order', 'category', 'description', 'amount', 'date']
    list_filter = ['category', 'date', 'order__date']
    search_fields = ['description', 'order__date']

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('order')
