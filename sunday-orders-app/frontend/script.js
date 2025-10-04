// Configuration
const API_BASE_URL = 'http://127.0.0.1:8000/api';

// Global state
let currentPage = 'dashboard';
let customers = [];
let products = [];
let orders = [];
let debts = [];

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupNavigation();
    loadInitialData();
    showPage('dashboard');
}

// Navigation
function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const page = btn.dataset.page;
            showPage(page);

            // Update active nav button
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}

function showPage(pageName) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    // Show selected page
    document.getElementById(`${pageName}-page`).classList.add('active');
    currentPage = pageName;

    // Load page-specific data
    switch(pageName) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'orders':
            loadOrdersData();
            break;
        case 'products':
            loadProductsData();
            break;
        case 'customers':
            loadCustomersData();
            break;
        case 'debts':
            loadDebtsData();
            break;
        case 'tracking':
            loadTrackingData();
            break;
        case 'reports':
            loadReportsData();
            break;
    }
}

// API Functions
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
        showError('Failed to connect to server. Please check if the backend is running.');
        throw error;
    }
}

// Load initial data
async function loadInitialData() {
    try {
        showLoading(true);

        // Load basic data
        const [customersData, productsData] = await Promise.all([
            apiRequest('/customers/'),
            apiRequest('/products/')
        ]);

        customers = customersData.results || customersData;
        products = productsData.results || productsData;

        showLoading(false);
    } catch (error) {
        showLoading(false);
        console.error('Failed to load initial data:', error);
    }
}

// Dashboard functions
async function loadDashboardData() {
    try {
        const [dashboardStats, recentOrders, outstandingDebts] = await Promise.all([
            apiRequest('/dashboard/stats/'),
            apiRequest('/orders/?limit=5'),
            apiRequest('/debts/outstanding/')
        ]);

        updateDashboardStats(dashboardStats);
        updateRecentOrders(recentOrders.results || recentOrders);
        updateOutstandingDebts(outstandingDebts.results || outstandingDebts);
    } catch (error) {
        console.error('Failed to load dashboard data:', error);
    }
}

function updateDashboardStats(stats) {
    document.getElementById('current-week-revenue').textContent =
        formatCurrency(stats.current_week?.revenue || 0);
    document.getElementById('current-week-profit').textContent =
        formatCurrency(stats.current_week?.profit || 0);
    document.getElementById('total-debt').textContent =
        formatCurrency(stats.total_outstanding_debt || 0);
    document.getElementById('total-customers').textContent = customers.length;
}

function updateRecentOrders(orders) {
    const container = document.getElementById('recent-orders-list');

    if (orders.length === 0) {
        container.innerHTML = '<p class="text-muted">No recent orders found.</p>';
        return;
    }

    const ordersHtml = orders.map(order => `
        <div class="order-item">
            <div class="order-date">${formatDate(order.date)}</div>
            <div class="order-summary">
                ${order.items?.length || 0} items • ${formatCurrency(order.total_revenue || 0)} revenue
            </div>
            <div class="order-profit">Profit: ${formatCurrency(order.total_profit || 0)}</div>
        </div>
    `).join('');

    container.innerHTML = ordersHtml;
}

function updateOutstandingDebts(debts) {
    const container = document.getElementById('outstanding-debts-list');

    if (debts.length === 0) {
        container.innerHTML = '<p class="text-muted">No outstanding debts.</p>';
        return;
    }

    const debtsHtml = debts.slice(0, 5).map(debt => `
        <div class="debt-item">
            <div class="debt-customer">${debt.customer_name}</div>
            <div class="debt-amount">${formatCurrency(debt.outstanding_amount)}</div>
            <div class="debt-date">Since ${formatDate(debt.date_created)}</div>
        </div>
    `).join('');

    container.innerHTML = debtsHtml;
}

// Orders functions
async function loadOrdersData() {
    try {
        const ordersData = await apiRequest('/orders/');
        orders = ordersData.results || ordersData;
        updateOrdersCalendar(orders);
        updateOrdersSummary(orders);
    } catch (error) {
        console.error('Failed to load orders data:', error);
    }
}

function updateOrdersSummary(orders) {
    const totalOrders = orders.length;
    const ordersWithSales = orders.filter(order => order.has_sales_data).length;
    const totalPlannedRevenue = orders.reduce((sum, order) => sum + (order.total_revenue || 0), 0);
    const totalActualRevenue = orders.reduce((sum, order) => sum + (order.actual_total_revenue || 0), 0);
    const totalPlannedProfit = orders.reduce((sum, order) => sum + (order.total_profit || 0), 0);
    const totalActualProfit = orders.reduce((sum, order) => sum + (order.actual_total_profit || 0), 0);

    const summaryHtml = `
        <div class="orders-summary">
            <div class="summary-stats">
                <div class="summary-stat">
                    <div class="stat-value">${totalOrders}</div>
                    <div class="stat-label">Total Orders</div>
                </div>
                <div class="summary-stat">
                    <div class="stat-value">${ordersWithSales}</div>
                    <div class="stat-label">With Sales Data</div>
                </div>
                <div class="summary-stat">
                    <div class="stat-value">${formatCurrency(totalPlannedRevenue)}</div>
                    <div class="stat-label">Planned Revenue</div>
                </div>
                <div class="summary-stat">
                    <div class="stat-value">${formatCurrency(totalActualRevenue)}</div>
                    <div class="stat-label">Actual Revenue</div>
                </div>
                <div class="summary-stat">
                    <div class="stat-value">${formatCurrency(totalPlannedProfit)}</div>
                    <div class="stat-label">Planned Profit</div>
                </div>
                <div class="summary-stat">
                    <div class="stat-value">${formatCurrency(totalActualProfit)}</div>
                    <div class="stat-label">Actual Profit</div>
                </div>
            </div>
        </div>
    `;

    // Insert summary before the orders calendar
    const ordersContent = document.querySelector('.orders-content');
    const existingSummary = ordersContent.querySelector('.orders-summary');
    if (existingSummary) {
        existingSummary.remove();
    }
    ordersContent.insertAdjacentHTML('afterbegin', summaryHtml);
}

function updateOrdersCalendar(orders) {
    const container = document.getElementById('orders-calendar');

    if (orders.length === 0) {
        container.innerHTML = '<p class="text-muted">No orders found. Create your first order!</p>';
        return;
    }

    const ordersHtml = orders.map(order => `
        <div class="order-card" onclick="viewOrder(${order.id})">
            <div class="order-card-header">
                <h4>${formatDate(order.date)}</h4>
                <div class="order-status-group">
                    <span class="order-status">
                        ${order.items?.length || 0} items
                    </span>
                    <span class="sales-status ${order.has_sales_data ? 'has-sales' : 'no-sales'}">
                        ${order.sales_completion_percentage.toFixed(0)}% Sales Data
                    </span>
                </div>
            </div>
            <div class="order-card-body">
                <div class="order-metrics-row">
                    <div class="metric-group">
                        <div class="metric-label">Planned</div>
                        <div class="order-metric">
                            <span>Revenue:</span>
                            <strong>${formatCurrency(order.total_revenue || 0)}</strong>
                        </div>
                        <div class="order-metric">
                            <span>Profit:</span>
                            <strong class="profit">${formatCurrency(order.total_profit || 0)}</strong>
                        </div>
                    </div>
                    ${order.has_sales_data ? `
                        <div class="metric-group">
                            <div class="metric-label">Actual</div>
                            <div class="order-metric">
                                <span>Revenue:</span>
                                <strong>${formatCurrency(order.actual_total_revenue || 0)}</strong>
                            </div>
                            <div class="order-metric">
                                <span>Profit:</span>
                                <strong class="profit">${formatCurrency(order.actual_total_profit || 0)}</strong>
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `).join('');

    container.innerHTML = `<div class="orders-grid">${ordersHtml}</div>`;
}

// Products functions
async function loadProductsData() {
    try {
        const productsData = await apiRequest('/products/');
        products = productsData.results || productsData;
        updateProductsList(products);
    } catch (error) {
        console.error('Failed to load products data:', error);
    }
}

function updateProductsList(products) {
    const container = document.getElementById('products-list');

    if (products.length === 0) {
        container.innerHTML = '<p class="text-muted">No products found. Add your first product!</p>';
        return;
    }

    const productsHtml = products.map(product => `
        <div class="product-card">
            <div class="product-info">
                <h4>${product.name}</h4>
                <div class="product-details">
                    <p><i class="fas fa-tag"></i> ${product.category || 'Uncategorized'}</p>
                    ${product.description ? `<p><i class="fas fa-info-circle"></i> ${product.description}</p>` : ''}
                </div>
            </div>
            <div class="product-pricing">
                <div class="price-info">
                    <div class="price-item">
                        <span>Cost:</span>
                        <strong>${formatCurrency(product.default_cost_price || 0)}</strong>
                    </div>
                    <div class="price-item">
                        <span>Sell:</span>
                        <strong>${formatCurrency(product.default_sell_price || 0)}</strong>
                    </div>
                    <div class="price-item profit">
                        <span>Profit:</span>
                        <strong>${formatCurrency((product.default_sell_price || 0) - (product.default_cost_price || 0))}</strong>
                    </div>
                </div>
            </div>
            <div class="product-actions">
                <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); showProductForm(${product.id})" title="Edit Product">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-secondary" onclick="event.stopPropagation(); viewProductHistory(${product.id})" title="View Usage History">
                    <i class="fas fa-history"></i>
                </button>
            </div>
        </div>
    `).join('');

    container.innerHTML = productsHtml;
}

// Customers functions
async function loadCustomersData() {
    try {
        const customersData = await apiRequest('/customers/');
        customers = customersData.results || customersData;
        updateCustomersList(customers);
    } catch (error) {
        console.error('Failed to load customers data:', error);
    }
}

function updateCustomersList(customers) {
    const container = document.getElementById('customers-list');

    if (customers.length === 0) {
        container.innerHTML = '<p class="text-muted">No customers found. Add your first customer!</p>';
        return;
    }

    const customersHtml = customers.map(customer => `
        <div class="customer-card">
            <div class="customer-info" onclick="viewCustomer(${customer.id})">
                <h4>${customer.name}</h4>
                <div class="customer-details">
                    <p><i class="fas fa-phone"></i> ${customer.phone || 'No phone'}</p>
                    ${customer.email ? `<p><i class="fas fa-envelope"></i> ${customer.email}</p>` : ''}
                    ${customer.birthday ? `<p><i class="fas fa-birthday-cake"></i> ${formatDate(customer.birthday)}</p>` : ''}
                    ${customer.address ? `<p><i class="fas fa-map-marker-alt"></i> ${customer.address}</p>` : ''}
                </div>
            </div>
            <div class="customer-debt">
                <span class="debt-amount ${customer.total_debt > 0 ? 'has-debt' : ''}">
                    ${formatCurrency(customer.total_debt || 0)}
                </span>
                <small>Outstanding Debt</small>
            </div>
            <div class="customer-actions">
                <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); showCustomerForm(${customer.id})" title="Edit Customer">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-secondary" onclick="event.stopPropagation(); viewCustomer(${customer.id})" title="View History">
                    <i class="fas fa-eye"></i>
                </button>
            </div>
        </div>
    `).join('');

    container.innerHTML = customersHtml;
}

// Debts functions
async function loadDebtsData() {
    try {
        const debtsData = await apiRequest('/debts/');
        debts = debtsData.results || debtsData;
        updateDebtsList(debts);
    } catch (error) {
        console.error('Failed to load debts data:', error);
    }
}

function updateDebtsList(debts) {
    const container = document.getElementById('debts-list');

    if (debts.length === 0) {
        container.innerHTML = '<p class="text-muted">No debts found.</p>';
        return;
    }

    const debtsHtml = debts.map(debt => `
        <div class="debt-card">
            <div class="debt-info">
                <h4 class="customer-name-link" onclick="showCustomerHistory(${debt.customer})">${debt.customer_name}</h4>
                <p>${debt.description || 'No description'}</p>
                <small>Created: ${formatDate(debt.date_created)}</small>
            </div>
            <div class="debt-amount-info">
                <div class="debt-total">₦${debt.amount}</div>
                <div class="debt-outstanding">Outstanding: ${formatCurrency(debt.outstanding_amount)}</div>
                <span class="status-badge status-${debt.status}">${debt.status}</span>
            </div>
            <div class="debt-actions">
                <button class="btn btn-sm btn-primary" onclick="makePayment(${debt.id})">
                    Pay
                </button>
                <button class="btn btn-sm btn-outline" onclick="editDebt(${debt.id})">
                    Edit
                </button>
            </div>
        </div>
    `).join('');

    container.innerHTML = debtsHtml;
}

// Utility functions
function formatCurrency(amount) {
    return `₦${parseFloat(amount || 0).toLocaleString()}`;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function getNextSunday() {
    const today = new Date();
    const nextSunday = new Date(today);
    nextSunday.setDate(today.getDate() + (7 - today.getDay()));
    return nextSunday.toISOString().split('T')[0];
}

function showLoading(show) {
    const spinner = document.getElementById('loading-spinner');
    spinner.style.display = show ? 'flex' : 'none';
}

function showError(message) {
    alert(message); // Simple error handling - can be improved with toast notifications
}

function showModal(title, content) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = content;
    document.getElementById('modal-overlay').style.display = 'flex';
}

function closeModal() {
    document.getElementById('modal-overlay').style.display = 'none';
}

// Placeholder functions for features to be implemented
function refreshDashboard() {
    loadDashboardData();
}

async function showOrderForm() {
    try {
        // Get products for the form
        const productsData = await apiRequest('/products/');
        const products = productsData.results || productsData;

        const formContent = `
            <form id="new-order-form" onsubmit="submitNewOrder(event)">
                <div class="order-form-header">
                    <h4>Create New Weekly Order</h4>
                    <p class="text-muted">Plan your next Sunday order with quantities and pricing</p>
                </div>

                <div class="form-group">
                    <label class="form-label">Order Date</label>
                    <input
                        type="date"
                        class="form-input"
                        name="order_date"
                        value="${getNextSunday()}"
                        required
                    >
                </div>

                <div class="form-group">
                    <label class="form-label">Notes (optional)</label>
                    <textarea
                        class="form-input"
                        name="notes"
                        rows="2"
                        placeholder="Any notes about this order..."
                    ></textarea>
                </div>

                <div class="order-items-section">
                    <h5>Order Items</h5>
                    <div class="order-items-grid">
                        ${products.map(product => `
                            <div class="order-item-card">
                                <div class="item-header">
                                    <h6>${product.name}</h6>
                                    <span class="product-category">${product.category || 'Bakery'}</span>
                                </div>

                                <div class="form-row">
                                    <div class="form-group">
                                        <label class="form-label">Quantity</label>
                                        <input
                                            type="number"
                                            class="form-input"
                                            name="quantity_${product.id}"
                                            min="0"
                                            placeholder="0"
                                        >
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">Cost Price</label>
                                        <input
                                            type="number"
                                            class="form-input"
                                            name="cost_price_${product.id}"
                                            min="0"
                                            step="0.01"
                                            value="${product.default_cost_price || ''}"
                                            placeholder="0.00"
                                        >
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">Sell Price</label>
                                        <input
                                            type="number"
                                            class="form-input"
                                            name="sell_price_${product.id}"
                                            min="0"
                                            step="0.01"
                                            value="${product.default_sell_price || ''}"
                                            placeholder="0.00"
                                        >
                                    </div>
                                </div>

                                <input type="hidden" name="product_id_${product.id}" value="${product.id}">
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="form-actions">
                    <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-plus"></i> Create Order
                    </button>
                </div>
            </form>
        `;

        showModal('Create New Weekly Order', formContent);
    } catch (error) {
        console.error('Failed to load products for order form:', error);
        showError('Failed to load products. Please try again.');
    }
}

async function submitNewOrder(event) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);

    const orderDate = formData.get('order_date');
    const notes = formData.get('notes') || '';

    // Collect order items
    const orderItems = [];
    const productIds = [];

    // Find all product IDs
    for (let [key, value] of formData.entries()) {
        if (key.startsWith('product_id_')) {
            const productId = key.split('_')[2];
            productIds.push(productId);
        }
    }

    // Build order items array
    for (const productId of productIds) {
        const quantity = parseInt(formData.get(`quantity_${productId}`)) || 0;
        const costPrice = parseFloat(formData.get(`cost_price_${productId}`)) || 0;
        const sellPrice = parseFloat(formData.get(`sell_price_${productId}`)) || 0;

        if (quantity > 0 && costPrice > 0 && sellPrice > 0) {
            orderItems.push({
                product: productId,
                quantity: quantity,
                cost_price: costPrice.toFixed(2),
                sell_price: sellPrice.toFixed(2)
            });
        }
    }

    if (orderItems.length === 0) {
        showError('Please add at least one item to the order');
        return;
    }

    try {
        showLoading(true);

        const orderData = {
            date: orderDate,
            notes: notes,
            items: orderItems
        };

        console.log('Creating order:', orderData); // Debug log

        const response = await apiRequest('/orders/', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });

        showLoading(false);
        closeModal();

        // Show success message
        alert('Order created successfully!');

        // Refresh the orders list
        if (currentPage === 'orders') {
            await loadOrdersData();
        }

        // Refresh dashboard if on dashboard
        if (currentPage === 'dashboard') {
            await loadDashboardData();
        }

    } catch (error) {
        showLoading(false);
        console.error('Failed to create order:', error);
        showError('Failed to create order. Please check your entries and try again.');
    }
}

function copyFromPrevious() {
    showModal('Copy Previous Order', '<p>Copy functionality will be implemented here</p>');
}

function showProductForm(productId = null) {
    if (productId) {
        showEditProductForm(productId);
    } else {
        showAddProductForm();
    }
}

function showAddProductForm() {
    const formContent = `
        <form id="new-product-form" onsubmit="submitNewProduct(event)">
            <div class="product-form-header">
                <h4>Add New Product</h4>
                <p class="text-muted">Add a new product to your inventory</p>
            </div>

            <div class="form-group">
                <label class="form-label">Product Name *</label>
                <input
                    type="text"
                    class="form-input"
                    name="name"
                    placeholder="Enter product name"
                    required
                >
            </div>

            <div class="form-group">
                <label class="form-label">Category</label>
                <select class="form-input" name="category">
                    <option value="">Select category</option>
                    <option value="Bakery">Bakery</option>
                    <option value="Pastries">Pastries</option>
                    <option value="Cakes">Cakes</option>
                    <option value="Donuts">Donuts</option>
                    <option value="Bread">Bread</option>
                    <option value="Special Orders">Special Orders</option>
                    <option value="Other">Other</option>
                </select>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Default Cost Price</label>
                    <input
                        type="number"
                        class="form-input"
                        name="default_cost_price"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                    >
                </div>
                <div class="form-group">
                    <label class="form-label">Default Sell Price</label>
                    <input
                        type="number"
                        class="form-input"
                        name="default_sell_price"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                    >
                </div>
            </div>

            <div class="form-group">
                <label class="form-label">Description</label>
                <textarea
                    class="form-input"
                    name="description"
                    rows="3"
                    placeholder="Optional description of the product..."
                ></textarea>
            </div>

            <div class="form-actions">
                <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">
                    <i class="fas fa-plus"></i> Add Product
                </button>
            </div>
        </form>
    `;

    showModal('Add New Product', formContent);
}

async function submitNewProduct(event) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);

    const name = formData.get('name').trim();
    const category = formData.get('category').trim();
    const defaultCostPrice = formData.get('default_cost_price');
    const defaultSellPrice = formData.get('default_sell_price');
    const description = formData.get('description').trim();

    // Validation
    if (!name) {
        showError('Product name is required');
        return;
    }

    // Validate prices if provided
    if (defaultCostPrice && parseFloat(defaultCostPrice) < 0) {
        showError('Cost price cannot be negative');
        return;
    }

    if (defaultSellPrice && parseFloat(defaultSellPrice) < 0) {
        showError('Sell price cannot be negative');
        return;
    }

    try {
        showLoading(true);

        const productData = {
            name: name
        };

        // Add optional fields only if they have values
        if (category) productData.category = category;
        if (defaultCostPrice) productData.default_cost_price = parseFloat(defaultCostPrice);
        if (defaultSellPrice) productData.default_sell_price = parseFloat(defaultSellPrice);
        if (description) productData.description = description;

        console.log('Creating product:', productData); // Debug log

        const response = await apiRequest('/products/', {
            method: 'POST',
            body: JSON.stringify(productData)
        });

        showLoading(false);
        closeModal();

        // Show success message
        alert('Product added successfully!');

        // Refresh the products list
        if (currentPage === 'products') {
            await loadProductsData();
        }

        // Refresh dashboard if on dashboard
        if (currentPage === 'dashboard') {
            await loadDashboardData();
        }

    } catch (error) {
        showLoading(false);
        console.error('Failed to create product:', error);
        showError('Failed to add product. Please check your entries and try again.');
    }
}

async function showEditProductForm(productId) {
    try {
        // Get the existing product details
        const product = await apiRequest(`/products/${productId}/`);

        const formContent = `
            <form id="edit-product-form" onsubmit="submitEditProduct(event, ${productId})">
                <div class="product-form-header">
                    <h4>Edit Product</h4>
                    <p class="text-muted">Update product information</p>
                </div>

                <div class="form-group">
                    <label class="form-label">Product Name *</label>
                    <input
                        type="text"
                        class="form-input"
                        name="name"
                        value="${product.name || ''}"
                        required
                    >
                </div>

                <div class="form-group">
                    <label class="form-label">Category</label>
                    <select class="form-input" name="category">
                        <option value="">Select category</option>
                        <option value="Bakery" ${product.category === 'Bakery' ? 'selected' : ''}>Bakery</option>
                        <option value="Pastries" ${product.category === 'Pastries' ? 'selected' : ''}>Pastries</option>
                        <option value="Cakes" ${product.category === 'Cakes' ? 'selected' : ''}>Cakes</option>
                        <option value="Donuts" ${product.category === 'Donuts' ? 'selected' : ''}>Donuts</option>
                        <option value="Bread" ${product.category === 'Bread' ? 'selected' : ''}>Bread</option>
                        <option value="Special Orders" ${product.category === 'Special Orders' ? 'selected' : ''}>Special Orders</option>
                        <option value="Other" ${product.category === 'Other' ? 'selected' : ''}>Other</option>
                    </select>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Default Cost Price</label>
                        <input
                            type="number"
                            class="form-input"
                            name="default_cost_price"
                            value="${product.default_cost_price || ''}"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                        >
                    </div>
                    <div class="form-group">
                        <label class="form-label">Default Sell Price</label>
                        <input
                            type="number"
                            class="form-input"
                            name="default_sell_price"
                            value="${product.default_sell_price || ''}"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                        >
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">Description</label>
                    <textarea
                        class="form-input"
                        name="description"
                        rows="3"
                        placeholder="Optional description of the product..."
                    >${product.description || ''}</textarea>
                </div>

                <div class="form-actions">
                    <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-save"></i> Update Product
                    </button>
                </div>
            </form>
        `;

        showModal('Edit Product', formContent);
    } catch (error) {
        console.error('Failed to load product for editing:', error);
        showError('Failed to load product details. Please try again.');
    }
}

async function submitEditProduct(event, productId) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);

    const name = formData.get('name').trim();
    const category = formData.get('category').trim();
    const defaultCostPrice = formData.get('default_cost_price');
    const defaultSellPrice = formData.get('default_sell_price');
    const description = formData.get('description').trim();

    // Validation
    if (!name) {
        showError('Product name is required');
        return;
    }

    // Validate prices if provided
    if (defaultCostPrice && parseFloat(defaultCostPrice) < 0) {
        showError('Cost price cannot be negative');
        return;
    }

    if (defaultSellPrice && parseFloat(defaultSellPrice) < 0) {
        showError('Sell price cannot be negative');
        return;
    }

    try {
        showLoading(true);

        const productData = {
            name: name,
            category: category || '',
            default_cost_price: defaultCostPrice ? parseFloat(defaultCostPrice) : null,
            default_sell_price: defaultSellPrice ? parseFloat(defaultSellPrice) : null,
            description: description || ''
        };

        console.log('Updating product:', productData); // Debug log

        const response = await apiRequest(`/products/${productId}/`, {
            method: 'PUT',
            body: JSON.stringify(productData)
        });

        showLoading(false);
        closeModal();

        // Show success message
        alert('Product updated successfully!');

        // Refresh the products list
        if (currentPage === 'products') {
            await loadProductsData();
        }

        // Refresh dashboard if on dashboard
        if (currentPage === 'dashboard') {
            await loadDashboardData();
        }

    } catch (error) {
        showLoading(false);
        console.error('Failed to update product:', error);
        showError('Failed to update product. Please check your entries and try again.');
    }
}

function showCustomerForm(customerId = null) {
    if (customerId) {
        showEditCustomerForm(customerId);
    } else {
        showAddCustomerForm();
    }
}

function showAddCustomerForm() {
    const formContent = `
        <form id="new-customer-form" onsubmit="submitNewCustomer(event)">
            <div class="customer-form-header">
                <h4>Add New Customer</h4>
                <p class="text-muted">Add a new customer to your database</p>
            </div>

            <div class="form-group">
                <label class="form-label">Customer Name *</label>
                <input
                    type="text"
                    class="form-input"
                    name="name"
                    placeholder="Enter customer name"
                    required
                >
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Phone Number</label>
                    <input
                        type="tel"
                        class="form-input"
                        name="phone"
                        placeholder="e.g., 08012345678"
                    >
                </div>
                <div class="form-group">
                    <label class="form-label">Email Address</label>
                    <input
                        type="email"
                        class="form-input"
                        name="email"
                        placeholder="customer@example.com"
                    >
                </div>
            </div>

            <div class="form-group">
                <label class="form-label">Address</label>
                <textarea
                    class="form-input"
                    name="address"
                    rows="2"
                    placeholder="Customer's address (optional)"
                ></textarea>
            </div>

            <div class="form-group">
                <label class="form-label">Birthday</label>
                <input
                    type="date"
                    class="form-input"
                    name="birthday"
                >
                <small class="form-help">Optional - helps track special occasions</small>
            </div>

            <div class="form-actions">
                <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">
                    <i class="fas fa-user-plus"></i> Add Customer
                </button>
            </div>
        </form>
    `;

    showModal('Add New Customer', formContent);
}

async function submitNewCustomer(event) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);

    const name = formData.get('name').trim();
    const phone = formData.get('phone').trim();
    const email = formData.get('email').trim();
    const address = formData.get('address').trim();
    const birthday = formData.get('birthday');

    // Validation
    if (!name) {
        showError('Customer name is required');
        return;
    }

    // Basic phone validation (if provided)
    if (phone && !/^[\d\s\-\+\(\)]+$/.test(phone)) {
        showError('Please enter a valid phone number');
        return;
    }

    // Basic email validation (if provided)
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showError('Please enter a valid email address');
        return;
    }

    try {
        showLoading(true);

        const customerData = {
            name: name
        };

        // Add optional fields only if they have values
        if (phone) customerData.phone = phone;
        if (email) customerData.email = email;
        if (address) customerData.address = address;
        if (birthday) customerData.birthday = birthday;

        console.log('Creating customer:', customerData); // Debug log

        const response = await apiRequest('/customers/', {
            method: 'POST',
            body: JSON.stringify(customerData)
        });

        showLoading(false);
        closeModal();

        // Show success message
        alert('Customer added successfully!');

        // Refresh the customers list
        if (currentPage === 'customers') {
            await loadCustomersData();
        }

        // Refresh dashboard if on dashboard
        if (currentPage === 'dashboard') {
            await loadDashboardData();
        }

    } catch (error) {
        showLoading(false);
        console.error('Failed to create customer:', error);
        showError('Failed to add customer. Please check your entries and try again.');
    }
}

async function showEditCustomerForm(customerId) {
    try {
        // Get the existing customer details
        const customer = await apiRequest(`/customers/${customerId}/`);

        const formContent = `
            <form id="edit-customer-form" onsubmit="submitEditCustomer(event, ${customerId})">
                <div class="customer-form-header">
                    <h4>Edit Customer</h4>
                    <p class="text-muted">Update customer information</p>
                </div>

                <div class="form-group">
                    <label class="form-label">Customer Name *</label>
                    <input
                        type="text"
                        class="form-input"
                        name="name"
                        value="${customer.name || ''}"
                        required
                    >
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Phone Number</label>
                        <input
                            type="tel"
                            class="form-input"
                            name="phone"
                            value="${customer.phone || ''}"
                            placeholder="e.g., 08012345678"
                        >
                    </div>
                    <div class="form-group">
                        <label class="form-label">Email Address</label>
                        <input
                            type="email"
                            class="form-input"
                            name="email"
                            value="${customer.email || ''}"
                            placeholder="customer@example.com"
                        >
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">Address</label>
                    <textarea
                        class="form-input"
                        name="address"
                        rows="2"
                        placeholder="Customer's address (optional)"
                    >${customer.address || ''}</textarea>
                </div>

                <div class="form-group">
                    <label class="form-label">Birthday</label>
                    <input
                        type="date"
                        class="form-input"
                        name="birthday"
                        value="${customer.birthday || ''}"
                    >
                    <small class="form-help">Optional - helps track special occasions</small>
                </div>

                <div class="customer-summary">
                    <div class="summary-item">
                        <span>Total Outstanding Debt:</span>
                        <strong>${formatCurrency(customer.total_debt || 0)}</strong>
                    </div>
                </div>

                <div class="form-actions">
                    <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-save"></i> Update Customer
                    </button>
                </div>
            </form>
        `;

        showModal('Edit Customer', formContent);
    } catch (error) {
        console.error('Failed to load customer for editing:', error);
        showError('Failed to load customer details. Please try again.');
    }
}

async function submitEditCustomer(event, customerId) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);

    const name = formData.get('name').trim();
    const phone = formData.get('phone').trim();
    const email = formData.get('email').trim();
    const address = formData.get('address').trim();
    const birthday = formData.get('birthday');

    // Validation
    if (!name) {
        showError('Customer name is required');
        return;
    }

    // Basic phone validation (if provided)
    if (phone && !/^[\d\s\-\+\(\)]+$/.test(phone)) {
        showError('Please enter a valid phone number');
        return;
    }

    // Basic email validation (if provided)
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showError('Please enter a valid email address');
        return;
    }

    try {
        showLoading(true);

        const customerData = {
            name: name,
            phone: phone || '',
            email: email || '',
            address: address || '',
            birthday: birthday || null
        };

        console.log('Updating customer:', customerData); // Debug log

        const response = await apiRequest(`/customers/${customerId}/`, {
            method: 'PUT',
            body: JSON.stringify(customerData)
        });

        showLoading(false);
        closeModal();

        // Show success message
        alert('Customer updated successfully!');

        // Refresh the customers list
        if (currentPage === 'customers') {
            await loadCustomersData();
        }

        // Refresh dashboard if on dashboard
        if (currentPage === 'dashboard') {
            await loadDashboardData();
        }

    } catch (error) {
        showLoading(false);
        console.error('Failed to update customer:', error);
        showError('Failed to update customer. Please check your entries and try again.');
    }
}

async function showGiveawayForm(giveawayId = null) {
    try {
        // Get orders and products for dropdowns
        const [ordersData, productsData] = await Promise.all([
            apiRequest('/orders/'),
            apiRequest('/products/')
        ]);

        const orders = ordersData.results || ordersData;
        const products = productsData.results || productsData;

        let giveaway = null;
        if (giveawayId) {
            giveaway = await apiRequest(`/giveaways/${giveawayId}/`);
        }

        const formContent = `
            <form id="${giveawayId ? 'edit' : 'new'}-giveaway-form" onsubmit="${giveawayId ? `submitEditGiveaway(event, ${giveawayId})` : 'submitNewGiveaway(event)'}">
                <div class="giveaway-form-header">
                    <h4>${giveawayId ? 'Edit' : 'Add'} Giveaway</h4>
                    <p class="text-muted">Track items given away for free</p>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Weekly Order *</label>
                        <select class="form-input" name="order" required>
                            <option value="">Select order</option>
                            ${orders.map(order => `
                                <option value="${order.id}" ${giveaway && giveaway.order === order.id ? 'selected' : ''}>
                                    ${formatDate(order.date)} - ₦${order.total_revenue}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Product *</label>
                        <select class="form-input" name="product" required>
                            <option value="">Select product</option>
                            ${products.map(product => `
                                <option value="${product.id}" ${giveaway && giveaway.product === product.id ? 'selected' : ''}>
                                    ${product.name}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Quantity *</label>
                        <input
                            type="number"
                            class="form-input"
                            name="quantity"
                            value="${giveaway ? giveaway.quantity : ''}"
                            min="1"
                            required
                        >
                    </div>
                    <div class="form-group">
                        <label class="form-label">Cost Price *</label>
                        <input
                            type="number"
                            class="form-input"
                            name="cost_price"
                            value="${giveaway ? giveaway.cost_price : ''}"
                            min="0"
                            step="0.01"
                            required
                        >
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Recipient *</label>
                        <input
                            type="text"
                            class="form-input"
                            name="recipient"
                            value="${giveaway ? giveaway.recipient : ''}"
                            placeholder="e.g., Pastor, Church, Charity"
                            required
                        >
                    </div>
                    <div class="form-group">
                        <label class="form-label">Date Given *</label>
                        <input
                            type="date"
                            class="form-input"
                            name="date_given"
                            value="${giveaway ? giveaway.date_given : new Date().toISOString().split('T')[0]}"
                            required
                        >
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">Notes</label>
                    <textarea
                        class="form-input"
                        name="notes"
                        rows="2"
                        placeholder="Optional notes about the giveaway..."
                    >${giveaway ? giveaway.notes : ''}</textarea>
                </div>

                <div class="form-actions">
                    <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-gift"></i> ${giveawayId ? 'Update' : 'Add'} Giveaway
                    </button>
                </div>
            </form>
        `;

        showModal(`${giveawayId ? 'Edit' : 'Add'} Giveaway`, formContent);
    } catch (error) {
        console.error('Failed to load giveaway form:', error);
        showError('Failed to load form. Please try again.');
    }
}

async function submitNewGiveaway(event) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);

    const order = formData.get('order');
    const product = formData.get('product');
    const quantity = parseInt(formData.get('quantity'));
    const costPrice = parseFloat(formData.get('cost_price'));
    const recipient = formData.get('recipient').trim();
    const dateGiven = formData.get('date_given');
    const notes = formData.get('notes').trim();

    // Validation
    if (!order || !product || !quantity || !costPrice || !recipient || !dateGiven) {
        showError('Please fill in all required fields');
        return;
    }

    if (quantity <= 0) {
        showError('Quantity must be greater than 0');
        return;
    }

    if (costPrice < 0) {
        showError('Cost price cannot be negative');
        return;
    }

    try {
        showLoading(true);

        const giveawayData = {
            order: parseInt(order),
            product: parseInt(product),
            quantity: quantity,
            cost_price: costPrice,
            recipient: recipient,
            date_given: dateGiven,
            notes: notes
        };

        console.log('Creating giveaway:', giveawayData); // Debug log

        const response = await apiRequest('/giveaways/', {
            method: 'POST',
            body: JSON.stringify(giveawayData)
        });

        showLoading(false);
        closeModal();

        // Show success message
        alert('Giveaway recorded successfully!');

        // Refresh the tracking data
        if (currentPage === 'tracking') {
            await loadTrackingData();
        }

        // Refresh dashboard if on dashboard
        if (currentPage === 'dashboard') {
            await loadDashboardData();
        }

    } catch (error) {
        showLoading(false);
        console.error('Failed to create giveaway:', error);
        showError('Failed to record giveaway. Please check your entries and try again.');
    }
}

async function submitEditGiveaway(event, giveawayId) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);

    const order = formData.get('order');
    const product = formData.get('product');
    const quantity = parseInt(formData.get('quantity'));
    const costPrice = parseFloat(formData.get('cost_price'));
    const recipient = formData.get('recipient').trim();
    const dateGiven = formData.get('date_given');
    const notes = formData.get('notes').trim();

    // Validation
    if (!order || !product || !quantity || !costPrice || !recipient || !dateGiven) {
        showError('Please fill in all required fields');
        return;
    }

    if (quantity <= 0) {
        showError('Quantity must be greater than 0');
        return;
    }

    if (costPrice < 0) {
        showError('Cost price cannot be negative');
        return;
    }

    try {
        showLoading(true);

        const giveawayData = {
            order: parseInt(order),
            product: parseInt(product),
            quantity: quantity,
            cost_price: costPrice,
            recipient: recipient,
            date_given: dateGiven,
            notes: notes
        };

        console.log('Updating giveaway:', giveawayData); // Debug log

        const response = await apiRequest(`/giveaways/${giveawayId}/`, {
            method: 'PUT',
            body: JSON.stringify(giveawayData)
        });

        showLoading(false);
        closeModal();

        // Show success message
        alert('Giveaway updated successfully!');

        // Refresh the tracking data
        if (currentPage === 'tracking') {
            await loadTrackingData();
        }

        // Refresh dashboard if on dashboard
        if (currentPage === 'dashboard') {
            await loadDashboardData();
        }

    } catch (error) {
        showLoading(false);
        console.error('Failed to update giveaway:', error);
        showError('Failed to update giveaway. Please check your entries and try again.');
    }
}

async function showDebtForm() {
    try {
        // Get customers for the dropdown
        const customersData = await apiRequest('/customers/');
        const customers = customersData.results || customersData;

        const formContent = `
            <form id="new-debt-form" onsubmit="submitNewDebt(event)">
                <div class="debt-form-header">
                    <h4>Add New Debt Record</h4>
                    <p class="text-muted">Record a new debt for a customer</p>
                </div>

                <div class="form-group">
                    <label class="form-label">Customer *</label>
                    <select class="form-input" name="customer" required>
                        <option value="">Select a customer</option>
                        ${customers.map(customer => `
                            <option value="${customer.id}">${customer.name}</option>
                        `).join('')}
                    </select>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Debt Amount *</label>
                        <input
                            type="number"
                            class="form-input"
                            name="amount"
                            min="0.01"
                            step="0.01"
                            placeholder="0.00"
                            required
                        >
                    </div>
                    <div class="form-group">
                        <label class="form-label">Date Created</label>
                        <input
                            type="date"
                            class="form-input"
                            name="date_created"
                            value="${new Date().toISOString().split('T')[0]}"
                            required
                        >
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">Description *</label>
                    <textarea
                        class="form-input"
                        name="description"
                        rows="3"
                        placeholder="What is this debt for? (e.g., Order from Oct 1, 2025, Special cake order, etc.)"
                        required
                    ></textarea>
                </div>

                <div class="form-group">
                    <label class="form-label">Initial Payment (optional)</label>
                    <input
                        type="number"
                        class="form-input"
                        name="initial_payment"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                    >
                    <small class="form-help">If customer pays something upfront, enter the amount here</small>
                </div>

                <div class="form-actions">
                    <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-plus"></i> Add Debt
                    </button>
                </div>
            </form>
        `;

        showModal('Add New Debt', formContent);
    } catch (error) {
        console.error('Failed to load customers for debt form:', error);
        showError('Failed to load customers. Please try again.');
    }
}

async function submitNewDebt(event) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);

    const customerId = formData.get('customer');
    const amount = parseFloat(formData.get('amount'));
    const dateCreated = formData.get('date_created');
    const description = formData.get('description').trim();
    const initialPayment = parseFloat(formData.get('initial_payment')) || 0;

    // Validation
    if (!customerId) {
        showError('Please select a customer');
        return;
    }

    if (amount <= 0) {
        showError('Debt amount must be greater than 0');
        return;
    }

    if (!description) {
        showError('Please provide a description for this debt');
        return;
    }

    if (initialPayment > amount) {
        showError('Initial payment cannot be greater than the debt amount');
        return;
    }

    try {
        showLoading(true);

        const debtData = {
            customer: customerId,
            amount: amount.toFixed(2),
            description: description,
            date_created: dateCreated
        };

        // If there's an initial payment, include it
        if (initialPayment > 0) {
            debtData.amount_paid = initialPayment.toFixed(2);
        }

        console.log('Creating debt:', debtData); // Debug log

        const response = await apiRequest('/debts/', {
            method: 'POST',
            body: JSON.stringify(debtData)
        });

        showLoading(false);
        closeModal();

        // Show success message
        alert('Debt record created successfully!');

        // Refresh the debts list
        if (currentPage === 'debts') {
            await loadDebtsData();
        }

        // Refresh dashboard if on dashboard
        if (currentPage === 'dashboard') {
            await loadDashboardData();
        }

    } catch (error) {
        showLoading(false);
        console.error('Failed to create debt:', error);
        showError('Failed to create debt record. Please check your entries and try again.');
    }
}

function filterDebts() {
    const filter = document.getElementById('debt-filter').value;
    // Filter implementation will be added here
}

function filterOrders() {
    const filter = document.getElementById('orders-filter').value;
    let filteredOrders = [...orders];

    switch(filter) {
        case 'with-sales':
            filteredOrders = orders.filter(order => order.has_sales_data);
            break;
        case 'without-sales':
            filteredOrders = orders.filter(order => !order.has_sales_data);
            break;
        case 'complete':
            filteredOrders = orders.filter(order => order.sales_completion_percentage === 100);
            break;
        case 'all':
        default:
            filteredOrders = orders;
            break;
    }

    updateOrdersCalendar(filteredOrders);
}

function exportReports() {
    alert('Export functionality will be implemented');
}

async function viewOrder(orderId) {
    try {
        const order = await apiRequest(`/orders/${orderId}/`);
        showOrderDetailModal(order);
    } catch (error) {
        console.error('Failed to load order details:', error);
        showError('Failed to load order details');
    }
}

function showOrderDetailModal(order) {
    const hasActualSales = order.has_sales_data;
    const completionPercentage = order.sales_completion_percentage;

    const modalContent = `
        <div class="order-detail-modal">
            <div class="order-header">
                <h3>Order for ${formatDate(order.date)}</h3>
                <div class="order-status">
                    <span class="completion-badge ${hasActualSales ? 'has-data' : 'no-data'}">
                        ${completionPercentage.toFixed(0)}% Sales Data Entered
                    </span>
                </div>
            </div>

            <div class="order-summary-cards">
                <div class="summary-card planned">
                    <h4>Planned</h4>
                    <div class="metric">Revenue: ${formatCurrency(order.total_revenue)}</div>
                    <div class="metric">Cost: ${formatCurrency(order.total_cost)}</div>
                    <div class="metric profit">Profit: ${formatCurrency(order.total_profit)}</div>
                </div>
                <div class="summary-card actual">
                    <h4>Actual</h4>
                    <div class="metric">Revenue: ${formatCurrency(order.actual_total_revenue)}</div>
                    <div class="metric">Cost: ${formatCurrency(order.actual_total_cost)}</div>
                    <div class="metric profit">Profit: ${formatCurrency(order.actual_total_profit)}</div>
                </div>
                <div class="summary-card variance">
                    <h4>Variance</h4>
                    <div class="metric">Revenue: ${formatCurrency(order.actual_total_revenue - order.total_revenue)}</div>
                    <div class="metric">Cost: ${formatCurrency(order.actual_total_cost - order.total_cost)}</div>
                    <div class="metric profit">Profit: ${formatCurrency(order.actual_total_profit - order.total_profit)}</div>
                </div>
            </div>

            <div class="order-items-section">
                <div class="section-header">
                    <h4>Items</h4>
                    <button class="btn btn-primary" onclick="showSalesEntryForm(${order.id})">
                        <i class="fas fa-edit"></i> Enter Sales Data
                    </button>
                </div>

                <div class="items-table">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Planned Qty</th>
                                <th>Sold Qty</th>
                                <th>Remaining</th>
                                <th>Planned Price</th>
                                <th>Actual Price</th>
                                <th>Sell-through %</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${order.items.map(item => `
                                <tr>
                                    <td><strong>${item.product_name}</strong></td>
                                    <td>${item.quantity}</td>
                                    <td>${item.sales ? item.sales.quantity_sold : '-'}</td>
                                    <td>${item.sales ? item.sales.quantity_remaining : item.quantity}</td>
                                    <td>${formatCurrency(item.sell_price)}</td>
                                    <td>${item.sales ? formatCurrency(item.sales.actual_sell_price) : '-'}</td>
                                    <td>${item.sales ? item.sales.sell_through_rate.toFixed(1) + '%' : '0%'}</td>
                                    <td>
                                        <span class="status-badge ${item.has_sales ? 'status-complete' : 'status-pending'}">
                                            ${item.has_sales ? 'Complete' : 'Pending'}
                                        </span>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            ${order.notes ? `<div class="order-notes"><strong>Notes:</strong> ${order.notes}</div>` : ''}
        </div>
    `;

    showModal(`Order Details - ${formatDate(order.date)}`, modalContent);
}

function viewCustomer(customerId) {
    showCustomerHistory(customerId);
}

async function showCustomerHistory(customerId) {
    try {
        // Get customer details
        const customer = await apiRequest(`/customers/${customerId}/`);

        // Get customer's debts
        const debtsData = await apiRequest(`/debts/?customer=${customerId}`);
        const customerDebts = debtsData.results || debtsData;

        // Get all orders to find customer's purchase history
        const ordersData = await apiRequest('/orders/');
        const allOrders = ordersData.results || ordersData;

        // Filter orders that might be related to this customer (through debts)
        const customerOrders = allOrders.filter(order =>
            customerDebts.some(debt =>
                debt.description && debt.description.includes(formatDate(order.date))
            )
        );

        const modalContent = `
            <div class="customer-history-modal">
                <div class="customer-header">
                    <h3>${customer.name}</h3>
                    <div class="customer-contact">
                        ${customer.phone ? `<p><i class="fas fa-phone"></i> ${customer.phone}</p>` : ''}
                        ${customer.email ? `<p><i class="fas fa-envelope"></i> ${customer.email}</p>` : ''}
                        ${customer.address ? `<p><i class="fas fa-map-marker-alt"></i> ${customer.address}</p>` : ''}
                    </div>
                </div>

                <div class="customer-summary">
                    <div class="summary-stat">
                        <div class="stat-value">${formatCurrency(customer.total_debt || 0)}</div>
                        <div class="stat-label">Total Outstanding Debt</div>
                    </div>
                    <div class="summary-stat">
                        <div class="stat-value">${customerDebts.length}</div>
                        <div class="stat-label">Total Debt Records</div>
                    </div>
                    <div class="summary-stat">
                        <div class="stat-value">${customerOrders.length}</div>
                        <div class="stat-label">Related Orders</div>
                    </div>
                </div>

                <div class="customer-sections">
                    <div class="section">
                        <h4><i class="fas fa-credit-card"></i> Debt History</h4>
                        ${customerDebts.length > 0 ? `
                            <div class="debt-history-list">
                                ${customerDebts.map(debt => `
                                    <div class="debt-history-item">
                                        <div class="debt-details">
                                            <strong>${formatCurrency(debt.amount)}</strong>
                                            <span class="debt-description">${debt.description || 'No description'}</span>
                                            <small class="debt-date">Created: ${formatDate(debt.date_created)}</small>
                                        </div>
                                        <div class="debt-status">
                                            <div class="outstanding-amount">${formatCurrency(debt.outstanding_amount)} remaining</div>
                                            <span class="status-badge status-${debt.status}">${debt.status}</span>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        ` : '<p class="text-muted">No debt records found.</p>'}
                    </div>

                    <div class="section">
                        <h4><i class="fas fa-shopping-cart"></i> Purchase History</h4>
                        ${customerOrders.length > 0 ? `
                            <div class="purchase-history-list">
                                ${customerOrders.map(order => `
                                    <div class="purchase-history-item" onclick="viewOrder(${order.id})">
                                        <div class="purchase-details">
                                            <strong>${formatDate(order.date)}</strong>
                                            <span class="purchase-summary">${order.items?.length || 0} items</span>
                                        </div>
                                        <div class="purchase-amounts">
                                            <div class="purchase-total">${formatCurrency(order.total_revenue || 0)}</div>
                                            <small>Total Order Value</small>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        ` : '<p class="text-muted">No purchase history found.</p>'}
                    </div>
                </div>

                ${customer.birthday ? `
                    <div class="customer-notes">
                        <p><i class="fas fa-birthday-cake"></i> <strong>Birthday:</strong> ${formatDate(customer.birthday)}</p>
                    </div>
                ` : ''}
            </div>
        `;

        showModal(`Customer History - ${customer.name}`, modalContent);
    } catch (error) {
        console.error('Failed to load customer history:', error);
        showError('Failed to load customer history');
    }
}

function makePayment(debtId) {
    console.log('Make payment for debt:', debtId);
}

async function editDebt(debtId) {
    try {
        // Get the existing debt details
        const debt = await apiRequest(`/debts/${debtId}/`);

        // Get customers for the dropdown
        const customersData = await apiRequest('/customers/');
        const customers = customersData.results || customersData;

        const formContent = `
            <form id="edit-debt-form" onsubmit="submitEditDebt(event, ${debtId})">
                <div class="debt-form-header">
                    <h4>Edit Debt Record</h4>
                    <p class="text-muted">Update debt information</p>
                </div>

                <div class="form-group">
                    <label class="form-label">Customer *</label>
                    <select class="form-input" name="customer" required>
                        <option value="">Select a customer</option>
                        ${customers.map(customer => `
                            <option value="${customer.id}" ${customer.id === debt.customer ? 'selected' : ''}>
                                ${customer.name}
                            </option>
                        `).join('')}
                    </select>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Debt Amount *</label>
                        <input
                            type="number"
                            class="form-input"
                            name="amount"
                            min="0.01"
                            step="0.01"
                            value="${debt.amount}"
                            required
                        >
                    </div>
                    <div class="form-group">
                        <label class="form-label">Date Created</label>
                        <input
                            type="date"
                            class="form-input"
                            name="date_created"
                            value="${debt.date_created}"
                            required
                        >
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">Description *</label>
                    <textarea
                        class="form-input"
                        name="description"
                        rows="3"
                        required
                    >${debt.description || ''}</textarea>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Amount Paid</label>
                        <input
                            type="number"
                            class="form-input"
                            name="amount_paid"
                            min="0"
                            step="0.01"
                            value="${debt.amount_paid || 0}"
                        >
                        <small class="form-help">Total amount paid so far</small>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Status</label>
                        <select class="form-input" name="status">
                            <option value="outstanding" ${debt.status === 'outstanding' ? 'selected' : ''}>Outstanding</option>
                            <option value="partial" ${debt.status === 'partial' ? 'selected' : ''}>Partial</option>
                            <option value="paid" ${debt.status === 'paid' ? 'selected' : ''}>Paid</option>
                        </select>
                    </div>
                </div>

                <div class="debt-summary">
                    <div class="summary-item">
                        <span>Outstanding Amount:</span>
                        <strong id="outstanding-preview">${formatCurrency(debt.outstanding_amount || 0)}</strong>
                    </div>
                </div>

                <div class="form-actions">
                    <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-save"></i> Update Debt
                    </button>
                </div>
            </form>
        `;

        showModal('Edit Debt Record', formContent);

        // Add real-time calculation of outstanding amount
        const form = document.getElementById('edit-debt-form');
        const amountInput = form.querySelector('input[name="amount"]');
        const amountPaidInput = form.querySelector('input[name="amount_paid"]');
        const outstandingPreview = document.getElementById('outstanding-preview');

        function updateOutstanding() {
            const amount = parseFloat(amountInput.value) || 0;
            const amountPaid = parseFloat(amountPaidInput.value) || 0;
            const outstanding = Math.max(0, amount - amountPaid);
            outstandingPreview.textContent = formatCurrency(outstanding);
        }

        amountInput.addEventListener('input', updateOutstanding);
        amountPaidInput.addEventListener('input', updateOutstanding);

    } catch (error) {
        console.error('Failed to load debt for editing:', error);
        showError('Failed to load debt details. Please try again.');
    }
}

async function submitEditDebt(event, debtId) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);

    const customerId = formData.get('customer');
    const amount = parseFloat(formData.get('amount'));
    const dateCreated = formData.get('date_created');
    const description = formData.get('description').trim();
    const amountPaid = parseFloat(formData.get('amount_paid')) || 0;
    const status = formData.get('status');

    // Validation
    if (!customerId) {
        showError('Please select a customer');
        return;
    }

    if (amount <= 0) {
        showError('Debt amount must be greater than 0');
        return;
    }

    if (!description) {
        showError('Please provide a description for this debt');
        return;
    }

    if (amountPaid > amount) {
        showError('Amount paid cannot be greater than the debt amount');
        return;
    }

    try {
        showLoading(true);

        const debtData = {
            customer: customerId,
            amount: amount.toFixed(2),
            description: description,
            date_created: dateCreated,
            amount_paid: amountPaid.toFixed(2),
            status: status
        };

        console.log('Updating debt:', debtData); // Debug log

        const response = await apiRequest(`/debts/${debtId}/`, {
            method: 'PUT',
            body: JSON.stringify(debtData)
        });

        showLoading(false);
        closeModal();

        // Show success message
        alert('Debt record updated successfully!');

        // Refresh the debts list
        if (currentPage === 'debts') {
            await loadDebtsData();
        }

        // Refresh dashboard if on dashboard
        if (currentPage === 'dashboard') {
            await loadDashboardData();
        }

    } catch (error) {
        showLoading(false);
        console.error('Failed to update debt:', error);
        showError('Failed to update debt record. Please check your entries and try again.');
    }
}

async function showExpenseForm(expenseId = null) {
    try {
        // Get orders for dropdown
        const ordersData = await apiRequest('/orders/');
        const orders = ordersData.results || ordersData;

        // Get expense categories
        const categoriesData = await apiRequest('/expenses/categories/');
        const categories = categoriesData || [];

        let expense = null;
        if (expenseId) {
            expense = await apiRequest(`/expenses/${expenseId}/`);
        }

        const formContent = `
            <form id="${expenseId ? 'edit' : 'new'}-expense-form" onsubmit="${expenseId ? `submitEditExpense(event, ${expenseId})` : 'submitNewExpense(event)'}">
                <div class="expense-form-header">
                    <h4>${expenseId ? 'Edit' : 'Add'} Expense</h4>
                    <p class="text-muted">Track operational expenses</p>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Category *</label>
                        <select class="form-input" name="category" required>
                            <option value="">Select category</option>
                            ${categories.map(cat => `
                                <option value="${cat.value}" ${expense && expense.category === cat.value ? 'selected' : ''}>
                                    ${cat.label}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Amount *</label>
                        <input
                            type="number"
                            class="form-input"
                            name="amount"
                            value="${expense ? expense.amount : ''}"
                            min="0"
                            step="0.01"
                            required
                        >
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">Description *</label>
                    <input
                        type="text"
                        class="form-input"
                        name="description"
                        value="${expense ? expense.description : ''}"
                        placeholder="Brief description of the expense"
                        required
                    >
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Date *</label>
                        <input
                            type="date"
                            class="form-input"
                            name="date"
                            value="${expense ? expense.date : new Date().toISOString().split('T')[0]}"
                            required
                        >
                    </div>
                    <div class="form-group">
                        <label class="form-label">Associated Order</label>
                        <select class="form-input" name="order">
                            <option value="">No specific order</option>
                            ${orders.map(order => `
                                <option value="${order.id}" ${expense && expense.order === order.id ? 'selected' : ''}>
                                    ${formatDate(order.date)} - ₦${order.total_revenue}
                                </option>
                            `).join('')}
                        </select>
                        <small class="form-help">Optional - link to a specific weekly order</small>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">Notes</label>
                    <textarea
                        class="form-input"
                        name="notes"
                        rows="2"
                        placeholder="Optional additional details..."
                    >${expense ? expense.notes : ''}</textarea>
                </div>

                <div class="form-actions">
                    <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-receipt"></i> ${expenseId ? 'Update' : 'Add'} Expense
                    </button>
                </div>
            </form>
        `;

        showModal(`${expenseId ? 'Edit' : 'Add'} Expense`, formContent);
    } catch (error) {
        console.error('Failed to load expense form:', error);
        showError('Failed to load form. Please try again.');
    }
}

async function submitNewExpense(event) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);

    const category = formData.get('category');
    const amount = parseFloat(formData.get('amount'));
    const description = formData.get('description').trim();
    const date = formData.get('date');
    const order = formData.get('order');
    const notes = formData.get('notes').trim();

    // Validation
    if (!category || !amount || !description || !date) {
        showError('Please fill in all required fields');
        return;
    }

    if (amount <= 0) {
        showError('Amount must be greater than 0');
        return;
    }

    try {
        showLoading(true);

        const expenseData = {
            category: category,
            amount: amount,
            description: description,
            date: date,
            notes: notes
        };

        // Add order if selected
        if (order) {
            expenseData.order = parseInt(order);
        }

        console.log('Creating expense:', expenseData); // Debug log

        const response = await apiRequest('/expenses/', {
            method: 'POST',
            body: JSON.stringify(expenseData)
        });

        showLoading(false);
        closeModal();

        // Show success message
        alert('Expense recorded successfully!');

        // Refresh the tracking data
        if (currentPage === 'tracking') {
            await loadTrackingData();
        }

        // Refresh dashboard if on dashboard
        if (currentPage === 'dashboard') {
            await loadDashboardData();
        }

    } catch (error) {
        showLoading(false);
        console.error('Failed to create expense:', error);
        showError('Failed to record expense. Please check your entries and try again.');
    }
}

// Tracking functions
let giveaways = [];
let expenses = [];

async function loadTrackingData() {
    try {
        // Load both giveaways and expenses
        const [giveawaysData, expensesData] = await Promise.all([
            apiRequest('/giveaways/'),
            apiRequest('/expenses/')
        ]);

        giveaways = giveawaysData.results || giveawaysData;
        expenses = expensesData.results || expensesData;

        updateGiveawaysList(giveaways);
        updateExpensesList(expenses);
    } catch (error) {
        console.error('Failed to load tracking data:', error);
    }
}

function switchTrackingTab(tab) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[onclick="switchTrackingTab('${tab}')"]`).classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(`${tab}-tab`).classList.add('active');
}

function updateGiveawaysList(giveaways) {
    const container = document.getElementById('giveaways-list');

    if (giveaways.length === 0) {
        container.innerHTML = '<p class="text-muted">No giveaways recorded yet. Add your first giveaway!</p>';
        return;
    }

    const giveawaysHtml = giveaways.map(giveaway => `
        <div class="tracking-card giveaway-card">
            <div class="tracking-info">
                <h4>${giveaway.product_name}</h4>
                <div class="tracking-details">
                    <p><i class="fas fa-calendar"></i> ${formatDate(giveaway.date_given)}</p>
                    <p><i class="fas fa-user"></i> ${giveaway.recipient}</p>
                    <p><i class="fas fa-box"></i> ${giveaway.quantity} units</p>
                    ${giveaway.notes ? `<p><i class="fas fa-sticky-note"></i> ${giveaway.notes}</p>` : ''}
                </div>
            </div>
            <div class="tracking-cost">
                <div class="cost-info">
                    <span>Total Cost:</span>
                    <strong class="cost-amount">${formatCurrency(giveaway.total_cost)}</strong>
                </div>
                <small>From Order: ${formatDate(giveaway.order_date)}</small>
            </div>
            <div class="tracking-actions">
                <button class="btn btn-sm btn-primary" onclick="editGiveaway(${giveaway.id})" title="Edit Giveaway">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteGiveaway(${giveaway.id})" title="Delete Giveaway">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');

    container.innerHTML = giveawaysHtml;
}

function updateExpensesList(expenses) {
    const container = document.getElementById('expenses-list');

    if (expenses.length === 0) {
        container.innerHTML = '<p class="text-muted">No expenses recorded yet. Add your first expense!</p>';
        return;
    }

    const expensesHtml = expenses.map(expense => `
        <div class="tracking-card expense-card">
            <div class="tracking-info">
                <h4>${expense.description}</h4>
                <div class="tracking-details">
                    <p><i class="fas fa-calendar"></i> ${formatDate(expense.date)}</p>
                    <p><i class="fas fa-tag"></i> ${expense.category_display}</p>
                    ${expense.order_date ? `<p><i class="fas fa-shopping-cart"></i> Order: ${formatDate(expense.order_date)}</p>` : ''}
                    ${expense.notes ? `<p><i class="fas fa-sticky-note"></i> ${expense.notes}</p>` : ''}
                </div>
            </div>
            <div class="tracking-cost">
                <div class="cost-info">
                    <span>Amount:</span>
                    <strong class="expense-amount">${formatCurrency(expense.amount)}</strong>
                </div>
            </div>
            <div class="tracking-actions">
                <button class="btn btn-sm btn-primary" onclick="editExpense(${expense.id})" title="Edit Expense">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteExpense(${expense.id})" title="Delete Expense">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');

    container.innerHTML = expensesHtml;
}

function loadReportsData() {
    document.querySelector('#reports-page .card-body').innerHTML =
        '<p class="text-muted">Reports functionality will be implemented here</p>';
}

async function showSalesEntryForm(orderId) {
    try {
        const order = await apiRequest(`/orders/${orderId}/`);

        const formContent = `
            <form id="sales-entry-form" onsubmit="submitSalesEntry(event, ${orderId})">
                <div class="sales-entry-header">
                    <h4>Enter Sales Data for ${formatDate(order.date)}</h4>
                    <p class="text-muted">Enter the actual quantities sold and prices achieved</p>
                </div>

                <div class="sales-items-grid">
                    ${order.items.map(item => `
                        <div class="sales-item-card">
                            <div class="item-header">
                                <h5>${item.product_name}</h5>
                                <span class="planned-qty">Planned: ${item.quantity}</span>
                            </div>

                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">Quantity Sold</label>
                                    <input
                                        type="number"
                                        class="form-input"
                                        name="quantity_sold_${item.id}"
                                        min="0"
                                        max="${item.quantity}"
                                        value="${item.sales ? item.sales.quantity_sold : ''}"
                                        placeholder="0"
                                    >
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Actual Sell Price</label>
                                    <input
                                        type="number"
                                        class="form-input"
                                        name="actual_sell_price_${item.id}"
                                        min="0"
                                        step="0.01"
                                        value="${item.sales ? item.sales.actual_sell_price : item.sell_price}"
                                        placeholder="${item.sell_price}"
                                    >
                                </div>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Notes (optional)</label>
                                <input
                                    type="text"
                                    class="form-input"
                                    name="notes_${item.id}"
                                    value="${item.sales ? item.sales.notes : ''}"
                                    placeholder="Any notes about this item..."
                                >
                            </div>
                        </div>
                    `).join('')}
                </div>

                <div class="form-actions">
                    <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-save"></i> Save Sales Data
                    </button>
                </div>
            </form>
        `;

        showModal('Enter Sales Data', formContent);
    } catch (error) {
        console.error('Failed to load order for sales entry:', error);
        showError('Failed to load order details');
    }
}

async function submitSalesEntry(event, orderId) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);

    // Collect sales entries
    const salesEntries = [];
    const orderItemIds = [];

    // Find all order item IDs by looking for quantity_sold fields
    for (let [key, value] of formData.entries()) {
        if (key.startsWith('quantity_sold_')) {
            const itemId = key.split('_')[2]; // Extract item ID from quantity_sold_${itemId}
            orderItemIds.push(itemId);
        }
    }

    console.log('Found order item IDs:', orderItemIds); // Debug log

    // Build sales entries array
    for (const itemId of orderItemIds) {
        const quantitySold = parseInt(formData.get(`quantity_sold_${itemId}`)) || 0;
        const actualSellPrice = parseFloat(formData.get(`actual_sell_price_${itemId}`)) || 0;
        const notes = formData.get(`notes_${itemId}`) || '';

        console.log(`Item ${itemId}: qty=${quantitySold}, price=${actualSellPrice}, notes=${notes}`); // Debug log

        if (quantitySold > 0 || actualSellPrice > 0) {
            salesEntries.push({
                order_item_id: itemId,
                quantity_sold: quantitySold.toString(),
                actual_sell_price: actualSellPrice.toString(),
                notes: notes
            });
        }
    }

    console.log('Sales entries to submit:', salesEntries); // Debug log

    if (salesEntries.length === 0) {
        showError('Please enter at least one sales entry');
        return;
    }

    try {
        showLoading(true);

        const response = await apiRequest(`/orders/${orderId}/enter_sales/`, {
            method: 'POST',
            body: JSON.stringify({
                sales_entries: salesEntries
            })
        });

        showLoading(false);
        closeModal();

        // Refresh the order view
        await viewOrder(orderId);

        // Show success message
        alert('Sales data saved successfully!');

        // Refresh the orders list to show updated completion status
        if (currentPage === 'orders') {
            await loadOrdersData();
        }

    } catch (error) {
        showLoading(false);
        console.error('Failed to save sales data:', error);
        showError('Failed to save sales data. Please check your entries and try again.');
    }
}
