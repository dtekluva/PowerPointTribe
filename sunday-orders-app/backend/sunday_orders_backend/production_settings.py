import os
import dj_database_url
from .settings import *

# Production settings
DEBUG = False

# Accept requests from any host — access is controlled by IP/port at the network layer
ALLOWED_HOSTS = ['*']

# Database — configured via DATABASE_URL environment variable
DATABASES = {
    'default': dj_database_url.config(
        default='postgres://postgres:19sedimat54@db:5432/sunday_orders',
        conn_max_age=600,
        conn_health_checks=True,
    )
}

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# Add whitenoise for static file serving
MIDDLEWARE.insert(1, 'whitenoise.middleware.WhiteNoiseMiddleware')

# CORS — allow all origins (no domain names in use; access restricted by network/port)
CORS_ALLOW_ALL_ORIGINS = True

# Security settings
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
