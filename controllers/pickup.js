const Route = require('../models/route');
const Photo = require('../models/photo');

// const sellers = async (req, res) => {
//     const { driverName } = req.params;
//     console.log(`Fetching sellers for driver: ${driverName}`);

//     try {
//         const sellers = await Route.find({ 'Driver Name': driverName }).distinct('seller_name');

//         const sellersWithCounts = await Promise.all(sellers.map(async (sellerName) => {
//             const productCount = await Route.aggregate([
//                 { $match: { 'Driver Name': driverName, seller_name: sellerName } },
//                 { $group: { _id: null, totalQuantity: { $sum: '$total_item_quantity' } } }
//             ]);
//             return {
//                 sellerName,
//                 productCount: productCount[0] ? productCount[0].totalQuantity : 0
//             };
//         }));

//         console.log('Sellers with counts:', sellersWithCounts);
//         res.json(sellersWithCounts);
//     } catch (error) {
//         console.error(`Error fetching seller names and counts for ${driverName}:`, error);
//         res.status(500).json({ message: 'Internal server error' });
//     }
// }

const pickupSellers = async (req, res) => {
    const { driverName } = req.params;
    console.log(`Fetching pickup sellers for driver: ${driverName}`);
  
    try {
      // Find the lock status for the given driver
      const driverData = await Route.findOne({ 'Driver Name': driverName }, 'Lock_Status');
      const lockStatus = driverData ? driverData.Lock_Status : 'open'; // Default to 'open' if not found
  
      const sellers = await Route.find({
        'Driver Name': driverName,
        $or: [
          { metafield_order_type: { $in: ['Replacement'] } },
          { metafield_order_type: { $eq: null } },
          { metafield_order_type: { $eq: '' } }     // Add condition for empty string
        ]
      }).distinct('seller_name');
  
      const sellersWithCounts = await Promise.all(sellers.map(async (sellerName) => {
        const productCount = await Route.aggregate([
          { $match: { 
            'Driver Name': driverName, 
            seller_name: sellerName, 
            $or: [
              { metafield_order_type: { $in: ['Replacement'] } },
              { metafield_order_type: { $eq: null } },
              { metafield_order_type: { $eq: '' } }
            ]
          } },
          { $group: { _id: null, totalQuantity: { $sum: '$total_item_quantity' } } }
        ]);
        return {
          sellerName,
          productCount: productCount[0] ? productCount[0].totalQuantity : 0
        };
      }));
  
      console.log('Pickup sellers with counts:', sellersWithCounts);
      res.json({ sellers: sellersWithCounts, lockStatus });
    } catch (error) {
      console.error(`Error fetching pickup seller names and counts for ${driverName}:`, error);
      res.status(500).json({ message: 'Internal server error' });
    }
}

const pickupLockScreen = async (req, res) => {
    const { driverName } = req.params;
    console.log(`Locking pickup screen for driver: ${driverName}`);
  
    try {
      await Route.updateMany(
        { 'Driver Name': driverName },
        { $set: { Lock_Status: 'close' } }
      );
      res.json({ message: 'Pickup screen locked successfully' });
    } catch (error) {
      console.error(`Error locking pickup screen for ${driverName}:`, error);
      res.status(500).json({ message: 'Internal server error' });
    }
};


const reversePickupSellers = async (req, res) => {
    const { driverName } = req.params;
    console.log(`Fetching reverse pickup sellers for driver: ${driverName}`);

    try {
        const sellers = await Route.find({
            'Driver Name': driverName,
            metafield_order_type: { $in: ['Delivery Failed', 'Replacement', 'Reverse Pickup'] },
            metafield_delivery_status: { $in: ['Replacement Pickup Successful', 'Reverse Pickup Successful'] }
        }).distinct('seller_name');

        const sellersWithCounts = await Promise.all(sellers.map(async (sellerName) => {
            const productCount = await Route.aggregate([
                {
                    $match: {
                        'Driver Name': driverName,
                        seller_name: sellerName,
                        metafield_order_type: { $in: ['Delivery Failed', 'Replacement', 'Reverse Pickup'] },
                        metafield_delivery_status: { $in: ['Replacement Pickup Successful', 'Reverse Pickup Successful'] }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalQuantity: { $sum: '$total_item_quantity' }
                    }
                }
            ]);
            return {
                sellerName,
                productCount: productCount[0] ? productCount[0].totalQuantity : 0
            };
        }));

        console.log('Reverse pickup sellers with counts:', sellersWithCounts);
        res.json(sellersWithCounts);
    } catch (error) {
        console.error(`Error fetching reverse pickup seller names and counts for ${driverName}:`, error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// const products = async (req, res) => {
//     const { seller_name, rider_code } = req.query;

//     try {
//         let query = {
//             seller_name: { $regex: new RegExp(`^${seller_name}$`, 'i') },
//             "Driver Name": { $regex: new RegExp(`^${rider_code}$`, 'i') }
//         };

//         const filteredData = await Route.find(query).select('FINAL line_item_sku line_item_name total_item_quantity Pickup_Status').lean();

//         const skuList = filteredData.map(data => data.line_item_sku);
//         const photos = await Photo.find({ sku: { $in: skuList } }).lean();

//         const photoMap = {};
//         photos.forEach(photo => {
//             photoMap[photo.sku] = photo.image_url;
//         });

//         const products = filteredData.map(data => ({
//             FINAL: data.FINAL,
//             line_item_sku: data.line_item_sku,
//             line_item_name: data.line_item_name,
//             image1: photoMap[data.line_item_sku] || null,
//             total_item_quantity: data.total_item_quantity,
//             "Pickup Status": data.Pickup_Status
//         }));

//         const orderCodeQuantities = products.reduce((acc, product) => {
//             acc[product.FINAL] = (acc[product.FINAL] || 0) + product.total_item_quantity;
//             return acc;
//         }, {});

//         res.json({ orderCodeQuantities, products });
//     } catch (error) {
//         console.error('Error fetching products:', error);
//         res.status(500).json({ message: 'Internal server error' });
//     }
// }

const pickupProducts = async (req, res) => {
    const { seller_name, rider_code } = req.query;

    try {
        let query = {
            seller_name: { $regex: new RegExp(`^${seller_name}$`, 'i') },
            "Driver Name": { $regex: new RegExp(`^${rider_code}$`, 'i') },
            $or: [

                { metafield_order_type: 'Replacement' },
                { metafield_order_type: { $eq: null } }, // Adding null condition
                { metafield_order_type: { $eq: '' } }    // Adding empty string condition
            ]
        };

        const filteredData = await Route.find(query).select('FINAL line_item_sku line_item_name total_item_quantity Pickup_Status').lean();

        const skuList = filteredData.map(data => data.line_item_sku);
        const photos = await Photo.find({ sku: { $in: skuList } }).lean();

        const photoMap = {};
        photos.forEach(photo => {
            photoMap[photo.sku] = photo.image_url;
        });

        const products = filteredData.map(data => ({
            FINAL: data.FINAL,
            line_item_sku: data.line_item_sku,
            line_item_name: data.line_item_name,
            image1: photoMap[data.line_item_sku] || null,
            total_item_quantity: data.total_item_quantity,
            "Pickup Status": data.Pickup_Status
        }));

        const orderCodeQuantities = products.reduce((acc, product) => {
            acc[product.FINAL] = (acc[product.FINAL] || 0) + product.total_item_quantity;
            return acc;
        }, {});

        res.json({ orderCodeQuantities, products });
    } catch (error) {
        console.error('Error fetching pickup products:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

const reversePickupProducts = async (req, res) => {
    const { seller_name, rider_code } = req.query;

    try {
        let query = {
            seller_name: { $regex: new RegExp(`^${seller_name}$`, 'i') },
            "Driver Name": { $regex: new RegExp(`^${rider_code}$`, 'i') },
            $or: [
                { metafield_order_type: 'Reverse Pickup' },
                { metafield_order_type: 'Replacement' },
                { metafield_order_type: 'Delivery Failed' },
            ]
        };

        const filteredData = await Route.find(query).select('FINAL line_item_sku line_item_name total_item_quantity Pickup_Status').lean();

        const skuList = filteredData.map(data => data.line_item_sku);
        const photos = await Photo.find({ sku: { $in: skuList } }).lean();

        const photoMap = {};
        photos.forEach(photo => {
            photoMap[photo.sku] = photo.image_url;
        });

        const products = filteredData.map(data => ({
            FINAL: data.FINAL,
            line_item_sku: data.line_item_sku,
            line_item_name: data.line_item_name,
            image1: photoMap[data.line_item_sku] || null,
            total_item_quantity: data.total_item_quantity,
            "Delivery Status": data.Delivery_Status
        }));

        const orderCodeQuantities = products.reduce((acc, product) => {
            acc[product.FINAL] = (acc[product.FINAL] || 0) + product.total_item_quantity;
            return acc;
        }, {});

        res.json({ orderCodeQuantities, products });
    } catch (error) {
        console.error('Error fetching reverse pickup products:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

const updatePickupStatus = async (req, res) => {
    const { sku, orderCode, status } = req.body;

    try {
        if (!sku || !orderCode) {
            return res.status(400).json({ message: 'SKU and Order Code are required' });
        }

        const result = await Route.updateOne(
            { line_item_sku: sku, FINAL: orderCode },
            { $set: { Pickup_Status: status } }
        );

        if (result.nModified === 0) {
            return res.status(404).json({ message: 'No matching document found to update' });
        }

        res.status(200).json({ message: 'Pickup status updated successfully' });
    } catch (error) {
        console.error('Error updating pickup status:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

const updatePickupStatusBulk = async (req, res) => {
    const { sellerName, driverName, finalCode, status } = req.body;

    try {
        const result = await Route.updateMany(
            { seller_name: sellerName, "Driver Name": driverName, FINAL: finalCode },
            { $set: { Pickup_Status: status } }
        );

        if (result.nModified === 0) {
            return res.status(404).json({ message: 'No matching documents found to update' });
        }

        res.status(200).json({ message: 'Pickup status updated in bulk successfully.' });
    } catch (error) {
        console.error('Error updating pickup status in bulk:', error);
        res.status(500).json({ error: 'Failed to update pickup status in bulk.' });
    }
}

module.exports = {
    // sellers,
    pickupSellers,
    reversePickupSellers,
    pickupLockScreen,
    // products,
    pickupProducts,
    reversePickupProducts,
    updatePickupStatus,
    updatePickupStatusBulk
};