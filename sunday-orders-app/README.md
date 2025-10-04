# Sunday Orders Dashboard

A simple, modern dashboard for managing weekly bakery orders, customer relationships, and debt tracking.

## Project Structure

```
sunday-orders-app/
├── backend/                 # Django REST API
│   ├── venv/               # Virtual environment
│   ├── orders/             # Main Django app
│   ├── sunday_orders_backend/  # Django project settings
│   ├── manage.py
│   ├── requirements.txt
│   └── populate_data.py    # Sample data script
└── frontend/               # HTML/CSS/JS Frontend
    ├── index.html
    ├── styles.css
    ├── script.js
    ├── package.json
    └── vercel.json         # Vercel deployment config
```

## Features

### ✅ Implemented
- **Dashboard**: Overview of weekly performance and outstanding debts
- **Weekly Orders**: View and manage Sunday orders
- **Customer Management**: Store customer information and special dates
- **Debt Tracking**: Track outstanding payments and payment history
- **Responsive Design**: Works on desktop, tablet, and mobile
- **REST API**: Full Django REST Framework backend

### 🚧 To Be Implemented
- Order creation and editing forms
- Customer creation and editing forms
- Debt payment processing
- Data export functionality
- Advanced reporting and analytics

## Backend Setup (Django)

1. **Navigate to backend directory**:
   ```bash
   cd sunday-orders-app/backend
   ```

2. **Activate virtual environment**:
   ```bash
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Run migrations**:
   ```bash
   python manage.py migrate
   ```

5. **Create sample data** (optional):
   ```bash
   python populate_data.py
   ```

6. **Create superuser** (optional):
   ```bash
   python manage.py createsuperuser
   ```

7. **Start development server**:
   ```bash
   python manage.py runserver
   ```

The API will be available at `http://127.0.0.1:8000/api/`

### API Endpoints

- `GET /api/customers/` - List all customers
- `GET /api/products/` - List all products
- `GET /api/orders/` - List all weekly orders
- `GET /api/debts/` - List all debts
- `GET /api/dashboard/stats/` - Dashboard statistics
- `GET /api/debts/outstanding/` - Outstanding debts only

## Frontend Setup (HTML/CSS/JS)

1. **Navigate to frontend directory**:
   ```bash
   cd sunday-orders-app/frontend
   ```

2. **Start local server**:
   ```bash
   python -m http.server 3000
   ```
   
   Or use any static file server:
   ```bash
   # Using Node.js
   npx serve -p 3000
   
   # Using PHP
   php -S localhost:3000
   ```

3. **Open in browser**:
   ```
   http://localhost:3000
   ```

## Deployment

### Frontend Deployment (Vercel)

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Deploy from frontend directory**:
   ```bash
   cd sunday-orders-app/frontend
   vercel --prod
   ```

3. **Update API URL**: After deployment, update the `API_BASE_URL` in `script.js` to point to your deployed backend.

### Backend Deployment Options

#### Option 1: Railway
1. Create account at [railway.app](https://railway.app)
2. Connect your GitHub repository
3. Deploy the backend folder
4. Add environment variables if needed

#### Option 2: Heroku
1. Install Heroku CLI
2. Create `Procfile` in backend directory:
   ```
   web: gunicorn sunday_orders_backend.wsgi
   ```
3. Add `gunicorn` to requirements.txt
4. Deploy using Heroku CLI

#### Option 3: DigitalOcean App Platform
1. Create account at DigitalOcean
2. Use App Platform to deploy from GitHub
3. Configure build and run commands

## Configuration

### Backend Configuration

Update `sunday-orders-app/backend/sunday_orders_backend/settings.py`:

```python
# For production, update CORS settings
CORS_ALLOWED_ORIGINS = [
    "https://your-frontend-domain.vercel.app",
]

# Remove this line in production
CORS_ALLOW_ALL_ORIGINS = False
```

### Frontend Configuration

Update `sunday-orders-app/frontend/script.js`:

```javascript
// Update API base URL for production
const API_BASE_URL = 'https://your-backend-domain.com/api';
```

## Sample Data

The `populate_data.py` script creates:
- 3 sample customers (Chinonso, Mrs. Abolarins, The Oladunjoyes)
- 5 sample products (Sugar Donuts, Sausage Roll, etc.)
- 4 weeks of sample orders
- 3 sample debt records

## Development Notes

- Backend runs on `http://127.0.0.1:8000`
- Frontend runs on `http://localhost:3000`
- CORS is configured to allow frontend-backend communication
- SQLite database is used by default (suitable for small-scale deployment)
- All monetary values are stored as decimals for precision

## Troubleshooting

### Backend Issues
- **CORS errors**: Check CORS settings in Django settings
- **Database errors**: Run `python manage.py migrate`
- **Import errors**: Ensure virtual environment is activated

### Frontend Issues
- **API connection failed**: Check if backend is running
- **Blank data**: Check browser console for JavaScript errors
- **Styling issues**: Clear browser cache

## Next Steps

1. Implement order creation/editing forms
2. Add customer management forms
3. Implement debt payment processing
4. Add data export functionality
5. Implement user authentication
6. Add email/SMS notifications for debt reminders
7. Implement advanced reporting features

## Support

For issues or questions, check the browser console for errors and ensure both backend and frontend are running correctly.
