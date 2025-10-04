import os
import pandas as pd
from decimal import Decimal, InvalidOperation
from datetime import datetime, date
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils.dateparse import parse_date
from orders.models import Customer, Product, WeeklyOrder, OrderItem, Debt, SalesEntry, Giveaway, Expense


class Command(BaseCommand):
    help = 'Import data from Excel file into Sunday Orders Dashboard database'

    def add_arguments(self, parser):
        parser.add_argument(
            'excel_file',
            type=str,
            help='Path to the Excel file to import'
        )
        parser.add_argument(
            '--truncate',
            action='store_true',
            help='Truncate existing data before import'
        )

    def handle(self, *args, **options):
        excel_file = options['excel_file']
        truncate = options['truncate']

        if not os.path.exists(excel_file):
            raise CommandError(f'Excel file "{excel_file}" does not exist.')

        self.stdout.write(f'Starting import from {excel_file}...')

        try:
            # Read all sheets from Excel file
            excel_data = pd.read_excel(excel_file, sheet_name=None, engine='openpyxl')

            with transaction.atomic():
                if truncate:
                    self.truncate_data()

                # Import data in order of dependencies
                customers_created = self.import_customers(excel_data)
                products_created = self.import_products(excel_data)
                orders_created = self.import_weekly_orders(excel_data)
                order_items_created = self.import_order_items(excel_data)
                debts_created = self.import_debts(excel_data)
                sales_created = self.import_sales_entries(excel_data)
                giveaways_created = self.import_giveaways(excel_data)
                expenses_created = self.import_expenses(excel_data)

                # Summary
                self.stdout.write(
                    self.style.SUCCESS(
                        f'\nImport completed successfully!\n'
                        f'Records created:\n'
                        f'- Customers: {customers_created}\n'
                        f'- Products: {products_created}\n'
                        f'- Weekly Orders: {orders_created}\n'
                        f'- Order Items: {order_items_created}\n'
                        f'- Debts: {debts_created}\n'
                        f'- Sales Entries: {sales_created}\n'
                        f'- Giveaways: {giveaways_created}\n'
                        f'- Expenses: {expenses_created}'
                    )
                )

        except Exception as e:
            raise CommandError(f'Import failed: {str(e)}')

    def truncate_data(self):
        """Clear all existing data from database tables"""
        self.stdout.write('Truncating existing data...')

        # Delete in reverse dependency order
        SalesEntry.objects.all().delete()
        Giveaway.objects.all().delete()
        Expense.objects.all().delete()
        OrderItem.objects.all().delete()
        WeeklyOrder.objects.all().delete()
        Debt.objects.all().delete()
        Product.objects.all().delete()
        Customer.objects.all().delete()

        self.stdout.write(self.style.SUCCESS('Existing data truncated.'))

    def safe_decimal(self, value, default=Decimal('0.00')):
        """Safely convert value to Decimal"""
        if pd.isna(value) or value == '' or value is None:
            return default
        try:
            return Decimal(str(value))
        except (InvalidOperation, ValueError):
            return default

    def safe_date(self, value):
        """Safely convert value to date"""
        if pd.isna(value) or value == '' or value is None:
            return None

        if isinstance(value, (datetime, date)):
            return value.date() if isinstance(value, datetime) else value

        # Try to parse string date
        try:
            parsed_date = parse_date(str(value))
            return parsed_date
        except:
            return None

    def safe_int(self, value, default=0):
        """Safely convert value to integer"""
        if pd.isna(value) or value == '' or value is None:
            return default
        try:
            return int(float(value))
        except (ValueError, TypeError):
            return default

    def safe_str(self, value, default=''):
        """Safely convert value to string"""
        if pd.isna(value) or value is None:
            return default
        return str(value).strip()

    def import_customers(self, excel_data):
        """Import customers from Excel data"""
        self.stdout.write('Importing customers...')
        created_count = 0
        errors = []

        # Extract customers from debt list and birthday sheets
        customer_names = set()

        # Get customers from debt list
        if 'Debt list' in excel_data:
            debt_df = excel_data['Debt list']
            for index, row in debt_df.iterrows():
                name = self.safe_str(row.iloc[0] if len(row) > 0 else '')
                if name and not name.startswith('2025-') and name != 'Chinonso':  # Skip dates and header
                    customer_names.add(name)

        # Get customers from birthday sheet
        if 'Birthdays and anniversary ' in excel_data:
            birthday_df = excel_data['Birthdays and anniversary ']
            for index, row in birthday_df.iterrows():
                name = self.safe_str(row.iloc[0] if len(row) > 0 else '')
                if name and name not in ['Anniversaries', 'Name', 'Birthdays']:
                    customer_names.add(name)

        # Create customers
        for name in customer_names:
            try:
                customer, created = Customer.objects.get_or_create(
                    name=name,
                    defaults={
                        'phone': '',
                        'birthday': None,
                        'anniversary': None,
                        'notes': ''
                    }
                )

                if created:
                    created_count += 1

            except Exception as e:
                errors.append(f'Customer {name}: {str(e)}')

        if errors:
            self.stdout.write(self.style.WARNING(f'Customer import errors:\n' + '\n'.join(errors)))

        self.stdout.write(f'Customers imported: {created_count}')
        return created_count

    def import_products(self, excel_data):
        """Import products from Excel data"""
        self.stdout.write('Importing products...')
        created_count = 0
        errors = []

        # Get products from Price List sheet
        if 'Price List' in excel_data:
            price_df = excel_data['Price List']
            for index, row in price_df.iterrows():
                try:
                    if index == 0:  # Skip header row
                        continue

                    name = self.safe_str(row.iloc[0] if len(row) > 0 else '')
                    sell_price = self.safe_decimal(row.iloc[1] if len(row) > 1 else 0)

                    if not name or name == 'Item':
                        continue

                    # Estimate cost price as 80% of sell price
                    cost_price = sell_price * Decimal('0.8') if sell_price > 0 else Decimal('0')

                    # Create product if doesn't exist
                    product, created = Product.objects.get_or_create(
                        name=name,
                        defaults={
                            'default_cost_price': cost_price,
                            'default_sell_price': sell_price
                        }
                    )

                    if created:
                        created_count += 1

                except Exception as e:
                    errors.append(f'Row {index + 2}: {str(e)}')

        # Also extract unique products from order sheets
        product_names = set()
        for sheet_name, df in excel_data.items():
            if any(date_part in sheet_name for date_part in ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', '2025']):
                for index, row in df.iterrows():
                    if index == 0:  # Skip header
                        continue
                    name = self.safe_str(row.iloc[0] if len(row) > 0 else '')
                    if name and name != 'Item':
                        product_names.add(name)

        # Create any missing products found in order sheets
        for name in product_names:
            try:
                product, created = Product.objects.get_or_create(
                    name=name,
                    defaults={
                        'default_cost_price': Decimal('400'),  # Default from Excel data
                        'default_sell_price': Decimal('500')   # Default from Excel data
                    }
                )

                if created:
                    created_count += 1

            except Exception as e:
                errors.append(f'Product {name}: {str(e)}')

        if errors:
            self.stdout.write(self.style.WARNING(f'Product import errors:\n' + '\n'.join(errors)))

        self.stdout.write(f'Products imported: {created_count}')
        return created_count

    def parse_date_from_sheet_name(self, sheet_name):
        """Parse date from sheet name like '3Mar25', '8 June 2025', etc."""
        import re
        from datetime import datetime

        # Clean the sheet name
        sheet_name = sheet_name.strip()

        # Handle different date formats in sheet names
        patterns = [
            r'(\d{1,2})\s*Mar\s*(\d{2,4})',      # 3Mar25, 8Mar25
            r'(\d{1,2})\s*Apr\s*(\d{2,4})',      # 6 Apr 2025
            r'(\d{1,2})\s*May\s*(\d{2,4})',      # 4 May 2025
            r'(\d{1,2})\s*Jun[e]?\s*(\d{2,4})',  # 1 June 2025, 8 June 2025
            r'(\d{1,2})\s*Jul[y]?\s*(\d{2,4})',  # 6 July 2025, 29 July 2025
            r'(\d{1,2})\s*Aug[ust]*\s*(\d{2,4})', # 03 August 2025
        ]

        month_map = {
            'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6, 'June': 6,
            'Jul': 7, 'July': 7, 'Aug': 8, 'August': 8
        }

        for pattern in patterns:
            match = re.search(pattern, sheet_name, re.IGNORECASE)
            if match:
                day = int(match.group(1))
                year_str = match.group(2)
                year = int(year_str) if len(year_str) == 4 else 2000 + int(year_str)

                # Extract month from pattern
                for month_name, month_num in month_map.items():
                    if month_name.lower() in sheet_name.lower():
                        try:
                            return date(year, month_num, day)
                        except ValueError:
                            continue

        return None

    def import_weekly_orders(self, excel_data):
        """Import weekly orders from Excel data"""
        self.stdout.write('Importing weekly orders...')
        created_count = 0
        errors = []

        # Process sheets that contain date information
        for sheet_name, df in excel_data.items():
            try:
                order_date = self.parse_date_from_sheet_name(sheet_name)
                if not order_date:
                    continue

                # Create weekly order if doesn't exist
                order, created = WeeklyOrder.objects.get_or_create(
                    date=order_date,
                    defaults={
                        'notes': f'Imported from sheet: {sheet_name}'
                    }
                )

                if created:
                    created_count += 1

            except Exception as e:
                errors.append(f'Sheet {sheet_name}: {str(e)}')

        if errors:
            self.stdout.write(self.style.WARNING(f'Weekly order import errors:\n' + '\n'.join(errors)))

        self.stdout.write(f'Weekly orders imported: {created_count}')
        return created_count

    def import_order_items(self, excel_data):
        """Import order items from Excel data"""
        self.stdout.write('Importing order items...')
        created_count = 0
        errors = []

        # Process sheets that contain order data
        for sheet_name, df in excel_data.items():
            try:
                order_date = self.parse_date_from_sheet_name(sheet_name)
                if not order_date:
                    continue

                # Find the corresponding order
                try:
                    order = WeeklyOrder.objects.get(date=order_date)
                except WeeklyOrder.DoesNotExist:
                    continue

                # Process each row in the sheet
                for index, row in df.iterrows():
                    try:
                        if index == 0:  # Skip header row
                            continue

                        product_name = self.safe_str(row.iloc[0] if len(row) > 0 else '')
                        quantity = self.safe_int(row.iloc[1] if len(row) > 1 else 0)
                        cost_price = self.safe_decimal(row.iloc[2] if len(row) > 2 else 0)
                        sell_price = self.safe_decimal(row.iloc[4] if len(row) > 4 else 0)

                        if not product_name or product_name == 'Item' or quantity <= 0:
                            continue

                        # Find the product
                        try:
                            product = Product.objects.get(name=product_name)
                        except Product.DoesNotExist:
                            # Create product if it doesn't exist
                            product = Product.objects.create(
                                name=product_name,
                                default_cost_price=cost_price or Decimal('400'),
                                default_sell_price=sell_price or Decimal('500')
                            )

                        # Create order item if doesn't exist
                        item, created = OrderItem.objects.get_or_create(
                            order=order,
                            product=product,
                            defaults={
                                'quantity': quantity,
                                'cost_price': cost_price or product.default_cost_price,
                                'sell_price': sell_price or product.default_sell_price
                            }
                        )

                        if created:
                            created_count += 1

                    except Exception as e:
                        errors.append(f'Sheet {sheet_name}, Row {index + 2}: {str(e)}')

            except Exception as e:
                errors.append(f'Sheet {sheet_name}: {str(e)}')

        if errors:
            self.stdout.write(self.style.WARNING(f'Order item import errors:\n' + '\n'.join(errors[:10])))  # Show first 10 errors

        self.stdout.write(f'Order items imported: {created_count}')
        return created_count

    def import_debts(self, excel_data):
        """Import debts from Excel data"""
        self.stdout.write('Importing debts...')
        created_count = 0
        errors = []

        # Process debt list sheet
        if 'Debt list' in excel_data:
            debt_df = excel_data['Debt list']
            current_customer = None

            for index, row in debt_df.iterrows():
                try:
                    first_col = self.safe_str(row.iloc[0] if len(row) > 0 else '')
                    second_col = row.iloc[1] if len(row) > 1 else None

                    # Check if this is a customer name (not a date and not empty)
                    if first_col and not first_col.startswith('2025-') and not pd.isna(second_col) == False:
                        # This looks like a customer name
                        current_customer = first_col
                        continue

                    # Check if this is a debt entry (date + amount)
                    if first_col.startswith('2025-') and current_customer and not pd.isna(second_col):
                        debt_date = self.safe_date(first_col)
                        amount = self.safe_decimal(second_col)

                        if debt_date and amount > 0:
                            # Find the customer
                            try:
                                customer = Customer.objects.get(name=current_customer)
                            except Customer.DoesNotExist:
                                # Create customer if doesn't exist
                                customer = Customer.objects.create(
                                    name=current_customer,
                                    phone='',
                                    birthday=None,
                                    anniversary=None,
                                    notes=''
                                )

                            # Create debt
                            debt = Debt.objects.create(
                                customer=customer,
                                amount=amount,
                                description=f'Debt from {debt_date}',
                                date_created=debt_date
                            )

                            created_count += 1

                    # Handle special case where customer name is followed by amount on same row
                    elif first_col and not first_col.startswith('2025-') and not pd.isna(second_col) and second_col > 0:
                        customer_name = first_col
                        amount = self.safe_decimal(second_col)

                        if amount > 0:
                            # Find the customer
                            try:
                                customer = Customer.objects.get(name=customer_name)
                            except Customer.DoesNotExist:
                                # Create customer if doesn't exist
                                customer = Customer.objects.create(
                                    name=customer_name,
                                    phone='',
                                    birthday=None,
                                    anniversary=None,
                                    notes=''
                                )

                            # Create debt with today's date
                            debt = Debt.objects.create(
                                customer=customer,
                                amount=amount,
                                description=f'Outstanding debt',
                                date_created=date.today()
                            )

                            created_count += 1

                except Exception as e:
                    errors.append(f'Row {index + 2}: {str(e)}')

        if errors:
            self.stdout.write(self.style.WARNING(f'Debt import errors:\n' + '\n'.join(errors[:10])))

        self.stdout.write(f'Debts imported: {created_count}')
        return created_count

    def import_sales_entries(self, excel_data):
        """Import sales entries from Excel data"""
        self.stdout.write('Importing sales entries...')
        # No sales data in current Excel structure
        self.stdout.write('No sales entry data found in Excel file.')
        return 0

    def import_giveaways(self, excel_data):
        """Import giveaways from Excel data"""
        self.stdout.write('Importing giveaways...')
        # No giveaway data in current Excel structure
        self.stdout.write('No giveaway data found in Excel file.')
        return 0

    def import_expenses(self, excel_data):
        """Import expenses from Excel data"""
        self.stdout.write('Importing expenses...')
        # No expense data in current Excel structure
        self.stdout.write('No expense data found in Excel file.')
        return 0
