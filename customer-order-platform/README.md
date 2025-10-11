# Sunday Orders - Customer Order Platform

A customer-facing order platform that allows church attendees to browse available products and place orders online, reducing crowding at the physical collection area during church services.

## Features

### 🛒 **Product Catalog**
- Real-time product display with current stock levels
- Clear pricing and availability status
- Stock depletion as orders are placed
- Out-of-stock and low-stock indicators

### 📱 **Order Placement**
- Simple, mobile-friendly interface
- Quantity selection with stock validation
- Shopping cart with order summary
- Two payment options:
  - Pay on collection (cash/card at pickup)
  - Pay now (online payment)

### ✅ **Order Management**
- Unique customer name validation per day
- Order confirmation with reference number
- Collection details and instructions
- Order receipt for pickup verification

### 📊 **Stock Integration**
- Real-time stock synchronization with backend API
- Prevents over-ordering when stock is insufficient
- Updates available quantities as orders are placed

## Technology Stack

- **Frontend**: Pure HTML, CSS, and JavaScript (no frameworks)
- **Backend**: Django REST API at `https://ppt.giftoria.cc/api/`
- **Deployment**: Netlify static hosting
- **Storage**: LocalStorage for order tracking (per day)

## User Experience

### Mobile-First Design
- Optimized for smartphone usage
- Touch-friendly interface elements
- Responsive design for all screen sizes
- Fast loading and smooth interactions

### Simple Workflow
1. **Browse Products** - View available items with real-time stock
2. **Add to Cart** - Select quantities and add items
3. **Review Order** - Check cart contents and total
4. **Enter Details** - Provide name and payment preference
5. **Confirm Order** - Receive order reference and collection details

## Deployment

### Netlify Configuration
- **Build Command**: None (static files)
- **Publish Directory**: Root directory
- **Environment**: Production API at `https://ppt.giftoria.cc/api/`

### CORS Configuration
The backend is configured to allow requests from:
- `https://order.tribesheart.netlify.app` (or your custom domain)
- Local development environments

## Local Development

```bash
# Clone the repository
git clone <repository-url>
cd customer-order-platform

# Start local development server
python -m http.server 3001

# Open in browser
open http://localhost:3001
```

## API Integration

### Endpoints Used
- `GET /api/products/` - Fetch available products
- Stock management is handled client-side with localStorage

### Data Flow
1. **Load Products** - Fetch from backend API
2. **Stock Tracking** - Client-side calculation based on cart
3. **Order Storage** - LocalStorage for daily order tracking
4. **Name Validation** - Prevent duplicate names per day

## Features in Detail

### Stock Management
- **Real-time Updates**: Stock levels update as items are added to cart
- **Visual Indicators**: Color-coded stock status (available/low/out)
- **Quantity Limits**: Prevents ordering more than available stock

### Order Validation
- **Unique Names**: Ensures no duplicate customer names per day
- **Required Fields**: Name validation for order identification
- **Stock Verification**: Final stock check before order confirmation

### Payment Options
- **Pay on Collection**: Default option for cash/card payment at pickup
- **Pay Now**: Online payment option (can be integrated with payment gateway)

### Collection Process
- **Order Reference**: Unique identifier for each order
- **Customer Name**: Primary identification method
- **Collection Time**: "After service at green carpet area"
- **Order Receipt**: Confirmation details for pickup verification

## Customization

### Branding
- Update colors in `styles.css` CSS variables
- Modify header text and branding elements
- Add church logo or custom styling

### Stock Configuration
- Modify stock levels in `script.js` `getProductStock()` function
- Integrate with backend inventory system if available
- Add product images or descriptions

### Payment Integration
- Add payment gateway integration for "Pay Now" option
- Customize payment methods and options
- Integrate with church's preferred payment system

## Browser Support

- **Modern Browsers**: Chrome, Firefox, Safari, Edge
- **Mobile Browsers**: iOS Safari, Chrome Mobile, Samsung Internet
- **Progressive Enhancement**: Graceful degradation for older browsers

## Security

- **Input Validation**: Client-side validation for all form inputs
- **CORS Protection**: Backend configured for specific domains only
- **Data Storage**: No sensitive data stored client-side
- **HTTPS**: Secure communication with backend API

## Future Enhancements

- **Real-time Stock**: WebSocket integration for live stock updates
- **Order History**: Customer order history and favorites
- **Notifications**: SMS/Email confirmations and reminders
- **Analytics**: Order tracking and customer insights
- **Multi-day Orders**: Support for advance ordering

## Support

For technical support or feature requests, contact the development team or create an issue in the repository.

---

**Made with ❤️ for our church community**
