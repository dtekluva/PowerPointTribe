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
- **Backend**: Django REST API deployed at `https://ppt.giftoria.cc/api/`
- **Deployment**: Netlify (static hosting)

## Deployment to Netlify

### Option 1: Git Integration (Recommended)

1. **Connect Repository**:
   - Go to [Netlify](https://netlify.com) and sign in
   - Click "New site from Git"
   - Connect your GitHub repository
   - Select the repository containing this frontend

2. **Configure Build Settings**:
   - **Base directory**: `sunday-orders-app/frontend`
   - **Build command**: Leave empty (no build needed)
   - **Publish directory**: `sunday-orders-app/frontend`

3. **Deploy**:
   - Click "Deploy site"
   - Netlify will automatically deploy and provide a URL

### Option 2: Manual Deployment

1. **Prepare Files**:
   ```bash
   cd sunday-orders-app/frontend
   ```

2. **Deploy to Netlify**:
   - Go to [Netlify](https://netlify.com)
   - Drag and drop the `frontend` folder to the deploy area
   - Or use Netlify CLI:
     ```bash
     npm install -g netlify-cli
     netlify deploy --prod --dir=.
     ```

## Configuration

The frontend is pre-configured to connect to the production backend:
- **API Base URL**: `https://ppt.giftoria.cc/api/`
- **CORS**: Already configured on the backend
- **HTTPS**: Enforced with proper SSL certificates

## Local Development

To run locally for development:

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

The frontend communicates with the Django REST API backend deployed at:
- **Primary**: `https://ppt.giftoria.cc/api/`
- **Secondary**: `https://www.ppt.giftoria.cc/api/`

All API calls are made using the Fetch API with proper error handling and CORS support.

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile responsive design
- Progressive enhancement for older browsers
