const DeliveryUpdate = require('../models/deliveryUpdate');

const getUpdates = async (req, res) => {
    try {
        const driverName = req.params.driverName;

        // Fetch only the Date, Delivered, and Penalty fields
        const deliveryUpdates = await DeliveryUpdate.find({ 'Driver Name': driverName }, 'Date Delivered Penalty');

        console.log('Fetched data:', deliveryUpdates); // Debugging log

        res.json({ deliveryUpdates });
    } catch (err) {
        console.error('Error fetching data:', err.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = {
    getUpdates
}