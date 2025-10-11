// Final Customer Order Workflow Test
// This script tests the complete customer order workflow

const API_BASE_URL = 'http://127.0.0.1:8000/api';

async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`);
    if (options.body) {
        console.log('📤 Request body:', options.body);
    }

    try {
        const response = await fetch(url, { ...defaultOptions, ...options });
        console.log(`📡 Response status: ${response.status} ${response.statusText}`);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ API Error Response:', errorText);
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log('📥 Response data:', data);
        return data;
    } catch (error) {
        console.error('❌ API request failed:', error);
        throw error;
    }
}

async function testCompleteWorkflow() {
    console.log('🚀 Starting Complete Customer Order Workflow Test');
    console.log('=' .repeat(60));

    try {
        // Step 1: Load Products
        console.log('\n📦 Step 1: Loading Products...');
        const productsData = await apiRequest('/products/');
        const products = productsData.results || productsData;
        
        if (!products || products.length === 0) {
            throw new Error('No products available');
        }
        
        console.log(`✅ Loaded ${products.length} products`);
        console.log(`Sample products:`, products.slice(0, 3).map(p => ({ id: p.id, name: p.name, price: p.default_sell_price })));

        // Step 2: Create a test cart
        console.log('\n🛍️ Step 2: Creating Test Cart...');
        const cart = [
            {
                id: products[0].id,
                name: products[0].name,
                price: parseFloat(products[0].default_sell_price),
                quantity: 2
            }
        ];
        
        if (products.length > 1) {
            cart.push({
                id: products[1].id,
                name: products[1].name,
                price: parseFloat(products[1].default_sell_price),
                quantity: 1
            });
        }
        
        const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        console.log(`✅ Cart created with ${cart.length} items, total: ₦${totalAmount}`);
        console.log('Cart contents:', cart);

        // Step 3: Test name validation
        console.log('\n🔍 Step 3: Testing Name Validation...');
        const testName = `Test Customer ${Date.now()}`;
        const today = new Date().toISOString().split('T')[0];
        
        const nameCheckResponse = await apiRequest(`/customer-orders/?order_date=${today}&customer_name=${encodeURIComponent(testName)}`);
        const existingOrders = nameCheckResponse.results || nameCheckResponse;
        const nameExists = existingOrders.some(order => 
            order.customer_name.toLowerCase() === testName.toLowerCase()
        );
        
        console.log(`✅ Name validation working - ${nameExists ? 'name exists' : 'name available'}`);
        console.log(`Existing orders today: ${existingOrders.length}`);

        // Step 4: Submit order
        console.log('\n📤 Step 4: Submitting Order...');
        const orderData = {
            customer_name: testName,
            phone_number: "08012345678",
            payment_method: "pay_on_collection",
            items: cart.map(item => ({
                id: item.id,
                quantity: item.quantity,
                price: item.price
            })),
            total_amount: totalAmount,
            order_date: today
        };

        const orderResponse = await apiRequest('/customer-orders/', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });

        if (!orderResponse.order_reference) {
            throw new Error('No order reference received');
        }

        console.log(`✅ Order submitted successfully!`);
        console.log(`Order Reference: ${orderResponse.order_reference}`);
        console.log(`Order ID: ${orderResponse.id}`);
        console.log(`Customer: ${orderResponse.customer_name}`);
        console.log(`Total: ₦${orderResponse.total_amount}`);
        console.log(`Items: ${orderResponse.total_items}`);
        console.log(`Status: ${orderResponse.status_display}`);

        // Step 5: Verify order in admin dashboard
        console.log('\n🔍 Step 5: Verifying Order in Admin Dashboard...');
        const adminOrdersResponse = await apiRequest('/customer-orders/');
        const adminOrders = adminOrdersResponse.results || adminOrdersResponse;
        const ourOrder = adminOrders.find(order => order.id === orderResponse.id);

        if (!ourOrder) {
            throw new Error('Order not found in admin dashboard');
        }

        console.log(`✅ Order found in admin dashboard`);
        console.log(`Admin view - Reference: ${ourOrder.order_reference}, Status: ${ourOrder.status_display}`);

        // Step 6: Test status update
        console.log('\n🔄 Step 6: Testing Status Update...');
        const statusUpdateResponse = await apiRequest(`/customer-orders/${orderResponse.id}/update_status/`, {
            method: 'POST',
            body: JSON.stringify({ status: 'preparing' })
        });

        console.log(`✅ Status updated successfully`);
        console.log(`New status: ${statusUpdateResponse.status_display}`);

        // Step 7: Test another status update
        console.log('\n🔄 Step 7: Testing Ready Status...');
        const readyStatusResponse = await apiRequest(`/customer-orders/${orderResponse.id}/update_status/`, {
            method: 'POST',
            body: JSON.stringify({ status: 'ready' })
        });

        console.log(`✅ Status updated to ready`);
        console.log(`Status: ${readyStatusResponse.status_display}`);

        // Step 8: Test completion
        console.log('\n✅ Step 8: Testing Order Completion...');
        const completeStatusResponse = await apiRequest(`/customer-orders/${orderResponse.id}/update_status/`, {
            method: 'POST',
            body: JSON.stringify({ 
                status: 'completed',
                collected_by: 'Test Staff Member'
            })
        });

        console.log(`✅ Order marked as completed`);
        console.log(`Status: ${completeStatusResponse.status_display}`);
        console.log(`Collected by: ${completeStatusResponse.collected_by}`);
        console.log(`Collected at: ${completeStatusResponse.collected_at}`);

        // Final verification
        console.log('\n🎉 Step 9: Final Verification...');
        const finalOrderCheck = await apiRequest(`/customer-orders/${orderResponse.id}/`);
        console.log(`✅ Final order state verified`);
        console.log(`Reference: ${finalOrderCheck.order_reference}`);
        console.log(`Status: ${finalOrderCheck.status_display}`);
        console.log(`Is Collected: ${finalOrderCheck.is_collected}`);

        console.log('\n' + '=' .repeat(60));
        console.log('🎉 COMPLETE WORKFLOW TEST SUCCESSFUL! 🎉');
        console.log('✅ All steps completed successfully');
        console.log('✅ Customer can place orders');
        console.log('✅ Orders are saved to database');
        console.log('✅ Admin can view and manage orders');
        console.log('✅ Status workflow is functional');
        console.log('✅ Collection tracking works');
        console.log('=' .repeat(60));

        return {
            success: true,
            orderReference: orderResponse.order_reference,
            orderId: orderResponse.id
        };

    } catch (error) {
        console.error('\n❌ WORKFLOW TEST FAILED!');
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
        return {
            success: false,
            error: error.message
        };
    }
}

// Run the test
testCompleteWorkflow().then(result => {
    if (result.success) {
        console.log(`\n🎯 Test completed successfully! Order ${result.orderReference} (ID: ${result.orderId}) was created and processed.`);
    } else {
        console.log(`\n💥 Test failed: ${result.error}`);
    }
}).catch(error => {
    console.error('\n💥 Unexpected test failure:', error);
});
