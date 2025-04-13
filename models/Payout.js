const mongoose = require('mongoose');

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
  'Remarks': {
    type: String
  }
}, {
  timestamps: true
});

const Payout = mongoose.model('Payout', payoutSchema, 'Payout');

module.exports = Payout;
