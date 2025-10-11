// Configuration
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL = isDevelopment 
    ? 'http://127.0.0.1:8000/api'  // Local development
    : 'https://ppt.giftoria.cc/api'; // Production

// Global state
let products = [];
let cart = [];
let isLoading = false;

// DOM elements
const loadingScreen = document.getElementById('loading-screen');
const mainContent = document.getElementById('main-content');
const productsGrid = document.getElementById('products-grid');
const orderSummary = document.getElementById('order-summary');
const cartBtn = document.getElementById('cart-btn');
const cartCount = document.getElementById('cart-count');
const cartTotal = document.getElementById('cart-total');
const cartItems = document.getElementById('cart-items');
const checkoutBtn = document.getElementById('checkout-btn');
const checkoutModal = document.getElementById('checkout-modal');
const successModal = document.getElementById('success-modal');
const checkoutForm = document.getElementById('checkout-form');

// Initialize app
document.addEventListener('DOMContentLoaded', initializeApp);

async function initializeApp() {
    try {
        showLoading();
        await loadProducts();
        renderProducts();
        hideLoading();
    } catch (error) {
        console.error('Failed to initialize app:', error);
        showError('Failed to load products. Please refresh the page.');
        hideLoading();
    }
}

function showLoading() {
    loadingScreen.style.display = 'flex';
    mainContent.style.display = 'none';
}

function hideLoading() {
    loadingScreen.style.display = 'none';
    mainContent.style.display = 'block';
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <div class="container">
            <div class="error-content">
                <i class="fas fa-exclamation-triangle"></i>
                <h2>Oops! Something went wrong</h2>
                <p>${message}</p>
                <button class="btn btn-primary" onclick="location.reload()">
                    <i class="fas fa-refresh"></i> Try Again
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(errorDiv);
}

// API functions
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    try {
        const response = await fetch(url, { ...defaultOptions, ...options });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('API request failed:', error);
        throw error;
    }
}

async function loadProducts() {
    try {
        const data = await apiRequest('/products/');
        products = data.results || data;
        console.log('Loaded products:', products);
    } catch (error) {
        console.error('Failed to load products:', error);
        throw error;
    }
}

// Product rendering
function renderProducts() {
    if (!products || products.length === 0) {
        productsGrid.innerHTML = `
            <div class="no-products">
                <i class="fas fa-box-open"></i>
                <h3>No products available</h3>
                <p>Please check back later for available items.</p>
            </div>
        `;
        return;
    }

    productsGrid.innerHTML = products.map(product => {
        const stock = getProductStock(product);
        const stockClass = getStockClass(stock);
        const stockText = getStockText(stock);
        const isOutOfStock = stock <= 0;
        
        return `
            <div class="product-card ${isOutOfStock ? 'out-of-stock' : ''}" data-product-id="${product.id}">
                <div class="product-header">
                    <h3 class="product-name">${product.name}</h3>
                    <div class="product-price">₦${parseFloat(product.default_sell_price).toLocaleString()}</div>
                </div>
                
                <div class="product-stock ${stockClass}">
                    <i class="fas ${getStockIcon(stock)}"></i>
                    ${stockText}
                </div>
                
                <div class="product-actions">
                    <div class="quantity-controls">
                        <button class="quantity-btn" onclick="decreaseQuantity(${product.id})" ${isOutOfStock ? 'disabled' : ''}>
                            <i class="fas fa-minus"></i>
                        </button>
                        <input type="number" class="quantity-input" id="qty-${product.id}" value="0" min="0" max="${stock}" readonly>
                        <button class="quantity-btn" onclick="increaseQuantity(${product.id})" ${isOutOfStock ? 'disabled' : ''}>
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                    <button class="add-to-cart" onclick="addToCart(${product.id})" ${isOutOfStock ? 'disabled' : ''}>
                        <i class="fas fa-cart-plus"></i>
                        ${isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Stock management functions
function getProductStock(product) {
    // For now, we'll use a simple stock system
    // In a real implementation, this would come from the backend
    const stockMap = {
        1: 50,  // Sugar Donuts
        2: 30,  // Sausage Roll
        3: 25,  // Jam Donuts
        4: 20,  // Banana Bread
        5: 15   // Chocolate Cake
    };
    
    // Reduce stock based on cart items
    const cartItem = cart.find(item => item.id === product.id);
    const reservedQuantity = cartItem ? cartItem.quantity : 0;
    
    return (stockMap[product.id] || 10) - reservedQuantity;
}

function getStockClass(stock) {
    if (stock <= 0) return 'stock-out';
    if (stock <= 5) return 'stock-low';
    return 'stock-available';
}

function getStockText(stock) {
    if (stock <= 0) return 'Out of Stock';
    if (stock <= 5) return `Only ${stock} left`;
    return `${stock} available`;
}

function getStockIcon(stock) {
    if (stock <= 0) return 'fa-times-circle';
    if (stock <= 5) return 'fa-exclamation-triangle';
    return 'fa-check-circle';
}

// Quantity controls
function increaseQuantity(productId) {
    const qtyInput = document.getElementById(`qty-${productId}`);
    const currentQty = parseInt(qtyInput.value);
    const product = products.find(p => p.id === productId);
    const maxStock = getProductStock(product);
    
    if (currentQty < maxStock) {
        qtyInput.value = currentQty + 1;
    }
}

function decreaseQuantity(productId) {
    const qtyInput = document.getElementById(`qty-${productId}`);
    const currentQty = parseInt(qtyInput.value);
    
    if (currentQty > 0) {
        qtyInput.value = currentQty - 1;
    }
}

// Cart functions
function addToCart(productId) {
    const qtyInput = document.getElementById(`qty-${productId}`);
    const quantity = parseInt(qtyInput.value);
    
    if (quantity <= 0) {
        alert('Please select a quantity first');
        return;
    }
    
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: parseFloat(product.default_sell_price),
            quantity: quantity
        });
    }
    
    // Reset quantity input
    qtyInput.value = 0;
    
    // Update UI
    updateCartUI();
    renderProducts(); // Re-render to update stock
    
    // Show success feedback
    showAddToCartFeedback(product.name, quantity);
}

function showAddToCartFeedback(productName, quantity) {
    const feedback = document.createElement('div');
    feedback.className = 'cart-feedback';
    feedback.innerHTML = `
        <i class="fas fa-check-circle"></i>
        Added ${quantity}x ${productName} to cart
    `;
    
    document.body.appendChild(feedback);
    
    setTimeout(() => {
        feedback.remove();
    }, 3000);
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartUI();
    renderProducts(); // Re-render to update stock
}

function updateCartQuantity(productId, newQuantity) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        if (newQuantity <= 0) {
            removeFromCart(productId);
        } else {
            item.quantity = newQuantity;
            updateCartUI();
            renderProducts(); // Re-render to update stock
        }
    }
}

function updateCartUI() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    cartCount.textContent = totalItems;
    cartTotal.textContent = totalPrice.toLocaleString();
    
    checkoutBtn.disabled = cart.length === 0;
    
    renderCartItems();
}

function renderCartItems() {
    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <p>Your cart is empty</p>
                <small>Add some delicious items to get started!</small>
            </div>
        `;
        return;
    }
    
    cartItems.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="item-details">
                <h4>${item.name}</h4>
                <p>₦${item.price.toLocaleString()} each</p>
            </div>
            <div class="item-actions">
                <div class="quantity-controls">
                    <button class="quantity-btn" onclick="updateCartQuantity(${item.id}, ${item.quantity - 1})">
                        <i class="fas fa-minus"></i>
                    </button>
                    <span class="quantity-display">${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateCartQuantity(${item.id}, ${item.quantity + 1})">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                <button class="btn-remove" onclick="removeFromCart(${item.id})" title="Remove item">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// UI functions
function toggleOrderSummary() {
    orderSummary.classList.toggle('active');
}

function proceedToCheckout() {
    if (cart.length === 0) return;
    
    // Populate checkout modal
    populateCheckoutModal();
    checkoutModal.classList.add('active');
}

function populateCheckoutModal() {
    const checkoutItems = document.getElementById('checkout-items');
    const checkoutTotal = document.getElementById('checkout-total');
    
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    checkoutItems.innerHTML = cart.map(item => `
        <div class="checkout-item">
            <span>${item.quantity}x ${item.name}</span>
            <span>₦${(item.price * item.quantity).toLocaleString()}</span>
        </div>
    `).join('');
    
    checkoutTotal.textContent = totalPrice.toLocaleString();
}

function closeCheckoutModal() {
    checkoutModal.classList.remove('active');
}

// Form handling
checkoutForm.addEventListener('submit', handleCheckout);

async function handleCheckout(e) {
    e.preventDefault();
    
    if (isLoading) return;
    
    const formData = new FormData(checkoutForm);
    const customerName = formData.get('customerName').trim();
    const phoneNumber = formData.get('phoneNumber').trim();
    const paymentMethod = formData.get('paymentMethod');
    
    if (!customerName) {
        alert('Please enter your name');
        return;
    }
    
    // Check for unique name per day
    if (await isNameTakenToday(customerName)) {
        alert('This name has already been used for an order today. Please use a different name or add your last name.');
        return;
    }
    
    isLoading = true;
    const submitBtn = checkoutForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    submitBtn.disabled = true;
    
    try {
        const orderData = {
            customer_name: customerName,
            phone_number: phoneNumber,
            payment_method: paymentMethod,
            items: cart,
            total_amount: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            order_date: new Date().toISOString().split('T')[0],
            status: 'pending'
        };
        
        // For now, we'll simulate order creation
        // In a real implementation, this would call the backend API
        const orderReference = generateOrderReference();
        
        // Show success modal
        showOrderSuccess(orderReference, customerName, paymentMethod);
        
        // Clear cart
        cart = [];
        updateCartUI();
        renderProducts();
        
        // Close checkout modal
        closeCheckoutModal();
        
    } catch (error) {
        console.error('Order submission failed:', error);
        alert('Failed to place order. Please try again.');
    } finally {
        isLoading = false;
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

async function isNameTakenToday(name) {
    // For now, we'll use localStorage to track names for the day
    // In a real implementation, this would check the backend
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = JSON.parse(localStorage.getItem(`orders_${today}`) || '[]');
    
    return todayOrders.some(order => 
        order.customer_name.toLowerCase() === name.toLowerCase()
    );
}

function generateOrderReference() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `ORD-${timestamp.toString().slice(-6)}${random.toString().padStart(3, '0')}`;
}

function showOrderSuccess(orderReference, customerName, paymentMethod) {
    // Populate success modal
    document.getElementById('order-reference').textContent = orderReference;
    document.getElementById('confirmed-name').textContent = customerName;
    document.getElementById('confirmed-payment').textContent = 
        paymentMethod === 'pay_now' ? 'Paid online' : 'Pay on collection';
    
    const confirmedItems = document.getElementById('confirmed-items');
    const confirmedTotal = document.getElementById('confirmed-total');
    
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    confirmedItems.innerHTML = cart.map(item => `
        <div class="confirmed-item">
            <span>${item.quantity}x ${item.name}</span>
            <span>₦${(item.price * item.quantity).toLocaleString()}</span>
        </div>
    `).join('');
    
    confirmedTotal.textContent = totalPrice.toLocaleString();
    
    // Store order in localStorage
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = JSON.parse(localStorage.getItem(`orders_${today}`) || '[]');
    todayOrders.push({
        reference: orderReference,
        customer_name: customerName,
        payment_method: paymentMethod,
        items: [...cart],
        total: totalPrice,
        timestamp: new Date().toISOString()
    });
    localStorage.setItem(`orders_${today}`, JSON.stringify(todayOrders));
    
    successModal.classList.add('active');
}

function takeScreenshot() {
    // For mobile devices, this will prompt the user to take a screenshot
    if (navigator.share) {
        navigator.share({
            title: 'Sunday Orders - Order Confirmation',
            text: 'My order confirmation for Sunday Orders',
            url: window.location.href
        });
    } else {
        alert('Please take a screenshot of this confirmation for your records.');
    }
}

function startNewOrder() {
    successModal.classList.remove('active');
    // Reset form
    checkoutForm.reset();
}

// Initialize cart UI on load
updateCartUI();
