# AasaMedChem Project Documentation & Code Explanation (Hinglish)

Yeh document AasaMedChem Inventory aur Order Management system ke architecture, database unit storage strategy, backend code, aur React frontend code ko pure detail me explain karta hai.

---

## 1. Project Overview (Project Kya Karta Hai?)

AasaMedChem ek chemical inventory management system hai jisme role-based access aur dynamic unit conversion (g/kg, mL/L, items) support hai. Isme do type ke users hote hain:
1. **Admin**: Jo inventory manage (Create, Update, Delete) kar sakta hai, stock aur preferred units set kar sakta hai, aur incoming client quotations ko verify aur approve/reject kar sakta hai.
2. **Seller/User (Client)**: Jo pure catalog ko search/filter kar sakta hai, units (jaise kg ko g me) dynamically switch karke stock aur rates check kar sakta hai, aur direct quotation request submit kar sakta hai.

---

## 2. Unit Storage & Conversion Strategy (Database me quantities aur prices kaise save ho rhi hain?)

Jab hum chemistry ke chemicals ya financial pricing handle karte hain, toh decimal precision (jaise 0.0001) bahut crucial hota hai. Isliye:
- **Base-Unit Storage Pattern**: Hum database me quantities ko humesha inki baseline units (Base Units) me save karte hain:
  - **WEIGHT** $\rightarrow$ Grams (`g`) me save hota hai.
  - **VOLUME** $\rightarrow$ Milliliters (`mL`) me save hota.
  - **COUNT** $\rightarrow$ Items (`pcs`) me save hota hai.
- **Price per Base Unit**: Har product ki price bhi per base unit save hoti hai (jaise Price per Gram ya Price per Milliliter).

### Mathematics of Conversion:
Admin jab chemical banata hai toh preferred display unit choose karta hai (jaise ₹800/kg). Database me save hone se pehle:
1. **Admin Price Input**: Agar price ₹800/kg hai, toh system use $800 / 1000 = 0.8$ ₹/g base price me convert karke save karega.
2. **Admin Stock Input**: Agar stock 15 kg hai, toh use $15 \times 1000 = 15000$ g base quantity me save karega.

Jab client ise browses karta hai aur display unit badalta hai:
- **Display Stock**: Stored Grams / Multiplier (e.g., $15000\text{ g} / 1000 = 15\text{ kg}$).
- **Display Price**: Stored Price per Gram $\times$ Multiplier (e.g., $0.8\text{/g} \times 1000 = 800\text{/kg}$).
- **Order Total**: Order Quantity $\times$ Display Price. Mathematical equality: $(Q_{ord} \times 1000) \times R_B = Q_{ord} \times (R_B \times 1000)$. Isse calculation 100% correct aur consistent rehti hai aur roundoff error nahi aate kyunki MongoDB me humne **Decimal128** data type use kiya hai.

---

## 3. Backend Code Explanation (Backend ki har file kya kar rhi hai?)

Backend `/api` folder ke andar resides karta hai. Chaliye har ek file ko samajhte hain:

### A. Configuration & DB Connection
- **[api/config/db.js](file:///Users/ankitmeena/Desktop/Aasmadech_project/api/config/db.js)**:
  - **Work**: MongoDB database se connect karne ka kaam karta hai.
  - **Key Logic**: Yeh file Vercel Serverless environment ke liye optimized hai. Serverless functions dynamically scale up aur down hote hain. Agar hum normal connection method use karenge, toh database connections leak ho jayenge. Isliye isme `global.mongoose` object use karke connection caching implement ki gayi hai. Agar connection pehle se exist karta hai, toh naya connection nahi banta, purana hi reuse ho jata hai.

### B. Database Models (Mongoose Schemas)
- **[api/models/User.js](file:///Users/ankitmeena/Desktop/Aasmadech_project/api/models/User.js)**:
  - **Work**: Users ke login details aur unke roles (`admin` ya `user`) ko define karta hai.
  - **Key Logic**: Isme Mongoose ka pre-save trigger (`pre('save')`) use hua hai. Jab bhi naya user signup karega ya password change karega, toh yeh trigger automatically password ko `bcryptjs` ka use karke hash (encrypt) kar dega. Isme ek helper method `matchPassword` bhi hai jo login ke time client ke entered password ko DB ke hashed password se compare karta hai.
  
- **[api/models/Product.js](file:///Users/ankitmeena/Desktop/Aasmadech_project/api/models/Product.js)**:
  - **Work**: Chemical products ke details (Name, SKU, Description, Category, Dimension, Stock, Price, CAS Number, Formula, aur Purity) store karta hai.
  - **Key Logic**: Stock (`stockInBaseUnit`), Price (`pricePerBaseUnit`), aur Purity ko Mongoose ke `Decimal128` data type me store kiya gaya hai. Jab Mongoose ise front-end ko json response me bhejta hai, toh Decimal128 values default me complex nested object me aati hain (jaise `{"$numberDecimal": "15000"}`). Isko simple numeric string me badalne ke liye schema me `.set('toJSON')` aur `.set('toObject')` transformers lagaye gaye hain, jo is nested object ko clean string me translate kar dete hain.
  
- **[api/models/Order.js](file:///Users/ankitmeena/Desktop/Aasmadech_project/api/models/Order.js)**:
  - **Work**: Client dwara submit ki gayi quotation requests ke details (ref client user, items arrays, and total amount) store karta hai.
  - **Key Logic**: Isme har order item ke snapshot fields hain (jaise `pricePerBaseUnit`, `totalPrice`, `orderedQuantity`, and `orderedUnit`). Snapshot rakhna isliye zaroori hai taaki agar baad me admin product ki price change bhi kare, tab bhi order ke time ki original price historical orders me intact rahe.

### C. Authentication Middleware
- **[api/middleware/auth.js](file:///Users/ankitmeena/Desktop/Aasmadech_project/api/middleware/auth.js)**:
  - **Work**: Routes ko secure karta hai aur check karta hai ki user logged-in hai ya nahi, aur uska role kya hai.
  - **Key Logic**: 
    - `protect`: Request headers me se JWT bearer token read karta hai. Use check karke valid user find karta hai aur `req.user` me inject kar deta hai.
    - `admin`: Check karta hai ki authenticated user ka role `'admin'` hai ya nahi. Agar role `'admin'` nahi hai, toh route access block karke status `403 Forbidden` return kar deta hai.

### D. Routing Layer
- **[api/routes/auth.js](file:///Users/ankitmeena/Desktop/Aasmadech_project/api/routes/auth.js)**:
  - **Work**: Authentication endpoints provide karta hai:
    - `/register`: Naya user/admin create karta hai.
    - `/login`: User authenticate karta hai aur authorization ke liye JWT secure token generate karke client ko bhejta hai.
    - `/me`: Current active user profile fetch karne ke liye JWT token validation karta hai.

- **[api/routes/products.js](file:///Users/ankitmeena/Desktop/Aasmadech_project/api/routes/products.js)**:
  - **Work**: Product management handle karta hai:
    - `GET /`: Search query aur category filter ke bases par products select karta hai.
    - `POST /`: (Admin only) Naya chemical create karta hai. Yaha price aur stock base units me convert hotey hain save hone se pehle.
    - `PUT /:id`: (Admin only) Edit product details. Isme partial update handler hai. Agar user only stock edit karta hai, toh price unchanged rehti hai aur conversion formula logic background me run hoti hai.
    - `DELETE /:id`: (Admin only) Product inventory se permanently delete karta hai.

- **[api/routes/orders.js](file:///Users/ankitmeena/Desktop/Aasmadech_project/api/routes/orders.js)**:
  - **Work**: Order checkout aur verification status handle karta hai:
    - `POST /`: Order place karne ke liye use hota hai. Yaha **Two-Pass Atomic Logic** use ki gayi hai:
      1. *Validation Pass*: Pehle order ke saare items ko verify kiya jata hai (ki stock sufficient hai ya nahi). Agar ek bhi item insufficient stock ka nikle, toh request 400 bad request ke sath abort ho jati hai, taaki inventory partially deduct na ho.
      2. *Execution Pass*: Agar saari checks pass ho jati hain, toh loops run karke products ki inventory se stock deduct hota hai aur order save ho jata hai.
    - `GET /`: Agar user Admin hai, toh queue me aane wale saare quotations read kar sakta hai. Agar normal Seller hai, toh use system only uske personal quotations filter karke return karega.
    - `PUT /:id/status`: (Admin only) Quotation status (`approved` / `rejected`) update karta hai.
      - **Stock Restoration Logic**: Agar admin kisi pending/approved order ko **Reject** karta hai, toh backend product inventory me un products ke quantities ko base units me automatically restore (vapas add) kar deta hai. Agar status rejected se wapas active kiya jaye, toh phir se verify karke stock deduct hota hai.

### E. Seeding Script & Server Entry
- **[api/scripts/seed.js](file:///Users/ankitmeena/Desktop/Aasmadech_project/api/scripts/seed.js)**:
  - **Work**: Database ko drop karke fresh default user entries aur 5 chemicals seed karta hai taaki direct checkout verify kiya ja sake without manually creating users first.
- **[api/index.js](file:///Users/ankitmeena/Desktop/Aasmadech_project/api/index.js)**:
  - **Work**: Main Express server configuration file hai jo custom routers connect karti hai, express json parsers register karti hai, aur deployment compatibility ke liye Express app instance export karti hai.

---

## 4. Frontend Code Explanation (React Frontend ki har file kya kar rhi hai?)

Frontend single-page-application (SPA) architecture hai jo client and routes manage karta hai:

### A. Shared Utilities & Global Bootstrap
- **[src/main.jsx](file:///Users/ankitmeena/Desktop/Aasmadech_project/src/main.jsx)**:
  - **Work**: React DOM bootstrap file jo root html container ke andar puri react hierarchy load karti hai.
- **[src/utils/conversions.js](file:///Users/ankitmeena/Desktop/Aasmadech_project/src/utils/conversions.js)**:
  - **Work**: Isme client-side unit conversion ke reusable functions hain:
    - `convertToDisplayQuantity`: Base quantities (grams) ko display values (kg) me change karta hai.
    - `convertToDisplayPrice`: Base price per gram ko price per kg me convert karta hai.
    - `calculateTotalPrice`: Quantity aur base rate ko direct multiply karke order total detail generate karta hai.
    - `formatINR`: Custom monetary values ko Indian Rupee Currency Format (`₹1,20,000.00`) me show karne ka kaam karta hai.
- **[src/index.css](file:///Users/ankitmeena/Desktop/Aasmadech_project/src/index.css)**:
  - **Work**: CSS design architecture setup. CSS variables declare kiye hain color patterns aur layout variables handle karne ke liye. Glassmorphic elements ke liye blur filter (`backdrop-filter`) aur border layers configured hain, aur micro-animations set kiye gaye hain hover triggers aur dialog fades ke liye.

### B. Routing & Components
- **[src/App.jsx](file:///Users/ankitmeena/Desktop/Aasmadech_project/src/App.jsx)**:
  - **Work**: React component state manager aur layout tree. Isme authentication profile status save hoti hai. Routing logic (`react-router-dom`) dynamic path checks karti hai. Isme system-wide floating success/error alerts ke liye toast notifications control kiya jata hai.
- **[src/components/ProtectedRoute.jsx](file:///Users/ankitmeena/Desktop/Aasmadech_project/src/components/ProtectedRoute.jsx)**:
  - **Work**: Client-side route security controller. Agar guest user dashboard path check kare toh yeh component use auto-redirect kar deta hai `/login` path par. Agar role check fail ho (e.g. non-admin accessing admin portal), toh use main catalog page pe wapas redirect kar diya jata hai.
- **[src/components/Navbar.jsx](file:///Users/ankitmeena/Desktop/Aasmadech_project/src/components/Navbar.jsx)**:
  - **Work**: Dynamic navigation banner. Agar logged-in user admin hai, toh dashboard routing check change ho jata hai. Isme current user ka dynamic avatar, role classification badge, real-time cart icon count trigger, aur logout options visual displays ke sath render hotey hain.

### C. Pages (Views)
- **[src/pages/Login.jsx](file:///Users/ankitmeena/Desktop/Aasmadech_project/src/pages/Login.jsx) & [src/pages/Register.jsx](file:///Users/ankitmeena/Desktop/Aasmadech_project/src/pages/Register.jsx)**:
  - **Work**: User registration aur sign-in cards.
  - **Speciality**: Login page me shortcut helper buttons diye gaye hain. Jab aap "Seller Account" ya "Admin Account" button click karte hain, toh form inputs automatically pre-seeded default credentials se fill ho jate hain taaki manual typing ke bina speed-testing ki ja sake.
  
- **[src/pages/Dashboard.jsx](file:///Users/ankitmeena/Desktop/Aasmadech_project/src/pages/Dashboard.jsx)**:
  - **Work**: Client/Seller catalog dashboard page.
  - **Key Features**:
    1. *Search & Filters*: Instant search inputs aur categorical tab selection filters instantly product matches render karte hain.
    2. *Interactive Dropdown Selection*: Har catalog product card par unit selections (`kg` / `g` or `L` / `mL`) badalte hi stock display aur INR rate dynamically re-calculate hokar fluid update hotey hain.
    3. *Live Estimate Calculation*: Jab user quantity field me value edit karta hai, toh dynamic estimate green badge auto-calculate hoke final subtotal print karta hai.
    4. *Cart Side Drawer*: Slide-out cart drawer me added products check hotey hain, aur quotation checkout trigger karne ke liye post request fire ki jati hai.
    5. *Quotation History*: Lower panel par client ke unke previous orders ke statuses check karne ka system.
  
- **[src/pages/AdminDashboard.jsx](file:///Users/ankitmeena/Desktop/Aasmadech_project/src/pages/AdminDashboard.jsx)**:
  - **Work**: Admin control panel.
  - **Key Features**:
    1. *Chemical Inventory Grid*: Table form me chemical list jisme product edit / delete options available hain.
    2. *Add/Edit Modals*: Chemical product CRUD forms jisme dimension select karne par preferred display units ka options set dynamically update hota hai.
    3. *Quotation Verification*: Safe approve / reject toggle buttons orders approve karne ke liye.
    4. *Unit Audit Trail*: Har order item ke nichay audit box box run hota hai jo backend data properties aur conversion mathematical calculation ko transparently present karta hai (e.g. `(500 g * 1 multiplier) * ₹0.80/g = ₹400.00`) jo unit storage compliance verify karta hai.
