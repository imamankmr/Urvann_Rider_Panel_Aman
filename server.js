const express = require('express');
const cors = require('cors');
const app = express();
require("dotenv").config();

const { mongoose, routeConnection } = require('./middlewares/connectToDB'); // Import both connections

const user = require('./controllers/user');
const pickup = require('./controllers/pickup');
const delivery = require('./controllers/delivery');
const rto = require('./controllers/rto');
const payout = require('./controllers/payout');
const dailyUpdates = require('./controllers/dailyUpdates');

app.use(express.json());
app.use(cors()); // Enable CORS for all routes

// Register route
app.post('/api/register', user.registerUser);

// Login route
app.post('/api/login', user.loginUser);

// Pickup-related routes
app.get('/api/drivers/:driverName/picked', pickup.pickedSellers);
app.get('/api/drivers/:driverName/not-picked', pickup.NotPickedSellers);
app.get('/api/drivers/:driverName/delivered', pickup.deliveredSellers);
app.get('/api/drivers/:driverName/not-delivered', pickup.NotDeliveredSellers);
app.post('/api/driver/:driverName/lock-pickup', pickup.pickupLockScreen);
app.get('/api/picked-products', pickup.pickedProducts);
app.get('/api/not-picked-products', pickup.NotPickedProducts);
app.get('/api/reverse-delivered-products', pickup.reverseDeliveredProducts);
app.get('/api/reverse-not-delivered-products', pickup.reverseNotDeliveredProducts);
app.post('/api/update-pickup-status', pickup.updatePickupStatus);
app.post('/api/update-pickup-status-bulk', pickup.updatePickupStatusBulk);
app.post('/api/update-returns-delivery-status', pickup.updateReturnsDeliveryStatus);
app.post('/api/update-returns-delivery-status-bulk', pickup.updateReturnsDeliveryStatusBulk);

// Daily updates route
app.get('/api/data/:driverName', dailyUpdates.getUpdates);

// Payout-related routes
app.get('/api/summary/:driverName', payout.summary);
app.get('/api/refund/:driverName', payout.refund);
app.get('/api/payable/:driverName', payout.payable);

// Delivery-related routes
app.get('/api/customers/:driverName', delivery.customers);
app.put('/api/update-delivery-status/:customerName', delivery.updateDeliveryStatus);
app.get('/deliveryscreen/product-details', delivery.deliveryProductDetails);

// RTO-related routes
app.get('/api/rtoscreen/:driverName', rto.rtoData);
app.get('/rtoscreen/product-details', rto.rtoProductDetails);
app.put('/api/update-rto-status/:customerName/:orderType', rto.updateRTOStatus);

// Server listening on port 5001
app.listen(5001, () => {
  console.log('Server is running on http://localhost:5001');
});