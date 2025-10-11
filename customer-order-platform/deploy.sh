#!/bin/bash

# Sunday Orders Customer Platform Deployment Script for Netlify

echo "🚀 Deploying Sunday Orders Customer Platform to Netlify..."

# Check if netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "❌ Netlify CLI not found. Installing..."
    npm install -g netlify-cli
fi

# Check if we're in the right directory
if [ ! -f "index.html" ]; then
    echo "❌ Error: index.html not found. Make sure you're in the customer-order-platform directory."
    exit 1
fi

# Check if netlify.toml exists
if [ ! -f "netlify.toml" ]; then
    echo "❌ Error: netlify.toml not found. Configuration file is missing."
    exit 1
fi

echo "✅ Pre-deployment checks passed"

# Deploy to Netlify
echo "📦 Deploying to Netlify..."
netlify deploy --prod --dir=.

echo "✅ Deployment complete!"
echo "🌐 Your Sunday Orders Customer Platform should now be live on Netlify"
echo ""
echo "📋 Next steps:"
echo "1. Check the deployment URL provided by Netlify"
echo "2. Test the platform functionality"
echo "3. Verify API connectivity to https://ppt.giftoria.cc/api/"
echo "4. Update CORS settings if using a new domain"
echo ""
echo "🔧 If you need to update CORS settings for a new domain:"
echo "   cd ../sunday-orders-app/frontend"
echo "   ./update-cors.sh https://your-new-domain.netlify.app"
echo ""
echo "🎉 Your customer order platform is ready for church attendees!"
