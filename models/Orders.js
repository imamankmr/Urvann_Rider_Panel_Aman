const mongoose = require("mongoose");
const { masterDB } = require('../middlewares/connectToDB');

// Define the nested schema for `data` fields
const dataSchema = new mongoose.Schema(
  {
    txn_id: { type: String },
    driver_name: String,
    Rider_Name: String,
    rider_code: String,
    metafield_delivery_status: String,
  },
  { _id: false }
);

// Define the main order schema
const orderSchema = new mongoose.Schema({
  data: dataSchema,
  receivedAt: Date,
  assignedAt: Date,
  rescheduledAt: Date,
});

// Create indexes for better query performance
orderSchema.index({ 'data.txn_id': 1 });
orderSchema.index({ 'data.rider_code': 1 });
orderSchema.index({ 'data.driver_name': 1 });
orderSchema.index({ receivedAt: 1 });
orderSchema.index({ assignedAt: 1 });

// Use masterDB connection instead of mongoose.model
const Order = masterDB.model("Order", orderSchema);

module.exports = Order;
