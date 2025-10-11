# Sunday Orders Customer Platform - Deployment Guide

## 🎯 Quick Deployment

Your customer-facing order platform is ready for Netlify deployment! Here are your deployment options:

### Option 1: Automatic Git Deployment (Recommended)

1. **Push to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Add customer order platform"
   git push origin main
   ```

2. **Create New Netlify Site**:
   - Go to [netlify.com](https://netlify.com)
   - Click "New site from Git"
   - Connect your GitHub account
   - Select your repository: `dtekluva/PowerPointTribe`

3. **Configure Build Settings**:
   - **Site name**: `order-tribesheart` (or your preferred name)
   - **Base directory**: `customer-order-platform`
   - **Build command**: (leave empty)
   - **Publish directory**: `customer-order-platform`

4. **Deploy**: Click "Deploy site"

### Option 2: Manual Deployment

1. **Install Netlify CLI**:
   ```bash
   npm install -g netlify-cli
   ```

2. **Deploy from customer platform directory**:
   ```bash
   cd customer-order-platform
   ./deploy.sh
   ```

   Or manually:
   ```bash
   netlify deploy --prod --dir=.
   ```

### Option 3: Drag & Drop

1. Go to [netlify.com](https://netlify.com)
2. Drag the entire `customer-order-platform` folder to the deploy area

## 🔧 Configuration Details

### API Configuration
- **Production API**: `https://ppt.giftoria.cc/api/`
- **Development API**: `http://127.0.0.1:8000/api` (auto-detected)
- **Environment Detection**: Automatic based on hostname

### Files Prepared for Netlify

✅ **netlify.toml** - Netlify configuration with:
- Security headers
- Cache control
- SPA fallback routing
- Custom domain redirects

✅ **script.js** - Updated with:
- Production API URL
- Environment-based configuration
- Stock management system
- Order validation logic

✅ **package.json** - Updated with:
- Netlify deployment script
- Repository information
- Customer platform metadata

✅ **README.md** - Complete documentation

✅ **deploy.sh** - Automated deployment script

✅ **.gitignore** - Netlify and development files

## 🌐 Expected Result

After deployment, you'll have:
- **Live URL**: Provided by Netlify (e.g., `https://order-tribesheart.netlify.app`)
- **HTTPS**: Automatic SSL certificate
- **CDN**: Global content delivery
- **Auto-deploys**: On git push (if using Git integration)

## 🔗 Backend Integration

The customer platform is pre-configured to connect to your deployed backend:
- **API Base**: `https://ppt.giftoria.cc/api/`
- **CORS**: Needs to be configured for your new domain
- **Stock Data**: Fetched from `/api/products/` endpoint

## 📱 Features Ready

Your customer order platform includes:
- ✅ Product catalog with real-time stock
- ✅ Shopping cart functionality
- ✅ Order placement with validation
- ✅ Unique name checking per day
- ✅ Payment method selection
- ✅ Order confirmation and receipt
- ✅ Mobile-responsive design
- ✅ Stock depletion as orders are placed

## 🚀 Post-Deployment Steps

### 1. Update CORS Settings

After deployment, update the backend to allow your new domain:

```bash
cd ../sunday-orders-app/frontend
./update-cors.sh https://your-app.netlify.app
```

Or manually update the backend CORS settings:
- SSH to server: `ssh root@165.227.67.116`
- Edit: `/home/PowerPointTribe/sunday-orders-app/backend/sunday_orders_backend/production_settings.py`
- Add your Netlify URL to `CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS`
- Restart: `systemctl restart sunday-orders.service`

### 2. Test the Platform

1. **Product Loading**: Verify products load from the API
2. **Add to Cart**: Test adding items to cart
3. **Stock Updates**: Confirm stock levels update correctly
4. **Order Placement**: Test the complete order flow
5. **Name Validation**: Try duplicate names to test validation
6. **Mobile Experience**: Test on various mobile devices

### 3. Configure Custom Domain (Optional)

If you want a custom domain like `order.yourchurch.com`:

1. **In Netlify Dashboard**:
   - Go to Site settings > Domain management
   - Add custom domain
   - Follow DNS configuration instructions

2. **Update CORS Settings**:
   ```bash
   ./update-cors.sh https://order.yourchurch.com
   ```

## 🛠️ Troubleshooting

**If products don't load:**
- Check browser console for CORS errors
- Verify backend is running at `https://ppt.giftoria.cc/api/`
- Test API directly: `curl https://ppt.giftoria.cc/api/products/`
- Update CORS settings for your domain

**If orders fail:**
- Check browser console for JavaScript errors
- Verify form validation is working
- Test with different customer names

**If deployment fails:**
- Ensure you're in the `customer-order-platform` directory
- Check that all files are present
- Verify Netlify CLI is installed

## 📊 Usage Analytics

After deployment, you can:
- Monitor usage in Netlify Analytics
- Track order patterns via browser localStorage
- Analyze popular products and peak times
- Monitor mobile vs desktop usage

## 🔒 Security Features

- **Input Validation**: All form inputs are validated
- **CORS Protection**: Backend configured for specific domains
- **HTTPS**: Secure communication with backend
- **No Sensitive Data**: No payment info stored client-side

## 🎯 Next Steps

1. **Deploy** using one of the methods above
2. **Update CORS** for your new domain
3. **Test thoroughly** with real scenarios
4. **Share URL** with church community
5. **Monitor usage** and gather feedback

## 📞 Support

For technical support:
- Check the browser console for errors
- Review the README.md for detailed documentation
- Test API connectivity directly
- Verify CORS configuration

---

**Your customer order platform is ready to reduce crowding and improve the Sunday ordering experience! 🎉**
