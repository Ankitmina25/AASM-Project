import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    sku: { type: String, required: true, unique: true },
    description: { type: String },
    category: { type: String, default: 'General' },
    dimension: {
      type: String,
      required: true,
      enum: ['WEIGHT', 'VOLUME', 'COUNT'],
    },
    stockInBaseUnit: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
    },
    pricePerBaseUnit: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
    },
    baseUnit: {
      type: String,
      required: true,
      enum: ['g', 'mL', 'pcs'],
    },
    preferredUnit: {
      type: String,
      required: true,
      enum: ['g', 'kg', 'mL', 'L', 'pcs'],
    },
    // Scientific metadata for MedChem theme
    casNumber: { type: String },
    chemicalFormula: { type: String },
    purity: { type: mongoose.Schema.Types.Decimal128, default: '99.0' },
  },
  { timestamps: true }
);

// Transform Decimal128 to String for clean frontend consumption
const transformDecimal = (doc, ret) => {
  if (ret._id) ret.id = ret._id.toString();
  if (ret.stockInBaseUnit) ret.stockInBaseUnit = ret.stockInBaseUnit.toString();
  if (ret.pricePerBaseUnit) ret.pricePerBaseUnit = ret.pricePerBaseUnit.toString();
  if (ret.purity) ret.purity = ret.purity.toString();
  return ret;
};

productSchema.set('toJSON', { transform: transformDecimal });
productSchema.set('toObject', { transform: transformDecimal });

const Product = mongoose.model('Product', productSchema);
export default Product;
