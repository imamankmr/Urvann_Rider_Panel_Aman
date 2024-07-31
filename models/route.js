const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  // Order_Type: { type: String, required: true },
  // order_id: { type: String, required: true },
  // status: { type: String, required: true },
  // txn_id: { type: String, required: true },
  seller_name: { type: String, required: true },
  line_item_name: { type: String, required: true },
  line_item_price: { type: Number, required: true },
  line_item_sku: { type: String, required: true },
  line_item_quantity: { type: Number, required: true },
  total_item_quantity: { type: Number, required: true },
  // client_substore: { type: String, required: true },
  // Unique_Key: { type: String, required: true },
  // Payout: { type: Number, required: true },
  // GMV: { type: Number, required: true },
  Driver_Code: { type: String, required: true },
  shipping_address_full_name: { type: String, required: true },
  shipping_address_phone: { type: String, required: true },
  shipping_address_address: { type: String, required: true },
  // Tag_code: { type: Number, required: true },
  FINAL: { type: String, required: true },
  Items: { type: Number, required: true },
  // Delivery_Status: { type: String, required: true },
  'Driver Name': { type: String, required: true },
  Pickup_Status: { type: String, required: true }
}, { collection: 'route' });

module.exports = mongoose.model('Route', routeSchema);
