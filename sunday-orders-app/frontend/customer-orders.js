// Configuration
const API_BASE_URL = '/api';

// Global state
let allOrders = [];
let filteredOrders = [];
let currentOrder = null;

// DOM elements
const loadingScreen = document.getElementById('loading-screen');
const mainContent = document.getElementById('main-content');
const ordersTableBody = document.getElementById('orders-table-body');
const ordersCount = document.getElementById('orders-count');
const noOrdersDiv = document.getElementById('no-orders');
const orderModal = document.getElementById('order-modal');
const statusModal = document.getElementById('status-modal');

// Initialize app
document.addEventListener('DOMContentLoaded', initializeApp);

async function initializeApp() {
    try {
        showLoading();
        await loadOrders();
        await loadStats();
        renderOrders();
        hideLoading();
    } catch (error) {
        console.error('Failed to initialize app:', error);
        showError('Failed to load customer orders. Please refresh the page.');
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

async function loadOrders() {
    try {
        const data = await apiRequest('/customer-orders/');
        allOrders = data.results || data;
        filteredOrders = [...allOrders];
        console.log('Loaded customer orders:', allOrders);
    } catch (error) {
        console.error('Failed to load orders:', error);
        throw error;
    }
}

async function loadStats() {
    try {
        const today = new Date().toISOString().split('T')[0];
        const todayOrders = allOrders.filter(order => order.order_date === today);

        // Calculate stats
        const totalOrders = allOrders.length;
        const totalRevenue = allOrders.reduce((sum, order) => sum + parseFloat(order.total_amount), 0);
        const pendingCount = allOrders.filter(order => order.status === 'pending').length;
        const readyCount = allOrders.filter(order => order.status === 'ready').length;

        // Update stats display
        document.getElementById('total-orders').textContent = totalOrders;
        document.getElementById('total-revenue').textContent = `₦${totalRevenue.toLocaleString()}`;
        document.getElementById('pending-count').textContent = pendingCount;
        document.getElementById('ready-count').textContent = readyCount;
    } catch (error) {
        console.error('Failed to load stats:', error);
    }
}

function renderOrders() {
    if (filteredOrders.length === 0) {
        ordersTableBody.innerHTML = '';
        noOrdersDiv.style.display = 'block';
        ordersCount.textContent = '0 orders';
        return;
    }

    noOrdersDiv.style.display = 'none';
    ordersCount.textContent = `${filteredOrders.length} order${filteredOrders.length !== 1 ? 's' : ''}`;

    ordersTableBody.innerHTML = filteredOrders.map(order => {
        const statusClass = getStatusClass(order.status);
        const paymentClass = getPaymentClass(order.payment_method);

        return `
            <tr class="order-row" onclick="showOrderDetails('${order.id}')">
                <td>
                    <strong>${order.order_reference}</strong>
                </td>
                <td>
                    <div class="customer-info">
                        <strong>${order.customer_name}</strong>
                        ${order.phone_number ? `<br><small>${order.phone_number}</small>` : ''}
                    </div>
                </td>
                <td>
                    <div class="date-info">
                        ${formatDate(order.order_date)}
                        <br><small>${formatTime(order.created_at)}</small>
                    </div>
                </td>
                <td>
                    <span class="items-count">${order.total_items} item${order.total_items !== 1 ? 's' : ''}</span>
                </td>
                <td>
                    <strong>₦${parseFloat(order.total_amount).toLocaleString()}</strong>
                </td>
                <td>
                    <span class="payment-badge ${paymentClass}">
                        ${order.payment_method_display}
                    </span>
                </td>
                <td>
                    <span class="status-badge ${statusClass}">
                        ${order.status_display}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-outline" onclick="event.stopPropagation(); showOrderDetails('${order.id}')" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); quickStatusUpdate('${order.id}')" title="Update Status">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function getStatusClass(status) {
    const statusClasses = {
        'pending': 'status-pending',
        'preparing': 'status-preparing',
        'ready': 'status-ready',
        'completed': 'status-completed',
        'cancelled': 'status-cancelled'
    };
    return statusClasses[status] || 'status-pending';
}

function getPaymentClass(paymentMethod) {
    return paymentMethod === 'pay_now' ? 'payment-paid' : 'payment-pending';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

function formatTime(dateTimeString) {
    const date = new Date(dateTimeString);
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Filter functions
function applyFilters() {
    const statusFilter = document.getElementById('status-filter').value;
    const dateFilter = document.getElementById('date-filter').value;
    const customerFilter = document.getElementById('customer-filter').value.toLowerCase();
    const paymentFilter = document.getElementById('payment-filter').value;

    filteredOrders = allOrders.filter(order => {
        const matchesStatus = !statusFilter || order.status === statusFilter;
        const matchesDate = !dateFilter || order.order_date === dateFilter;
        const matchesCustomer = !customerFilter || order.customer_name.toLowerCase().includes(customerFilter);
        const matchesPayment = !paymentFilter || order.payment_method === paymentFilter;

        return matchesStatus && matchesDate && matchesCustomer && matchesPayment;
    });

    renderOrders();
}

function resetFilters() {
    document.getElementById('status-filter').value = '';
    document.getElementById('date-filter').value = '';
    document.getElementById('customer-filter').value = '';
    document.getElementById('payment-filter').value = '';

    filteredOrders = [...allOrders];
    renderOrders();
}

function filterToday() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date-filter').value = today;
    applyFilters();
}

function filterPending() {
    document.getElementById('status-filter').value = 'pending';
    applyFilters();
}

function filterReady() {
    document.getElementById('status-filter').value = 'ready';
    applyFilters();
}

async function refreshOrders() {
    try {
        showLoading();
        await loadOrders();
        await loadStats();
        applyFilters(); // Reapply current filters
        hideLoading();
    } catch (error) {
        console.error('Failed to refresh orders:', error);
        showError('Failed to refresh orders. Please try again.');
        hideLoading();
    }
}

// Order details functions
async function showOrderDetails(orderId) {
    try {
        const order = allOrders.find(o => o.id == orderId);
        if (!order) {
            console.error('Order not found:', orderId);
            return;
        }

        currentOrder = order;

        const orderDetails = document.getElementById('order-details');
        orderDetails.innerHTML = `
            <div class="order-info-grid">
                <div class="order-info-section">
                    <h4><i class="fas fa-receipt"></i> Order Information</h4>
                    <div class="info-row">
                        <span class="label">Reference:</span>
                        <span class="value"><strong>${order.order_reference}</strong></span>
                    </div>
                    <div class="info-row">
                        <span class="label">Date:</span>
                        <span class="value">${formatDate(order.order_date)} at ${formatTime(order.created_at)}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Status:</span>
                        <span class="value">
                            <span class="status-badge ${getStatusClass(order.status)}">
                                ${order.status_display}
                            </span>
                        </span>
                    </div>
                    <div class="info-row">
                        <span class="label">Total Amount:</span>
                        <span class="value"><strong>₦${parseFloat(order.total_amount).toLocaleString()}</strong></span>
                    </div>
                </div>

                <div class="order-info-section">
                    <h4><i class="fas fa-user"></i> Customer Information</h4>
                    <div class="info-row">
                        <span class="label">Name:</span>
                        <span class="value"><strong>${order.customer_name}</strong></span>
                    </div>
                    <div class="info-row">
                        <span class="label">Phone:</span>
                        <span class="value">${order.phone_number || 'Not provided'}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Payment Method:</span>
                        <span class="value">
                            <span class="payment-badge ${getPaymentClass(order.payment_method)}">
                                ${order.payment_method_display}
                            </span>
                        </span>
                    </div>
                </div>

                <div class="order-info-section">
                    <h4><i class="fas fa-map-marker-alt"></i> Collection Information</h4>
                    <div class="info-row">
                        <span class="label">Location:</span>
                        <span class="value">${order.collection_notes}</span>
                    </div>
                    ${order.collected_at ? `
                        <div class="info-row">
                            <span class="label">Collected At:</span>
                            <span class="value">${formatDate(order.collected_at)} at ${formatTime(order.collected_at)}</span>
                        </div>
                    ` : ''}
                    ${order.collected_by ? `
                        <div class="info-row">
                            <span class="label">Collected By:</span>
                            <span class="value">${order.collected_by}</span>
                        </div>
                    ` : ''}
                </div>
            </div>

            <div class="order-items-section">
                <h4><i class="fas fa-shopping-bag"></i> Order Items</h4>
                <div class="items-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Quantity</th>
                                <th>Unit Price</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${order.items.map(item => `
                                <tr>
                                    <td><strong>${item.product_name}</strong></td>
                                    <td>${item.quantity}</td>
                                    <td>₦${parseFloat(item.unit_price).toLocaleString()}</td>
                                    <td><strong>₦${parseFloat(item.total_price).toLocaleString()}</strong></td>
                                </tr>
                            `).join('')}
                        </tbody>
                        <tfoot>
                            <tr class="total-row">
                                <td colspan="3"><strong>Total</strong></td>
                                <td><strong>₦${parseFloat(order.total_amount).toLocaleString()}</strong></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        `;

        orderModal.classList.add('active');
    } catch (error) {
        console.error('Failed to show order details:', error);
        alert('Failed to load order details. Please try again.');
    }
}

function closeOrderModal() {
    orderModal.classList.remove('active');
    currentOrder = null;
}

// Close modal when clicking on backdrop
orderModal.addEventListener('click', function(e) {
    if (e.target === orderModal) {
        closeOrderModal();
    }
});

// Status update functions
function showStatusUpdate() {
    if (!currentOrder) return;

    document.getElementById('new-status').value = currentOrder.status;

    // Show/hide collection fields based on status
    const newStatusSelect = document.getElementById('new-status');
    const collectionFields = document.getElementById('collection-fields');

    newStatusSelect.addEventListener('change', function() {
        if (this.value === 'completed') {
            collectionFields.style.display = 'block';
        } else {
            collectionFields.style.display = 'none';
        }
    });

    statusModal.classList.add('active');
}

function closeStatusModal() {
    statusModal.classList.remove('active');
    document.getElementById('status-form').reset();
    document.getElementById('collection-fields').style.display = 'none';
}

// Close status modal when clicking on backdrop
statusModal.addEventListener('click', function(e) {
    if (e.target === statusModal) {
        closeStatusModal();
    }
});

async function updateOrderStatus() {
    if (!currentOrder) return;

    const newStatus = document.getElementById('new-status').value;
    const collectedBy = document.getElementById('collected-by').value;

    if (!newStatus) {
        alert('Please select a status');
        return;
    }

    if (newStatus === 'completed' && !collectedBy) {
        alert('Please enter the staff member name who handed over the order');
        return;
    }

    try {
        const updateData = { status: newStatus };
        if (newStatus === 'completed') {
            updateData.collected_by = collectedBy;
        }

        const response = await apiRequest(`/customer-orders/${currentOrder.id}/update_status/`, {
            method: 'POST',
            body: JSON.stringify(updateData)
        });

        // Update the order in our local data
        const orderIndex = allOrders.findIndex(o => o.id === currentOrder.id);
        if (orderIndex !== -1) {
            allOrders[orderIndex] = response;
        }

        // Refresh the display
        applyFilters();
        await loadStats();

        // Close modals
        closeStatusModal();
        closeOrderModal();

        // Show success message
        showSuccessMessage(`Order ${currentOrder.order_reference} status updated to ${response.status_display}`);

    } catch (error) {
        console.error('Failed to update order status:', error);
        alert('Failed to update order status. Please try again.');
    }
}

async function quickStatusUpdate(orderId) {
    const order = allOrders.find(o => o.id == orderId);
    if (!order) return;

    currentOrder = order;
    showStatusUpdate();
}

function showSuccessMessage(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.innerHTML = `
        <div class="success-content">
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        </div>
    `;

    document.body.appendChild(successDiv);

    setTimeout(() => {
        successDiv.remove();
    }, 3000);
}
