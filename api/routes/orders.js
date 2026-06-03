import express from 'express';
import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// Helper to get unit multiplier
const getMultiplier = (unit) => {
  if (unit === 'kg' || unit === 'L') return 1000;
  return 1;
};

// @desc    Place a new order/quotation
// @route   POST /api/orders
// @access  Private
router.post('/', protect, async (req, res) => {
  const { items } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ message: 'No order items provided' });
  }

  try {
    // Validation Pass: Verify all items before making any modifications
    const productUpdates = [];
    const orderItems = [];
    let totalAmount = 0;

    for (const item of items) {
      const { productId, orderedQuantity, orderedUnit } = item;

      if (!orderedQuantity || parseFloat(orderedQuantity) <= 0) {
        return res.status(400).json({ message: 'Quantity must be greater than zero' });
      }

      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: `Product not found: ${productId}` });
      }

      // Check unit validity for product's dimension
      const validUnits = {
        WEIGHT: ['g', 'kg'],
        VOLUME: ['mL', 'L'],
        COUNT: ['pcs'],
      };

      if (!validUnits[product.dimension].includes(orderedUnit)) {
        return res.status(400).json({
          message: `Invalid unit "${orderedUnit}" for product "${product.name}"`
        });
      }

      const multiplier = getMultiplier(orderedUnit);
      const qtyInBaseUnitVal = parseFloat(orderedQuantity) * multiplier;
      const currentStockVal = parseFloat(product.stockInBaseUnit.toString());

      if (currentStockVal < qtyInBaseUnitVal) {
        return res.status(400).json({
          message: `Insufficient stock for "${product.name}". Available: ${
            currentStockVal / multiplier
          } ${orderedUnit}, Requested: ${orderedQuantity} ${orderedUnit}`
        });
      }

      const pricePerBaseUnitVal = parseFloat(product.pricePerBaseUnit.toString());
      const itemTotalPriceVal = qtyInBaseUnitVal * pricePerBaseUnitVal;
      totalAmount += itemTotalPriceVal;

      productUpdates.push({
        product,
        newStock: currentStockVal - qtyInBaseUnitVal
      });

      orderItems.push({
        product: product._id,
        productName: product.name,
        sku: product.sku,
        dimension: product.dimension,
        orderedQuantity: mongoose.Types.Decimal128.fromString(orderedQuantity.toString()),
        orderedUnit,
        quantityInBaseUnit: mongoose.Types.Decimal128.fromString(qtyInBaseUnitVal.toString()),
        pricePerBaseUnit: product.pricePerBaseUnit,
        totalPrice: mongoose.Types.Decimal128.fromString(itemTotalPriceVal.toFixed(4)),
      });
    }

    // Execution Pass: Save all inventory updates
    for (const update of productUpdates) {
      update.product.stockInBaseUnit = mongoose.Types.Decimal128.fromString(update.newStock.toString());
      await update.product.save();
    }

    const order = new Order({
      user: req.user._id,
      items: orderItems,
      totalAmount: mongoose.Types.Decimal128.fromString(totalAmount.toFixed(4)),
      status: 'pending',
    });

    const createdOrder = await order.save();
    return res.status(201).json(createdOrder);
  } catch (error) {
    console.error('Create order error:', error);
    return res.status(500).json({ message: 'Server error during order creation' });
  }
});

// @desc    Get orders (Admin sees all, User sees their own)
// @route   GET /api/orders
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let orders;
    if (req.user.role === 'admin') {
      orders = await Order.find({})
        .populate('user', 'name email')
        .sort({ createdAt: -1 });
    } else {
      orders = await Order.find({ user: req.user._id })
        .sort({ createdAt: -1 });
    }
    return res.json(orders);
  } catch (error) {
    console.error('Fetch orders error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Update order status (with stock restoration logic if rejected)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
router.put('/:id/status', protect, admin, async (req, res) => {
  const { status } = req.body;

  if (!['pending', 'approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const oldStatus = order.status;
    if (oldStatus === status) {
      return res.json(order);
    }

    // Transition Validation and Execution
    // 1. From non-rejected to rejected -> Restore inventory
    if (status === 'rejected' && oldStatus !== 'rejected') {
      for (const item of order.items) {
        const product = await Product.findById(item.product);
        if (product) {
          const currentStock = parseFloat(product.stockInBaseUnit.toString());
          const restoreQty = parseFloat(item.quantityInBaseUnit.toString());
          product.stockInBaseUnit = mongoose.Types.Decimal128.fromString(
            (currentStock + restoreQty).toString()
          );
          await product.save();
        }
      }
    }
    // 2. From rejected to pending/approved -> Rededuct inventory
    else if (oldStatus === 'rejected' && status !== 'rejected') {
      // Validation first
      const productUpdates = [];
      for (const item of order.items) {
        const product = await Product.findById(item.product);
        if (!product) {
          return res.status(400).json({
            message: `Cannot change status. Product for SKU ${item.sku} no longer exists.`
          });
        }
        const currentStock = parseFloat(product.stockInBaseUnit.toString());
        const deductQty = parseFloat(item.quantityInBaseUnit.toString());

        if (currentStock < deductQty) {
          return res.status(400).json({
            message: `Cannot change status. Insufficient stock for product "${product.name}".`
          });
        }
        productUpdates.push({ product, newStock: currentStock - deductQty });
      }

      // Execute deduction
      for (const update of productUpdates) {
        update.product.stockInBaseUnit = mongoose.Types.Decimal128.fromString(
          update.newStock.toString()
        );
        await update.product.save();
      }
    }

    order.status = status;
    const updatedOrder = await order.save();
    return res.json(updatedOrder);
  } catch (error) {
    console.error('Update order status error:', error);
    return res.status(500).json({ message: 'Server error updating status' });
  }
});

export default router;
