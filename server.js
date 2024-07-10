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
mongoose.connect('mongodb+srv://sambhav:UrvannGenie01@urvanngenie.u7r4o.mongodb.net/UrvannRiderApp?retryWrites=true&w=majority&appName=UrvannGenie', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', async () => {
  console.log('Connected to MongoDB');

  try {
    // Create indexes in MongoDB
    await Route.createIndexes({
      seller_name: 1,
      'Driver Name': 1,
      line_item_sku: 1,
      FINAL: 1
    });
    console.log('Indexes created successfully');
  } catch (error) {
    console.error('Error creating indexes:', error);
  }
});

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
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if user exists
    const user = await User.findOne({ username });
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
    const filteredData = await Route.find({
      seller_name: { $regex: new RegExp(`^${seller_name}$`, 'i') },
      "Driver Name": { $regex: new RegExp(`^${rider_code}$`, 'i') }
    }).lean(); // Use .lean() for faster read operation

    const photos = await Photo.find().lean(); // Fetch photos

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
    // Ensure both SKU and order code are provided
    if (!sku || !orderCode) {
      return res.status(400).json({ message: 'SKU and Order Code are required' });
    }

    // Update the pickup status based on SKU and order code
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
  const { sellerName, driverName, status } = req.body;

  try {
    await Route.updateMany(
      { seller_name: sellerName, "Driver Name": driverName },
      { $set: { "Pickup Status": status } }
    );
    res.status(200).json({ message: 'Pickup status updated successfully for all products' });
  } catch (error) {
    console.error('Error updating pickup status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/data/:driverName
app.get('/api/data/:driverName', async (req, res) => {
  try {
    const driverName = req.params.driverName;

    console.log(`Fetching data for seller: ${driverName}`); // Debugging log

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
    console.log(`Fetching refund for seller: ${driverName}`);

    const refunds = await Refund.find({ seller_name: driverName });

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

    const payables = await Payable.find({ seller_name: driverName });

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
