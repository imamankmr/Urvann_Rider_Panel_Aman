const Summary = require('../models/Summary');
const Payable = require('../models/Payable');
const Refund = require('../models/Refund');

const summary = async (req, res) => {
    try {
        const driverName = req.params.driverName;
        console.log(`Fetching summary for seller: ${driverName}`);

        const summary = await Summary.findOne({ Name: driverName });

        if (!summary) {
            console.log('Summary not found');
            return res.status(200).json({ message: 'Summary not found' });
        }

        res.json(summary);
    } catch (err) {
        console.error('Error fetching summary:', err.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

const refund = async (req, res) => {
    try {
        const driverName = req.params.driverName;

        const refunds = await Refund.find({ Driver: driverName });

        res.json(refunds);
    } catch (err) {
        console.error('Error fetching refunds:', err.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

const payable = async (req, res) => {
    try {
        const driverName = req.params.driverName;
        console.log(`Fetching payable for seller: ${driverName}`);

        const payables = await Payable.find({ 'Driver Name': driverName });

        res.json(payables);
    } catch (err) {
        console.error('Error fetching payables:', err.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = {
    summary,
    refund,
    payable
}