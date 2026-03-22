// Stock Management JavaScript

// Global variables
let stockData = [];
let activeOrder = null;
let customerOrders = [];

const API_BASE_URL = '/api';

// DOM elements
const loadingScreen = document.getElementById('loading-screen');
const mainContent = document.getElementById('main-content');
const activeOrderInfo = document.getElementById('active-order-info');
const stockTableBody = document.getElementById('stock-table-body');
const noStockData = document.getElementById('no-stock-data');

// Initialize app
document.addEventListener('DOMContentLoaded', initializeApp);

async function initializeApp() {
    try {
        console.log('🚀 Initializing Stock Management...');
        await loadStockData();
        await loadCustomerOrders();
        renderStockOverview();
        renderStockTable();
        renderCustomerOrdersImpact();

        // Hide loading screen
        loadingScreen.style.display = 'none';
        mainContent.style.display = 'block';

        console.log('✅ Stock Management initialized successfully');
    } catch (error) {
        console.error('❌ Failed to initialize stock management:', error);
        showError('Failed to load stock management. Please refresh the page.');
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
        throw error;
    }
}

async function loadStockData() {
    try {
        console.log('📦 Loading stock data...');
        const data = await apiRequest('/products/with_stock/');
        stockData = data.results || data;

        // Get active order info from the first product (they all share the same active order)
        if (stockData.length > 0 && stockData[0].weekly_order_id) {
            activeOrder = {
                id: stockData[0].weekly_order_id,
                date: stockData[0].weekly_order_date
            };
        }

        console.log('📦 Stock data loaded:', stockData.length, 'products');
    } catch (error) {
        console.error('Failed to load stock data:', error);
        throw error;
    }
}

async function loadCustomerOrders() {
    try {
        console.log('🛒 Loading customer orders...');
        const data = await apiRequest('/customer-orders/');
        customerOrders = data.results || data;
        console.log('🛒 Customer orders loaded:', customerOrders.length);
    } catch (error) {
        console.error('Failed to load customer orders:', error);
        throw error;
    }
}

// Rendering Functions
function renderStockOverview() {
    // Update active order info
    if (activeOrder) {
        activeOrderInfo.innerHTML = `
            <div class="active-order-header">
                <h3><i class="fas fa-calendar-check"></i> Week of ${formatDate(activeOrder.date)}</h3>
                <div class="order-status">
                    <span class="status-badge status-active">Active</span>
                </div>
            </div>
            <div class="active-order-details">
                <div class="order-detail">
                    <span class="label">Order ID:</span>
                    <span class="value">#${activeOrder.id}</span>
                </div>
                <div class="order-detail">
                    <span class="label">Date:</span>
                    <span class="value">${formatDate(activeOrder.date)}</span>
                </div>
                <div class="order-detail">
                    <span class="label">Products:</span>
                    <span class="value">${stockData.length} items</span>
                </div>
            </div>
        `;
    } else {
        activeOrderInfo.innerHTML = `
            <div class="no-active-order">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>No Active Stock Order</h3>
                <p>Create a weekly order to start managing stock.</p>
                <button class="btn btn-primary" onclick="window.location.href='index.html'">
                    <i class="fas fa-plus"></i> Create Weekly Order
                </button>
            </div>
        `;
    }

    // Update stats
    const totalProducts = stockData.length;
    const inStockProducts = stockData.filter(p => p.available_stock > 5).length;
    const lowStockProducts = stockData.filter(p => p.available_stock > 0 && p.available_stock <= 5).length;
    const outOfStockProducts = stockData.filter(p => p.available_stock <= 0).length;

    document.getElementById('total-products').textContent = totalProducts;
    document.getElementById('in-stock-products').textContent = inStockProducts;
    document.getElementById('low-stock-products').textContent = lowStockProducts;
    document.getElementById('out-of-stock-products').textContent = outOfStockProducts;
}

function renderStockTable() {
    if (stockData.length === 0) {
        stockTableBody.innerHTML = '';
        noStockData.style.display = 'block';
        return;
    }

    noStockData.style.display = 'none';

    stockTableBody.innerHTML = stockData.map(product => {
        const stockStatus = getStockStatus(product.available_stock);
        const orderedQty = product.current_stock + (product.reserved_stock || 0);
        const soldQty = orderedQty - product.current_stock;

        return `
            <tr class="stock-row ${stockStatus.class}">
                <td>
                    <div class="product-info">
                        <strong>${product.name}</strong>
                        <div class="product-price">₦${parseFloat(product.default_sell_price).toLocaleString()}</div>
                    </div>
                </td>
                <td><span class="qty-badge qty-ordered">${orderedQty}</span></td>
                <td><span class="qty-badge qty-sold">${soldQty}</span></td>
                <td><span class="qty-badge qty-reserved">${product.reserved_stock || 0}</span></td>
                <td><span class="qty-badge qty-available">${product.available_stock}</span></td>
                <td>
                    <span class="status-badge ${stockStatus.class}">
                        <i class="fas ${stockStatus.icon}"></i>
                        ${stockStatus.text}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-outline" onclick="viewProductDetails(${product.id})" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline" onclick="adjustStock(${product.id})" title="Adjust Stock">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function renderCustomerOrdersImpact() {
    const pendingOrders = customerOrders.filter(order => order.status === 'pending');
    const preparingOrders = customerOrders.filter(order => order.status === 'preparing');
    const readyOrders = customerOrders.filter(order => order.status === 'ready');

    document.getElementById('pending-orders-count').textContent = pendingOrders.length;
    document.getElementById('preparing-orders-count').textContent = preparingOrders.length;
    document.getElementById('ready-orders-count').textContent = readyOrders.length;

    // Show order details
    renderOrdersImpactDetails('pending-orders-details', pendingOrders);
    renderOrdersImpactDetails('preparing-orders-details', preparingOrders);
    renderOrdersImpactDetails('ready-orders-details', readyOrders);
}

function renderOrdersImpactDetails(containerId, orders) {
    const container = document.getElementById(containerId);

    if (orders.length === 0) {
        container.innerHTML = '<p class="no-orders">No orders in this status</p>';
        return;
    }

    // Group orders by product to show impact
    const productImpact = {};
    orders.forEach(order => {
        order.items.forEach(item => {
            if (!productImpact[item.product_name]) {
                productImpact[item.product_name] = 0;
            }
            productImpact[item.product_name] += item.quantity;
        });
    });

    container.innerHTML = Object.entries(productImpact)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3) // Show top 3 products
        .map(([productName, quantity]) => `
            <div class="impact-item">
                <span class="product-name">${productName}</span>
                <span class="impact-qty">${quantity} reserved</span>
            </div>
        `).join('');
}

// Utility Functions
function getStockStatus(availableStock) {
    if (availableStock <= 0) {
        return { class: 'status-out', icon: 'fa-times-circle', text: 'Out of Stock' };
    } else if (availableStock <= 5) {
        return { class: 'status-low', icon: 'fa-exclamation-triangle', text: 'Low Stock' };
    } else {
        return { class: 'status-good', icon: 'fa-check-circle', text: 'In Stock' };
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Action Functions
async function refreshStock() {
    try {
        showMessage('Refreshing stock data...', 'info');
        await loadStockData();
        await loadCustomerOrders();
        renderStockOverview();
        renderStockTable();
        renderCustomerOrdersImpact();
        showMessage('Stock data refreshed successfully!', 'success');
    } catch (error) {
        console.error('Failed to refresh stock:', error);
        showError('Failed to refresh stock data. Please try again.');
    }
}

function filterStock() {
    const searchTerm = document.getElementById('stock-search').value.toLowerCase();
    const rows = stockTableBody.querySelectorAll('.stock-row');

    rows.forEach(row => {
        const productName = row.querySelector('.product-info strong').textContent.toLowerCase();
        if (productName.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function viewProductDetails(productId) {
    const product = stockData.find(p => p.id === productId);
    if (product) {
        alert(`Product Details:\n\nName: ${product.name}\nPrice: ₦${product.default_sell_price}\nCurrent Stock: ${product.current_stock}\nReserved: ${product.reserved_stock || 0}\nAvailable: ${product.available_stock}`);
    }
}

function adjustStock(productId) {
    alert('Stock adjustment feature coming soon!');
}

async function exportStockReport() {
    if (!activeOrder) {
        showError('No active weekly order found. Cannot generate report.');
        return;
    }

    showMessage('Generating report, please wait...', 'info');

    try {
        // Fetch full weekly order data (includes items, sales, debts, expenses, giveaways)
        const order = await apiRequest(`/weekly-orders/${activeOrder.id}/`);

        const rows = [];

        // ── REPORT HEADER ──────────────────────────────────────────────────────
        rows.push(['SUNDAY ORDERS — WEEKLY REPORT']);
        rows.push([`Week of: ${formatDate(order.date)}`]);
        rows.push([`Generated: ${new Date().toLocaleString()}`]);
        rows.push([]);

        // ── WEEKLY SUMMARY ─────────────────────────────────────────────────────
        rows.push(['=== WEEKLY SUMMARY ===']);
        rows.push([]);
        rows.push(['Metric', 'Planned (₦)', 'Actual (₦)', 'Variance (₦)']);
        rows.push(['Revenue',
            parseFloat(order.total_revenue || 0).toFixed(2),
            parseFloat(order.actual_total_revenue || 0).toFixed(2),
            (parseFloat(order.actual_total_revenue || 0) - parseFloat(order.total_revenue || 0)).toFixed(2)
        ]);
        rows.push(['Cost',
            parseFloat(order.total_cost || 0).toFixed(2),
            parseFloat(order.actual_total_cost || 0).toFixed(2),
            (parseFloat(order.actual_total_cost || 0) - parseFloat(order.total_cost || 0)).toFixed(2)
        ]);
        rows.push(['Profit',
            parseFloat(order.total_profit || 0).toFixed(2),
            parseFloat(order.actual_total_profit || 0).toFixed(2),
            (parseFloat(order.actual_total_profit || 0) - parseFloat(order.total_profit || 0)).toFixed(2)
        ]);
        rows.push([]);
        rows.push(['Cash Received (₦)', parseFloat(order.cash_received || 0).toFixed(2)]);
        rows.push(['Transfer Received (₦)', parseFloat(order.transfer_received || 0).toFixed(2)]);
        rows.push(['Total Payments Received (₦)', parseFloat(order.total_payments_received || 0).toFixed(2)]);
        rows.push(['Total Giveaway Cost (₦)', parseFloat(order.total_giveaway_cost || 0).toFixed(2)]);
        rows.push(['Total Expenses (₦)', parseFloat(order.total_expenses || 0).toFixed(2)]);
        rows.push(['Outstanding Debt (₦)', parseFloat(order.total_debt || 0).toFixed(2)]);
        rows.push(['True Net Profit (₦)', parseFloat(order.true_net_profit || 0).toFixed(2)]);
        rows.push(['Sales Completion', `${parseFloat(order.sales_completion_percentage || 0).toFixed(1)}%`]);
        rows.push([]);
        rows.push([]);

        // ── PRODUCT SALES ──────────────────────────────────────────────────────
        rows.push(['=== PRODUCT SALES ===']);
        rows.push([]);
        rows.push([
            'Product', 'Ordered Qty', 'Cost Price (₦)', 'Sell Price (₦)',
            'Planned Revenue (₦)', 'Planned Cost (₦)', 'Planned Profit (₦)',
            'Qty Sold', 'Actual Sell Price (₦)', 'Actual Revenue (₦)',
            'Actual Cost (₦)', 'Actual Profit (₦)',
            'Qty Remaining', 'Sell-Through %', 'Revenue Variance (₦)', 'Notes'
        ]);

        let totalPlannedRev = 0, totalActualRev = 0, totalPlannedProfit = 0, totalActualProfit = 0;

        (order.items || []).forEach(item => {
            const s = item.sales || {};
            const plannedRev = parseFloat(item.total_revenue || 0);
            const plannedCost = parseFloat(item.total_cost || 0);
            const plannedProfit = parseFloat(item.total_profit || 0);
            const actualRev = parseFloat(s.total_revenue || 0);
            const actualCost = parseFloat(s.total_cost || 0);
            const actualProfit = parseFloat(s.actual_profit || 0);
            totalPlannedRev += plannedRev;
            totalActualRev += actualRev;
            totalPlannedProfit += plannedProfit;
            totalActualProfit += actualProfit;

            rows.push([
                item.product_name,
                item.quantity,
                parseFloat(item.cost_price || 0).toFixed(2),
                parseFloat(item.sell_price || 0).toFixed(2),
                plannedRev.toFixed(2),
                plannedCost.toFixed(2),
                plannedProfit.toFixed(2),
                s.quantity_sold ?? '—',
                s.actual_sell_price != null ? parseFloat(s.actual_sell_price).toFixed(2) : '—',
                s.total_revenue != null ? actualRev.toFixed(2) : '—',
                s.total_cost != null ? actualCost.toFixed(2) : '—',
                s.actual_profit != null ? actualProfit.toFixed(2) : '—',
                s.quantity_remaining ?? '—',
                s.sell_through_rate != null ? `${parseFloat(s.sell_through_rate).toFixed(1)}%` : '—',
                s.planned_vs_actual_variance != null ? parseFloat(s.planned_vs_actual_variance).toFixed(2) : '—',
                s.notes || ''
            ]);
        });

        rows.push([
            'TOTALS', '', '', '',
            totalPlannedRev.toFixed(2), '', totalPlannedProfit.toFixed(2),
            '', '', totalActualRev.toFixed(2),
            '', totalActualProfit.toFixed(2),
            '', '', (totalActualRev - totalPlannedRev).toFixed(2), ''
        ]);
        rows.push([]);
        rows.push([]);

        // ── DEBTORS ────────────────────────────────────────────────────────────
        rows.push(['=== DEBTORS ===']);
        rows.push([]);

        if ((order.debts || []).length === 0) {
            rows.push(['No debts recorded for this week.']);
        } else {
            rows.push(['Customer Name', 'Description', 'Total Owed (₦)', 'Amount Paid (₦)', 'Outstanding (₦)', 'Status', 'Date Created', 'Date Paid', 'Notes']);

            let totalOwed = 0, totalPaid = 0, totalOutstanding = 0;
            (order.debts || []).forEach(debt => {
                totalOwed += parseFloat(debt.amount || 0);
                totalPaid += parseFloat(debt.amount_paid || 0);
                totalOutstanding += parseFloat(debt.outstanding_amount || 0);
                rows.push([
                    debt.customer_name,
                    debt.description || '',
                    parseFloat(debt.amount || 0).toFixed(2),
                    parseFloat(debt.amount_paid || 0).toFixed(2),
                    parseFloat(debt.outstanding_amount || 0).toFixed(2),
                    debt.status.charAt(0).toUpperCase() + debt.status.slice(1),
                    debt.date_created,
                    debt.date_paid || '—',
                    debt.notes || ''
                ]);
            });
            rows.push(['TOTALS', '', totalOwed.toFixed(2), totalPaid.toFixed(2), totalOutstanding.toFixed(2), '', '', '', '']);
        }
        rows.push([]);
        rows.push([]);

        // ── EXPENSES ───────────────────────────────────────────────────────────
        rows.push(['=== EXPENSES ===']);
        rows.push([]);

        if ((order.expenses || []).length === 0) {
            rows.push(['No expenses recorded for this week.']);
        } else {
            rows.push(['Category', 'Description', 'Amount (₦)', 'Date', 'Notes']);

            let totalExpenses = 0;
            (order.expenses || []).forEach(exp => {
                totalExpenses += parseFloat(exp.amount || 0);
                rows.push([
                    exp.category_display || exp.category,
                    exp.description,
                    parseFloat(exp.amount || 0).toFixed(2),
                    exp.date,
                    exp.notes || ''
                ]);
            });
            rows.push(['TOTALS', '', totalExpenses.toFixed(2), '', '']);
        }
        rows.push([]);
        rows.push([]);

        // ── GIVEAWAYS ──────────────────────────────────────────────────────────
        rows.push(['=== GIVEAWAYS ===']);
        rows.push([]);

        if ((order.giveaways || []).length === 0) {
            rows.push(['No giveaways recorded for this week.']);
        } else {
            rows.push(['Product', 'Quantity', 'Cost Price (₦)', 'Total Cost (₦)', 'Recipient', 'Date Given', 'Notes']);

            let totalGiveawayCost = 0;
            (order.giveaways || []).forEach(g => {
                totalGiveawayCost += parseFloat(g.total_cost || 0);
                rows.push([
                    g.product_name,
                    g.quantity,
                    parseFloat(g.cost_price || 0).toFixed(2),
                    parseFloat(g.total_cost || 0).toFixed(2),
                    g.recipient,
                    g.date_given,
                    g.notes || ''
                ]);
            });
            rows.push(['TOTALS', '', '', totalGiveawayCost.toFixed(2), '', '', '']);
        }

        // ── BUILD & DOWNLOAD ───────────────────────────────────────────────────
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.aoa_to_sheet(rows);
        worksheet['!cols'] = [
            { wch: 22 }, { wch: 14 }, { wch: 16 }, { wch: 16 },
            { wch: 18 }, { wch: 16 }, { wch: 18 }, { wch: 12 },
            { wch: 18 }, { wch: 18 }, { wch: 16 }, { wch: 16 },
            { wch: 14 }, { wch: 14 }, { wch: 18 }, { wch: 22 }
        ];
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Weekly Report');

        const dateStr = order.date.replace(/-/g, '');
        XLSX.writeFile(workbook, `Sunday_Orders_Report_${dateStr}.xlsx`);

        showMessage('Report exported successfully!', 'success');
    } catch (error) {
        console.error('Export failed:', error);
        showError('Failed to export report. Please try again.');
    }
}

// Message Functions
function showMessage(message, type = 'info') {
    const messageContainer = document.getElementById('message-container');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${type}`;
    messageDiv.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-times-circle' : 'fa-info-circle'}"></i>
        ${message}
    `;

    messageContainer.appendChild(messageDiv);

    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}

function showError(message) {
    showMessage(message, 'error');
}
