export const MULTIPLIERS = {
  g: 1,
  kg: 1000,
  mL: 1,
  L: 1000,
  pcs: 1,
};

export const DIMENSION_UNITS = {
  WEIGHT: ['g', 'kg'],
  VOLUME: ['mL', 'L'],
  COUNT: ['pcs'],
};

export const BASE_UNITS = {
  WEIGHT: 'g',
  VOLUME: 'mL',
  COUNT: 'pcs',
};

/**
 * Converts a quantity in a specific unit to its base unit representation.
 * @param {number|string} quantity 
 * @param {string} unit 
 * @returns {number}
 */
export const convertToBaseQuantity = (quantity, unit) => {
  const q = parseFloat(quantity) || 0;
  const m = MULTIPLIERS[unit] || 1;
  return q * m;
};

/**
 * Converts a base quantity back to a display unit.
 * @param {number|string} baseQuantity 
 * @param {string} targetUnit 
 * @returns {number}
 */
export const convertToDisplayQuantity = (baseQuantity, targetUnit) => {
  const q = parseFloat(baseQuantity) || 0;
  const m = MULTIPLIERS[targetUnit] || 1;
  return q / m;
};

/**
 * Converts price per base unit to price per display unit.
 * @param {number|string} pricePerBaseUnit 
 * @param {string} targetUnit 
 * @returns {number}
 */
export const convertToDisplayPrice = (pricePerBaseUnit, targetUnit) => {
  const p = parseFloat(pricePerBaseUnit) || 0;
  const m = MULTIPLIERS[targetUnit] || 1;
  return p * m;
};

/**
 * Calculates the total INR price for an order item.
 * @param {number|string} quantity - Order quantity in target unit
 * @param {string} unit - Target unit (e.g. kg, L, pcs)
 * @param {number|string} pricePerBaseUnit - Stored base unit price
 * @returns {number}
 */
export const calculateTotalPrice = (quantity, unit, pricePerBaseUnit) => {
  const q = parseFloat(quantity) || 0;
  const basePrice = parseFloat(pricePerBaseUnit) || 0;
  const multiplier = MULTIPLIERS[unit] || 1;
  return q * multiplier * basePrice;
};

/**
 * Formats a currency value in INR.
 * @param {number|string} amount 
 * @returns {string}
 */
export const formatINR = (amount) => {
  const a = parseFloat(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(a);
};

/**
 * Formats a quantity value with appropriate decimal places.
 * @param {number|string} qty 
 * @param {string} unit 
 * @returns {string}
 */
export const formatQuantity = (qty, unit) => {
  const q = parseFloat(qty) || 0;
  // If it's items, no decimal places, else up to 3 decimal places
  const fractionDigits = unit === 'pcs' ? 0 : 3;
  return q.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: fractionDigits,
  });
};
