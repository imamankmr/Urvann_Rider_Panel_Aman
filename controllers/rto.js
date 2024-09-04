const { routeConnection } = require('../middlewares/connectToDB');
const Photo = require('../models/photo');
const Route = require('../models/route');
const RouteSchema = require('../models/route');  // Import the route schema


const rtoData = async (req, res) => {
    try {
        const { driverName } = req.params;
        const collections = await routeConnection.db.listCollections().toArray();
        let matchingCollectionName;

        // Check each collection for the seller's name
        for (const collection of collections) {
        const currentCollection = routeConnection.collection(collection.name);
        const foundSeller = await currentCollection.findOne({ 'Driver Name': { $regex: new RegExp(`^${driverName}$`, 'i') } });
        if (foundSeller) {
            matchingCollectionName = collection.name;
            break;
        }
        }

        if (!matchingCollectionName) {
        return res.status(404).json({ message: 'Seller not found in any collection' });
        }

        // Dynamically set the collection for the Route model
        const Route = routeConnection.model('Route', require('../models/route').schema, matchingCollectionName);
        // Define the filter conditions for Delivery_Status
        const filterConditions = [
            { 'metafield_order_type': 'Replacement' },
            { 'metafield_order_type': 'Reverse Pickup' },
            //{ 'metafield_order_type': 'Delivery Failed' },
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



const rtoProductDetails = async (req, res) => {
    try {
        const { driverName } = req.params;
        const collections = await routeConnection.db.listCollections().toArray();
        let matchingCollectionName;

        // Check each collection for the seller's name
        for (const collection of collections) {
        const currentCollection = routeConnection.collection(collection.name);
        const foundSeller = await currentCollection.findOne({ 'Driver Name': { $regex: new RegExp(`^${driverName}$`, 'i') } });
        if (foundSeller) {
            matchingCollectionName = collection.name;
            break;
        }
        }

        if (!matchingCollectionName) {
        return res.status(404).json({ message: 'Seller not found in any collection' });
        }

        // Dynamically set the collection for the Route model
        const Route = routeConnection.model('Route', require('../models/route').schema, matchingCollectionName);
        // Extract query parameters
        const { order_code, metafield_order_type } = req.query;

        // Log parameters for debugging
        //console.log('Received query parameters:', req.query);

        // Check if parameters are missing
        if (!order_code || !metafield_order_type) {
            //console.log('Missing query parameters');
            return res.status(400).json({ message: 'Missing required query parameters' });
        }

        // Fetch route details based on query parameters
        const routeDetails = await Route.find({
            FINAL: order_code,
            metafield_order_type: metafield_order_type
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

            // Add product details to the array
            return {
                line_item_sku: routeDetail.line_item_sku,
                line_item_name: routeDetail.line_item_name,
                image1: productDetails.image_url || null,
                total_item_quantity: routeDetail.total_item_quantity
            };
        }));

        res.json(productDetailsArray);
    } catch (error) {
        console.error('Error fetching product details:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

const updateRTOStatus = async (req, res) => {
    const { customerName, orderType } = req.params; // Use parameters directly
    const { deliveryStatus, driverName } = req.body;

    console.log("Received parameters:", { customerName, orderType, deliveryStatus });

    if (!deliveryStatus) {
        console.warn('Delivery status is undefined or null');
        return res.status(400).send('Delivery status is required');
    }

    try {
        const { driverName } = req.params;
        const collections = await routeConnection.db.listCollections().toArray();
        let matchingCollectionName;

        // Check each collection for the seller's name
        for (const collection of collections) {
        const currentCollection = routeConnection.collection(collection.name);
        const foundSeller = await currentCollection.findOne({ 'Driver Name': { $regex: new RegExp(`^${driverName}$`, 'i') } });
        if (foundSeller) {
            matchingCollectionName = collection.name;
            break;
        }
        }

        if (!matchingCollectionName) {
        return res.status(404).json({ message: 'Seller not found in any collection' });
        }

        // Dynamically set the collection for the Route model
        const Route = routeConnection.model('Route', require('../models/route').schema, matchingCollectionName);
        // Check if there are open locks
        const lockedStatuses = await Route.find({ Lock_Status: "Open" });

        if (lockedStatuses.length > 0) {
            return res.status(401).send('Cannot update delivery status while there are open locks');
        }

        // Update RTO status
        const result = await Route.updateMany(
            {
                shipping_address_full_name: customerName,
                metafield_order_type: orderType
            },
            { $set: { metafield_delivery_status: deliveryStatus } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).send('No records found to update for the given customer and order type');
        }

        res.status(200).send('RTO status updated successfully');
    } catch (error) {
        console.error('Error in updateRTOStatus:', error.message);
        console.error('Stack trace:', error.stack);
        res.status(500).send('Server error');
    }
};

module.exports = {
    rtoData,
    rtoProductDetails,
    updateRTOStatus
};