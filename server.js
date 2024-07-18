const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const app = express();
const Photo = require('./models/photo'); // Import the Photo model
const User = require('./models/userDetails'); // Use the existing User model
const Route = require('./models/route'); // Import the Route model
const DeliveryUpdate = require('./models/deliveryUpdate');
const Summary = require('./models/Summary');
const Payable = require('./models/Payable');
const Refund = require('./models/Refund');

app.use(express.json());
app.use(cors()); // Enable CORS for all routes

// MongoDB connection URI
const MONGODB_URI = 'mongodb+srv://sambhav:UrvannGenie01@urvanngenie.u7r4o.mongodb.net/UrvannRiderApp?retryWrites=true&w=majority&appName=UrvannGenie';

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

// Hardcoded JWT secret key (use this only for development/testing)
const JWT_SECRET = 'your_secret_key'; // Replace 'your_secret_key' with a strong secret key

// Register route
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if user already exists
    let user = await User.findOne({ username });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    user = new User({
      username,
      password, // Directly storing the password without hashing
    });

    // Save user to database
    await user.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// Login route
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if user exists
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    // Check if password matches
    if (password !== user.password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/driver/:driverName/sellers
app.get('/api/driver/:driverName/sellers', async (req, res) => {
  const { driverName } = req.params;
  console.log(`Fetching sellers for driver: ${driverName}`);

  try {
    const sellers = await Route.find({ 'Driver Name': driverName }).distinct('seller_name');

    const sellersWithCounts = await Promise.all(sellers.map(async (sellerName) => {
      const productCount = await Route.aggregate([
        { $match: { 'Driver Name': driverName, seller_name: sellerName } },
        { $group: { _id: null, totalQuantity: { $sum: '$total_item_quantity' } } }
      ]);
      return {
        sellerName,
        productCount: productCount[0] ? productCount[0].totalQuantity : 0
      };
    }));

    console.log('Sellers with counts:', sellersWithCounts);
    res.json(sellersWithCounts);
  } catch (error) {
    console.error(`Error fetching seller names and counts for ${driverName}:`, error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/products
app.get('/api/products', async (req, res) => {
  const { seller_name, rider_code } = req.query;

  try {
    let query = {
      seller_name: { $regex: new RegExp(`^${seller_name}$`, 'i') },
      "Driver Name": { $regex: new RegExp(`^${rider_code}$`, 'i') }
    };

    const filteredData = await Route.find(query).select('FINAL line_item_sku line_item_name total_item_quantity Pickup Status').lean();

    const skuList = filteredData.map(data => data.line_item_sku);
    const photos = await Photo.find({ sku: { $in: skuList } }).lean();

    const photoMap = {};
    photos.forEach(photo => {
      photoMap[photo.sku] = photo.image_url;
    });

    const products = filteredData.map(data => ({
      FINAL: data.FINAL,
      line_item_sku: data.line_item_sku,
      line_item_name: data.line_item_name,
      image1: photoMap[data.line_item_sku] || null,
      total_item_quantity: data.total_item_quantity,
      "Pickup Status": data["Pickup Status"]
    }));

    const orderCodeQuantities = products.reduce((acc, product) => {
      acc[product.FINAL] = (acc[product.FINAL] || 0) + product.total_item_quantity;
      return acc;
    }, {});

    res.json({ orderCodeQuantities, products });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/update-pickup-status
app.post('/api/update-pickup-status', async (req, res) => {
  const { sku, orderCode, status } = req.body;

  try {
    if (!sku || !orderCode) {
      return res.status(400).json({ message: 'SKU and Order Code are required' });
    }

    const result = await Route.updateOne(
      { line_item_sku: sku, FINAL: orderCode },
      { $set: { "Pickup Status": status } }
    );

    if (result.nModified === 0) {
      return res.status(404).json({ message: 'No matching document found to update' });
    }

    res.status(200).json({ message: 'Pickup status updated successfully' });
  } catch (error) {
    console.error('Error updating pickup status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/update-pickup-status-bulk
app.post('/api/update-pickup-status-bulk', async (req, res) => {
  const { sellerName, driverName, finalCode, status } = req.body;

  try {
    const result = await Route.updateMany(
      { seller_name: sellerName, "Driver Name": driverName, FINAL: finalCode },
      { $set: { "Pickup Status": status } }
    );

    if (result.nModified === 0) {
      return res.status(404).json({ message: 'No matching documents found to update' });
    }

    res.status(200).json({ message: 'Pickup status updated in bulk successfully.' });
  } catch (error) {
    console.error('Error updating pickup status in bulk:', error);
    res.status(500).json({ error: 'Failed to update pickup status in bulk.' });
  }
});

// GET /api/data/:driverName
app.get('/api/data/:driverName', async (req, res) => {
  try {
    const driverName = req.params.driverName;

    // Fetch only the Date, Delivered, and Penalty fields
    const deliveryUpdates = await DeliveryUpdate.find({ 'Driver Name': driverName }, 'Date Delivered Penalty');

    console.log('Fetched data:', deliveryUpdates); // Debugging log

    res.json({ deliveryUpdates });
  } catch (err) {
    console.error('Error fetching data:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint for Summary
app.get('/api/summary/:driverName', async (req, res) => {
  try {
    const driverName = req.params.driverName;
    console.log(`Fetching summary for seller: ${driverName}`);

    const summary = await Summary.findOne({ Name: driverName });

    if (!summary) {
      console.log('Summary not found');
      return res.status(200).json({ message: 'Summary not found' });
    }

    res.json(summary);
  } catch (err) {
    console.error('Error fetching summary:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint for Refund
app.get('/api/refund/:driverName', async (req, res) => {
  try {
    const driverName = req.params.driverName;
    console.log(`Fetching refund for seller: ${driverName}`);

    const refunds = await Refund.find({ Driver: driverName });

    res.json(refunds);
  } catch (err) {
    console.error('Error fetching refunds:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint for Payable
app.get('/api/payable/:driverName', async (req, res) => {
  try {
    const driverName = req.params.driverName;
    console.log(`Fetching payable for seller: ${driverName}`);

    const payables = await Payable.find({ 'Driver Name': driverName });

    res.json(payables);
  } catch (err) {
    console.error('Error fetching payables:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Server listening on port 5000
app.listen(5001, () => {
  console.log('Server is running on http://localhost:5001');
});