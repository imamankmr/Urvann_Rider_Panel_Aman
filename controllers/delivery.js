const Route = require('../models/route');

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

        // Define the filter conditions for orders
        const filterConditions = {
            'Driver Name': driverName,
            $or: [
                { 'metafield_order_type': { $exists: false } }, // Orders where metafield_order_type doesn't exist (normal orders)
                { 'metafield_order_type': '' },                // Orders where metafield_order_type is an empty string (normal orders)
                { 'metafield_order_type': 'Replacement' }       // Replacement orders
            ]
        };

        const routes = await Route.find(filterConditions);

        if (routes.length === 0) {
            return res.status(404).json({ message: 'No customers found for this driver' });
        }

        // Create a map to aggregate item quantities and statuses by customer
        const customerMap = new Map();

        routes.forEach(route => {
            const customerName = route.shipping_address_full_name;

            if (!customerMap.has(customerName)) {
                customerMap.set(customerName, {
                    _id: route._id, // Include _id
                    order_code: route.FINAL,
                    items: route.Items,
                    address: route.shipping_address_address,
                    total_quantity: route.total_item_quantity, // Initialize with current quantity
                    phone: route.shipping_address_phone,
                    metafield_delivery_status: route.metafield_delivery_status || '', // Initialize status
                    replacement_orders: route.metafield_order_type === 'Replacement' ? route.total_item_quantity : 0 // Handle replacement quantity
                });
            } else {
                // Aggregate quantity for the existing customer
                const existing = customerMap.get(customerName);
                existing.total_quantity += route.total_item_quantity;

                // Add replacement order quantity if this is a replacement
                if (route.metafield_order_type === 'Replacement') {
                    existing.replacement_orders += route.total_item_quantity;
                }

                customerMap.set(customerName, existing);
            }
        });

        // Convert map to array of objects
        const customers = Array.from(customerMap.entries()).map(([name, { _id, order_code, items, address, total_quantity, phone, metafield_delivery_status, replacement_orders }]) => ({
            _id,
            name, // This will be the name of the customer
            order_code,
            items,
            address,
            total_quantity,
            phone,
            metafield_delivery_status, // Include status in response
            replacement_orders // Include aggregated replacement order quantity
        }));

        res.json({ customers }); // Return the customers with aggregated quantity and status
    } catch (error) {
        console.error(error);
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
    updateDeliveryStatus
}