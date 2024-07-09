const mongoose = require('mongoose');

const deliveryUpdatesSchema = new mongoose.Schema({
  Date: Date,
  'Driver Name': String,
  Delivered: Number,
  Penalty: Number,
});

const DeliveryUpdate = mongoose.model('DeliveryUpdate', deliveryUpdatesSchema, 'Delivery_updates');

module.exports = DeliveryUpdate;
