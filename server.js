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

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    user = new User({
      username,
      password: hashedPassword,
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
// Login route
app.post('/api/login', async (req, res) => {
  const { Driver_name, password } = req.body;

  try {
    // Check if user exists
    const user = await User.findOne({ Driver_name });
    if (!user) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    // Check if password matches
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
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

// GET /api/driver/:driver_name/sellers
app.get('/api/driver/:Driver_name/sellers', async (req, res) => {
  const { Driver_name } = req.params;
  try {
    const sellers = await Route.find({ 'Driver Name': Driver_name }).distinct('seller_name');
    res.json(sellers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// GET /api/products
app.get('/api/products', async (req, res) => {
  const { seller_name, rider_code } = req.query;

    // Adjusted query to handle case sensitivity and exact match issues
    try {
      // Adjusted query to handle exact matches using regex anchors
      const filteredData = await Route.find({
        seller_name: { $regex: new RegExp(`^${seller_name}$`, 'i') }, // Exact case insensitive match
        "Driver Name": { $regex: new RegExp(`^${rider_code}$`, 'i') } // Exact case insensitive match
      });
    
    // Fetch all photos from the database
    const photos = await Photo.find();

    // Create a map of SKU to image URL
    const photoMap = {};
    photos.forEach(photo => {
      photoMap[photo.sku] = photo.image_url;
    });

    // Merge filtered data with photo URLs
    const mergedData = filteredData.map(data => ({
      ...data._doc,
      image1: photoMap[data.line_item_sku] || null
    }));

    // Calculate order code quantities
    const orderCodeQuantities = mergedData.reduce((acc, data) => {
      acc[data.FINAL] = (acc[data.FINAL] || 0) + data.total_item_quantity;
      return acc;
    }, {});

    // Prepare products response
    const products = mergedData.map(data => ({
      FINAL: data.FINAL,
      line_item_sku: data.line_item_sku,
      line_item_name: data.line_item_name,
      image1: data.image1,
      total_item_quantity: data.total_item_quantity
    }));

    res.json({ orderCodeQuantities, products });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/data/:driverName', async (req, res) => {
  try {
    const driverName = req.params.driverName;

    console.log(`Fetching data for seller: ${driverName}`); // Debugging log

    // Fetch only the Date, Delivered, and Penalty fields
    const deliveryUpdates = await DeliveryUpdate.find({ 'Seller name': driverName }, 'Date Delivered Penalty');

    console.log('Fetched data:', deliveryUpdates); // Debugging log

    res.json({ deliveryUpdates });
  } catch (err) {
    console.error('Error fetching data:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint for Summary
// Endpoint for Summary
app.get('/api/summary/:driverName', async (req, res) => {
  try {
    const driverName = req.params.driverName;
    console.log(`Fetching summary for seller: ${driverName}`);

    const summary = await Summary.findOne({ Name: driverName });

    if (!summary) {
      console.log('Summary not found');
      return res.status(404).json({ message: 'Summary not found' });
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
    const refunds = await Refund.find({ Seller: driverName });

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
    const payables = await Payable.find({ seller_name: driverName });

    res.json(payables);
  } catch (err) {
    console.error('Error fetching payables:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
