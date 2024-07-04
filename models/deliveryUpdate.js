const mongoose = require('mongoose');

const deliveryUpdatesSchema = new mongoose.Schema({
  Date: Date,
  'Seller name': String,
  Delivered: Number,
  Penalty: Number,
});

const DeliveryUpdate = mongoose.model('DeliveryUpdate', deliveryUpdatesSchema, 'Delivery_updates');

module.exports = DeliveryUpdate;
