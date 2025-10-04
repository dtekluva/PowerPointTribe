# Deployment Guide

## Quick Deployment Steps

### 1. Frontend Deployment (Vercel) - 5 minutes

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/sunday-orders-app.git
   git push -u origin main
   ```

2. **Deploy to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Set root directory to `frontend`
   - Deploy!

3. **Note your frontend URL**: `https://your-app-name.vercel.app`

### 2. Backend Deployment (Railway) - 10 minutes

1. **Go to [railway.app](https://railway.app)**
2. **Create new project from GitHub**
3. **Configure deployment**:
   - Root directory: `backend`
   - Build command: `pip install -r requirements.txt`
   - Start command: `gunicorn sunday_orders_backend.wsgi`
   - Add environment variable: `DJANGO_SETTINGS_MODULE=sunday_orders_backend.production_settings`

4. **Note your backend URL**: `https://your-app-name.railway.app`

### 3. Connect Frontend to Backend

1. **Update frontend API URL**:
   Edit `frontend/script.js`:
   ```javascript
   const API_BASE_URL = 'https://your-backend-url.railway.app/api';
   ```

2. **Update backend CORS settings**:
   Edit `backend/sunday_orders_backend/production_settings.py`:
   ```python
   CORS_ALLOWED_ORIGINS = [
       "https://your-frontend-url.vercel.app",
   ]
   ```

3. **Redeploy both applications**

## Alternative Deployment Options

### Backend Options

#### Option 1: Heroku (Free tier discontinued)
```bash
# Install Heroku CLI
# Create Heroku app
heroku create your-app-name
heroku config:set DJANGO_SETTINGS_MODULE=sunday_orders_backend.production_settings
git subtree push --prefix=backend heroku main
```

#### Option 2: DigitalOcean App Platform
1. Create DigitalOcean account
2. Use App Platform
3. Connect GitHub repository
4. Set build/run commands

#### Option 3: PythonAnywhere
1. Upload code to PythonAnywhere
2. Set up virtual environment
3. Configure WSGI file
4. Set up static files

### Frontend Options

#### Option 1: Netlify
1. Connect GitHub repository
2. Set build directory to `frontend`
3. Deploy

#### Option 2: GitHub Pages
1. Enable GitHub Pages in repository settings
2. Set source to `frontend` folder
3. Access via `https://username.github.io/repository-name`

## Environment Variables

### Backend Environment Variables
```
DJANGO_SETTINGS_MODULE=sunday_orders_backend.production_settings
DATABASE_URL=postgresql://user:pass@host:port/dbname  # For PostgreSQL
SECRET_KEY=your-secret-key-here
DEBUG=False
```

### Frontend Environment Variables
```
REACT_APP_API_URL=https://your-backend-url.com/api  # If using React build
```

## Database Setup

### For Production (PostgreSQL recommended)

1. **Create PostgreSQL database** (Railway/Heroku provide this)
2. **Update DATABASE_URL** environment variable
3. **Run migrations**:
   ```bash
   python manage.py migrate
   ```
4. **Create superuser**:
   ```bash
   python manage.py createsuperuser
   ```
5. **Load sample data**:
   ```bash
   python populate_data.py
   ```

## SSL/HTTPS Setup

### For production, enable HTTPS in Django settings:
```python
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
```

## Monitoring and Maintenance

### Health Checks
- Backend: `https://your-backend-url.com/admin/`
- Frontend: `https://your-frontend-url.com/`
- API: `https://your-backend-url.com/api/customers/`

### Backup Strategy
1. **Database backups**: Use your hosting provider's backup service
2. **Code backups**: GitHub repository
3. **Regular exports**: Implement data export functionality

### Updates and Maintenance
1. **Update dependencies** regularly
2. **Monitor error logs** in hosting platform
3. **Test functionality** after deployments
4. **Keep API documentation** updated

## Troubleshooting

### Common Issues

#### CORS Errors
- Check CORS_ALLOWED_ORIGINS in production_settings.py
- Ensure frontend URL is correctly added
- Verify API_BASE_URL in frontend script.js

#### Database Connection Issues
- Check DATABASE_URL environment variable
- Ensure database is created and accessible
- Run migrations: `python manage.py migrate`

#### Static Files Not Loading
- Check STATIC_ROOT and STATIC_URL settings
- Ensure whitenoise is in MIDDLEWARE
- Run: `python manage.py collectstatic`

#### 500 Server Errors
- Check application logs in hosting platform
- Verify all environment variables are set
- Check DEBUG=False in production

### Getting Help
1. Check hosting platform documentation
2. Review Django deployment guides
3. Check browser console for frontend errors
4. Review server logs for backend errors

## Cost Estimates

### Free Tier Options
- **Vercel**: Free for personal projects
- **Railway**: $5/month after free tier
- **Netlify**: Free for personal projects
- **PythonAnywhere**: Free tier available

### Paid Options
- **DigitalOcean**: $5-10/month
- **AWS/GCP**: Variable based on usage
- **Heroku**: $7/month per dyno

## Security Checklist

- [ ] DEBUG=False in production
- [ ] SECRET_KEY is secure and not in code
- [ ] ALLOWED_HOSTS is properly configured
- [ ] CORS settings are restrictive
- [ ] HTTPS is enabled
- [ ] Database credentials are secure
- [ ] Regular security updates applied
