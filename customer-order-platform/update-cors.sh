#!/bin/bash

# Script to update CORS settings on the backend for the customer order platform

if [ $# -eq 0 ]; then
    echo "Usage: $0 <customer-platform-url>"
    echo "Example: $0 https://order-tribesheart.netlify.app"
    exit 1
fi

CUSTOMER_URL=$1
SERVER_IP="165.227.67.116"

echo "🔧 Updating CORS settings for customer platform: $CUSTOMER_URL"

# Update the production settings on the server
ssh root@$SERVER_IP "cd /home/PowerPointTribe/sunday-orders-app/backend && cat > sunday_orders_backend/production_settings.py << 'EOF'
from .settings import *

# Production settings
DEBUG = False

# Update with actual domains
ALLOWED_HOSTS = [
    'ppt.giftoria.cc',
    'www.ppt.giftoria.cc',
    '165.227.67.116',
    'localhost',
    '127.0.0.1',
]

# CORS settings for production
CORS_ALLOWED_ORIGINS = [
    'https://tribesheart.netlify.app',  # Admin dashboard
    '$CUSTOMER_URL',                    # Customer order platform
    'http://localhost:3000',            # Local admin development
    'http://127.0.0.1:3000',           # Local admin development
    'http://localhost:3001',            # Local customer development
    'http://127.0.0.1:3001',           # Local customer development
]

# CORS configuration
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]
CORS_PREFLIGHT_MAX_AGE = 86400

# Static files
STATIC_URL = '/static/'
STATIC_ROOT = '/home/PowerPointTribe/sunday-orders-app/backend/staticfiles'

# CSRF settings
CSRF_TRUSTED_ORIGINS = [
    'https://ppt.giftoria.cc',
    'https://www.ppt.giftoria.cc',
    'https://tribesheart.netlify.app',
    '$CUSTOMER_URL',
]
EOF"

# Restart the service
echo "🔄 Restarting Django service..."
ssh root@$SERVER_IP "systemctl restart sunday-orders.service"

echo "✅ CORS settings updated successfully!"
echo "🌐 Both admin and customer platforms should now work:"
echo "   - Admin: https://tribesheart.netlify.app"
echo "   - Customer: $CUSTOMER_URL"

# Test the connection
echo "🧪 Testing CORS for customer platform..."
ssh root@$SERVER_IP "curl -H 'Origin: $CUSTOMER_URL' https://ppt.giftoria.cc/api/products/ -s -o /dev/null -w 'HTTP Status: %{http_code}\n'"

echo "✅ Done! Your customer order platform should now work with the backend."
echo ""
echo "📝 Note: Both Nginx (OPTIONS requests) and Django (API requests) are configured"
echo "   If you still have issues, check that both configurations are updated."
