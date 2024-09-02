const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;
// Connect to MongoDB for UrvannRiderApp database
mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected to UrvannRiderApp'))
  .catch(err => console.error(err));

// MongoDB connection URI for UrvannHubRouteData database
const MONGODB_URI_ROUTE = 'mongodb+srv://sambhav:UrvannGenie01@urvanngenie.u7r4o.mongodb.net/UrvannHubRouteData?retryWrites=true&w=majority&appName=UrvannGenie';

// Create a separate connection for the UrvannHubRouteData database
const routeConnection = mongoose.createConnection(MONGODB_URI_ROUTE);

routeConnection.on('connected', () => {
  console.log('MongoDB connected to UrvannHubRouteData');
});

routeConnection.on('error', (err) => {
  console.error(err);
});

module.exports = {
  mongoose,        // Export the default connection for UrvannRiderApp
  routeConnection  // Export the separate connection for UrvannHubRouteData
};