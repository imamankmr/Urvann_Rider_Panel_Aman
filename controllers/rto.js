const Route = require('../models/route');
const Photo = require('../models/photo');

const rtoData = async (req, res) => {
    try {
        const { driverName } = req.params;

        // Define the filter conditions for Delivery_Status
        const filterConditions = [
            { 'metafield_order_type': 'Replacement' },
            { 'metafield_order_type': 'Reverse Pickup' },
            { 'metafield_order_type': 'Delivery Failed' },
        ];

        // Fetch routes with the given driver name and filter conditions
        const routes = await Route.find({
            'Driver Name': driverName,
            $or: filterConditions
        });

        if (routes.length === 0) {
            return res.status(404).json({ message: 'No customers found for this driver' });
        }

        // Create a map to ensure unique customers
        const customerMap = new Map();

        routes.forEach(route => {
            if (!customerMap.has(route.shipping_address_full_name)) {
                customerMap.set(route.shipping_address_full_name, {
                    _id: route._id,
                    order_code: route.FINAL,
                    items: route.Items,
                    address: route.shipping_address_address,
                    total_quantity: route.total_item_quantity, // Corrected field name
                    phone: route.shipping_address_phone,
                    metafield_order_status: route.metafield_order_type, // Include metafield_order_status
                });
            }
        });

        // Convert map to array of objects
        const customers = Array.from(customerMap.entries()).map(([name, { _id, order_code, items, address, total_quantity, phone, metafield_order_status }]) => ({
            _id,
            name,         // This will be the name of the customer
            order_code,
            items,
            address,
            total_quantity,
            phone,
            metafield_order_status, // Include in the final customer object
        }));

        res.json({ customers });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
}

const rtoProductDetails = async (req, res) => {
    try {
        // Extract query parameters
        const { order_code, metafield_order_type } = req.query;

        // Log parameters for debugging
        console.log('Received query parameters:', req.query);

        // Check if parameters are missing
        if (!order_code || !metafield_order_type) {
            console.log('Missing query parameters');
            return res.status(400).json({ message: 'Missing required query parameters' });
        }

        // Fetch route details based on query parameters
        const routeDetails = await Route.findOne({
            FINAL: order_code,
            metafield_order_type: metafield_order_type
        });

        console.log('Route details:', routeDetails);

        if (!routeDetails) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Fetch product details based on SKU from routeDetails
        const productDetails = await Photo.findOne({ sku: routeDetails.line_item_sku });

        console.log('Product details:', productDetails);

        if (!productDetails) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Send response with product details
        const response = {
            line_item_sku: routeDetails.line_item_sku,
            line_item_name: routeDetails.line_item_name,
            image1: productDetails.image_url || null,
            total_item_quantity: routeDetails.total_item_quantity
        };

        res.json(response);
    } catch (error) {
        console.error('Error fetching product details:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

const updateRTOStatus = async (req, res) => {
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
                shipping_address_full_name: customerName,
                metafield_delivery_status: { $in: ['Reverse Pickup', 'Replacement'] }
            },
            { $set: { metafield_delivery_status: deliveryStatus } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).send('No records found to update');
        }

        res.status(200).send('RTO status updated successfully');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
}

module.exports = {
    rtoData,
    rtoProductDetails,
    updateRTOStatus
};