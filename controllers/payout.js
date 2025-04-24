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
            const start = new Date(startDate);
            const end = new Date(endDate);
            
            // Ensure start date is at beginning of day
            start.setHours(0, 0, 0, 0);
            // Ensure end date is at end of day
            end.setHours(23, 59, 59, 999);
            
            // Log the raw dates
            console.log('Raw dates:', {
                startDate: startDate,
                endDate: endDate,
                parsedStart: start,
                parsedEnd: end
            });
            
            dateQuery = {
                'Date': {
                    $gte: start,
                    $lte: end
                }
            };
        } else {
            // Default to yesterday if no dates provided
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            yesterday.setHours(0, 0, 0, 0);
            
            const today = new Date(yesterday);
            today.setDate(today.getDate() + 1);
            
            dateQuery = {
                'Date': {
                    $gte: yesterday,
                    $lt: today
                }
            };
        }

        // Log the date query in a cleaner format
        console.log('Date query:', JSON.stringify({
            start: dateQuery.Date.$gte,
            end: dateQuery.Date.$lte
        }, null, 2));

        // First check if any records exist for this driver with increased timeout
        const driverExists = await Payout.findOne({ 'Driver Assigned': driverName })
            .maxTimeMS(30000)
            .lean()
            .exec();

        console.log('Driver exists check:', !!driverExists);

        if (!driverExists) {
            console.log('No records found for driver:', driverName);
            return res.json({
                message: 'No records found for this driver',
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
                netEarnings: 0,
                lifetimeEarnings: 0,
                orderDetails: []
            });
        }

        // Get payouts for the date range with increased timeout
        const payouts = await Payout.find({
            'Driver Assigned': driverName,
            ...dateQuery
        })
        .maxTimeMS(30000)
        .lean()
        .exec();

        console.log('Found payouts:', payouts.length);
        
        // Log sample payout dates to verify range
        if (payouts.length > 0) {
            console.log('Sample payout dates:', payouts.slice(0, 3).map(p => ({
                date: p.Date,
                baseEarning: p['Base Earning'],
                deliveryStatus: p['Delivery Status']
            })));
        }

        // Group payouts by date for verification
        const earningsByDate = payouts.reduce((acc, payout) => {
            const date = new Date(payout.Date).toLocaleDateString('en-IN');
            if (!acc[date]) {
                acc[date] = {
                    baseEarning: 0,
                    incentives: 0,
                    penalties: 0,
                    paidAmount: 0,
                    delivered: 0,
                    notDelivered: 0
                };
            }
            acc[date].baseEarning += payout['Base Earning'] || 0;
            acc[date].incentives += (payout['Earning Incentive'] || 0) + 
                                  (payout['Weekend Incentive'] || 0) + 
                                  (payout['Long Distance incentive'] || 0);
            acc[date].penalties += payout['Penalty'] || 0;
            acc[date].paidAmount += payout['Paid Amount'] || 0;
            if (payout['Delivery Status'] === 'Z-Delivered') {
                acc[date].delivered += 1;
            } else {
                acc[date].notDelivered += 1;
            }
            return acc;
        }, {});

        console.log('Earnings by date:', earningsByDate);

        // Calculate total earnings for the date range
        const totalEarnings = payouts.reduce((sum, payout) => {
            return sum + (payout['Base Earning'] || 0);
        }, 0);

        const totalIncentives = payouts.reduce((sum, payout) => {
            return sum + (payout['Earning Incentive'] || 0) + 
                   (payout['Weekend Incentive'] || 0) + 
                   (payout['Long Distance incentive'] || 0);
        }, 0);

        const totalPenalties = payouts.reduce((sum, payout) => {
            return sum + (payout['Penalty'] || 0);
        }, 0);
        
        const totalPaidAmount = payouts.reduce((sum, payout) => {
            return sum + (payout['Paid Amount'] || 0);}, 0);

        const netEarnings = totalEarnings + totalIncentives - totalPenalties ;

        // Calculate delivery statistics
        const delivered = payouts.filter(p => p['Delivery Status'] === 'Z-Delivered').length;
        const notDelivered = payouts.filter(p => p['Delivery Status'] !== 'Z-Delivered').length;

        // Log the calculations
        console.log('Earnings calculations:', {
            totalEarnings,
            totalIncentives,
            totalPenalties,
            netEarnings,
            delivered,
            notDelivered,
            totalPaidAmount
        });

        // Get all-time totals for the driver with options
        const allTimeTotals = await Payout.aggregate([
            { $match: { 'Driver Assigned': driverName } },
            {
                $group: {
                    _id: null,
                    totalBaseEarnings: { $sum: '$Base Earning' },
                    totalIncentives: { 
                        $sum: { 
                            $add: [
                                { $ifNull: ['$Earning Incentive', 0] },
                                { $ifNull: ['$Weekend Incentive', 0] },
                                { $ifNull: ['$Long Distance incentive', 0] }
                            ]
                        }
                    },
                    totalPenalties: { $sum: { $ifNull: ['$Penalty', 0] } },
                    totalPaidAmount: { $sum: { $ifNull: ['$Paid Amount', 0] } }
                }
            }
        ], { maxTimeMS: 30000 });
        
        const lifetimeEarnings = allTimeTotals.length > 0 
            ? allTimeTotals[0].totalBaseEarnings + 
              allTimeTotals[0].totalIncentives - 
              allTimeTotals[0].totalPenalties - 
              allTimeTotals[0].totalPaidAmount
            : 0;
        

        // Combine payout details
        const orderDetails = payouts.map(payout => {
            // Log each payout to see what fields are available
            console.log('Processing payout:', {
                txn_id: payout['txn_id'],
                remarks: payout['Remarks'],
                paymentDate: payout['Payment Date']
            });

            return {
                txnId: payout['txn_id'],
                deliveryStatus: payout['Delivery Status'] || 'N/A',
                paymentDate: payout['Payment Date'] || 'N/A',
                remarks: payout['Remarks'] || 'N/A',
                baseEarning: payout['Base Earning'] || 0,
                incentives: (payout['Earning Incentive'] || 0) + 
                          (payout['Weekend Incentive'] || 0) + 
                          (payout['Long Distance incentive'] || 0),
                penalties: payout['Penalty'] || 0,
                paidAmount: payout['Paid Amount'] || 0,
            };
        });

        // Log sample of processed orders
        console.log('Sample processed orders:', orderDetails.slice(0, 2));

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
            totalEarnings: totalEarnings,
            ordersCompleted: payouts.length,
            delivered: delivered,
            notDelivered: notDelivered,
            incentives: totalIncentives,
            penalties: totalPenalties,
            netEarnings: netEarnings,
            paidAmount: totalPaidAmount,
            lifetimeEarnings: lifetimeEarnings,
            orderDetails: orderDetails
        };

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



const getDateWiseEarnings = async (req, res) => {
    try {
        const driverName = req.params.driverName;
        const { startDate, endDate } = req.query;
        
        // Log the raw dates received
        console.log('Raw dates received:', { startDate, endDate });
        
        // Parse dates and set to start/end of day
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        
        console.log('Processed date range:', {
            start: start.toISOString(),
            end: end.toISOString()
        });

        // Build date query
        const dateQuery = {
            'Date': {
                $gte: start,
                $lte: end
            }
        };

        // Get payouts for the date range
        const payouts = await Payout.find({
            'Driver Assigned': driverName,
            ...dateQuery
        })
        .maxTimeMS(30000)
        .lean()
        .exec();

        console.log('Found payouts:', payouts.length);
        console.log('Sample payout dates:', payouts.slice(0, 3).map(p => p.Date));

        // Group payouts by date
        const dateWiseEarnings = payouts.reduce((acc, payout) => {
            const date = new Date(payout.Date);
            date.setHours(0, 0, 0, 0); // Normalize to start of day
            
            const formattedDate = date.toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });

            if (!acc[formattedDate]) {
                acc[formattedDate] = {
                    date: formattedDate,
                    baseEarning: 0,
                    incentives: 0,
                    penalties: 0,
                    paidAmount: 0,
                    orders: []
                };
            }

            acc[formattedDate].baseEarning += payout['Base Earning'] || 0;
            acc[formattedDate].incentives += (payout['Earning Incentive'] || 0) + 
                                         (payout['Weekend Incentive'] || 0) + 
                                         (payout['Long Distance incentive'] || 0);
            acc[formattedDate].penalties += payout['Penalty'] || 0;
            acc[formattedDate].paidAmount += payout['Paid Amount'] || 0;
            
            // Add order details with new fields
            const orderDetails = {
                txnId: payout['txn_id'],
                riderCode: payout['rider_code'] || 'N/A',
                deliveryStatus: payout['Delivery Status'] || 'N/A',
                baseEarning: payout['Base Earning'] || 0,
                incentives: (payout['Earning Incentive'] || 0) + 
                          (payout['Weekend Incentive'] || 0) + 
                          (payout['Long Distance incentive'] || 0),
                penalties: payout['Penalty'] || 0,
                paymentDate: payout['Payment Date'] || 'N/A',
                paidAmount: payout['Paid Amount'] || 0,
                remarks: payout['Remarks'] || 'N/A'
            };
            
            acc[formattedDate].orders.push(orderDetails);

            return acc;
        }, {});

        // Generate all dates in the range
        const allDates = [];
        let currentDate = new Date(start);

        while (currentDate <= end) {
            const formattedDate = currentDate.toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });

            // If no data exists for this date, create an empty entry
            if (!dateWiseEarnings[formattedDate]) {
                dateWiseEarnings[formattedDate] = {
                    date: formattedDate,
                    baseEarning: 0,
                    incentives: 0,
                    penalties: 0,
                    orders: []
                };
            }

            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Convert to array and sort by date (most recent first)
        const result = Object.values(dateWiseEarnings)
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        console.log('Final dates in response:', result.map(r => r.date));

        res.json({
            dateWiseEarnings: result
        });
    } catch (err) {
        console.error('Detailed error in getDateWiseEarnings:', {
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
};


module.exports = {
    summary,
    refund,
    payable,
    getPayoutData,
    getDateWiseEarnings
}