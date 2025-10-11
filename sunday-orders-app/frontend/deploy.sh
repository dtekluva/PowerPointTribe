#!/bin/bash

# Sunday Orders Frontend Deployment Script for Netlify

echo "🚀 Deploying Sunday Orders Dashboard to Netlify..."

# Check if netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "❌ Netlify CLI not found. Installing..."
    npm install -g netlify-cli
fi

# Check if we're in the right directory
if [ ! -f "index.html" ]; then
    echo "❌ Error: index.html not found. Make sure you're in the frontend directory."
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
echo "🌐 Your Sunday Orders Dashboard should now be live on Netlify"
echo ""
echo "📋 Next steps:"
echo "1. Check the deployment URL provided by Netlify"
echo "2. Test the dashboard functionality"
echo "3. Verify API connectivity to https://ppt.giftoria.cc/api/"
echo ""
echo "🔧 If you need to update the API URL, edit script.js and redeploy"
