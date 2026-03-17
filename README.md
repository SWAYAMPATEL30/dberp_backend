# Skyprint ERP - Printing Company Management System

A comprehensive, cloud-based ERP solution for Indian printing companies with full GST compliance, production management, and end-to-end business process integration.

## 🚀 Features

### Core Modules

- **Financial Management** - GST-compliant invoicing, payments, e-invoicing, GSTR-1/3B generation
- **Sales & CRM** - Customer management, quotations with cost estimation, sales orders
- **Production Management** - Job scheduling, machine allocation, quality control, real-time tracking
- **Inventory & Procurement** - Material management, purchase orders, MRP, stock tracking
- **Logistics** - Shipment management, e-way bill generation, delivery tracking
- **Human Resources** - Employee management, attendance, leave, payroll with PF/ESI/TDS
- **Analytics & Reporting** - Role-based dashboards, KPIs, financial reports

### Key Highlights

- ✅ **GST Compliance** - Automatic tax calculation (CGST/SGST/IGST), e-invoicing with IRN & QR codes
- ✅ **Role-Based Access Control** - Granular permissions for different user roles
- ✅ **Real-Time Production Tracking** - Monitor jobs from pre-press to post-press
- ✅ **Cost Estimation** - Detailed quotation system with material, labor, and overhead costs
- ✅ **Mobile Responsive** - Optimized for desktop, tablet, and mobile devices
- ✅ **Type-Safe APIs** - Built with tRPC for end-to-end type safety

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, TailwindCSS
- **Backend**: Next.js API Routes, tRPC
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with JWT
- **State Management**: React Query (TanStack Query)

## 📦 Installation

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database

### Setup Steps

1. **Clone the repository**
   ```bash
   cd DhruvilBhai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Copy `.env.example` to `.env` and update the values:
   ```bash
   cp .env.example .env
   ```

   Update `DATABASE_URL` with your PostgreSQL connection string:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/skyprint_erp"
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npm run db:generate

   # Push schema to database
   npm run db:push

   # Seed the database with sample data
   npx tsx prisma/seed.ts
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open the application**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔐 Default Login Credentials

```
Email: admin@skyprint.com
Password: admin123
```

## 📁 Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   ├── login/             # Authentication pages
│   └── layout.tsx         # Root layout
├── components/            # React components
├── lib/                   # Utility functions
│   ├── auth.ts           # NextAuth configuration
│   ├── gst.ts            # GST utilities
│   ├── prisma.ts         # Prisma client
│   └── trpc.ts           # tRPC client
├── prisma/               # Database schema and migrations
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Seed script
├── server/               # Server-side code
│   └── api/              # tRPC routers
│       ├── routers/      # Module-specific routers
│       ├── root.ts       # Root router
│       └── trpc.ts       # tRPC setup
└── types/                # TypeScript type definitions
```

## 🎯 Usage Guide

### Creating a Quotation

1. Navigate to **CRM & Sales** → **Quotations**
2. Click **+ New Quotation**
3. Select customer and add items with specifications
4. The system automatically calculates costs based on:
   - Paper cost (based on size, GSM, quantity)
   - Ink cost
   - Plate and pre-press costs
   - Labor and machine time
   - Finishing costs
   - Overhead allocation
5. Review and save the quotation

### Converting to Sales Order

1. Open an approved quotation
2. Click **Convert to Order**
3. Set delivery date
4. The system creates a sales order and updates the quotation status

### Creating Production Jobs

1. Navigate to **Production** → **Jobs**
2. Select a sales order
3. Create job with specifications
4. Schedule on available machines
5. Track progress through pre-press, press, and post-press stages

### Generating GST-Compliant Invoices

1. Navigate to **Finance** → **Invoices**
2. Create invoice from sales order
3. System automatically calculates:
   - CGST/SGST for intra-state transactions
   - IGST for inter-state transactions
4. Generate e-invoice with IRN and QR code
5. Download PDF or send to customer

## 🔧 Configuration

### Adding New Roles

Edit `prisma/seed.ts` to add custom roles with specific permissions.

### Customizing GST Rates

Update tax rates in the `TaxRate` model or modify the `calculateGST` function in `lib/gst.ts`.

### Adding New Modules

1. Create a new router in `server/api/routers/`
2. Add to root router in `server/api/root.ts`
3. Create corresponding UI pages in `app/dashboard/`

## 📊 Database Schema

The system uses 50+ database models covering:

- **Authentication**: User, Role, Permission, RolePermission
- **Finance**: Invoice, Bill, Payment, TaxRate, GSTReturn
- **CRM**: Customer, Contact, Quotation, SalesOrder
- **Production**: Job, JobTicket, Machine, MachineSchedule, QualityCheck
- **Inventory**: Material, Stock, PurchaseOrder, GoodsReceipt, MaterialIssue
- **Logistics**: Shipment, EWayBill
- **HR**: Employee, Attendance, Leave, Payroll, Shift
- **System**: KPI, Alert, AuditLog

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Manual Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

## 📝 License

This project is proprietary software developed for Skyprint.

## 🤝 Support

For support and queries, contact: admin@skyprint.com

---

**Built with ❤️ for Skyprint - Transforming Printing Business Management**
