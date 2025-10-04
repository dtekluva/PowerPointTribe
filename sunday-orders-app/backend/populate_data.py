#!/usr/bin/env python
import os
import sys
import django
from datetime import date, timedelta
from decimal import Decimal

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sunday_orders_backend.settings')
django.setup()

from orders.models import Customer, Product, WeeklyOrder, OrderItem, Debt


def populate_data():
    print("Creating sample data...")
    
    # Create customers
    customers_data = [
        {
            'name': 'Chinonso',
            'phone': '08012345678',
            'birthday': date(1990, 3, 15),
            'anniversary': date(2015, 6, 20),
            'notes': 'Regular customer, pays monthly'
        },
        {
            'name': 'Mrs. Abolarins',
            'phone': '08087654321',
            'birthday': date(1985, 7, 10),
            'anniversary': date(2010, 2, 7),
            'notes': 'Prefers sugar donuts'
        },
        {
            'name': 'The Oladunjoyes',
            'phone': '08098765432',
            'anniversary': date(2012, 2, 12),
            'notes': 'Family orders for special occasions'
        }
    ]
    
    customers = []
    for customer_data in customers_data:
        customer, created = Customer.objects.get_or_create(
            name=customer_data['name'],
            defaults=customer_data
        )
        customers.append(customer)
        if created:
            print(f"Created customer: {customer.name}")
    
    # Create products
    products_data = [
        {
            'name': 'Sugar Donuts',
            'default_cost_price': Decimal('500.00'),
            'default_sell_price': Decimal('600.00')
        },
        {
            'name': 'Sausage Roll',
            'default_cost_price': Decimal('600.00'),
            'default_sell_price': Decimal('700.00')
        },
        {
            'name': 'Jam Donuts',
            'default_cost_price': Decimal('600.00'),
            'default_sell_price': Decimal('700.00')
        },
        {
            'name': 'Banana Bread',
            'default_cost_price': Decimal('900.00'),
            'default_sell_price': Decimal('1000.00')
        },
        {
            'name': 'Chocolate Cake',
            'default_cost_price': Decimal('500.00'),
            'default_sell_price': Decimal('600.00')
        }
    ]
    
    products = []
    for product_data in products_data:
        product, created = Product.objects.get_or_create(
            name=product_data['name'],
            defaults=product_data
        )
        products.append(product)
        if created:
            print(f"Created product: {product.name}")
    
    # Create sample weekly orders
    today = date.today()
    # Get last Sunday
    days_since_sunday = today.weekday() + 1 if today.weekday() != 6 else 0
    last_sunday = today - timedelta(days=days_since_sunday)
    
    # Create orders for the last 4 weeks
    for i in range(4):
        order_date = last_sunday - timedelta(days=i*7)
        
        order, created = WeeklyOrder.objects.get_or_create(
            date=order_date,
            defaults={'notes': f'Weekly order for {order_date}'}
        )
        
        if created:
            print(f"Created order for: {order_date}")
            
            # Add items to the order
            order_items = [
                {'product': products[0], 'quantity': 25, 'cost_price': Decimal('500'), 'sell_price': Decimal('600')},
                {'product': products[1], 'quantity': 25, 'cost_price': Decimal('600'), 'sell_price': Decimal('700')},
                {'product': products[2], 'quantity': 25, 'cost_price': Decimal('600'), 'sell_price': Decimal('700')},
                {'product': products[3], 'quantity': 20, 'cost_price': Decimal('900'), 'sell_price': Decimal('1000')},
            ]
            
            for item_data in order_items:
                OrderItem.objects.create(order=order, **item_data)
    
    # Create sample debts
    debts_data = [
        {
            'customer': customers[0],
            'amount': Decimal('8700.00'),
            'amount_paid': Decimal('0.00'),
            'description': 'Multiple orders',
            'date_created': date(2025, 4, 6),
            'notes': 'Outstanding since April'
        },
        {
            'customer': customers[1],
            'amount': Decimal('3200.00'),
            'amount_paid': Decimal('0.00'),
            'description': 'Special order',
            'date_created': date(2025, 5, 15),
            'notes': 'Anniversary order'
        },
        {
            'customer': customers[2],
            'amount': Decimal('5500.00'),
            'amount_paid': Decimal('2000.00'),
            'description': 'Family order',
            'date_created': date(2025, 6, 1),
            'notes': 'Partial payment made'
        }
    ]
    
    for debt_data in debts_data:
        debt, created = Debt.objects.get_or_create(
            customer=debt_data['customer'],
            amount=debt_data['amount'],
            date_created=debt_data['date_created'],
            defaults=debt_data
        )
        if created:
            print(f"Created debt for {debt.customer.name}: ₦{debt.amount}")
    
    print("Sample data created successfully!")


if __name__ == '__main__':
    populate_data()
