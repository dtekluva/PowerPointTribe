import os
from .settings import *

# Production settings
DEBUG = False

# Update this with your actual domain
ALLOWED_HOSTS = [
    'ppt.giftoria.cc',
    'www.ppt.giftoria.cc',
    '165.227.67.116',
    'localhost',
    '127.0.0.1',
]

# Database for production (PostgreSQL recommended)
import dj_database_url
DATABASES = {
    'default': dj_database_url.config(
        default='sqlite:///db.sqlite3',
        conn_max_age=600,
        conn_health_checks=True,
    )
}

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# Add whitenoise for static file serving
MIDDLEWARE.insert(1, 'whitenoise.middleware.WhiteNoiseMiddleware')

# CORS settings for production
CORS_ALLOWED_ORIGINS = [
    "https://tribesheart.netlify.app",
    "http://ppt.giftoria.cc:3002",
    "http://165.227.67.116:3002",
    "http://localhost:3002",
    "http://127.0.0.1:3002",
]

# Remove this in production
CORS_ALLOW_ALL_ORIGINS = False

# Security settings
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# HTTPS settings (uncomment when using HTTPS)
# SECURE_SSL_REDIRECT = True
# SESSION_COOKIE_SECURE = True
# CSRF_COOKIE_SECURE = True
