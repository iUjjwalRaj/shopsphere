import Order from '../models/Order.js';
import Product from '../models/Product.js';
import asyncHandler from '../utils/asyncHandler.js';

// GET /api/admin/stats
export const getAdminStats = asyncHandler(async (req, res) => {
  // Total revenue from delivered orders
  const revenueAgg = await Order.aggregate([
    { $match: { status: 'delivered' } },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } },
  ]);
  const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].total : 0;

  // Orders placed today
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const ordersToday = await Order.countDocuments({
    createdAt: { $gte: startOfToday },
  });

  // Pending orders count
  const pendingOrders = await Order.countDocuments({ status: 'pending' });

  // Low-stock products (stock < 5)
  const lowStockProducts = await Product.countDocuments({ stock: { $lt: 5 } });

  res.json({
    totalRevenue,
    ordersToday,
    pendingOrders,
    lowStockProducts,
  });
});
