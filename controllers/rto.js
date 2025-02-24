const Route = require('../models/route');
const Photo = require('../models/photo');
const moment = require('moment-timezone'); // Import moment-timezone
const Audit = require('../models/audit');
const rtoData = async (req, res) => {
    try {
        const { driverName } = req.params;

        // Define the filter conditions for Delivery_Status
        const filterConditions = [
            { 'metafield_order_type': 'Replacement' },
            { 'metafield_order_type': 'Reverse Pickup' },
        ];

        // Fetch routes with the given driver name and filter conditions
        const routes = await Route.find({
            'Driver Name': driverName,
            $or: filterConditions
        });

        if (routes.length === 0) {
            return res.status(404).json({ message: 'No customers found for this driver' });
        }

        // Create a map to aggregate products for each customer and order type
        const customerMap = new Map();

        routes.forEach(route => {
            const key = `${route.shipping_address_full_name}-${route.metafield_order_type}`;

            if (!customerMap.has(key)) {
                customerMap.set(key, {
                    _id: route._id,
                    name: route.shipping_address_full_name,
                    order_code: route.FINAL,
                    items: [],
                    address: route.shipping_address_address,
                    total_quantity: 0,
                    phone: route.shipping_address_phone,
                    metafield_order_status: route.metafield_order_type,
                    Alternate_number: route['Alternate phone number'],
                    metafield_delivery_status: route.metafield_delivery_status || '', // Ensure status is included
                });
            }

            // Add the current route's items and other details to the existing customer entry
            const customer = customerMap.get(key);
            
            // Check if Items is defined and is an array before iterating
            if (Array.isArray(route.Items)) {
                customer.items.push(...route.Items); // Aggregate items
            } else {
                console.warn(`Items for route ${route._id} is not an array or is undefined.`);
            }
            
            customer.total_quantity += route.total_item_quantity || 0; // Ensure total_quantity is a number
        });

        // Convert map to array of objects
        const customers = Array.from(customerMap.values());

        res.json({ customers });
    } catch (error) {
        console.error('Error in rtoData:', error.message);
        console.error('Stack trace:', error.stack);
        res.status(500).json({ message: 'Server error', details: error.message });
    }
};



const rtoProductDetailsv1 = async (req, res) => {
    try {
        // Extract query parameters
        const { order_code, metafield_order_type, driverName } = req.query;

        // Check if parameters are missing
        if (!order_code || !driverName) {
            return res.status(400).json({
                message: 'Missing required query parameters: order_code or driverName'
            });
        }

        // Construct the query object, making metafield_order_type optional
        const query = { FINAL: order_code, 'Driver Name': driverName };
        if (metafield_order_type) {
            query.metafield_order_type = metafield_order_type;
        }

        // Fetch all route details based on the query parameters with only required fields
        const routeDetailsList = await Route.find(query, 'line_item_sku line_item_name total_item_quantity Delivery_Status Pickup_Status metafield_order_type').lean();

        if (!routeDetailsList || routeDetailsList.length === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Collect all SKUs for batch fetching
        const skus = routeDetailsList.map(routeDetails => routeDetails.line_item_sku);

        // Fetch all product photos in one query
        const productDetailsMap = await Photo.find({ sku: { $in: skus } }, 'sku image_url').lean().then(photos =>
            photos.reduce((map, photo) => {
                map[photo.sku] = photo.image_url || null;
                return map;
            }, {})
        );

        // Combine route details with product photos
        const productDetailsList = routeDetailsList.map(routeDetails => ({
            line_item_sku: routeDetails.line_item_sku,
            line_item_name: routeDetails.line_item_name,
            image1: productDetailsMap[routeDetails.line_item_sku] || null,
            total_item_quantity: routeDetails.total_item_quantity,
            delivery_status: routeDetails.Delivery_Status,
            Pickup_Status: routeDetails.Pickup_Status,
            metafield_order_type: routeDetails.metafield_order_type,
        }));

        // Send response with all product details
        res.json(productDetailsList);
    } catch (error) {
        console.error('Error fetching product details:', error);
        res.status(500).json({ message: 'Server error' });
    }
};


const rtoProductDetails = async (req, res) => {
    try {
        // Extract query parameters
        const { order_code, metafield_order_type } = req.query;

        // Check if parameters are missing
        if (!order_code || !metafield_order_type) {
            return res.status(400).json({ message: 'Missing required query parameters' });
        }

        // Fetch all route details based on query parameters
        const routeDetailsList = await Route.find({
            FINAL: order_code,
            metafield_order_type: metafield_order_type
        });

        if (!routeDetailsList || routeDetailsList.length === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Initialize an array to hold all product details
        const productDetailsList = [];

        // Fetch product details for each route entry
        for (const routeDetails of routeDetailsList) {
            const productDetails = await Photo.findOne({ sku: routeDetails.line_item_sku });

            if (productDetails) {
                // Add the relevant details to the response list
                productDetailsList.push({
                    line_item_sku: routeDetails.line_item_sku,
                    line_item_name: routeDetails.line_item_name,
                    image1: productDetails.image_url || null,
                    total_item_quantity: routeDetails.total_item_quantity,
                    delivery_status: routeDetails.Delivery_Status
                });
            } else {
                // If product not found, you can choose to skip it or return an error message
                productDetailsList.push({
                    line_item_sku: routeDetails.line_item_sku,
                    line_item_name: routeDetails.line_item_name,
                    image1: null,
                    total_item_quantity: routeDetails.total_item_quantity,
                    delivery_status: routeDetails.Delivery_Status,
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

const updateRTOStatus = async (req, res) => {
    const { customerName, orderType } = req.params;
    const { deliveryStatus, driverName } = req.body;

    // Set driverName to username if driverName is not passed separately
    const username = driverName;

    // Validate if deliveryStatus is present
    if (!deliveryStatus) {
        return res.status(400).send('Delivery status is required');
    }

    try {
        // Check if there are open locks for the specific driver
        const lockedStatuses = await Route.find({ 
            Lock_Status: "Open", 
            "Driver Name": driverName // Filter by driverName
        });

        if (lockedStatuses.length > 0) {
            return res.status(401).send('Please submit pickup before proceeding');
        }

        // Update RTO status for the customer and order type
        const result = await Route.updateMany(
            {
                shipping_address_full_name: customerName,
                metafield_order_type: orderType
            },
            { $set: { metafield_delivery_status: deliveryStatus } }
        );

        // If no records were updated, return a 404 response
        if (result.matchedCount === 0) {
            return res.status(404).send('No records found to update for the given customer and order type');
        }

        // Track the time of the last RTO status update
        const { istDate: updateTime } = getISTTime(); // Use getISTTime to get IST date

        // Update or create the audit record for this rider's username
        const auditRecord = await Audit.findOne({ username }).sort({ loginTime: -1 });

        if (auditRecord) {
            auditRecord.lastUpdatedStatusTime = updateTime; // Set the last update time
            await auditRecord.save(); // Save the audit record with updated time
        } else {
            return res.status(404).send('No audit record found for this rider');
        }

        res.status(200).send('RTO status updated successfully');
    } catch (error) {
        console.error('Error in updateRTOStatus:', error.message);
        res.status(500).send('Server error');
    }
};



module.exports = {
    rtoData,
    rtoProductDetails,
    rtoProductDetailsv1,
    updateRTOStatus
};