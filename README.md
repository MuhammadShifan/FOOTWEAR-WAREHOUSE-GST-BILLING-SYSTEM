# AS MARKETING - Footwear Warehouse Inventory & Billing System (MERN)

A high-performance, **strict text-only** (zero images) warehouse inventory management and GST billing web application designed for footwear wholesale operations (**AS MARKETING, Thanjavur**).

---

## ⚡ Key Highlights & Strict Constraints
1. **Zero Images Anywhere**: Pure text typography (`Inter` & `Fira Code` / `Monospace`), dense data tables, ASCII banners, and clean border grids. No `<img>` or SVG icons are used.
2. **Exact GST Invoice Format**:
   - **Seller Header**: `AS MARKETING`, `GST INVOICE`, Thanjavur address, GSTIN: `33APDPM1586P1ZG`.
   - **Buyer & Invoice Details**: Buyer Name, Address, Contact, Buyer GSTIN, Invoice No, Date, Term.
   - **Itemized Columns**: `S.N`, `Description of Goods` (e.g., `AEROWALK-NV58-BLACK(40-45)`), `HSN`, `Qty`, `MRP`, `Rate`, `Dis%`, `Discount`, `Amount`.
   - **Tax & Calculations**: Total Amount Before Tax, CGST 2.5%, SGST 2.5% (or IGST 5%), Total GST 5%, Roundoff, Net Total, and Amount in Words.
   - **Footer**: Bank Details (`JAS MARKETING`, `SOUTH INDIAN BANK`, A/C No: `0076073000010634`, IFSC: `SIBL0000076`), terms & conditions, and Authorized Signatory.
3. **Hard Copy Print Integration**: Uses CSS `@media print` optimized for standard single-page A4 paper output with crisp black lines, 0 margin clipping, and page break prevention.
4. **Auto-Stock Deduction**: Invoicing automatically deducts pair counts from inventory.
5. **Resilient Architecture**: Includes MongoDB Mongoose ODM support plus automatic in-memory fallback for instant prototyping.

---

## 📁 Project Architecture

```
bill creator/
├── package.json               # Root scripts (npm run server, npm run client)
├── server/                    # Node.js + Express + MongoDB Backend
│   ├── config/
│   │   └── db.js              # Mongoose DB connection
│   ├── models/
│   │   ├── Item.js            # Footwear Inventory Mongoose Schema
│   │   └── Invoice.js         # GST Invoice Mongoose Schema
│   ├── controllers/
│   │   ├── inventoryController.js # Inventory CRUD & Stock Sync
│   │   └── invoiceController.js   # Invoice generator & Tax math
│   ├── routes/
│   │   ├── inventoryRoutes.js # /api/inventory endpoints
│   │   └── invoiceRoutes.js   # /api/invoices endpoints
│   ├── utils/
│   │   └── numberToWords.js   # Indian Rupee Number to Words converter
│   ├── seedData.js            # Realistic chappal models seeder
│   └── server.js              # Express API entry point (Port 5001)
└── client/                    # Vite + React Frontend (Port 3000)
    ├── src/
    │   ├── components/
    │   │   ├── Header.jsx         # ASCII banner & Nav tabs
    │   │   ├── Inventory.jsx      # Stock manager & low stock warnings
    │   │   ├── Billing.jsx        # Live billing form & dynamic math
    │   │   ├── PrintableBill.jsx  # Exact A4 GST Invoice component
    │   │   ├── InvoiceList.jsx    # Bill archives & search
    │   │   └── InvoiceModal.jsx   # Screen preview & Print trigger
    │   ├── services/
    │   │   └── api.js             # Axios API service
    │   ├── index.css              # Pure text styles & @media print rules
    │   ├── App.jsx                # Main dashboard state & views
    │   └── main.jsx               # React DOM root
    └── vite.config.js             # API proxy config
```

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
In the root directory, run:
```bash
npm run install-all
```
*(Or navigate to `server/` and run `npm install`, then to `client/` and run `npm install`)*

### 2. Start the Backend Server (Express)
```bash
cd server
npm run dev
```
Backend will start on `http://localhost:5001`.

### 3. Start the Frontend Client (Vite + React)
In another terminal window:
```bash
cd client
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 🖨️ How to Print Bills
1. Open the **[ 2. CREATE BILL ]** tab.
2. Enter Buyer details (e.g. `SRI BALAJI FOOTWEAR`) and select footwear models from inventory.
3. Quantity, Discount, Taxable value, CGST 2.5%, SGST 2.5%, Roundoff, and Net Total will calculate live.
4. Click **[ PRINT BILL ]**.
5. The print preview modal opens with the exact **AS MARKETING** GST invoice.
6. Click **[ PRINT HARD COPY NOW ]** or press `Ctrl + P` (`Cmd + P` on Mac) to print directly to your thermal/laser/inkjet printer or save as PDF.
# FOOTWEAR-WAREHOUSE-GST-BILLING-SYSTEM
