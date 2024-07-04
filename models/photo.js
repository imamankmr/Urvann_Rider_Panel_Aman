const mongoose = require('mongoose');

const photoSchema = new mongoose.Schema({
  name: String,
  sku: String,
  image_url: String
});

const Photo = mongoose.model('Photo', photoSchema);

module.exports = Photo;
