const Route = require('../models/route');
const Photo = require('../models/photo');
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
            //{ 'metafield_order_type': 'Replacement' }
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
        const customers = Array.from(customerMap.entries()).map(([name, { _id, order_code, items, address, total_quantity, phone, metafield_delivery_status }]) => ({
            _id,
            name,         // This will be the name of the customer
            order_code,
            items,
            address,
            total_quantity,
            phone,
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
        const { order_code, /* metafield_order_type */ } = req.query;
        // console.log('Received query parameters:', req.query);

        // Log parameters for debugging
        //console.log('Received query parameters:', req.query);

        // Check if parameters are missing
        if (!order_code /*|| !metafield_order_type*/) {
            //console.log('Missing query parameters');
            return res.status(400).json({ message: 'Missing required query parameters' });
        }

        // Fetch route details based on query parameters
        const routeDetails = await Route.find({
            FINAL: order_code,
            // metafield_order_type: metafield_order_type
        });

        //console.log('Route details:', routeDetails);

        if (!routeDetails || routeDetails.length === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Fetch product details based on SKU from routeDetails
        const productDetailsArray = await Promise.all(routeDetails.map(async (routeDetail) => {
            const productDetails = await Photo.findOne({ sku: routeDetail.line_item_sku });

            //console.log('Product details:', productDetails);

            if (!productDetails) {
                return res.status(404).json({ message: 'Product not found' });
            }

            return {
                line_item_sku: routeDetail.line_item_sku,
                line_item_name: routeDetail.line_item_name,
                image1: productDetails.image_url || null,
                total_item_quantity: routeDetail.total_item_quantity,
                pickup_status: routeDetail.Pickup_Status
            };
        }));

        res.json(productDetailsArray);
    } catch (error) {
        console.error('Error fetching product details:', error);
        res.status(500).json({ message: 'Server error' });
    }
}


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

const updateDeliveryStatus = async (req, res) => {
    const { customerName } = req.params;
    const { deliveryStatus } = req.body;

    try {
        const lockedStatuses = await Route.find({ Lock_Status: "Open" });

        console.log(lockedStatuses);

        if (lockedStatuses.length > 0) {
            return res.status(401).send('Cannot update delivery status while there are open locks');
        }

        const result = await Route.updateMany(
            {
                metafield_order_type: { $in: [null] },
                shipping_address_full_name: customerName
            },
            { $set: { metafield_delivery_status: deliveryStatus } }
        );
        
        console.log('Update Result:', result);        

        if (result.matchedCount === 0) {
            return res.status(404).send('No records found to update');
        }

        res.status(200).send('Delivery status updated successfully');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
}

module.exports = {
    customers,
    updateDeliveryStatus,
    deliveryProductDetails,
}