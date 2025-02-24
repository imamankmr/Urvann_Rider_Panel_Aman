const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seller_name: { type: String, required: true },
  line_item_name: { type: String, required: true },
  line_item_price: { type: Number, required: true },
  line_item_sku: { type: String, required: true },
  line_item_quantity: { type: Number, required: true },
  total_item_quantity: { type: Number, required: true },
  Driver_Code: { type: String, required: true },
  shipping_address_full_name: { type: String, required: true },
  shipping_address_phone: { type: String, required: true },
  shipping_address_address: { type: String, required: true },
  FINAL: { type: String, required: true },
  Items: { type: Number, required: true },
  Delivery_Status: { type: String, required: true },
  'Driver Name': { type: String, required: true },
  Pickup_Status: { type: String, required: true },
  metafield_delivery_status: { type: String, required: true },
  metafield_order_type: { type: String, required: true },
  Lock_Status: { type: String, required: true },
  'Alternate phone number': { type: String, required: true }
}, { collection: 'route' });

module.exports = mongoose.model('Route', routeSchema);
