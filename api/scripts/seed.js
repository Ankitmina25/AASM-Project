import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';

dotenv.config();

const seedData = async () => {
  try {
    console.log('Connecting to database for seeding...');
    await connectDB();

    // 1. Clear existing database collections
    console.log('Cleaning existing collections...');
    await User.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});

    console.log('Database cleaned successfully.');

    // 2. Create default Admin & Seller accounts
    console.log('Creating default users...');
    const adminUser = await User.create({
      name: 'Administrator (AasaMed)',
      email: 'admin@aasamedchem.com',
      password: 'admin123', // Will be hashed automatically by pre-save hooks
      role: 'admin',
    });

    const sellerUser = await User.create({
      name: 'Seller User (AasaMed)',
      email: 'seller@aasamedchem.com',
      password: 'seller123',
      role: 'user',
    });

    console.log(`Users created:\n- Admin: ${adminUser.email}\n- Seller/User: ${sellerUser.email}`);

    // 3. Create initial chemical products
    console.log('Inserting initial chemical inventory...');
    const initialProducts = [
      {
        name: 'Aspirin (Acetylsalicylic Acid)',
        sku: 'ASP-0045',
        description: 'Pharmaceutical grade active compound for anti-inflammatory and synthesis studies.',
        category: 'Analgesics',
        dimension: 'WEIGHT',
        stockInBaseUnit: mongoose.Types.Decimal128.fromString('15000'), // 15 kg (stored in g)
        pricePerBaseUnit: mongoose.Types.Decimal128.fromString('0.80'), // ₹0.80 per g (₹800 per kg)
        baseUnit: 'g',
        preferredUnit: 'kg',
        casNumber: '50-78-2',
        chemicalFormula: 'C9H8O4',
        purity: mongoose.Types.Decimal128.fromString('99.5'),
      },
      {
        name: 'Acetaminophen (Paracetamol) USP',
        sku: 'ACP-0023',
        description: 'Active pharmaceutical ingredient (API) for pain relief and fever reduction formulations.',
        category: 'Analgesics',
        dimension: 'WEIGHT',
        stockInBaseUnit: mongoose.Types.Decimal128.fromString('25000'), // 25 kg (stored in g)
        pricePerBaseUnit: mongoose.Types.Decimal128.fromString('0.75'), // ₹0.75 per g (₹750 per kg)
        baseUnit: 'g',
        preferredUnit: 'kg',
        casNumber: '103-90-2',
        chemicalFormula: 'C8H9NO2',
        purity: mongoose.Types.Decimal128.fromString('99.8'),
      },
      {
        name: 'Ethanol (Anhydrous Reagent)',
        sku: 'ETH-0512',
        description: 'Analytical grade solvent for chemical extraction, chromatography, and organic synthesis.',
        category: 'Solvents',
        dimension: 'VOLUME',
        stockInBaseUnit: mongoose.Types.Decimal128.fromString('50000'), // 50 Liters (stored in mL)
        pricePerBaseUnit: mongoose.Types.Decimal128.fromString('0.35'), // ₹0.35 per mL (₹350 per L)
        baseUnit: 'mL',
        preferredUnit: 'L',
        casNumber: '64-17-5',
        chemicalFormula: 'C2H5OH',
        purity: mongoose.Types.Decimal128.fromString('99.9'),
      },
      {
        name: 'Hydrochloric Acid 37% ACS',
        sku: 'HCL-1209',
        description: 'Strong mineral acid widely used as a laboratory reagent for analytical titration.',
        category: 'Acids',
        dimension: 'VOLUME',
        stockInBaseUnit: mongoose.Types.Decimal128.fromString('12500'), // 12.5 Liters (stored in mL)
        pricePerBaseUnit: mongoose.Types.Decimal128.fromString('0.18'), // ₹0.18 per mL (₹180 per L)
        baseUnit: 'mL',
        preferredUnit: 'L',
        casNumber: '7647-01-0',
        chemicalFormula: 'HCl',
        purity: mongoose.Types.Decimal128.fromString('37.0'),
      },
      {
        name: 'Silica Gel Chromatography Column',
        sku: 'COL-9981',
        description: 'Standard flash chromatography column packed with silica gel for purifying compound mixtures.',
        category: 'Labware',
        dimension: 'COUNT',
        stockInBaseUnit: mongoose.Types.Decimal128.fromString('40'), // 40 items
        pricePerBaseUnit: mongoose.Types.Decimal128.fromString('2450.00'), // ₹2450.00 per item
        baseUnit: 'pcs',
        preferredUnit: 'pcs',
        casNumber: '112926-00-8',
        chemicalFormula: 'SiO2',
        purity: mongoose.Types.Decimal128.fromString('100.0'),
      }
    ];

    await Product.insertMany(initialProducts);
    console.log('Chemical products successfully seeded.');

    console.log('Database seeding operation completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding process encountered an error:', error);
    process.exit(1);
  }
};

seedData();
