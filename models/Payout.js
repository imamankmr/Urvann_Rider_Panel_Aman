const mongoose = require('mongoose');
const { mainDB } = require('../middlewares/connectToDB');

const payoutSchema = new mongoose.Schema({
  'Date': {
    type: Date,
    required: true
  },
  'Driver Code': {
    type: String,
    required: true
  },
  'Driver Assigned': {
    type: String,
    required: true
  },
  'Delivery Status': {
    type: String
  },
  'Hub Code': {
    type: String
  },
  'Code': {
    type: String
  },
  'Base Earning': {
    type: Number,
    default: 0
  },
  'Weekend Incentive': {
    type: Number,
    default: 0
  },
  'Long Distance incentive': {
    type: Number,
    default: 0
  },
  'Earning Incentive': {
    type: Number,
    default: 0
  },
  'Penalty': {
    type: Number,
    default: 0
  },
  'txn_id': {
    type: String
  },
  'rider_code': {
    type: String
  },
  'Remarks': {
    type: String
  },
  'Payment Date': {
    type: String
  },
  'Paid Amount': {
    type: Number,
    default: 0
  },
}, {
  timestamps: true
});

// Create indexes for better query performance
payoutSchema.index({ 'Driver Assigned': 1 });
payoutSchema.index({ 'Date': 1 });
payoutSchema.index({ 'txn_id': 1 });

const Payout = mongoose.model('Payout', payoutSchema, 'Payout');

module.exports = Payout;
