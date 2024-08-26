const express = require('express');
const cors = require('cors');
const app = express();
require("dotenv").config();

const connectToDB = require('./middlewares/connectToDB');

const user = require('./controllers/user');
const pickup = require('./controllers/pickup');
const delivery = require('./controllers/delivery');
const rto = require('./controllers/rto');
const payout = require('./controllers/payout');
const dailyUpdates = require('./controllers/dailyUpdates');

app.use(express.json());
app.use(cors()); // Enable CORS for all routes

connectToDB();

// Register route
app.post('/api/register', user.registerUser);

// Login route
app.post('/api/login', user.loginUser);


// GET /api/driver/:driverName/sellers
// app.get('/api/driver/:driverName/sellers', pickup.sellers);
app.get('/api/driver/:driverName/pickup-sellers', pickup.pickupSellers);
app.get('/api/drivers/:driverName/picked', pickup.pickedSellers);
app.get('/api/drivers/:driverName/not-picked', pickup.NotPickedSellers);
app.get('/api/drivers/:driverName/delivered', pickup.deliveredSellers);
app.get('/api/drivers/:driverName/not-delivered', pickup.NotDeliveredSellers);
app.post('/api/driver/:driverName/lock-pickup', pickup.pickupLockScreen);
app.get('/api/driver/:driverName/reverse-pickup-sellers', pickup.reversePickupSellers);

// GET /api/products
// app.get('/api/products', pickup.products);
app.get('/api/pickup-products', pickup.pickupProducts);
app.get('/api/picked-products', pickup.pickedProducts);
app.get('/api/not-picked-products', pickup.NotPickedProducts);
app.get('/api/reverse-pickup-products', pickup.reversePickupProducts);
app.get('/api/reverse-delivered-products', pickup.reverseDeliveredProducts);
app.get('/api/reverse-not-delivered-products', pickup.reverseNotDeliveredProducts);

// POST /api/update-pickup-status
app.post('/api/update-pickup-status', pickup.updatePickupStatus);

// POST /api/update-pickup-status-bulk
app.post('/api/update-pickup-status-bulk', pickup.updatePickupStatusBulk);
app.post('/api/update-returns-delivery-status', pickup.updateReturnsDeliveryStatus);
app.post('/api/update-returns-delivery-status-bulk', pickup.updateReturnsDeliveryStatusBulk);


// GET /api/data/:driverName
app.get('/api/data/:driverName', dailyUpdates.getUpdates);

// Endpoint for Summary
app.get('/api/summary/:driverName', payout.summary);

// Endpoint for Refund
app.get('/api/refund/:driverName', payout.refund);

// Endpoint for Payable
app.get('/api/payable/:driverName', payout.payable);


// Endpoints for Delivery
app.get('/api/customers/:driverName', delivery.customers);
app.put('/api/update-delivery-status/:customerName', delivery.updateDeliveryStatus);

// Endpoints for RTO
app.get('/api/rtoscreen/:driverName', rto.rtoData);

// Define endpoint to fetch product details based on order_id
// server.js or app.js
app.get('/rtoscreen/product-details', rto.rtoProductDetails);

app.put('/api/update-rto-status/:customerName/:orderType', rto.updateRTOStatus);



// Server listening on port 5001
app.listen(5001, () => {
  console.log('Server is running on http://localhost:5001');
});