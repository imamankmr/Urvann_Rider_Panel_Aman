const mongoose = require('mongoose');

const payableSchema = new mongoose.Schema({
  order_id: Number,
  seller_name: String,
  created_on: String,
  line_item_name: String,
  line_item_price: Number,
  line_item_quantity: Number,
  Store: String,
  "Urvann revenue": Number,
  "Payable to vendor": Number,
  SKU: String
});

const Payable = mongoose.model('Payable', payableSchema, 'Payable');

module.exports = Payable;
