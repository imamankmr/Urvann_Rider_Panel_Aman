const Route = require('../models/route');
const Photo = require('../models/photo');
const Audit = require('../models/audit');
const moment = require('moment-timezone'); // Import moment-timezone
// const customers = async (req, res) => {
//     try {
//         const { driverName } = req.params;
//         const routes = await Route.find({ 'Driver Name': driverName });

//         if (routes.length === 0) {
//             return res.status(404).json({ message: 'No customers found for this driver' });
//         }

//         // Create a map to ensure unique customers
//         const customerMap = new Map();

//         routes.forEach(route => {
//             if (!customerMap.has(route.shipping_address_full_name)) {
//                 customerMap.set(route.shipping_address_full_name, {
//                     _id: route._id, // Include _id
//                     order_code: route.FINAL,
//                     items: route.Items,
//                     address: route.shipping_address_address,
//                     phone: route.shipping_address_phone,
//                 });
//             }
//         });

//         // Convert map to array of objects
//         const customers = Array.from(customerMap.entries()).map(([name, { _id, order_code, items, address, phone }]) => ({
//             _id,
//             name,         // This will be the name of the customer
//             order_code,
//             items,
//             address,
//             phone,
//         }));

//         res.json({ customers });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Server error' });
//     }
// }

const customers = async (req, res) => {
    try {
        const { driverName } = req.params;

        // Define the filter conditions for Delivery_Status
        const filterConditions = [
            { 'metafield_order_type': { $exists: false } }, // No Delivery_Status field
            { 'metafield_order_type': 'Replacement' }
        ];

        const routes = await Route.find({
            'Driver Name': driverName,
            $or: filterConditions
        });

        if (routes.length === 0) {
            return res.status(404).json({ message: 'No customers found for this driver' });
        }

        // Create a map to aggregate item quantities and statuses by customer
        const customerMap = new Map();

        routes.forEach(route => {
            if (!customerMap.has(route.shipping_address_full_name)) {
                customerMap.set(route.shipping_address_full_name, {
                    _id: route._id, // Include _id
                    order_code: route.FINAL,
                    items: route.Items,
                    address: route.shipping_address_address,
                    total_quantity: route.total_item_quantity, // Initialize with current quantity
                    phone: route.shipping_address_phone,
                    Alternate_number: route.Alternate_number,
                    metafield_delivery_status: route.metafield_delivery_status || '' // Fetch the status
                });
            } else {
                // Aggregate quantity for the existing customer
                const existing = customerMap.get(route.shipping_address_full_name);
                existing.total_quantity += route.total_item_quantity;
                customerMap.set(route.shipping_address_full_name, existing);
            }
        });

        // Convert map to array of objects
        const customers = Array.from(customerMap.entries()).map(([name, { _id, order_code, items, address, total_quantity, phone, Alternate_number, metafield_delivery_status }]) => ({
            _id,
            name,         // This will be the name of the customer
            order_code,
            items,
            address,
            total_quantity,
            phone,
            Alternate_number,
            metafield_delivery_status, // Include status in response
        }));

        res.json({ customers }); // Return the customers with aggregated quantity and status
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
}

const deliveryProductDetails = async (req, res) => {
    try {
        // Extract query parameters
        const { order_code, metafield_order_type } = req.query;

        // Check if the required parameter 'order_code' is missing
        if (!order_code) {
            return res.status(400).json({ message: 'Missing required query parameter: order_code' });
        }

        // Construct the query object, making metafield_order_type optional
        const query = { FINAL: order_code };
        if (metafield_order_type) {
            query.metafield_order_type = metafield_order_type;
        }

        // Fetch all route details based on the query parameters
        const routeDetailsList = await Route.find(query);

        if (!routeDetailsList || routeDetailsList.length === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Initialize an array to hold all product details
        const productDetailsList = [];

        // Fetch product details for each route entry
        for (const routeDetails of routeDetailsList) {
            const productDetails = await Photo.findOne({ sku: routeDetails.line_item_sku });

            if (productDetails) {
                // Add the relevant details, including the pickup_status, to the response list
                productDetailsList.push({
                    line_item_sku: routeDetails.line_item_sku,
                    line_item_name: routeDetails.line_item_name,
                    image1: productDetails.image_url || null,
                    total_item_quantity: routeDetails.total_item_quantity,
                    pickup_status: routeDetails.Pickup_Status 
                });
            } else {
                // If product not found, add an entry with an error message
                productDetailsList.push({
                    line_item_sku: routeDetails.line_item_sku,
                    line_item_name: routeDetails.line_item_name,
                    image1: null,
                    total_item_quantity: routeDetails.total_item_quantity,
                    pickup_status: routeDetails.Pickup_Status,
                    error: 'Product not found'
                });
            }
        }

        // Send response with all product details
        res.json(productDetailsList);
    } catch (error) {
        console.error('Error fetching product details:', error);
        res.status(500).json({ message: 'Server error' });
    }
};




// const updateDeliveryStatus = async (req, res) => {
//     const { customerName } = req.params;
//     const { deliveryStatus } = req.body;

//     try {
//         const result = await Route.updateMany(
//             { shipping_address_full_name: customerName },
//             { $set: { Delivery_Status: deliveryStatus } }
//         );

//         if (result.matchedCount === 0) {
//             return res.status(404).send('No records found for the specified customer');
//         }

//         res.status(200).send('Delivery status updated successfully');
//     } catch (error) {
//         console.error(error);
//         res.status(500).send('Server error');
//     }
// }

// Function to convert current time to IST
const getISTTime = () => {
    const istTime = moment.tz('Asia/Kolkata');  // Get current time in IST
    return {
        istDate: istTime.toDate(),  // Save as a Date object (it will be saved in UTC in MongoDB)
        istFormatted: istTime.format('DD-MM-YYYY hh:mm A'),  // Save formatted IST string
        startOfDayIST: istTime.clone().startOf('day').toDate(),  // Start of the day in IST as Date
        endOfDayIST: istTime.clone().endOf('day').toDate()  // End of the day in IST as Date
    };
};

const updateDeliveryStatus = async (req, res) => {
    const { customerName } = req.params;
    const { deliveryStatus, driverName } = req.body;

    // Define `username` as `driverName`
    const username = driverName;

    try {
        // Check for locked statuses only for the specific driver
        const lockedStatuses = await Route.find({ 
            Lock_Status: "Open", 
            "Driver Name": driverName // Add the driverName condition
        });
        
        //console.log("Locked Statuses found:", lockedStatuses.length);

        // If any locked statuses are found, send a 401 response
        if (lockedStatuses.length > 0) {
            //console.log("Returning 401: Locked statuses are open.");
            return res.status(401).send('Please submit pickup before proceeding');
        }

        // Update delivery status for matching routes
        const result = await Route.updateMany(
            {
                metafield_order_type: { $in: [null] }, // Only normal orders
                shipping_address_full_name: customerName
            },
            { $set: { metafield_delivery_status: deliveryStatus } }
        );

        //console.log("Update result:", result);

        // If no documents matched, send a 404 response
        if (result.matchedCount === 0) {
            //console.log("Returning 404: No records found to update.");
            return res.status(404).send('No records found to update');
        }

        // Track the time of the last delivery status update in IST
        const { istDate } = getISTTime(); // Extract only the istDate for MongoDB

        // Update or create the audit record for this rider's username
        const auditRecord = await Audit.findOne({ username }).sort({ loginTime: -1 });

        if (auditRecord) {
            //console.log("Audit record found. Checking lastUpdatedStatusTime...");

            // If the last updated status time is earlier than the current update time, update it
            if (!auditRecord.lastUpdatedStatusTime || new Date(auditRecord.lastUpdatedStatusTime) < new Date(istDate)) {
                auditRecord.lastUpdatedStatusTime = istDate; // Set the last update time as istDate (Date object)
                await auditRecord.save(); // Save the audit record with updated time
                //console.log("Audit record updated with new lastUpdatedStatusTime:", istDate);
            }
        } else {
            //console.log("Returning 404: No audit record found for this rider.");
            return res.status(404).send('No audit record found for this rider');
        }

        // Successful update
        //console.log("Returning 200: Delivery status updated successfully.");
        res.status(200).send('Delivery status updated successfully');
    } catch (error) {
        //console.error("Error in updateDeliveryStatus API:", error);
        res.status(500).send('Server error');
    }
};


module.exports = {
    customers,
    updateDeliveryStatus,
    deliveryProductDetails,
}
