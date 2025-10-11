# Sunday Orders Dashboard - Netlify Deployment Guide

## 🎯 Quick Deployment

Your frontend is now ready for Netlify deployment! Here are your options:

### Option 1: Automatic Git Deployment (Recommended)

1. **Push to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Prepare frontend for Netlify deployment"
   git push origin main
   ```

2. **Connect to Netlify**:
   - Go to [netlify.com](https://netlify.com)
   - Click "New site from Git"
   - Connect your GitHub account
   - Select your repository: `dtekluva/PowerPointTribe`

3. **Configure Build Settings**:
   - **Base directory**: `sunday-orders-app/frontend`
   - **Build command**: (leave empty)
   - **Publish directory**: `sunday-orders-app/frontend`

4. **Deploy**: Click "Deploy site"

### Option 2: Manual Deployment

1. **Install Netlify CLI**:
   ```bash
   npm install -g netlify-cli
   ```

2. **Deploy from frontend directory**:
   ```bash
   cd sunday-orders-app/frontend
   ./deploy.sh
   ```

   Or manually:
   ```bash
   netlify deploy --prod --dir=.
   ```

### Option 3: Drag & Drop

1. Go to [netlify.com](https://netlify.com)
2. Drag the entire `sunday-orders-app/frontend` folder to the deploy area

## 🔧 Configuration Details

### API Configuration
- **Production API**: `https://ppt.giftoria.cc/api/`
- **Development API**: `http://127.0.0.1:8000/api` (auto-detected)
- **Environment Detection**: Automatic based on hostname

### Files Prepared for Netlify

✅ **netlify.toml** - Netlify configuration with:
- Security headers
- Cache control
- Redirect rules
- SPA fallback

✅ **script.js** - Updated with:
- Production API URL
- Environment-based configuration
- Automatic development/production switching

✅ **package.json** - Updated with:
- Netlify deployment script
- Repository information
- Deployment metadata

✅ **README.md** - Complete documentation

✅ **deploy.sh** - Automated deployment script

✅ **.gitignore** - Netlify and development files

## 🌐 Expected Result

After deployment, you'll have:
- **Live URL**: Provided by Netlify (e.g., `https://sunday-orders-dashboard.netlify.app`)
- **HTTPS**: Automatic SSL certificate
- **CDN**: Global content delivery
- **Auto-deploys**: On git push (if using Git integration)

## 🔗 Backend Integration

The frontend is pre-configured to connect to your deployed backend:
- **API Base**: `https://ppt.giftoria.cc/api/`
- **CORS**: Already configured on backend
- **Authentication**: Ready for API calls

## 📱 Features Ready

Your dashboard includes:
- ✅ Dashboard overview with metrics
- ✅ Weekly orders management
- ✅ Customer management
- ✅ Product catalog
- ✅ Debt tracking
- ✅ Sales & expense tracking
- ✅ Reports and analytics
- ✅ Responsive mobile design

## 🚀 Next Steps

1. **Deploy** using one of the methods above
2. **Test** the live application
3. **Verify** API connectivity
4. **Share** the URL with users

## 🛠️ Troubleshooting

**If API calls fail:**
- Check browser console for CORS errors
- Verify backend is running at `https://ppt.giftoria.cc/api/`
- Test API directly: `curl https://ppt.giftoria.cc/api/customers/`

**If deployment fails:**
- Ensure you're in the `sunday-orders-app/frontend` directory
- Check that all files are present
- Verify Netlify CLI is installed

**For custom domain:**
- Add your domain in Netlify dashboard
- Update DNS settings as instructed by Netlify
