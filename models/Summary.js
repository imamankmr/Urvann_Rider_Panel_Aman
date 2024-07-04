const mongoose = require('mongoose');

const summarySchema = new mongoose.Schema({
  Name: String,
  Payable: Number,
  Refunds: Number,
  'Other additions': Number,
  'B2B sales': Number,
  Stickers: Number,
  Penalty: Number,
  'Total Paid': Number,
});

const Summary = mongoose.model('Summary', summarySchema, 'Summary');

module.exports = Summary;
