import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  productName: { type: String, required: true },
  sku: { type: String, required: true },
  dimension: {
    type: String,
    required: true,
    enum: ['WEIGHT', 'VOLUME', 'COUNT'],
  },
  orderedQuantity: {
    type: mongoose.Schema.Types.Decimal128,
    required: true,
  },
  orderedUnit: {
    type: String,
    required: true,
  },
  quantityInBaseUnit: {
    type: mongoose.Schema.Types.Decimal128,
    required: true,
  },
  pricePerBaseUnit: {
    type: mongoose.Schema.Types.Decimal128,
    required: true,
  },
  totalPrice: {
    type: mongoose.Schema.Types.Decimal128,
    required: true,
  },
});

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [orderItemSchema],
    totalAmount: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

// Transform Decimal128 to String for clean frontend consumption
const transformDecimal = (doc, ret) => {
  if (ret._id) ret.id = ret._id.toString();
  if (ret.totalAmount) ret.totalAmount = ret.totalAmount.toString();
  
  if (ret.items && Array.isArray(ret.items)) {
    ret.items = ret.items.map(item => {
      // Check if it's already a plain object or needs conversion
      const itemObj = item._doc ? { ...item._doc } : item;
      if (itemObj._id) itemObj.id = itemObj._id.toString();
      if (itemObj.orderedQuantity) itemObj.orderedQuantity = itemObj.orderedQuantity.toString();
      if (itemObj.quantityInBaseUnit) itemObj.quantityInBaseUnit = itemObj.quantityInBaseUnit.toString();
      if (itemObj.pricePerBaseUnit) itemObj.pricePerBaseUnit = itemObj.pricePerBaseUnit.toString();
      if (itemObj.totalPrice) itemObj.totalPrice = itemObj.totalPrice.toString();
      return itemObj;
    });
  }
  return ret;
};

orderSchema.set('toJSON', { transform: transformDecimal });
orderSchema.set('toObject', { transform: transformDecimal });

const Order = mongoose.model('Order', orderSchema);
export default Order;
