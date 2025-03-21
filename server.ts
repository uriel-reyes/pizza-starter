import express = require('express');
import cors = require('cors');
import getStoreOrders from './lib/getStoreOrders';
import apiRoot from './src/BuildClient';

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Endpoint to get orders
app.get('/orders', (req, res) => {
    getStoreOrders().then(orders => {
        res.json(orders);
    }).catch(error => {
        console.error('Failed to retrieve orders:', error);
        res.status(500).send('Failed to retrieve orders');
    });
});

// New endpoint to update order state with correct action
app.post('/orders/:id/state', async (req, res) => {
    const orderId = req.params.id;
    const { state } = req.body;
    
    if (!orderId || !state) {
        return res.status(400).json({ error: 'Order ID and state are required' });
    }
    
    try {
        // First, get all available states to find the right state ID
        const statesResponse = await apiRoot
            .states()
            .get()
            .execute();
        
        // Find the state object by key
        const stateObj = statesResponse.body.results
            .find(s => s.key === state && s.type === 'OrderState');
        
        if (!stateObj) {
            return res.status(400).json({ 
                error: 'Invalid state',
                message: `State "${state}" not found. Available order states: ${statesResponse.body.results
                    .filter(s => s.type === 'OrderState')
                    .map(s => s.key)
                    .join(', ')}`
            });
        }
        
        // Get the current order to retrieve its version
        const orderResponse = await apiRoot
            .orders()
            .withId({ ID: orderId })
            .get()
            .execute();
        
        const orderVersion = orderResponse.body.version;
        
        console.log(`Transitioning order ${orderId} to state "${state}" (ID: ${stateObj.id}, version: ${orderVersion})`);
        
        // Update the order with the correct transitionState action
        const updateResponse = await apiRoot
            .orders()
            .withId({ ID: orderId })
            .post({
                body: {
                    version: orderVersion,
                    actions: [{
                        action: "transitionState",
                        state: {
                            typeId: "state",
                            id: stateObj.id
                        }
                    }]
                }
            })
            .execute();
        
        return res.json({
            success: true,
            message: `Order ${orderId} transitioned to state "${state}"`,
            order: updateResponse.body
        });
        
    } catch (error: unknown) {
        console.error(`Failed to update order ${orderId} state:`, error);
        
        let errorMessage = 'Failed to update order state';
        let errorDetails = {};
        
        if (error instanceof Error) {
            errorMessage = error.message;
            
            // Try to extract more details from commercetools error
            const ctError = error as any;
            if (ctError.body) {
                errorDetails = ctError.body;
            }
        }
        
        return res.status(500).json({ 
            error: 'Failed to update order state',
            message: errorMessage,
            details: errorDetails
        });
    }
});

// Debug endpoint to test state transitions
app.get('/debug/order-states', async (req, res) => {
    try {
        // Fetch available states
        const statesResponse = await apiRoot
            .states()
            .get()
            .execute();
        
        const orderStates = statesResponse.body.results
            .filter(state => state.type === 'OrderState')
            .map(state => ({
                key: state.key,
                id: state.id,
                name: state.name?.en || state.key,
                initial: state.initial
            }));
        
        return res.json({
            available_states: orderStates,
            usage_example: {
                endpoint: "/orders/:id/state",
                method: "POST",
                body: {
                    state: "in-oven" // Use the state key
                }
            }
        });
    } catch (error: unknown) {
        console.error('Error fetching states:', error);
        
        let errorMessage = 'Failed to fetch order states';
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        
        return res.status(500).json({ 
            error: errorMessage
        });
    }
});

// Debug endpoint to inspect a specific order
app.get('/debug/orders/:id', async (req, res) => {
    const orderId = req.params.id;
    
    try {
        const orderResponse = await apiRoot
            .orders()
            .withId({ ID: orderId })
            .get()
            .execute();
        
        return res.json({
            order: {
                id: orderResponse.body.id,
                version: orderResponse.body.version,
                state: orderResponse.body.state,
                orderState: orderResponse.body.orderState,
                // Include other relevant fields
            },
            update_example: {
                endpoint: `/orders/${orderId}/state`,
                method: "POST",
                body: {
                    state: "in-oven" // Use the state key
                }
            }
        });
    } catch (error: unknown) {
        console.error(`Error fetching order ${orderId}:`, error);
        
        let errorMessage = 'Failed to fetch order';
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        
        return res.status(500).json({ 
            error: errorMessage
        });
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});