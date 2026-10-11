# AS MARKETING — Footwear Warehouse Inventory & GST Billing System

[![MERN Stack](https://img.shields.io/badge/Stack-MERN-blue.svg)](https://mongodb.com)
[![React](https://img.shields.io/badge/Frontend-React_18_%2B_Vite-61dafb.svg)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Backend-Node.js_%2B_Express-green.svg)](https://nodejs.org)
[![Database](https://img.shields.io/badge/Database-MongoDB_%2B_Mongoose-47a248.svg)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/License-ISC-purple.svg)](LICENSE)

A high-performance, full-stack **MERN (MongoDB, Express.js, React 18, Node.js)** enterprise software engineered for wholesale footwear distribution and warehouse management. Tailored specifically for **AS MARKETING** (Thanjavur, Tamil Nadu), this system handles real-time stock control across multi-variant footwear matrices (Model + Color + Size), automated Indian GST tax computations (CGST/SGST vs IGST), strict negative-stock prevention, sequential tax invoice generation, and thermal/A4-standardized printable billing with number-to-words currency conversion.

---

## Table of Contents

1. [System Architecture & Tech Stack](#1-system-architecture--tech-stack)
2. [Directory & File Structure](#2-directory--file-structure)
3. [Page-by-Page Technical Breakdown](#3-page-by-page-technical-breakdown)
   - [Authentication & Access Control (`AuthPage.jsx`)](#31-authentication--access-control-authpagejsx)
   - [Header & Global Warehouse Navigation (`Header.jsx`)](#32-header--global-warehouse-navigation-headerjsx)
   - [Warehouse Inventory & Stock Controller (`Inventory.jsx`)](#33-warehouse-inventory--stock-controller-inventoryjsx)
   - [GST Billing Engine & Point of Sale (`Billing.jsx`)](#34-gst-billing-engine--point-of-sale-billingjsx)
   - [Invoice Archives & Ledger (`InvoiceList.jsx`)](#35-invoice-archives--ledger-invoicelistjsx)
   - [Printable Tax Invoice Modal & Layout (`InvoiceModal.jsx` & `PrintableBill.jsx`)](#36-printable-tax-invoice-modal--layout-invoicemodaljsx--printablebilljsx)
4. [Authentication & Security Flow (JWT)](#4-authentication--security-flow-jwt)
5. [Database Models & Schema Design](#5-database-models--schema-design)
6. [End-to-End Billing & Stock Deduction Workflow](#6-end-to-end-billing--stock-deduction-workflow)
7. [GST Calculation & Number-to-Words Engine](#7-gst-calculation--number-to-words-engine)
8. [Installation & Setup Guide](#8-installation--setup-guide)
9. [API Specification & Endpoints](#9-api-specification--endpoints)

---

## 1. System Architecture & Tech Stack

```
+---------------------------------------------------------------------------------------+
|                                    CLIENT TIER                                        |
|                          React 18 + Vite SPA (Port 5173)                              |
|                                                                                       |
|   +-------------------+   +--------------------+   +------------------------------+   |
|   |   AuthContext     |   |   State & Hooks    |   |    Axios HTTP Client         |   |
|   |  - JWT in Storage |   |  - useState        |   |   - Interceptor: JWT Header  |   |
|   |  - RBAC User State|   |  - useEffect       |   |   - Interceptor: 401 Handler |   |
|   +---------+---------+   +---------+----------+   +--------------+---------------+   |
+-------------|-----------------------|-----------------------------|-------------------+
              |                       |                             |
              | REST API / JSON       | HTTPS API Calls             | Authorization: Bearer
              v                       v                             v
+---------------------------------------------------------------------------------------+
|                                    SERVER TIER                                        |
|                         Node.js + Express REST API (Port 5001)                        |
|                                                                                       |
|   +-------------------+   +--------------------+   +------------------------------+   |
|   |  Auth Middleware  |   |   Express Routers  |   |    Business Controllers      |   |
|   |  - protect (JWT)  |-->|  - /api/auth       |-->|  - authController.js         |   |
|   |  - authorize(RBAC)|   |  - /api/inventory  |   |  - inventoryController.js    |   |
|   |                   |   |  - /api/invoices   |   |  - invoiceController.js      |   |
|   +-------------------+   +--------------------+   +--------------+---------------+   |
|                                                                   |                   |
|                                            +----------------------+                   |
|                                            | Atomic Stock Decrements                  |
|                                            | Real-time GST Math                       |
|                                            v                                          |
+---------------------------------------------------------------------------------------+
|                                   DATABASE TIER                                       |
|                                 MongoDB Database                                      |
|                                                                                       |
|   +-------------------+   +--------------------+   +------------------------------+   |
|   |   Users Model     |   |    Items Model     |   |    Invoices Model            |   |
|   |  - Encrypted Pass |   |  - Compound Index  |   |  - Snapshot Line Items       |   |
|   |  - Role (Admin/..) |  |  - Variant Records |   |  - Sequential Invoice No     |   |
|   +-------------------+   +--------------------+   +------------------------------+   |
+---------------------------------------------------------------------------------------+
```

### Technology Highlights

- **Frontend:** React 18, Vite, Custom CSS Design System (Terminal Dark UI + High-Contrast Clean Print Styles), Axios with Request/Response Interceptors.
- **Backend:** Node.js (ES Modules), Express.js, JSON Web Tokens (`jsonwebtoken`), Password Hashing with `bcryptjs`, Email notifications with `nodemailer`.
- **Database:** MongoDB with Mongoose ODM, utilizing compound unique indexing (`modelName + color + size`), text indices for fuzzy lookup, and in-memory failover fallback.
- **Taxation Compliance:** Indian Goods and Services Tax (GST) compliant under HSN Chapter 64 (Footwear). Supports Intra-state (CGST 2.5% + SGST 2.5%) and Inter-state (IGST 5.0%) with automatic state detection from GSTIN.

---

## 2. Directory & File Structure

```
.
├── client/                                # React 18 Frontend Application (Vite)
│   ├── dist/                              # Production build output
│   ├── index.html                         # SPA Entry HTML with Google Fonts
│   ├── package.json                       # Frontend dependencies & scripts
│   ├── vite.config.js                     # Vite build & dev-server configuration
│   └── src/
│       ├── App.jsx                        # Application root, Tab routing & Modal state
│       ├── main.jsx                       # React DOM entry point
│       ├── index.css                      # Complete Dark Terminal + Print CSS Engine
│       ├── context/
│       │   └── AuthContext.jsx            # React Context for JWT auth state & session
│       ├── services/
│       │   └── api.js                     # Axios instance with auth interceptors
│       └── components/
│           ├── Header.jsx                 # Top bar, warehouse stats, tab triggers, auth status
│           ├── Inventory.jsx              # Stock management table, filters, variant editor
│           ├── Billing.jsx                # Invoice creator, real-time GST math & cart engine
│           ├── InvoiceList.jsx            # Invoice history records, query filters, reprint
│           ├── InvoiceModal.jsx           # Print preview overlay & keyboard shortcut hooks
│           ├── PrintableBill.jsx          # Formal A4 / Tax Invoice layout for physical print
│           └── auth/
│               └── AuthPage.jsx           # Sign in & Account registration forms
│
├── server/                                # Node.js / Express REST API
│   ├── .env                               # Server environment variables (PORT, MONGO_URI, JWT_SECRET)
│   ├── package.json                       # Backend dependencies & npm scripts
│   ├── server.js                          # Express application entry & route aggregation
│   ├── seedData.js                        # Database seeder for sample footwear models
│   ├── config/
│   │   └── db.js                          # MongoDB Mongoose connection & index sync
│   ├── controllers/
│   │   ├── authController.js              # User registration, login, JWT issuance, profile
│   │   ├── inventoryController.js         # Inventory CRUD, variant queries, stock adjustments
│   │   └── invoiceController.js           # Invoice generation, sequential numbers, stock link
│   ├── middleware/
│   │   └── authMiddleware.js              # JWT Bearer verification & Role Authorization
│   ├── models/
│   │   ├── User.js                        # User Schema, bcrypt hooks, password comparisons
│   │   ├── Item.js                        # Footwear item schema, compound unique indexes
│   │   └── Invoice.js                     # GST Invoice schema, subdocuments, buyer/seller meta
│   └── utils/
│       ├── numberToWords.js               # Indian Rupee words formatter (Crores, Lakhs, Paise)
│       └── sendEmail.js                   # Nodemailer transporter & OTP template dispatcher
│
└── package.json                           # Root scripts to run client & server concurrently
```

---

## 3. Page-by-Page Technical Breakdown

### 3.1 Authentication & Access Control (`AuthPage.jsx`)

- **File Path:** [`client/src/components/auth/AuthPage.jsx`](file:///Users/proplanet/Documents/bill%20creator/client/src/components/auth/AuthPage.jsx)
- **Route / Mode:** Rendered conditionally on the root route when `isAuthenticated === false` and `guestMode === false`.

#### Purpose & UI Components
Provides a cyber-terminal authentication interface allowing warehouse personnel to sign in to existing accounts or register new accounts with administrative/managerial roles.

- **Brand Header:** Terminal banner displaying `[ AS MARKETING ]` branding and access security badges.
- **Tabbed Switcher:** Toggle buttons between **Sign In** and **Create Account** modes.
- **Form Controls:** Styled inputs for Name, Email, Password, Confirm Password, and Role selection (`admin`, `manager`, `staff`).
- **Interactive Password Visibility:** Built-in show/hide password toggle.
- **Error / Success Banners:** Dismissible, styled alert boxes detailing validation errors.

#### React Hooks Implemented
- `useState`:
  - `mode ('login' | 'register')`: Tracks the active authentication form tab.
  - `name, email, password, confirmPassword, role`: Stores local form inputs.
  - `showPassword (boolean)`: Toggles password field input types between `password` and `text`.
  - `loading (boolean)`: Controls loading spinners and disables submit buttons during network I/O.
  - `errorMsg, successMsg (string)`: Manages error and success feedback banners.
- `useAuth` (Custom Hook): Accesses `login` and `register` methods from the global `AuthContext`.

#### Key Functions & Handlers
- `switchView(newMode)`: Switches between login and register views while resetting error/success messages.
- `handleLoginSubmit(e)`: Validates mandatory email and password fields, dispatches `login(email, password)` via `AuthContext`, and calls `onAuthSuccess()` on resolution.
- `handleRegisterSubmit(e)`: Performs client-side validation (minimum 6 characters, password match verification), dispatches `register(name, email, password, role)`, and updates user session.

#### State Management Flow
Local form state handles input capture. Upon successful API response, the token and user objects are stored in `localStorage` and dispatched into `AuthContext`, triggering a global re-render of `App.jsx` to mount the main warehouse dashboard.

---

### 3.2 Header & Global Warehouse Navigation (`Header.jsx`)

- **File Path:** [`client/src/components/Header.jsx`](file:///Users/proplanet/Documents/bill%20creator/client/src/components/Header.jsx)
- **Route / Position:** Permanent top-navigation header in dashboard view.

#### Purpose & UI Components
Displays warehouse metadata (GSTIN, State Code, Location), real-time stock metric aggregates, logged-in user profile with role badges, logout button, and primary navigation tabs.

- **System Tags:** Displays `GSTIN: 33APDPM1586P1ZG` and `STATE: 33 (TN)`.
- **Live Stock Stats Widget:** Shows total unique models, total warehouse stock pairs, and color-coded low-stock alert counters.
- **User Authentication Badge:** Displays user's name, role tag (`[ADMIN]`, `[MANAGER]`), and an instant sign-out trigger.
- **Navigation Tabs:** Primary tab controls switching between `[ 1. INVENTORY / STOCKS ]`, `[ 2. CREATE BILL ]`, and `[ 3. INVOICE HISTORY ]`.

#### React Hooks Implemented
- `useAuth`: Consumes `user`, `isAuthenticated`, and `logout` from `AuthContext`.

#### Key Functions & Handlers
- `setActiveTab(tabName)`: Prop handler passed from `App.jsx` to switch the primary active view.
- `logout()`: Clears authentication tokens and local user data, resetting the app to authentication view.

---

### 3.3 Warehouse Inventory & Stock Controller (`Inventory.jsx`)

- **File Path:** [`client/src/components/Inventory.jsx`](file:///Users/proplanet/Documents/bill%20creator/client/src/components/Inventory.jsx)
- **View:** `activeTab === 'inventory'`

#### Purpose & UI Components
The core stock management panel where warehouse managers monitor, search, filter, create, edit, and adjust footwear inventory at the SKU level (Model + Color + Size).

- **Toolbar & Search Engine:** Real-time text search (Model, Brand, Category, Size, Color), Color preset dropdown, and a toggle for "Low Stock Only" filtering.
- **Data Table:** Comprehensive tabular display showing S.N, Model Name, Brand, Category, Color indicator dot with hex mapping, Size, HSN Code, Wholesale Rate, MRP, Stock in Pairs, Status Badge (`IN STOCK`, `LOW STOCK`, `OUT OF STOCK`), and Action Buttons.
- **Quick Stock Stepper:** Inline `+10` and `-10` stock adjustment buttons for fast inventory modifications.
- **Add/Edit Variant Modal:** Overlay form for inserting new footwear models or updating existing pricing, rates, and stock alerts.

#### React Hooks Implemented
- `useState`:
  - `searchTerm (string)`: Holds the user's query string for live client-side filtering.
  - `selectedColorFilter (string)`: Holds the selected color dropdown value (`ALL`, `BLACK`, `BLUE`, etc.).
  - `showLowStockOnly (boolean)`: Toggle state for showing only items at or below `minStockAlert`.
  - `isModalOpen (boolean)`: Controls visibility of the Add/Edit Variant modal.
  - `editingItem (object | null)`: Stores the active item being edited (or null if creating).
  - `formData (object)`: Manages form fields (`modelName`, `brand`, `category`, `color`, `size`, `sizeRange`, `hsn`, `mrp`, `rate`, `stockQty`, `minStockAlert`).
  - `saving (boolean)`, `errorMsg (string)`: Tracks asynchronous save state.

#### Key Functions & Handlers
- `getColorDotHex(color)`: Helper function mapping footwear color names (`BLACK`, `BROWN`, `NAVY`, `RED`, `TAN`, etc.) to specific hex color values.
- `handleOpenAdd()`: Initializes blank `formData` state and opens the modal.
- `handleOpenEdit(item)`: Prepopulates `formData` with the selected item's values and opens the modal.
- `handleQuickStock(id, adjustment)`: Calls `inventoryApi.adjustStock(id, { adjustment })` and triggers `onRefresh()` to reload data.
- `handleDelete(id, name, color, size)`: Prompts confirmation dialog and calls `inventoryApi.delete(id)`.
- `handleSubmit(e)`: Formats strings to uppercase, casts numerical fields, calls `inventoryApi.create` or `inventoryApi.update`, closes the modal, and refreshes the dataset.

#### State Management Flow
Receives `items` array and `loading` status as props from `App.jsx`. Dispatches mutation requests through `inventoryApi` and informs the parent via `onRefresh` to synchronize state with the server.

---

### 3.4 GST Billing Engine & Point of Sale (`Billing.jsx`)

- **File Path:** [`client/src/components/Billing.jsx`](file:///Users/proplanet/Documents/bill%20creator/client/src/components/Billing.jsx)
- **View:** `activeTab === 'billing'`

#### Purpose & UI Components
The flagship transaction module where wholesale GST invoices are prepared, priced, validated, and finalized.

- **Invoice Metadata Form:** Sequential invoice number input, invoice date picker, payment terms selector (`30 Days`, `15 Days`, `Cash on Delivery`), and place of supply.
- **Buyer & GSTIN Details:** Buyer Name, Billing Address, Contact Number, Buyer GSTIN, and auto-computed State and State Code.
- **Dynamic Cart Grid:** Multi-row itemized bill builder featuring:
  - Footwear Model dropdown populated from active warehouse inventory.
  - Color picker preset with automatic inventory variant matching.
  - Size selection.
  - Live available stock indicator with visual low/insufficient stock warnings.
  - Pairs Quantity input with validation.
  - MRP and Wholesale Rate inputs.
  - Discount % input with computed discount amount.
  - Net row amount calculation.
  - Row removal and addition buttons (`+ ADD FOOTWEAR ROW`).
- **Live Summary & Tax Dashboard:** Computes Total Quantity (Pairs), Taxable Amount Before Tax, CGST (2.5%) & SGST (2.5%) for Tamil Nadu intra-state bills, IGST (5.0%) for inter-state bills, Round Off, Net Payable Total (INR), and Indian Rupee Amount in Words.
- **Pre-Submission Stock Validation Guard:** Prohibits bill creation if requested pairs exceed warehouse availability.

#### React Hooks Implemented
- `useState`:
  - `invoiceNo (string)`: Sequential invoice number fetched from backend or generated locally.
  - `date (string)`: Defaults to current date (`YYYY-MM-DD`).
  - `term (string)`: Payment credit terms.
  - `buyerDetails (object)`: Stores `name`, `address`, `contact`, `gstin`, `state`, `stateCode`.
  - `items (array)`: Array of line items (`sn`, `itemId`, `modelName`, `color`, `size`, `hsn`, `qty`, `mrp`, `rate`, `disPercent`, `disAmount`, `amount`, `availableStock`).
  - `saving (boolean)`, `errorMsg (string)`: Handles API mutation status.
- `useEffect`:
  - Calls `fetchNextNo()` on component mount to retrieve the next available sequential invoice number (`ASM/26-27/XXX`).

#### Key Functions & Handlers
- `fetchNextNo()`: Fetches the next invoice number from `invoiceApi.getNextNumber()`.
- `handleBuyerGstinChange(val)`: Inspects the first 2 characters of the GSTIN (e.g., `33` -> Tamil Nadu, `32` -> Kerala, `29` -> Karnataka) and automatically assigns state name and code.
- `handleItemSelect(index, selectedItemId)`: Finds item in `inventoryItems`, auto-populates color, size, HSN, rate, MRP, and available stock, and calculates line totals.
- `handleColorChange(index, newColor)`: Checks if a variant with the specified model and new color exists in inventory and links its ID and stock availability.
- `handleRowChange(index, field, value)`: Recalculates gross amounts, discount amounts, and row net values when quantities, rates, or discounts are modified.
- `handleAddRow()` / `handleRemoveRow(index)`: Appends or deletes cart rows with automatic serial number (`sn`) re-indexing.
- `convertNumberToRupeesClient(amount)`: Client-side mathematical converter converting numerical totals into formal Indian Rupee currency strings.
- `handleCreateInvoice(triggerPrint)`: Performs strict stock and validation checks, packages invoice payload, calls `invoiceApi.create(payload)`, updates inventory/invoice state, and optionally launches the print modal.

---

### 3.5 Invoice Archives & Ledger (`InvoiceList.jsx`)

- **File Path:** [`client/src/components/InvoiceList.jsx`](file:///Users/proplanet/Documents/bill%20creator/client/src/components/InvoiceList.jsx)
- **View:** `activeTab === 'history'`

#### Purpose & UI Components
Maintains a searchable, filterable historical record of all GST invoices generated by AS MARKETING.

- **Aggregation Metrics:** Real-time calculation of **Total Billed Amount (Rs)** and **Total Pairs Sold** across filtered results.
- **Search & Filter Controls:** Fuzzy search by Invoice Number, Buyer Name, or Buyer GSTIN; status filter by `ALL`, `PAID`, `UNPAID`, `CANCELLED`.
- **Invoices Ledger Table:** Columns for S.N, Invoice No, Date, Buyer Name, Buyer GSTIN, Total Pairs, Amount Before Tax, Total GST, Net Total, Status Badge, and Print/View action buttons.

#### React Hooks Implemented
- `useState`:
  - `searchTerm (string)`: Query text for filtering invoice records.
  - `filterStatus (string)`: Filter criteria for invoice payment status.

#### Key Functions & Handlers
- `onSelectInvoice(inv)`: Handler triggered when clicking `[ PRINT / VIEW ]`, passing the selected invoice object to `App.jsx` to open `InvoiceModal`.

---

### 3.6 Printable Tax Invoice Modal & Layout (`InvoiceModal.jsx` & `PrintableBill.jsx`)

- **File Paths:**
  - [`client/src/components/InvoiceModal.jsx`](file:///Users/proplanet/Documents/bill%20creator/client/src/components/InvoiceModal.jsx)
  - [`client/src/components/PrintableBill.jsx`](file:///Users/proplanet/Documents/bill%20creator/client/src/components/PrintableBill.jsx)

#### Purpose & UI Components
Renders a pixel-perfect, GST-compliant physical A4 tax invoice that can be printed directly to thermal/laser printers or saved as a PDF.

- **`InvoiceModal.jsx`**:
  - Modal container with backdrop blur, keyboard shortcut handlers (`ESC` to close, `Ctrl+P` / `Cmd+P` to print).
  - Print controls that automatically hide during physical printing via `.no-print` CSS classes.
- **`PrintableBill.jsx`**:
  - Standardized double-border tax invoice container formatted for 210mm x 297mm (A4).
  - **Seller Details Box:** AS MARKETING header, wholesale distributor tagline, registered address, contact numbers, GSTIN (`33APDPM1586P1ZG`), State: Tamil Nadu (33).
  - **Buyer Details (Bill To) Box:** M/s Buyer Name, Address, Contact, Buyer GSTIN, State and Code.
  - **Invoice Specifications Box:** Invoice No, Date, Payment Term, Place of Supply, Reverse Charge (NO).
  - **Itemized Table:** S.N, Description of Goods, Color, Size, HSN Code (`6402`/`6404`), Quantity (PRS), MRP, Rate, Dis%, Discount, Amount.
  - **Filler Rows:** Automatically renders empty rows if line items are fewer than 8 to maintain standardized paper layout.
  - **Tax Calculations Box:** CGST (2.5%) + SGST (2.5%) or IGST (5.0%), Total GST, Round Off (+/-), Net Payable Total.
  - **Amount in Words:** Formal Indian Rupee currency representation.
  - **Bank Details Box:** Account Name (`JAS MARKETING`), Bank Name (`SOUTH INDIAN BANK`), A/C No (`0076073000010634`), IFSC (`SIBL0000076`), Branch (`Thanjavur Branch`).
  - **Declarations & Terms:** Standard 3-point legal terms of sale and Authorized Signatory box for AS MARKETING.

#### React Hooks Implemented
- `useRef`: `printRef` forwarded using `React.forwardRef` to manage DOM print boundaries.
- `useEffect`: Binds global keydown event listeners for `Escape` and `Ctrl+P`/`Cmd+P` when the modal is active.

---

## 4. Authentication & Security Flow (JWT)

```
[ Frontend: AuthPage.jsx ]
       |
       | 1. POST /api/auth/login { email, password }
       v
[ Backend: authController.js ]
       |
       | 2. Query User.findOne({ email }).select('+password')
       | 3. Compare password via bcrypt.compare(password, user.password)
       | 4. Generate JWT: jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' })
       v
[ Frontend: AuthContext.jsx ]
       |
       | 5. Save in localStorage:
       |    - 'as_auth_token' -> <JWT_TOKEN_STRING>
       |    - 'as_auth_user'  -> { _id, name, email, role }
       | 6. Set React Auth State -> { isAuthenticated: true, user }
       v
[ API Requests: api.js Interceptor ]
       |
       | 7. Outgoing HTTP Request
       |    Headers: { Authorization: "Bearer <JWT_TOKEN_STRING>" }
       v
[ Backend: authMiddleware.js (protect) ]
       |
       | 8. Extract token from Header: req.headers.authorization.split(' ')[1]
       | 9. Verify: jwt.verify(token, JWT_SECRET)
       | 10. Attach User: req.user = await User.findById(decoded.id).select('-password')
       | 11. next() -> Route Controller
```

### Detailed Security Mechanisms

1. **Password Hashing:** Passwords are encrypted before persisting to MongoDB using a `pre('save')` Mongoose hook with `bcryptjs` using a salt work factor of `10`. Passwords are excluded from query results by default (`select: false`).
2. **JWT Issuance:** Issued via `jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' })`.
3. **Axios Request Interceptor:** Located in [`client/src/services/api.js`](file:///Users/proplanet/Documents/bill%20creator/client/src/services/api.js). Automatically reads `as_auth_token` from `localStorage` and appends `config.headers.Authorization = 'Bearer ' + token` to every outgoing API request.
4. **Axios Response Interceptor:** Listens for `401 Unauthorized` responses. If an invalid or expired token is detected, it automatically purges `localStorage` items (`as_auth_token`, `as_auth_user`) to redirect the user to the login screen.
5. **Backend Protection Middleware:** Located in [`server/middleware/authMiddleware.js`](file:///Users/proplanet/Documents/bill%20creator/server/middleware/authMiddleware.js). Validates the presence of the Bearer token, decodes the signature, verifies user existence in the database, and attaches the active user document to `req.user`.
6. **Role-Based Access Control (RBAC):** The `authorize(...roles)` middleware restricts designated routes to authorized user roles (`admin`, `manager`, `staff`).

---

## 5. Database Models & Schema Design

### 5.1 User Model (`User.js`)

Represents authenticated warehouse staff and administrators.

```javascript
{
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6, select: false },
  role: { type: String, enum: ['admin', 'manager', 'staff'], default: 'admin' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}
```

---

### 5.2 Footwear Item Model (`Item.js`)

Represents distinct footwear models and SKU variants in the warehouse.

```javascript
{
  modelName: { type: String, required: true, trim: true, uppercase: true },
  color: { type: String, required: true, trim: true, uppercase: true, default: 'BLACK' },
  size: { type: String, required: true, trim: true, default: '6-10' },
  sizeRange: { type: String, trim: true, default: '6-10' },
  brand: { type: String, default: 'GENERAL', trim: true, uppercase: true },
  category: { type: String, default: 'GENTS CHAPPAL', trim: true },
  hsn: { type: String, default: '6402', trim: true },
  mrp: { type: Number, required: true, min: 0 },
  rate: { type: Number, required: true, min: 0 },
  stockQty: { type: Number, required: true, default: 0, min: 0 },
  minStockAlert: { type: Number, default: 10 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}
```

#### Indexing Strategy:
- **Compound Unique Index:** `{ modelName: 1, color: 1, size: 1 }` prevents duplicate SKU variants.
- **Text Index:** `{ modelName: 'text', brand: 'text', category: 'text', color: 'text', size: 'text' }` enables high-speed fuzzy search across inventory.

---

### 5.3 Invoice Model (`Invoice.js`)

Stores comprehensive records of generated wholesale GST tax invoices.

```javascript
// Embedded Subdocument: InvoiceItem
const invoiceItemSchema = {
  sn: { type: Number, required: true },
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
  modelName: { type: String, trim: true, uppercase: true },
  color: { type: String, trim: true, uppercase: true, default: 'BLACK' },
  size: { type: String, trim: true, default: '6-10' },
  description: { type: String, required: true, trim: true },
  hsn: { type: String, default: '6402', trim: true },
  qty: { type: Number, required: true, min: 1 },
  mrp: { type: Number, required: true, min: 0 },
  rate: { type: Number, required: true, min: 0 },
  disPercent: { type: Number, default: 0, min: 0, max: 100 },
  disAmount: { type: Number, default: 0, min: 0 },
  amount: { type: Number, required: true, min: 0 }
};

// Root Document: Invoice
const invoiceSchema = {
  invoiceNo: { type: String, required: true, unique: true, trim: true, uppercase: true },
  date: { type: Date, default: Date.now, required: true },
  term: { type: String, default: '30 Days', trim: true },
  placeOfSupply: { type: String, default: 'Tamil Nadu (33)', trim: true },
  sellerDetails: {
    name: { type: String, default: 'AS MARKETING' },
    tagline: { type: String, default: 'WHOLESALE FOOTWEAR DISTRIBUTOR' },
    address: { type: String, default: 'No. 14/B, Old Bus Stand Road, Near Flower Market, Thanjavur, Tamil Nadu - 613001' },
    contact: { type: String, default: 'Ph: +91 98424 55123, +91 94431 88290' },
    email: { type: String, default: 'asmarketingtnj@gmail.com' },
    gstin: { type: String, default: '33APDPM1586P1ZG' },
    state: { type: String, default: 'Tamil Nadu' },
    stateCode: { type: String, default: '33' }
  },
  buyerDetails: {
    name: { type: String, required: true, trim: true },
    address: { type: String, default: '', trim: true },
    contact: { type: String, default: '', trim: true },
    gstin: { type: String, default: 'URP', trim: true, uppercase: true },
    state: { type: String, default: 'Tamil Nadu', trim: true },
    stateCode: { type: String, default: '33', trim: true }
  },
  items: [invoiceItemSchema],
  totalQty: { type: Number, required: true, default: 0 },
  totalBeforeTax: { type: Number, required: true, default: 0 },
  isInterState: { type: Boolean, default: false },
  cgstRate: { type: Number, default: 2.5 },
  cgstAmount: { type: Number, default: 0 },
  sgstRate: { type: Number, default: 2.5 },
  sgstAmount: { type: Number, default: 0 },
  igstRate: { type: Number, default: 5.0 },
  igstAmount: { type: Number, default: 0 },
  totalGst: { type: Number, required: true, default: 0 },
  roundOff: { type: Number, default: 0 },
  netTotal: { type: Number, required: true, default: 0 },
  amountInWords: { type: String, required: true, default: '' },
  bankDetails: {
    accountName: { type: String, default: 'JAS MARKETING' },
    bankName: { type: String, default: 'SOUTH INDIAN BANK' },
    accountNo: { type: String, default: '0076073000010634' },
    ifsc: { type: String, default: 'SIBL0000076' },
    branch: { type: String, default: 'Thanjavur Branch' }
  },
  terms: { type: [String] },
  status: { type: String, enum: ['UNPAID', 'PAID', 'PARTIALLY_PAID', 'CANCELLED'], default: 'UNPAID' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
};
```

---

## 6. End-to-End Billing & Stock Deduction Workflow

The following sequence details every operation executed when generating a GST invoice:

```
[ FRONTEND: User Interaction in Billing.jsx ]
  1. Operator inputs Buyer Details (Name, GSTIN, Address).
  2. Operator adds footwear line items (Selects Model, Color variant, Quantity).
  3. Client calculates line totals: Gross = Qty * Rate; DisAmount = Gross * (Dis% / 100); Amount = Gross - DisAmount.
  4. Client validates availableStock for all rows. If Qty > Available, submission is blocked.
  5. Operator clicks "[ GENERATE & PRINT INVOICE ]".
                             |
                             | HTTP POST /api/invoices (Payload with line items & buyer data)
                             v
[ BACKEND: invoiceController.js & inventoryController.js ]
  6. Backend re-calculates all line item math to prevent payload tampering.
  7. Backend computes GST:
     - If State Code === '33' (Tamil Nadu): CGST = Taxable * 2.5%, SGST = Taxable * 2.5%, IGST = 0.
     - If State Code !== '33' (Inter-State): IGST = Taxable * 5.0%, CGST = 0, SGST = 0.
  8. Computes Net Total = Math.round(Taxable + TotalGST); RoundOff = NetTotal - (Taxable + TotalGST).
  9. Executes numberToWordsRupees(netTotal) to generate legal word description.
 10. Resolves sequential invoice number (e.g., ASM/26-27/045).
 11. Executes verifyStockAvailability(processedItems):
     - Queries DB for each item by itemId or Model+Color+Size.
     - Verifies if item.stockQty >= requestedQty.
     - If insufficient, aborts with HTTP 400 Bad Request.
 12. Creates Invoice document in MongoDB: await Invoice.create(invoiceData).
 13. Executes deductStockForItems(processedItems):
     - Runs atomic decrement: await Item.findByIdAndUpdate(itemId, { $inc: { stockQty: -qty } }).
 14. Returns HTTP 201 Created with saved invoice document.
                             |
                             | JSON Response: { success: true, data: createdInvoice }
                             v
[ FRONTEND: State Synchronization in App.jsx ]
 15. handleInvoiceCreated triggers loadInventory() and loadInvoices() to refresh application state.
 16. Billing.jsx form resets to default empty row and increments to next sequential invoice number.
 17. App.jsx sets selectedInvoice = createdInvoice and opens <InvoiceModal />.
 18. PrintableBill renders pixel-perfect A4 bill, and window.print() can be triggered immediately.
```

---

## 7. GST Calculation & Number-to-Words Engine

### 7.1 GST Tax Calculation Rules

Footwear items in India are taxed under HSN 6402 / 6404 at a standard wholesale GST rate of **5%**:

$$\text{Gross Amount} = \text{Quantity} \times \text{Rate}$$

$$\text{Discount Amount} = \frac{\text{Gross Amount} \times \text{Discount } \%}{100}$$

$$\text{Taxable Amount (Total Before Tax)} = \sum (\text{Gross Amount} - \text{Discount Amount})$$

- **Intra-State Supply (Tamil Nadu, State Code: 33):**
  $$\text{CGST Amount} = \frac{\text{Taxable Amount} \times 2.5}{100}$$
  $$\text{SGST Amount} = \frac{\text{Taxable Amount} \times 2.5}{100}$$
  $$\text{Total GST} = \text{CGST Amount} + \text{SGST Amount}$$

- **Inter-State Supply (Outside Tamil Nadu, e.g., Kerala: 32, Karnataka: 29):**
  $$\text{IGST Amount} = \frac{\text{Taxable Amount} \times 5.0}{100}$$
  $$\text{Total GST} = \text{IGST Amount}$$

- **Net Payable Grand Total & Round Off:**
  $$\text{Net Total} = \text{round}(\text{Taxable Amount} + \text{Total GST})$$
  $$\text{Round Off} = \text{Net Total} - (\text{Taxable Amount} + \text{Total GST})$$

---

### 7.2 Number-to-Words Indian Currency Algorithm

Located in [`server/utils/numberToWords.js`](file:///Users/proplanet/Documents/bill%20creator/server/utils/numberToWords.js) and mirrored in [`client/src/components/Billing.jsx`](file:///Users/proplanet/Documents/bill%20creator/client/src/components/Billing.jsx). Converts numerical amounts to the Indian numbering system:

- **Denominations Handled:** Crores ($10^7$), Lakhs ($10^5$), Thousands ($10^3$), Hundreds ($10^2$), Units, and Decimal Paise.
- **Example:**
  `15611.00` $\rightarrow$ **"Rupees Fifteen Thousand Six Hundred Eleven Only"**
  `16330.50` $\rightarrow$ **"Rupees Sixteen Thousand Three Hundred Thirty and Fifty Paise Only"**

---

## 8. Installation & Setup Guide

### 8.1 Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or higher)
- [npm](https://www.npmjs.com/) (v9.0.0 or higher)
- [MongoDB](https://www.mongodb.com/) (Local instance on `mongodb://localhost:27017` or a MongoDB Atlas URI)

---

### 8.2 Environment Configuration

Create a `.env` file in the `server/` directory:

```env
# Server Port
PORT=5001

# MongoDB Connection String
MONGO_URI=mongodb://localhost:27017/as_marketing_footwear

# JWT Authentication
JWT_SECRET=as_marketing_footwear_jwt_secret_super_secure_key_2026
JWT_EXPIRE=7d

# Optional SMTP Email Configuration (Nodemailer)
EMAIL_USER=asmarketingtnj@gmail.com
EMAIL_PASS=your_16_character_app_password
EMAIL_SERVICE=gmail
```

*(Optional)* Create a `.env` file in the `client/` directory if connecting to a remote backend:

```env
VITE_API_URL=http://localhost:5001/api
```

---

### 8.3 Installation Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/MuhammadShifan/FOOTWEAR-WAREHOUSE-GST-BILLING-SYSTEM.git
   cd FOOTWEAR-WAREHOUSE-GST-BILLING-SYSTEM
   ```

2. **Install all dependencies (Root, Server, and Client):**
   ```bash
   npm run install-all
   ```
   *Alternatively, install manually:*
   ```bash
   cd server && npm install
   cd ../client && npm install
   cd ..
   ```

3. **Seed sample footwear models and variants into MongoDB:**
   ```bash
   npm run seed
   ```

4. **Launch the application:**
   - **Terminal 1 (Backend API Server):**
     ```bash
     npm run server
     ```
     *Server will run at [http://localhost:5001](http://localhost:5001)*
   - **Terminal 2 (Frontend Client):**
     ```bash
     npm run client
     ```
     *Client will run at [http://localhost:5173](http://localhost:5173)*

---

## 9. API Specification & Endpoints

### 9.1 Authentication (`/api/auth`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register new user account & return JWT token |
| `POST` | `/api/auth/login` | Public | Authenticate user credentials & return JWT token |
| `GET` | `/api/auth/me` | Private | Retrieve logged-in user profile (`req.user`) |

---

### 9.2 Inventory & Stock (`/api/inventory`)

| Method | Endpoint | Access | Query / Params | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/inventory` | Public | `search`, `color`, `size`, `lowStock` | Get list of all active footwear models/variants |
| `GET` | `/api/inventory/:id` | Public | `id` (Mongo ID) | Get single footwear item details |
| `POST` | `/api/inventory` | Public | Request Body | Create new footwear model/variant |
| `PUT` | `/api/inventory/:id` | Public | `id`, Request Body | Update item details, pricing, rates, or alerts |
| `PATCH`| `/api/inventory/:id/stock` | Public | `id`, `{ adjustment, newStock }` | Increment, decrement, or override stock pairs |
| `DELETE`| `/api/inventory/:id` | Public | `id` | Delete footwear item from warehouse |

---

### 9.3 Invoices & Billing (`/api/invoices`)

| Method | Endpoint | Access | Query / Params | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/invoices` | Public | `search`, `status`, `fromDate`, `toDate` | Get all generated GST tax invoices |
| `GET` | `/api/invoices/next-number` | Public | None | Compute next sequential invoice number |
| `GET` | `/api/invoices/:id` | Public | `id` (Mongo ID or Invoice No) | Get full invoice data with buyer & line items |
| `POST` | `/api/invoices` | Public | Request Body | Validate stock, generate bill, & auto-deduct inventory |
| `PUT` | `/api/invoices/:id` | Public | `id`, `{ status }` | Update invoice payment status (`PAID`, `CANCELLED`) |

---

### 9.4 Health Check (`/api/health`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Returns server status, uptime timestamp, and business GSTIN |

---

## 10. Authors & Acknowledgments

- **Developed for:** AS MARKETING, Wholesale Footwear Distributor, Thanjavur, Tamil Nadu.
- **Maintainer:** Muhammad Shifan ([@MuhammadShifan](https://github.com/MuhammadShifan))
- **Stack:** MongoDB, Express.js, React.js 18, Node.js, Vite.
