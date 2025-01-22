const Route = require('../models/route');
const Photo = require('../models/photo');
const Audit = require('../models/audit');
const moment = require('moment-timezone'); // Import moment-timezone

const customers = async (req, res) => {
    try {
        const { driverName } = req.params;

        // Define the filter conditions for Delivery_Status
        const filterConditions = [
            { 'metafield_order_type': { $exists: false } }, // No Delivery_Status field
            { 'metafield_order_type': '' }, // Also include empty string for metafield_order_type
        ];

        const routes = await Route.find({
            'Driver Name': driverName,
            $or: filterConditions,
        });

        if (routes.length === 0) {
            return res.status(404).json({ message: 'No customers found for this driver' });
        }

        // Create a map to aggregate item quantities and determine status by customer
        const customerMap = new Map();

        routes.forEach((route) => {
            const customerKey = route.FINAL; // Unique identifier for customer (order code)

            if (!customerMap.has(customerKey)) {
                customerMap.set(customerKey, {
                    _id: route._id,
                    name: route.shipping_address_full_name,
                    order_code: route.FINAL,
                    address: route.shipping_address_address,
                    total_quantity: route.total_item_quantity,
                    phone: route.shipping_address_phone,
                    Alternate_number: route['Alternate phone number'],
                    statuses: [route.metafield_delivery_status || ''], // Collect statuses
                });
            } else {
                const existing = customerMap.get(customerKey);
                existing.total_quantity += route.total_item_quantity; // Aggregate quantity
                existing.statuses.push(route.metafield_delivery_status || ''); // Collect more statuses
                customerMap.set(customerKey, existing);
            }
        });

        // Convert map to array and determine the final status
        const customers = Array.from(customerMap.entries()).map(
            ([order_code, { _id, name, address, total_quantity, phone, Alternate_number, statuses }]) => {
                const finalStatus = statuses.includes('Partially Delivered')
                    ? 'Partially Delivered'
                    : statuses.find((status) => status) || ''; // Use the first non-empty status

                return {
                    _id,
                    order_code,
                    name,
                    address,
                    total_quantity,
                    phone,
                    Alternate_number,
                    metafield_delivery_status: finalStatus, // Final determined status
                };
            }
        );

        res.json({ customers });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};


const deliveryProductDetailsv1 = async (req, res) => {
    try {
        const { order_code, driverName } = req.query;

        if (!order_code || !driverName) {
            return res.status(400).json({ message: 'Missing required query parameters: order_code or driverName' });
        }

        // Query to fetch only the required fields
        const query = { FINAL: order_code, 'Driver Name': driverName };
        const fieldsToSelect = 'line_item_sku line_item_name total_item_quantity Pickup_Status metafield_order_type';
        const routeDetailsList = await Route.find(query, fieldsToSelect).lean();

        if (!routeDetailsList || !routeDetailsList.length) {
            return res.status(404).json({ message: 'No data found for the given query' });
        }

        // Filter out records with specific metafield_order_type values
        const filteredRouteDetailsList = routeDetailsList.filter(routeDetails =>
            routeDetails.metafield_order_type !== 'Replacement' &&
            routeDetails.metafield_order_type !== 'Reverse Pickup'
        );

        if (!filteredRouteDetailsList.length) {
            return res.status(404).json({ message: 'No data available after filtering' });
        }

        // Collect SKUs for batch fetching
        const skus = filteredRouteDetailsList.map(routeDetails => routeDetails.line_item_sku);

        // Fetch all product photos in one query
        const photos = await Photo.find({ sku: { $in: skus } }, 'sku image_url').lean();

        // Create a map of SKU to image_url for quick lookup
        const photoMap = photos.reduce((map, photo) => {
            map[photo.sku] = photo.image_url;
            return map;
        }, {});

        // Calculate Delivery_item_count for documents with Pickup_Status as 'Picked'
        // const deliveryItemCount = filteredRouteDetailsList
        //     .filter(routeDetails => routeDetails.Pickup_Status === 'Picked')
        //     .reduce((sum, routeDetails) => sum + Number(routeDetails.total_item_quantity), 0);

        // Append photos and Delivery_item_count to each item in the filtered list
        const updatedRouteDetailsList = filteredRouteDetailsList.map(routeDetails => ({
            line_item_sku: routeDetails.line_item_sku,
            line_item_name: routeDetails.line_item_name,
            total_item_quantity: routeDetails.total_item_quantity,
            Pickup_Status: routeDetails.Pickup_Status,
            image1: photoMap[routeDetails.line_item_sku] || null,
            // Delivery_item_count: deliveryItemCount,
        }));

        // Send the response
        res.json(updatedRouteDetailsList);
    } catch (error) {
        console.error('Error fetching product details:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

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

const updatePartialDelivery = async (req, res) => {
    try {
        const { order_code, deliveredProducts, driverName } = req.body;

        console.log('Request payload:', { order_code, deliveredProducts, driverName });

        // Validate required fields
        if (!order_code || !deliveredProducts || !driverName) {
            console.error('Validation Error: Missing required fields.');
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Ensure deliveredProducts is an array
        if (!Array.isArray(deliveredProducts)) {
            console.error('Validation Error: Delivered products must be an array.');
            return res.status(400).json({ message: 'Delivered products must be an array.' });
        }

        // Debugging: Verify matching documents before the update
        const matchingDocs = await Route.find({ FINAL: order_code, 'Driver Name': driverName });
        console.log(`Matching documents for order_code: ${order_code}`, matchingDocs);

        if (matchingDocs.length === 0) {
            console.warn('No matching documents found for the given order_code and driverName.');
            return res.status(404).json({ message: 'No matching records found to update.' });
        }

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

        // Use bulkWrite to update `metafield_delivery_status`
        const bulkWriteResult = await Route.bulkWrite([
            {
                updateMany: {
                    filter: { FINAL: order_code, line_item_sku: { $in: deliveredProducts } },
                    update: { $set: { metafield_delivery_status: 'Partially Delivered' } },
                },
            },
            {
                updateMany: {
                    filter: { FINAL: order_code, line_item_sku: { $nin: deliveredProducts } },
                    update: { $set: { metafield_delivery_status: 'Partially Not Delivered' } },
                },
            },
        ]);

        console.log('Bulk write result:', bulkWriteResult);

        if (bulkWriteResult.modifiedCount === 0) {
            console.warn('No records were updated for the given order_code and deliveredProducts.');
            return res.status(404).json({ message: 'No records found to update.' });
        }

        res.status(200).json({ message: 'Partial delivery updated successfully' });
    } catch (error) {
        console.error('Error updating partial delivery:', error.message, error.stack);
        res.status(500).json({ message: 'Server error', error: error.message });
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
    updatePartialDelivery,
    deliveryProductDetailsv1,
}