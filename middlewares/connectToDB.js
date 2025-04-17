const mongoose = require('mongoose');

// MongoDB connection URI
// const MONGODB_URI = 'mongodb+srv://sambhav:UrvannGenie01@urvanngenie.u7r4o.mongodb.net/UrvannSellerApp?retryWrites=true&w=majority&appName=UrvannGenie';
const MONGODB_URI = process.env.MONGODB_URI;
// const MONGODB_URI = "mongodb+srv://sambhav:UrvannGenie01@urvanngenie.u7r4o.mongodb.net/UrvannRiderApp?retryWrites=true&w=majority&appName=UrvannGenie";


// Connect to MongoDB
const connectToDB = () => {
  mongoose.connect(MONGODB_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error(err));
}

module.exports = connectToDB;