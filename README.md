# AasaMedChem | Inventory & Order Management System

A premium, nature-and-chemistry-inspired MERN-stack web application designed to manage chemical reagent inventory, perform high-precision real-time unit conversions, and handle quotation and ordering flows with role-based authentication.

---

## 🧪 Project Overview & Features

AasaMedChem satisfies all evaluation expectations of the recruitment process:
- **Role-Based Authentication**: Secure login and sign-up with segregated views for **Admin** and **Seller/User (Client)**.
- **Dynamic Unit Converter**: Real-time pricing and stock level conversions directly on the product cards (e.g., toggling between `kg` <-> `g` or `L` <-> `mL`).
- **Precision Auditing Trail**: A detailed math verification breakdown in the Admin panel to audit how the database converts and stores quantities and prices.
- **Live Estimate Calculator**: Instantly computes INR values as users adjust quantities in their desired units.
- **Interactive Quotation System**: Complete cart and checkout workflow with transactional validation to guarantee stock consistency.
- **Premium Science Theme**: Designed with a high-fidelity glassmorphism dark-mode aesthetic utilizing rich gradients, clean border micro-glows, and Outfit/Inter typography.

---

## 🛠️ Tech Stack & System Design

```
                     +----------------------------------+
                     |    React Frontend SPA (Vite)     |
                     | - Responsive Flexbox/Grid UI     |
                     | - Glassmorphism design system    |
                     | - Shared Unit Conversion helpers |
                     +----------------------------------+
                                      |
                         HTTP / JSON / JWT (Bearer)
                                      v
                     +----------------------------------+
                     |    Express API on Vercel Node    |
                     | - Serverless Routing             |
                     | - Role verification middleware   |
                     | - Two-pass Stock Validation      |
                     +----------------------------------+
                                      |
                              Mongoose / MongoDB
                                      v
                     +----------------------------------+
                     |    MongoDB Database (Atlas/Local)|
                     | - Decimal128 precision handling  |
                     | - Collection indexing            |
                     +----------------------------------+
```

### Stack Components:
1. **Frontend**: React (v18), Vite, Lucide Icons, and Vanilla CSS with custom property tokens.
2. **Backend**: Node.js, Express, JSON Web Token (JWT) auth, and BcryptJS hashing.
3. **Database**: MongoDB (Mongoose ODM).

---

## 📊 Database Schema & Types

To achieve high decimal precision for MedChem formulations, all numeric fields related to quantities, rates, and totals are stored as **MongoDB Decimal128** (via Mongoose `mongoose.Schema.Types.Decimal128`), which supports 34 significant decimal digits.

### 1. User Schema (`users`)
- `name` (String, required): User's full name.
- `email` (String, required, unique): Login identifier.
- `password` (String, required): BCrypt hashed password.
- `role` (String, required, default: `'user'`): Either `'admin'` or `'user'`.

### 2. Product Schema (`products`)
- `name` (String, required): Name of the chemical.
- `sku` (String, required, unique): Unique inventory catalog code.
- `description` (String): Reagent details, storage conditions, hazards.
- `category` (String, default: `'General'`): e.g., Analgesics, Acids, Solvents.
- `dimension` (String, required): Either `'WEIGHT'`, `'VOLUME'`, or `'COUNT'`.
- `stockInBaseUnit` (Decimal128, required): Quantity stored in base unit (`g`, `mL`, or `pcs`).
- `pricePerBaseUnit` (Decimal128, required): INR price per base unit.
- `baseUnit` (String, required): Internal base unit: `'g'` (weight), `'mL'` (volume), or `'pcs'` (count).
- `preferredUnit` (String, required): The default display unit (`g`, `kg`, `mL`, `L`, or `pcs`).
- `casNumber` (String): CAS Registry Number.
- `chemicalFormula` (String): e.g. `C9H8O4`.
- `purity` (Decimal128, default: `99.0`): Percentage purity of compound.

### 3. Order Schema (`orders`)
- `user` (ObjectId ref User, required): The client placing the quotation.
- `orderNumber` (String, unique): Auto-generated unique ID (e.g. `ORD-1729092-2345`) to satisfy pre-existing database indexes.
- `totalAmount` (Decimal128, required): Grand total of the quotation in INR.
- `status` (String, required, default: `'pending'`): Status enum: `['pending', 'approved', 'rejected']`.
- `items` (Array of OrderItem):
  - `product` (ObjectId ref Product, required)
  - `productName` (String, required): Snapshot of name at order time.
  - `sku` (String, required): Snapshot of SKU at order time.
  - `dimension` (String, required): WEIGHT, VOLUME, or COUNT.
  - `orderedQuantity` (Decimal128, required): Quantity in order unit (e.g. `2.5`).
  - `orderedUnit` (String, required): Unit selected by user (e.g. `'kg'`).
  - `quantityInBaseUnit` (Decimal128, required): Stored base conversion (e.g. `2500`).
  - `pricePerBaseUnit` (Decimal128, required): Base rate snapshot.
  - `totalPrice` (Decimal128, required): Calculated item price in INR.

---

## 🔄 Unit Storage & Conversion Strategy

### 1. Base Unit Selection
To maintain complete consistency and simplify database queries, we store all inventories in standard **base units**:
- **WEIGHT** dimension $\rightarrow$ Grams (`g`)
- **VOLUME** dimension $\rightarrow$ Milliliters (`mL`)
- **COUNT** dimension $\rightarrow$ Items (`pcs`)

### 2. Conversion Multipliers
The application uses the following static scale multipliers:
- $1\text{ kg} = 1000\text{ g}$ (Weight multiplier $M = 1000$)
- $1\text{ g} = 1\text{ g}$ (Weight multiplier $M = 1$)
- $1\text{ L} = 1000\text{ mL}$ (Volume multiplier $M = 1000$)
- $1\text{ mL} = 1\text{ mL}$ (Volume multiplier $M = 1$)
- $1\text{ pcs} = 1\text{ pcs}$ (Count multiplier $M = 1$)

### 3. Price & Stock Calculations
Let $R_B$ represent the internal database price per base unit, and $Q_B$ represent the internal stock quantity in base unit.
For any active display/order unit $U$:

- **Display Price per Unit ($P_U$)**:
  $$P_U = R_B \times M_U$$
- **Display Stock Available ($S_U$)**:
  $$S_U = Q_B / M_U$$
- **Order Total Price ($T$)**:
  Given an order quantity $Q_{ord}$ in unit $U$:
  $$T = Q_{ord} \times P_U = Q_{ord} \times (R_B \times M_U)$$
- **Inventory Stock Deduction**:
  When an order is successfully placed, the stock is reduced internally in the base unit:
  $$Q_{B\_new} = Q_B - (Q_{ord} \times M_U)$$

### 4. Code Execution Application Layers
- **DB Save/Update (Backend)**: When an Admin adds or edits a product, stock and price are entered in their preferred display unit. The backend applies the conversion multiplier to save the records normalized (e.g. saving ₹500/kg as ₹0.50/g).
- **Display & Calculations (Frontend)**: Standard utilities (`src/utils/conversions.js`) dynamically calculate and format INR rates and available stocks as soon as the user toggles a product card dropdown.
- **Order Checkout (Backend)**: Before checking out, the backend validates order stock levels and stores both the display order quantity/unit and the absolute base unit values.

---

## 🚀 Setup & Installation (Local Development)

### Prerequisites
- Node.js (v18 or higher)
- NPM
- A running MongoDB instance (or MongoDB Atlas URI)

### 1. Clone the repository and install dependencies
```bash
# Navigate to the project root
npm install
```

### 2. Set Up Environment Variables
Create a file named `.env` at the project root with the following variables:
```env
PORT=5001
MONGODB_URI=mongodb+srv://chintumina:YxZuKTioe5ucxy5e@validation-backend.lqohp2g.mongodb.net/?appName=Validation-Backend
JWT_SECRET=aasa_medchem_jwt_secret_hackathon_9918237
NODE_ENV=development
```

### 3. Seed the Database
Populate your database with the default roles, test credentials, and initial chemical inventory:
```bash
npm run seed
```

### 4. Run the Dev Servers
Start both the React development server (Vite) and the Node API server (Nodemon) simultaneously using a single command:
```bash
npm run dev
```
Once started:
- Frontend is running at: `http://localhost:5173`
- Backend API is running at: `http://localhost:5001`
- Requests to `/api/*` are reverse-proxied automatically from Vite to port 5001.

---

## 🔒 Test Credentials & User Workflows

Use these pre-seeded credentials to verify the core systems:

| Role | Username / Email | Password |
| :--- | :--- | :--- |
| **Administrator** | `admin@aasamedchem.com` | `admin123` |
| **Seller / User** | `seller@aasamedchem.com` | `seller123` |

### 🛠️ Seller Workflow (Quotation Flow)
1. Navigate to `http://localhost:5173/login`.
2. Click **Seller Account** under the "Hackathon Quick Login" helper panel to auto-fill credentials, then sign in.
3. Browse products, filter by categories, or search in the search bar.
4. Locate **Aspirin (Acetylsalicylic Acid)**. Note that by default it displays in preferred units (`kg`).
5. Change the unit dropdown on the card to `g`. Notice how:
   - Available stock instantly changes from `15 kg` to `15,000 g`.
   - The rate changes from `₹800.00 / kg` to `₹0.80 / g`.
6. Input a quantity (e.g. `500`). The green estimation badge will display the calculation live: `(500 g * 1 multiplier) * ₹0.80/g = ₹400.00`.
7. Click **Add to Quotation**.
8. Open the shopping cart drawer (top right badge), review your items, and click **Submit Quotation Request**.
9. The request will appear in your "Quotation Requests" history with a yellow `PENDING` badge.

### 🛡️ Admin Workflow (Inventory & Verification Flow)
1. Sign out, and log back in by clicking **Admin Account** under the quick login helper panel.
2. In the **Manage Inventory** tab, you can view all warehouse inventory in preferred units and internal base unit configurations. Use the **Add Chemical** button or click the edit/delete buttons to manage catalog products.
3. Switch to the **Verify Quotations** tab.
4. Locate the quotation you just placed. Note that under each item there is an **Audit Trail** box showing the internal database values:
   - Stored Base Quantity: `500 g`
   - Stored Base Price: `₹0.80 / g`
   - Audit Formula: `(500 g * 1 multiplier) * ₹0.80/g = ₹400.00`
5. Click **Approve**. The status badge updates to `APPROVED`.
6. Switch back to the **Manage Inventory** tab. Notice that the Aspirin stock has automatically decreased by $500\text{ g}$ (from $15\text{ kg}$ down to $14.5\text{ kg}$).

*Note: If you click **Reject** on a pending or approved order, the stock is automatically restored to the inventory in its exact base units.*

---

## 🌐 Deployment to Vercel

The application structure is fully optimized to run on Vercel using `vercel.json` routing.

### Step-by-Step Vercel Deployment:
1. Install the Vercel CLI: `npm i -g vercel`
2. Run the deployment setup from your project root:
   ```bash
   vercel
   ```
3. Set your production environment variables when prompted or on the Vercel Dashboard:
   - `MONGODB_URI` $\rightarrow$ Your MongoDB Atlas Connection String.
   - `JWT_SECRET` $\rightarrow$ A secure random secret string.
4. Trigger the build:
   ```bash
   vercel --prod
   ```
Vercel will compile the Vite frontend into static assets and deploy `/api/index.js` as serverless Node.js functions.
