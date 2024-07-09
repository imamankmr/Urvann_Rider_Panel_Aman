const mongoose = require('mongoose');

const refundSchema = new mongoose.Schema({
  order_id: Number,
  "SKU id": String,
  Driver: String,
  line_item_name: String,
  "Product amount": Number,
  Qty: Number,
  "Amount to be deducted": Number,
  "B2B price": String // Assuming this field can be a string or handle empty values
});

const Refund = mongoose.model('Refunds', refundSchema, 'Refunds');

module.exports = Refund;
