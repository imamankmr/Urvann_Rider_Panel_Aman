const Summary = require('../models/Summary');
const Payable = require('../models/Payable');
const Refund = require('../models/Refund');
const Payout = require('../models/Payout');

const summary = async (req, res) => {
    try {
        const driverName = req.params.driverName;
        //console.log(`Fetching summary for seller: ${driverName}`);

        const summary = await Summary.findOne({ Name: driverName });

        if (!summary) {
            //console.log('Summary not found');
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
        //console.log(`Fetching payable for seller: ${driverName}`);

        const payables = await Payable.find({ 'Driver Name': driverName });

        res.json(payables);
    } catch (err) {
        console.error('Error fetching payables:', err.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

const getPayoutData = async (req, res) => {
    try {
        const driverName = req.params.driverName;
        const { startDate, endDate } = req.query;
        
        console.log('Payout request received:', { driverName, startDate, endDate });
        
        // Build date query
        let dateQuery = {};
        if (startDate && endDate) {
            dateQuery = {
                'Date': {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                }
            };
        } else {
            // Default to today if no dates provided
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            dateQuery = {
                'Date': {
                    $gte: today,
                    $lt: tomorrow
                }
            };
        }

        console.log('Date query:', JSON.stringify(dateQuery, null, 2));

        // First check if any records exist for this driver
        const driverExists = await Payout.findOne({ 'Driver Assigned': driverName });
        console.log('Driver exists check:', !!driverExists);

        if (!driverExists) {
            console.log('No records found for driver:', driverName);
            return res.json({
                driverDetails: {
                    driverAssigned: driverName,
                    driverCode: 'N/A',
                    hub: 'N/A'
                },
                totalEarnings: 0,
                ordersCompleted: 0,
                delivered: 0,
                notDelivered: 0,
                incentives: 0,
                penalties: 0,
                netEarnings: 0
            });
        }

        const payouts = await Payout.find({
            'Driver Assigned': driverName,
            ...dateQuery
        });

        console.log('Found payouts:', payouts.length);
        console.log('Sample payout record:', payouts[0] ? JSON.stringify(payouts[0], null, 2) : 'No records found');

        // Get driver details from the first payout record
        const driverDetails = payouts.length > 0 ? {
            driverAssigned: payouts[0]['Driver Assigned'],
            driverCode: payouts[0]['Driver Code'],
            hub: payouts[0]['Hub Code']
        } : {
            driverAssigned: driverName,
            driverCode: 'N/A',
            hub: 'N/A'
        };

        // Calculate statistics
        const stats = {
            driverDetails,
            totalEarnings: 0,
            ordersCompleted: payouts.length,
            delivered: 0,
            notDelivered: 0,
            incentives: 0,
            penalties: 0,
            netEarnings: 0
        };

        payouts.forEach(payout => {
            stats.totalEarnings += payout['Base Earning'] || 0;
            if (payout['Delivery Status'] === 'Z-Delivered') {
                stats.delivered += 1;
            } else {
                stats.notDelivered += 1;
            }
            stats.incentives += (payout['Earning Incentive'] || 0) + 
                              (payout['Weekend Incentive'] || 0) + 
                              (payout['Long Distance incentive'] || 0);
            stats.penalties += payout['Penalty'] || 0;
        });

        // Calculate net earnings
        stats.netEarnings = stats.totalEarnings - stats.penalties + stats.incentives;

        res.json(stats);
    } catch (err) {
        console.error('Detailed error in getPayoutData:', {
            message: err.message,
            stack: err.stack,
            name: err.name
        });
        res.status(500).json({ 
            error: 'Internal Server Error',
            details: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
}

module.exports = {
    summary,
    refund,
    payable,
    getPayoutData
}