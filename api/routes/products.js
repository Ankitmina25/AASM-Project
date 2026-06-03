import express from 'express';
import Product from '../models/Product.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// Helper to convert frontend values to base units
const convertToBaseUnits = (dimension, preferredUnit, price, stock) => {
  let stockInBaseUnit = stock;
  let pricePerBaseUnit = price;
  let baseUnit = 'pcs';

  if (dimension === 'WEIGHT') {
    baseUnit = 'g';
    if (preferredUnit === 'kg') {
      stockInBaseUnit = (parseFloat(stock) * 1000).toString();
      pricePerBaseUnit = (parseFloat(price) / 1000).toString();
    } else {
      stockInBaseUnit = stock.toString();
      pricePerBaseUnit = price.toString();
    }
  } else if (dimension === 'VOLUME') {
    baseUnit = 'mL';
    if (preferredUnit === 'L') {
      stockInBaseUnit = (parseFloat(stock) * 1000).toString();
      pricePerBaseUnit = (parseFloat(price) / 1000).toString();
    } else {
      stockInBaseUnit = stock.toString();
      pricePerBaseUnit = price.toString();
    }
  } else if (dimension === 'COUNT') {
    baseUnit = 'pcs';
    stockInBaseUnit = stock.toString();
    pricePerBaseUnit = price.toString();
  }

  return { stockInBaseUnit, pricePerBaseUnit, baseUnit };
};

// @desc    Get all products (with search/filter)
// @route   GET /api/products
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { search, category } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { casNumber: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    const products = await Product.find(query).sort({ createdAt: -1 });
    return res.json(products);
  } catch (error) {
    console.error('Fetch products error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    return res.json(product);
  } catch (error) {
    console.error('Fetch product error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
router.post('/', protect, admin, async (req, res) => {
  const {
    name,
    sku,
    description,
    category,
    dimension,
    price,  // in preferredUnit
    stock,  // in preferredUnit
    preferredUnit,
    casNumber,
    chemicalFormula,
    purity,
  } = req.body;

  try {
    const productExists = await Product.findOne({ sku });
    if (productExists) {
      return res.status(400).json({ message: 'Product with this SKU already exists' });
    }

    const { stockInBaseUnit, pricePerBaseUnit, baseUnit } = convertToBaseUnits(
      dimension,
      preferredUnit,
      price,
      stock
    );

    const product = await Product.create({
      name,
      sku,
      description,
      category: category || 'General',
      dimension,
      stockInBaseUnit,
      pricePerBaseUnit,
      baseUnit,
      preferredUnit,
      casNumber,
      chemicalFormula,
      purity: purity ? purity.toString() : '99.0',
    });

    return res.status(201).json(product);
  } catch (error) {
    console.error('Create product error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
router.put('/:id', protect, admin, async (req, res) => {
  const {
    name,
    sku,
    description,
    category,
    dimension,
    price,
    stock,
    preferredUnit,
    casNumber,
    chemicalFormula,
    purity,
  } = req.body;

  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Verify SKU uniqueness if changed
    if (sku && sku !== product.sku) {
      const skuExists = await Product.findOne({ sku });
      if (skuExists) {
        return res.status(400).json({ message: 'Product with this SKU already exists' });
      }
    }

    let finalStockInBaseUnit = product.stockInBaseUnit;
    let finalPricePerBaseUnit = product.pricePerBaseUnit;
    let finalBaseUnit = product.baseUnit;

    if (price !== undefined || stock !== undefined || dimension || preferredUnit) {
      const activeDimension = dimension || product.dimension;
      const activePrefUnit = preferredUnit || product.preferredUnit;
      
      // If price was not sent, we get the current price in that preferred unit
      let currentPriceInPref = parseFloat(product.pricePerBaseUnit.toString());
      if (product.preferredUnit === 'kg' || product.preferredUnit === 'L') {
        currentPriceInPref = currentPriceInPref * 1000;
      }
      const activePrice = price !== undefined ? price : currentPriceInPref;

      // Same for stock
      let currentStockInPref = parseFloat(product.stockInBaseUnit.toString());
      if (product.preferredUnit === 'kg' || product.preferredUnit === 'L') {
        currentStockInPref = currentStockInPref / 1000;
      }
      const activeStock = stock !== undefined ? stock : currentStockInPref;

      const converted = convertToBaseUnits(
        activeDimension,
        activePrefUnit,
        activePrice,
        activeStock
      );
      finalStockInBaseUnit = converted.stockInBaseUnit;
      finalPricePerBaseUnit = converted.pricePerBaseUnit;
      finalBaseUnit = converted.baseUnit;
    }

    // Update fields
    product.name = name || product.name;
    product.sku = sku || product.sku;
    product.description = description !== undefined ? description : product.description;
    product.category = category || product.category;
    product.dimension = dimension || product.dimension;
    product.stockInBaseUnit = finalStockInBaseUnit;
    product.pricePerBaseUnit = finalPricePerBaseUnit;
    product.baseUnit = finalBaseUnit;
    product.preferredUnit = preferredUnit || product.preferredUnit;
    product.casNumber = casNumber !== undefined ? casNumber : product.casNumber;
    product.chemicalFormula = chemicalFormula !== undefined ? chemicalFormula : product.chemicalFormula;
    product.purity = purity ? purity.toString() : product.purity;

    const updatedProduct = await product.save();
    return res.json(updatedProduct);
  } catch (error) {
    console.error('Update product error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    await Product.deleteOne({ _id: req.params.id });
    return res.json({ message: 'Product removed successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router;
