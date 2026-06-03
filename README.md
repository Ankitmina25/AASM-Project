# AasaMedChem | Inventory & Order Management System

Yeh ek premium, nature aur chemistry-inspired MERN-stack web application hai jo chemical inventory, real-time unit conversions, aur quotations/order queue ko manage karta hai. Isme role-based authentication ka use karke Admin aur Seller/User (Client) ke dedicated features implement kiye gaye hain.

---

## 🧪 Project Overview & Features (Project ke Key Features)

AasaMedChem assignment ke saare requirements ko successfully fulfill karta hai:
- **Role-Based Authentication**: Secure login aur sign-up flows. Admin aur Seller ke paas alag-alag UI views aur options hain.
- **Dynamic Unit Converter**: Reagent cards par units (`kg`, `g`, `L`, `mL`, `pcs`) ko change karte hi available stock aur rate INR amount ke sath dynamically aur accurately calculate hokar show hote hain.
- **Precision Auditing Trail**: Admin panel me har incoming order ke niche ek transparent mathematical breakdown diya gaya hai jo prove karta hai ki backend database me conversions 100% correct ho rahe hain.
- **Live Estimate Calculator**: Jab client quantity select karta hai, toh card par green estimation badge live price calculate karke display karta hai.
- **Interactive Quotation System**: Shopping cart drawer ke sath checkout system jisme order submit karte hi inventory deduct ho jati hai.
- **Premium Glassmorphic UI**: HSL colors, teals, and emerald highlights ke sath ek clean scientific visual aesthetic setup.

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

### Tech Stack Details:
1. **Frontend**: React (v18), Vite, Lucide Icons, and Vanilla CSS.
2. **Backend**: Node.js, Express, JSON Web Token (JWT) auth, aur BcryptJS.
3. **Database**: MongoDB (Mongoose ODM).

---

## 📊 Database Schema & Types (Database Ke Collection Aur Fields)

Scientific calculations aur financial figures me precision ko maintain rakhne ke liye, humne database me price, quantity, aur purity ke liye **MongoDB Decimal128** (`mongoose.Schema.Types.Decimal128`) type ka use kiya hai.

### 1. User Schema (`users`)
- `name` (String, required): User ka full name.
- `email` (String, required, unique): Login email.
- `password` (String, required): Hashed password.
- `role` (String, required, default: `'user'`): Role classification: `'admin'` ya `'user'`.

### 2. Product Schema (`products`)
- `name` (String, required): Chemical product ka naam.
- `sku` (String, required, unique): Product code.
- `description` (String): Product information.
- `category` (String, default: `'General'`): Product category.
- `dimension` (String, required): Physical dimension: `'WEIGHT'`, `'VOLUME'`, or `'COUNT'`.
- `stockInBaseUnit` (Decimal128, required): Grams (`g`), Milliliters (`mL`), ya Pieces (`pcs`) me base stock level.
- `pricePerBaseUnit` (Decimal128, required): Price per base unit (INR).
- `baseUnit` (String, required): `'g'` (weight), `'mL'` (volume), ya `'pcs'` (count).
- `preferredUnit` (String, required): Default display unit (jaise `'kg'` ya `'L'`).
- `casNumber` (String): CAS Registry Number.
- `chemicalFormula` (String): Formula (e.g. `C9H8O4`).
- `purity` (Decimal128, default: `99.0`): Chemical purity range (%).

### 3. Order Schema (`orders`)
- `user` (ObjectId ref User, required): Order place karne wala user/seller.
- `orderNumber` (String, unique): Pre-existing database index ko satisfy karne ke liye auto-generated unique ID (e.g. `ORD-1729092-2345`).
- `totalAmount` (Decimal128, required): Quotation ka grand total in INR.
- `status` (String, required, default: `'pending'`): Status enum: `['pending', 'approved', 'rejected']`.
- `items` (Array of OrderItem):
  - `product` (ObjectId ref Product, required)
  - `productName` (String, required): Order ke time product ka naam.
  - `sku` (String, required): Product SKU snapshot.
  - `dimension` (String, required): Product dimension.
  - `orderedQuantity` (Decimal128, required): User dwara order ki gayi quantity (e.g. `2.5`).
  - `orderedUnit` (String, required): User dwara selected unit (e.g. `'kg'`).
  - `quantityInBaseUnit` (Decimal128, required): Base unit me conversion (e.g. `2500`).
  - `pricePerBaseUnit` (Decimal128, required): Base price rate snapshot.
  - `totalPrice` (Decimal128, required): Calculated item total price.

---

## 🔄 Unit Storage & Conversion Strategy (Unit Calculations Kaise Hoti Hain?)

### 1. Base Unit Selection
Database queries ko simple aur consistent rakhne ke liye saara stock **base units** me save hota hai:
- **WEIGHT** dimension $\rightarrow$ Grams (`g`)
- **VOLUME** dimension $\rightarrow$ Milliliters (`mL`)
- **COUNT** dimension $\rightarrow$ Items (`pcs`)

### 2. Conversion Multipliers (Scale Factors)
- $1\text{ kg} = 1000\text{ g}$ (Multiplier $M = 1000$)
- $1\text{ g} = 1\text{ g}$ (Multiplier $M = 1$)
- $1\text{ L} = 1000\text{ mL}$ (Multiplier $M = 1000$)
- $1\text{ mL} = 1\text{ mL}$ (Multiplier $M = 1$)
- $1\text{ pcs} = 1\text{ pcs}$ (Multiplier $M = 1$)

### 3. Price & Stock Formulas
Maan lijiye $R_B$ database me save kiya gaya price per base unit hai aur $Q_B$ base unit stock level hai:

- **Display Price per Unit ($P_U$)**:
  $$P_U = R_B \times M_U$$
- **Display Stock Available ($S_U$)**:
  $$S_U = Q_B / M_U$$
- **Order Total Price ($T$)**:
  $$T = Q_{ord} \times P_U = Q_{ord} \times (R_B \times M_U)$$
- **Inventory Stock Deduction**:
  $$Q_{B\_new} = Q_B - (Q_{ord} \times M_U)$$

---

## 🚀 Setup & Installation (Local Machine par Kaise Run Karein?)

### Prerequisites
- Node.js (v18 or higher)
- NPM
- Running MongoDB instance

### 1. Clone karke dependencies install karein
```bash
npm install
```

### 2. .env File Config Karein
Root folder par `.env` file banayein aur ye variables add karein:
```env
PORT=5001
MONGODB_URI=mongodb+srv://chintumina:YxZuKTioe5ucxy5e@validation-backend.lqohp2g.mongodb.net/?appName=Validation-Backend
JWT_SECRET=aasa_medchem_jwt_secret_hackathon_9918237
NODE_ENV=development
```

### 3. Database Seed Karein (Default Data Insert Karein)
Seed script run karke database ko standard test credentials aur chemicals se populate karein:
```bash
npm run seed
```

### 4. Dev Servers Run Karein
React Frontend aur Node.js API ko concurrently run karne ke liye ek command chalayein:
```bash
npm run dev
```
Dev servers start hone ke baad:
- Frontend Client: `http://localhost:5173/`
- Backend Express Server: `http://localhost:5001/`
- Vite frontend par `/api` backend requests proxy se process ho jayengi.

---

## 🔒 Test Credentials & Workflows (Kaise Test Karein?)

Database seeding complete hone par niche diye credentials use karke sign-in karein:

| Role | Username / Email | Password |
| :--- | :--- | :--- |
| **Administrator** | `admin@aasamedchem.com` | `admin123` |
| **Seller / User** | `seller@aasamedchem.com` | `seller123` |

### 🛠️ Seller Workflow (Quotation Order Placement)
1. `http://localhost:5173/login` par jayein.
2. Login screen par **Seller Account** button click karein (isase values automatically auto-fill ho jayengi), aur Sign In karein.
3. Catalog me **Aspirin (Acetylsalicylic Acid)** card locate karein.
4. Card ke unit dropdown ko `kg` se badalkar `g` kijiye. Aap dekhenge ki:
   - Stock display `15 kg` se change hokar `15,000 g` ho gaya.
   - Rate `₹800.00 / kg` se change hokar `₹0.80 / g` ho gaya.
5. Quantity inputs me **`500`** daalein. Green badge live estimate show karega: `(500 g * 1 multiplier) * ₹0.80/g = ₹400.00`.
6. **Add to Quotation** click kijiye.
7. Top-right side me ShoppingCart select karke Cart Drawer open kijiye aur **Submit Quotation Request** par click karein.
8. Dashboard page par scroll down karke "Your Quotation Requests" me confirm karein ki order status `PENDING` show ho raha hai.

### 🛡️ Admin Workflow (Order Audit & Approval)
1. Log out karke **Admin Account** ke standard auto-fill button se login karein.
2. Dashboard par **Verify Quotations** select karein.
3. Seller dwara bheje gaye request ke details and order items verify karein.
4. Har order item ke niche **Unit Conversion & Price Audit Trail** open kijiye, aur check karein ki mathematical validation formula aur internal DB values correct hain ya nahi.
5. **Approve** button click karke order status change kijiye.
6. **Manage Inventory** tab par switch kijiye, aur locate karein **Aspirin**. Aap dekhenge ki usaka stock dynamically decrement ho chuka hai (from `15.0 kg` to `14.5 kg`).

*Admin dwara order **Reject** karne par product quantity base units me automatically restore ho jayegi.*

---

## 🌐 Deployment to Vercel

Is project ko single repository me run karne ke liye `vercel.json` configurators likhe gaye hain.

1. Vercel CLI install karein: `npm i -g vercel`
2. Root folder se link setup karein:
   ```bash
   vercel
   ```
3. Environmental settings dashboard me configure karein (`MONGODB_URI` & `JWT_SECRET`).
4. Production production build deploy karein:
   ```bash
   vercel --prod
   ```
 Vercel static assets build karke deploy kar dega aur `/api/index.js` ko serverless Node functions me convert kar dega.
