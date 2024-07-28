// models/Route.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RouteSchema = new Schema({
  shipping_address_full_name: {
    type: String,
    required: true,
  },
  'Driver Name': {
    type: String,
    required: true,
  },
});

const Route = mongoose.model('Route', RouteSchema);

module.exports = Route;
