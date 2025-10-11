#!/bin/bash

# Script to update CORS settings on the backend for new Netlify URLs

if [ $# -eq 0 ]; then
    echo "Usage: $0 <netlify-url>"
    echo "Example: $0 https://your-app.netlify.app"
    exit 1
fi

NETLIFY_URL=$1
SERVER_IP="165.227.67.116"

echo "🔧 Updating CORS settings for: $NETLIFY_URL"

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
    '$NETLIFY_URL',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
]

# Allow all origins for development (can be restricted later)
CORS_ALLOW_ALL_ORIGINS = False

# CORS credentials
CORS_ALLOW_CREDENTIALS = True

# Static files
STATIC_URL = '/static/'
STATIC_ROOT = '/home/PowerPointTribe/sunday-orders-app/backend/staticfiles'

# CSRF settings
CSRF_TRUSTED_ORIGINS = [
    'https://ppt.giftoria.cc',
    'https://www.ppt.giftoria.cc',
    '$NETLIFY_URL',
]
EOF"

# Restart the service
echo "🔄 Restarting Django service..."
ssh root@$SERVER_IP "systemctl restart sunday-orders.service"

echo "✅ CORS settings updated successfully!"
echo "🌐 Your Netlify app at $NETLIFY_URL should now be able to access the API"

# Test the connection
echo "🧪 Testing CORS..."
ssh root@$SERVER_IP "curl -H 'Origin: $NETLIFY_URL' https://ppt.giftoria.cc/api/customers/ -s -o /dev/null -w 'HTTP Status: %{http_code}\n'"

echo "✅ Done! Your frontend should now work with the backend."
echo ""
echo "📝 Note: CORS is handled by both Nginx (for OPTIONS requests) and Django (for actual requests)"
echo "   If you still have issues, check that both configurations are updated."
