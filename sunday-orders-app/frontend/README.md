# Sunday Orders Dashboard Frontend

A simple, functional dashboard for managing Sunday orders, customers, products, and debts.

## Features

- **Dashboard Overview** - Weekly performance metrics and outstanding debts
- **Weekly Orders Management** - Create and manage weekly order records
- **Customer Management** - Track customer information and debt history
- **Product Catalog** - Manage products with pricing and profit margins
- **Debt Tracking** - Monitor outstanding payments and payment history
- **Sales & Expense Tracking** - Record sales entries and business expenses
- **Reports** - Generate business insights and analytics

## Technology Stack

- **Frontend**: Pure HTML, CSS, and JavaScript (no frameworks)
- **Backend**: Django REST Framework (Gunicorn)
- **Deployment**: Docker Compose (Nginx + Django + PostgreSQL)

## Default Credentials

### Frontend / Django Admin

| Field    | Value                        |
|----------|------------------------------|
| Username | `admin`                      |
| Password | `PPT@2024`                   |
| Login    | `http://localhost/login.html` |
| Admin    | `http://localhost/admin/`    |

The same username and password are used to log into the frontend CRM and the Django admin panel.

### PostgreSQL Database

| Field    | Value           |
|----------|-----------------|
| Host     | `db` (internal) / `localhost` (host machine) |
| Port     | `5432`          |
| Database | `sunday_orders` |
| User     | `postgres`      |
| Password | `19sedimat54`   |

Credentials are stored in `sunday-orders-app/.env` (excluded from version control). See `.env.sample` for the template.

## Docker Deployment

```bash
cd sunday-orders-app

# Copy the sample env file and fill in your values
cp .env.sample .env

# Build and start all services
docker compose up -d --build
```

- **Frontend**: `http://localhost` (port 80)
- **Backend API**: `http://localhost:8000/api/`
- **Django Admin**: `http://localhost/admin/`

The Django superuser is created automatically on first startup from the values in `.env`.

## Local Development

To run the frontend in isolation against a live backend:

```bash
cd sunday-orders-app/frontend
python -m http.server 3000
```

Then open `http://localhost:3000` in your browser.

## File Structure

```
frontend/
├── index.html          # Main application page
├── script.js           # Application logic and API calls
├── styles.css          # Styling and responsive design
├── netlify.toml        # Netlify configuration
├── package.json        # Project metadata
└── README.md           # This file
```

## Backend Integration

The frontend communicates with the Django REST API via relative `/api/` paths. Nginx (running in the `frontend` container) proxies those requests to the `backend` container on port 8000 — no hardcoded domains or CORS configuration required.

All API calls are made using the Fetch API with proper error handling.

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile responsive design
- Progressive enhancement for older browsers
