const mongoose = require('mongoose');

const auditSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    loginTime: {
        type: Date,
        required: true
    },
    lastUpdatedStatusTime: {
        type: Date,
        default: null  // We will update this on logout
    },
    firstPickupTime: { 
        type: Date,
        default: null 
    }
});

module.exports = mongoose.model('Audit', auditSchema);
