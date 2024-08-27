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
  
     
      res.json({ sellers: sellersWithCounts, lockStatus });
    } catch (error) {
      console.error(`Error fetching pickup seller names and counts for ${driverName}:`, error);
      res.status(500).json({ message: 'Internal server error' });
    }
}

const pickedSellers = async (req, res) => {
    const { driverName } = req.params;
    
  
    try {
        // Log before trying to find the driver
        
        
        // Find the lock status for the given driver
        const driverData = await Route.findOne({ 'Driver Name': driverName }, 'Lock_Status');
        if (!driverData) {
           
        }

        const lockStatus = driverData ? driverData.Lock_Status : 'open'; // Default to 'open' if not found
  
        // Log before fetching sellers
        
        
        // Find all distinct sellers with products marked as "Picked"
        const sellers = await Route.find({
            'Driver Name': driverName,
            Pickup_Status: 'Picked',  // Filter for Pickup_Status "Picked"
            $or: [
                { metafield_order_type: { $in: ['Replacement'] } },
                { metafield_order_type: { $eq: null } },
                { metafield_order_type: { $eq: '' } }     // Add condition for empty string
            ]
        }).distinct('seller_name');

        if (sellers.length === 0) {
           
        }
        
        // Calculate the total product count for each seller where Pickup_Status is "Picked"
        const sellersWithCounts = await Promise.all(sellers.map(async (sellerName) => {
            const productCount = await Route.aggregate([
                { 
                    $match: { 
                        'Driver Name': driverName, 
                        seller_name: sellerName, 
                        Pickup_Status: 'Picked',  // Ensure only "Picked" products are counted
                        $or: [
                            { metafield_order_type: { $in: ['Replacement'] } },
                            { metafield_order_type: { $eq: null } },
                            { metafield_order_type: { $eq: '' } }
                        ]
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

        // console.log('Pickup sellers with counts:', sellersWithCounts);
        res.json({ sellers: sellersWithCounts, lockStatus });
    } catch (error) {
        console.error(`Error fetching pickup seller names and counts for ${driverName}:`, error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


const NotPickedSellers = async (req, res) => {
    const { driverName } = req.params;
    //console.log(`Fetching pickup sellers for driver: ${driverName}`);
  
    try {
      // Find the lock status for the given driver
      const driverData = await Route.findOne({ 'Driver Name': driverName }, 'Lock_Status');
      const lockStatus = driverData ? driverData.Lock_Status : 'open'; // Default to 'open' if not found
  
      // Find all distinct sellers with products marked as "Picked"
      const sellers = await Route.find({
        'Driver Name': driverName,
        Pickup_Status: 'Not Picked',  // Filter for Pickup_Status "Picked"
        $or: [
          { metafield_order_type: { $in: ['Replacement'] } },
          { metafield_order_type: { $eq: null } },
          { metafield_order_type: { $eq: '' } }     // Add condition for empty string
        ]
      }).distinct('seller_name');
  
      // Calculate the total product count for each seller where Pickup_Status is "Picked"
      const sellersWithCounts = await Promise.all(sellers.map(async (sellerName) => {
        const productCount = await Route.aggregate([
          { 
            $match: { 
              'Driver Name': driverName, 
              seller_name: sellerName, 
              Pickup_Status: 'Not Picked',  // Ensure only "Picked" products are counted
              $or: [
                { metafield_order_type: { $in: ['Replacement'] } },
                { metafield_order_type: { $eq: null } },
                { metafield_order_type: { $eq: '' } }
              ]
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
  
    //  console.log('Pickup sellers with counts:', sellersWithCounts);
      res.json({ sellers: sellersWithCounts, lockStatus });
    } catch (error) {
      console.error(`Error fetching pickup seller names and counts for ${driverName}:`, error);
      res.status(500).json({ message: 'Internal server error' });
    }
}

const NotDeliveredSellers = async (req, res) => {
    const { driverName } = req.params;

    try {
        // Find distinct sellers with the correct filters
        const sellers = await Route.find({
            'Driver Name': driverName,
            $or: [
                // Special case for 'Delivery Failed'
                {
                    metafield_order_type: 'Delivery Failed',
                    'Delivery_Status': 'Not Delivered'
                },
                // Existing logic for 'Replacement' and 'Reverse Pickup'
                {
                    metafield_order_type: { $in: ['Replacement', 'Reverse Pickup'] },
                    metafield_delivery_status: { $in: ['Replacement Pickup Successful', 'Reverse Pickup Successful'] },
                    'Delivery_Status': 'Not Delivered'
                }
            ]
        }).distinct('seller_name');

        // Get counts of products for each seller
        const sellersWithCounts = await Promise.all(sellers.map(async (sellerName) => {
            const productCount = await Route.aggregate([
                {
                    $match: {
                        'Driver Name': driverName,
                        seller_name: sellerName,
                        $or: [
                            // Special case for 'Delivery Failed'
                            {
                                metafield_order_type: 'Delivery Failed',
                                'Delivery_Status': 'Not Delivered'
                            },
                            // Existing logic for 'Replacement' and 'Reverse Pickup'
                            {
                                metafield_order_type: { $in: ['Replacement', 'Reverse Pickup'] },
                                metafield_delivery_status: { $in: ['Replacement Pickup Successful', 'Reverse Pickup Successful'] },
                                'Delivery_Status': 'Not Delivered'
                            }
                        ]
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

        res.json(sellersWithCounts);
    } catch (error) {
        console.error(`Error fetching reverse pickup seller names and counts for ${driverName}:`, error);
        res.status(500).json({ message: 'Internal server error' });
    }
};



const deliveredSellers = async (req, res) => {
    const { driverName } = req.params;

    try {
        // Find distinct sellers with the correct filters
        const sellers = await Route.find({
            'Driver Name': driverName,
            $or: [
                // Special case for 'Delivery Failed'
                {
                    metafield_order_type: 'Delivery Failed',
                    'Delivery_Status': 'Delivered'
                },
                // Existing logic for 'Replacement' and 'Reverse Pickup'
                {
                    metafield_order_type: { $in: ['Replacement', 'Reverse Pickup'] },
                    metafield_delivery_status: { $in: ['Replacement Pickup Successful', 'Reverse Pickup Successful'] },
                    'Delivery_Status': 'Delivered'
                }
            ]
        }).distinct('seller_name');

        // Get counts of products for each seller
        const sellersWithCounts = await Promise.all(sellers.map(async (sellerName) => {
            const productCount = await Route.aggregate([
                {
                    $match: {
                        'Driver Name': driverName,
                        seller_name: sellerName,
                        $or: [
                            // Special case for 'Delivery Failed'
                            {
                                metafield_order_type: 'Delivery Failed',
                                'Delivery_Status': 'Delivered'
                            },
                            // Existing logic for 'Replacement' and 'Reverse Pickup'
                            {
                                metafield_order_type: { $in: ['Replacement', 'Reverse Pickup'] },
                                metafield_delivery_status: { $in: ['Replacement Pickup Successful', 'Reverse Pickup Successful'] },
                                'Delivery_Status': 'Delivered'
                            }
                        ]
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

        res.json(sellersWithCounts);
    } catch (error) {
        console.error(`Error fetching reverse pickup seller names and counts for ${driverName}:`, error);
        res.status(500).json({ message: 'Internal server error' });
    }
};



const pickupLockScreen = async (req, res) => {
    const { driverName } = req.params;
   // console.log(`Locking pickup screen for driver: ${driverName}`);
  
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
   // console.log(`Fetching reverse pickup sellers for driver: ${driverName}`);

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

       // console.log('Reverse pickup sellers with counts:', sellersWithCounts);
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
        // Update the query to include Pickup_Status: 'Picked'
        let query = {
            seller_name: { $regex: new RegExp(`^${seller_name}$`, 'i') },  // Case-insensitive regex for exact match
            "Driver Name": { $regex: new RegExp(`^${rider_code}$`, 'i') },  // Case-insensitive regex for exact match
            Pickup_Status: 'Picked',  // Add condition for Pickup_Status being 'Picked'
            $or: [
                { metafield_order_type: 'Replacement' },
                { metafield_order_type: { $eq: null } },  // Match null metafield_order_type
                { metafield_order_type: { $eq: '' } }  // Match empty string metafield_order_type
            ]
        }

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

const pickedProducts = async (req, res) => {
    const { seller_name, rider_code } = req.query;

    try {
        // Update the query to include Pickup_Status: 'Picked'
        let query = {
            seller_name: { $regex: new RegExp(`^${seller_name}$`, 'i') },  // Case-insensitive regex for exact match
            "Driver Name": { $regex: new RegExp(`^${rider_code}$`, 'i') },  // Case-insensitive regex for exact match
            Pickup_Status: 'Not Picked',  // Add condition for Pickup_Status being 'Picked'
            $or: [
                { metafield_order_type: 'Replacement' },
                { metafield_order_type: { $eq: null } },  // Match null metafield_order_type
                { metafield_order_type: { $eq: '' } }  // Match empty string metafield_order_type
            ]
        }

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
            "Pickup Status": data.Pickup_Status // Ensure Pickup_Status is included in the product data
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

const NotPickedProducts = async (req, res) => {
    const { seller_name, rider_code } = req.query;

    try {
        // Update the query to include Pickup_Status: 'Picked'
        let query = {
            seller_name: { $regex: new RegExp(`^${seller_name}$`, 'i') },
            "Driver Name": { $regex: new RegExp(`^${rider_code}$`, 'i') },
            Pickup_Status: 'Not Picked',  // Add condition for Pickup_Status being 'Not Picked'
            $or: [
                { metafield_order_type: 'Replacement' },
                { metafield_order_type: { $eq: null } },
                { metafield_order_type: { $eq: '' } }
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
            "Pickup Status": data.Pickup_Status // Ensure Pickup_Status is included in the product data
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
                {metafield_delivery_status: { $in: ['Replacement Pickup Successful', 'Reverse Pickup Successful'] }}
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

const reverseDeliveredProducts = async (req, res) => {
    const { seller_name, rider_code } = req.query;

    try {
        let query = {
            seller_name: { $regex: new RegExp(`^${seller_name}$`, 'i') },
            "Driver Name": { $regex: new RegExp(`^${rider_code}$`, 'i') },
            Delivery_Status: 'Delivered', // Additional filter for 'Not Delivered' status
            metafield_delivery_status: { 
                $in: ['Replacement Pickup Successful', 'Reverse Pickup Successful'] 
            }, // This condition must always be true
            $or: [
                { metafield_order_type: 'Reverse Pickup' },
                { metafield_order_type: 'Replacement' },
                { metafield_order_type: 'Delivery Failed' }
            ]
        };

        const filteredData = await Route.find(query).select('FINAL line_item_sku line_item_name total_item_quantity Pickup_Status Delivery_Status').lean();

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
};

const reverseNotDeliveredProducts = async (req, res) => {
    const { seller_name, rider_code } = req.query;

    try {
        let query = {
            seller_name: { $regex: new RegExp(`^${seller_name}$`, 'i') },
            "Driver Name": { $regex: new RegExp(`^${rider_code}$`, 'i') },
            Delivery_Status: 'Not Delivered', // Additional filter for 'Not Delivered' status
            metafield_delivery_status: { 
                $in: ['Replacement Pickup Successful', 'Reverse Pickup Successful'] 
            }, // This condition must always be true
            $or: [
                { metafield_order_type: 'Reverse Pickup' },
                { metafield_order_type: 'Replacement' },
                { metafield_order_type: 'Delivery Failed' }
            ]
        };

        const filteredData = await Route.find(query).select('FINAL line_item_sku line_item_name total_item_quantity Pickup_Status Delivery_Status').lean();

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
};


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

const updateReturnsDeliveryStatus = async (req, res) => {
    const { sku, orderCode, status } = req.body;

    try {
        if (!sku || !orderCode) {
            return res.status(400).json({ message: 'SKU and Order Code are required' });
        }

        const result = await Route.updateOne(
            { line_item_sku: sku, FINAL: orderCode },
            { $set: { Delivery_Status: status } }
        );

        if (result.nModified === 0) {
            return res.status(404).json({ message: 'No matching document found to update' });
        }

        res.status(200).json({ message: 'Delivery status updated successfully' });
    } catch (error) {
        console.error('Error updating delivery status:', error);
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

const updateReturnsDeliveryStatusBulk = async (req, res) => {
    const { sellerName, driverName, finalCode, status } = req.body;

    try {
        const result = await Route.updateMany(
            { seller_name: sellerName, "Driver Name": driverName, FINAL: finalCode },
            { $set: { Delivery_Status: status } }
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
    pickedSellers,
    NotPickedSellers,
    NotDeliveredSellers,
    deliveredSellers,
    // products,
    pickupProducts,
    reversePickupProducts,
    NotPickedProducts,
    reverseDeliveredProducts,
    reverseNotDeliveredProducts,
    pickedProducts,
    updatePickupStatus,
    updateReturnsDeliveryStatus,
    updatePickupStatusBulk,
    updateReturnsDeliveryStatusBulk
};