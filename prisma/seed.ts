
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Starting FINAL database seed for Skyprint ERP...");

    // Clean up existing data (Reverse dependency order to avoid FK errors)
    console.log("Cleaning up existing data...");

    // Level 6
    await prisma.eWayBill.deleteMany().catch(() => { });
    await prisma.transaction.deleteMany().catch(() => { });

    // Level 5
    await prisma.stockAdjustment.deleteMany().catch(() => { });
    await prisma.shipment.deleteMany().catch(() => { });
    await prisma.payment.deleteMany().catch(() => { });
    await prisma.goodsReceiptItem.deleteMany().catch(() => { });
    await prisma.goodsReceipt.deleteMany().catch(() => { });
    await prisma.jobTicket.deleteMany().catch(() => { });
    await prisma.machineSchedule.deleteMany().catch(() => { });
    await prisma.qualityCheck.deleteMany().catch(() => { });
    await prisma.jobProgress.deleteMany().catch(() => { });

    // Level 4
    await prisma.payroll.deleteMany().catch(() => { });
    await prisma.attendance.deleteMany().catch(() => { });
    await prisma.leave.deleteMany().catch(() => { });
    await (prisma as any).startStopCheck?.deleteMany().catch(() => { }); // Handle potential optional/renamed models
    await prisma.purchaseOrderItem.deleteMany().catch(() => { });
    await prisma.purchaseOrder.deleteMany().catch(() => { });
    await prisma.billItem.deleteMany().catch(() => { });
    await prisma.bill.deleteMany().catch(() => { });
    await prisma.stock.deleteMany().catch(() => { });
    await prisma.materialIssue.deleteMany().catch(() => { });
    await prisma.invoiceItem.deleteMany().catch(() => { });
    await prisma.invoice.deleteMany().catch(() => { });

    // Level 3
    await prisma.job.deleteMany().catch(() => { });
    await prisma.salesOrderItem.deleteMany().catch(() => { });
    await prisma.salesOrder.deleteMany().catch(() => { });
    await prisma.quotationItem.deleteMany().catch(() => { });
    await prisma.quotation.deleteMany().catch(() => { });
    await prisma.shiftAssignment.deleteMany().catch(() => { });

    // Level 2
    await prisma.contact.deleteMany().catch(() => { });
    await prisma.account.deleteMany().catch(() => { });
    await prisma.machineMaintenance.deleteMany().catch(() => { });

    // Level 1 (Base)
    await prisma.shift.deleteMany().catch(() => { });
    await prisma.employee.deleteMany().catch(() => { });
    await prisma.customer.deleteMany().catch(() => { });
    await prisma.vendor.deleteMany().catch(() => { });
    await prisma.material.deleteMany().catch(() => { });
    await prisma.machine.deleteMany().catch(() => { });
    await prisma.user.deleteMany().catch(() => { });
    await prisma.rolePermission.deleteMany().catch(() => { });
    await prisma.role.deleteMany().catch(() => { });
    await prisma.permission.deleteMany().catch(() => { });

    // --- 1. CORE AUTH & PERMISSIONS ---
    console.log("Creating Permissions & Roles...");
    const modules = ["users", "finance", "crm", "production", "inventory", "logistics", "hr"];
    const actions = ["create", "read", "update", "delete"];
    const permissionData = modules.flatMap(module =>
        actions.map(action => ({
            name: `${module}.${action}`,
            module,
            action,
            description: `${action} ${module}`
        }))
    );

    const permissions = await Promise.all(
        permissionData.map(p => prisma.permission.create({
            data: { id: randomUUID(), ...p }
        }))
    );

    const adminRole = await prisma.role.create({
        data: {
            id: randomUUID(),
            updatedAt: new Date(),
            name: "Admin",
            description: "Full system access",
            RolePermission: {
                create: permissions.map(p => ({ id: randomUUID(), permissionId: p.id }))
            }
        }
    });

    const hashedPassword = await bcrypt.hash("123", 10);
    const adminUser = await prisma.user.create({
        data: {
            id: randomUUID(),
            updatedAt: new Date(),
            email: "sky@gmail.com",
            password: hashedPassword,
            name: "Admin User",
            phone: "+91 9876543210",
            roleId: adminRole.id,
            isActive: true,
        }
    });

    // --- 2. BASE MASTER DATA ---
    console.log("Creating Master Data (Customers, Vendors, Materials, Machines)...");

    // Customers
    const customers = await Promise.all([
        { name: "Tech Corp", city: "Mumbai", state: "Maharashtra" },
        { name: "Retail Giants", city: "Delhi", state: "Delhi" },
        { name: "Edu Books", city: "Pune", state: "Maharashtra" },
        { name: "Health Care Inc", city: "Bangalore", state: "Karnataka" },
        { name: "Foodies Ltd", city: "Chennai", state: "Tamil Nadu" }
    ].map((c, i) => prisma.customer.create({
        data: {
            id: randomUUID(),
            updatedAt: new Date(),
            code: `CUST00${i + 1}`,
            name: c.name,
            email: `contact@${c.name.toLowerCase().replace(/ /g, "")}.com`,
            phone: `+91 987654321${i}`,
            billingAddress: `123 ${c.city} Road`,
            city: c.city,
            state: c.state,
            pincode: "400001",
            isActive: true
        }
    })));

    // Vendors
    const vendors = await Promise.all([
        { name: "Paper Mill A", type: "Paper" },
        { name: "Ink Systems", type: "Ink" },
        { name: "Pack Mat Ltd", type: "Packaging" },
        { name: "Chem Traders", type: "Chemicals" },
        { name: "Office Supplies", type: "General" }
    ].map((v, i) => prisma.vendor.create({
        data: {
            id: randomUUID(),
            updatedAt: new Date(),
            code: `VEND00${i + 1}`,
            name: v.name,
            email: `sales@${v.name.toLowerCase().replace(/ /g, "")}.com`,
            city: "Mumbai",
            state: "Maharashtra",
            isActive: true
        }
    })));

    // Materials
    const materials = await Promise.all([
        { name: "Glossy Paper A4", category: "paper", unit: "ream", cost: 500 },
        { name: "Cyan Ink", category: "ink", unit: "liter", cost: 1200 },
        { name: "Binding Glue", category: "chemical", unit: "kg", cost: 250 },
        { name: "Cardboard Sheets", category: "packaging", unit: "sheet", cost: 20 },
        { name: "Laminating Roll", category: "film", unit: "roll", cost: 800 }
    ].map((m, i) => prisma.material.create({
        data: {
            id: randomUUID(),
            updatedAt: new Date(),
            code: `MAT00${i + 1}`,
            name: m.name,
            category: m.category,
            unit: m.unit,
            standardCost: m.cost,
            reorderPoint: 50,
            isActive: true
        }
    })));

    // Machines
    const machines = await Promise.all([
        { name: "Heidelberg Speedmaster", type: "Offset" },
        { name: "HP Indigo", type: "Digital" },
        { name: "Polar Cutter", type: "Finishing" },
        { name: "Horizon Binder", type: "Binding" },
        { name: "Komori Lithrone", type: "Offset" }
    ].map((m, i) => prisma.machine.create({
        data: {
            id: randomUUID(),
            updatedAt: new Date(),
            code: `MACH00${i + 1}`,
            name: m.name,
            type: m.type,
            hourlyRate: 1500,
            isActive: true
        }
    })));

    // Shifts
    const shifts = await Promise.all([
        { name: "Morning", start: "08:00", end: "16:00" },
        { name: "Evening", start: "16:00", end: "00:00" },
        { name: "Night", start: "00:00", end: "08:00" }
    ].map(s => prisma.shift.create({
        data: {
            id: randomUUID(),
            updatedAt: new Date(),
            name: s.name,
            startTime: s.start,
            endTime: s.end,
            isActive: true
        }
    })));

    // Employees
    const employees = await Promise.all([
        { name: "John Doe", dept: "Production", role: "Operator" },
        { name: "Jane Smith", dept: "Sales", role: "Manager" },
        { name: "Bob Wilson", dept: "HR", role: "Executive" },
        { name: "Alice Brown", dept: "Finance", role: "Accountant" },
        { name: "Charlie Day", dept: "Logistics", role: "Supervisor" }
    ].map((e, i) => prisma.employee.create({
        data: {
            id: randomUUID(),
            updatedAt: new Date(),
            employeeCode: `EMP00${i + 1}`,
            firstName: e.name.split(" ")[0],
            lastName: e.name.split(" ")[1],
            email: `${e.name.toLowerCase().replace(" ", ".")}@skyprint.com`,
            department: e.dept,
            designation: e.role,
            basicSalary: 30000,
            dateOfJoining: new Date(),
            isActive: true
        }
    })));

    // --- 3. INVENTORY & PROCUREMENT ---
    console.log("Creating Inventory Data (Stock, POs, GRs)...");

    // Initial Stock
    await Promise.all(materials.map(m => prisma.stock.create({
        data: {
            id: randomUUID(),
            updatedAt: new Date(),
            materialId: m.id,
            location: "Main Warehouse",
            quantity: 1000,
            value: 1000 * (Number(m.standardCost) || 0)
        }
    })));

    // Purchase Orders & Goods Receipts
    for (let i = 0; i < 5; i++) {
        const po = await prisma.purchaseOrder.create({
            data: {
                id: randomUUID(),
                updatedAt: new Date(),
                poNumber: `PO-2024-${100 + i}`,
                poDate: new Date(),
                vendorId: vendors[i].id,
                subtotal: 5000,
                tax: 900,
                totalAmount: 5900,
                status: "received",
                PurchaseOrderItem: {
                    create: [{
                        id: randomUUID(),
                        materialId: materials[i].id,
                        quantity: 100,
                        unitPrice: Number(materials[i].standardCost),
                        taxRate: 18,
                        amount: 100 * Number(materials[i].standardCost)
                    }]
                }
            }
        });

        // GR for PO
        await prisma.goodsReceipt.create({
            data: {
                id: randomUUID(),
                createdAt: new Date(),
                grNumber: `GR-2024-${100 + i}`,
                grDate: new Date(),
                poId: po.id,
                GoodsReceiptItem: {
                    create: [{
                        id: randomUUID(),
                        materialId: materials[i].id,
                        quantity: 100,
                        unitCost: Number(materials[i].standardCost)
                    }]
                }
            }
        });
    }

    // --- 4. CRM & SALES ---
    console.log("Creating CRM Data (Quotations, SOs)...");
    const salesOrders = [];

    for (let i = 0; i < 5; i++) {
        // Quotation
        const qt = await prisma.quotation.create({
            data: {
                id: randomUUID(),
                updatedAt: new Date(),
                quotationNumber: `QT-2024-${100 + i}`,
                quotationDate: new Date(),
                validUntil: new Date(Date.now() + 86400000 * 30),
                customerId: customers[i].id,
                subtotal: 10000,
                tax: 1800,
                totalAmount: 11800,
                status: "approved",
                QuotationItem: {
                    create: [{
                        id: randomUUID(),
                        description: "Marketing Brochures",
                        quantity: 2000,
                        unitPrice: 5,
                        taxRate: 18,
                        amount: 10000
                    }]
                }
            }
        });

        // Sales Order (Linked to Quotation)
        const so = await prisma.salesOrder.create({
            data: {
                id: randomUUID(),
                updatedAt: new Date(),
                orderNumber: `SO-2024-${100 + i}`,
                orderDate: new Date(),
                deliveryDate: new Date(Date.now() + 86400000 * 10),
                customerId: customers[i].id,
                quotationId: qt.id,
                subtotal: 10000,
                tax: 1800,
                totalAmount: 11800,
                status: "confirmed",
                priority: i % 2 === 0 ? "high" : "normal",
                createdById: adminUser.id,
                SalesOrderItem: {
                    create: [{
                        id: randomUUID(),
                        description: "Marketing Brochures",
                        quantity: 2000,
                        unitPrice: 5,
                        taxRate: 18,
                        amount: 10000
                    }]
                }
            }
        });
        salesOrders.push(so);
    }

    // --- 5. PRODUCTION ---
    console.log("Creating Production Data (Jobs, Schedules)...");
    const jobs = [];

    for (let i = 0; i < 5; i++) {
        const job = await prisma.job.create({
            data: {
                id: randomUUID(),
                updatedAt: new Date(),
                jobNumber: `JOB-2024-${100 + i}`,
                salesOrderId: salesOrders[i].id,
                description: "Print 5000 Brochures",
                quantity: 2000,
                dueDate: new Date(Date.now() + 86400000 * 7),
                status: "in_progress",
                estimatedCost: 4000,
                createdById: adminUser.id,
            }
        });
        jobs.push(job);

        // Machine Schedule
        await prisma.machineSchedule.create({
            data: {
                id: randomUUID(),
                updatedAt: new Date(),
                machineId: machines[i].id,
                jobId: job.id,
                startTime: new Date(),
                endTime: new Date(Date.now() + 3600000 * 4), // 4 hours later
                status: "scheduled"
            }
        });
    }

    // --- 6. LOGISTICS ---
    console.log("Creating Logistics Data (Shipments)...");
    for (let i = 0; i < 5; i++) {
        await prisma.shipment.create({
            data: {
                id: randomUUID(),
                updatedAt: new Date(),
                shipmentNumber: `SHP-2024-${100 + i}`,
                salesOrderId: salesOrders[i].id,
                shipmentDate: new Date(),
                status: "shipped",
                courierName: "BlueDart",
                trackingNumber: `BD${10000 + i}`,
                EWayBill: {
                    create: {
                        id: randomUUID(),
                        updatedAt: new Date(),
                        eWayBillNo: `EWB${50000 + i}`,
                        docType: "Tax Invoice",
                        docNumber: `INV-2024-${100 + i}`,
                        docDate: new Date(),
                        vehicleNumber: "MH01AB1234"
                    }
                }
            }
        });
    }

    // --- 7. FINANCE ---
    console.log("Creating Finance Data (Invoices, Bills, Accounts)...");

    // Accounts (Chart of Accounts)
    const accounts = await Promise.all([
        { name: "Cash on Hand", type: "Asset", code: "1001" },
        { name: "Bank Account", type: "Asset", code: "1002" },
        { name: "Sales Revenue", type: "Income", code: "4001" },
        { name: "Purchase Expense", type: "Expense", code: "5001" },
        { name: "Salaries", type: "Expense", code: "5002" }
    ].map(a => prisma.account.create({
        data: {
            id: randomUUID(),
            updatedAt: new Date(),
            name: a.name,
            type: a.type,
            code: a.code
        }
    })));

    // Invoices (Receivable)
    for (let i = 0; i < 5; i++) {
        await prisma.invoice.create({
            data: {
                id: randomUUID(),
                updatedAt: new Date(),
                invoiceNumber: `INV-2024-${100 + i}`,
                invoiceDate: new Date(),
                dueDate: new Date(Date.now() + 86400000 * 15),
                customerId: customers[i].id,
                salesOrderId: salesOrders[i].id,
                placeOfSupply: customers[i].state || "State",
                subtotal: 10000,
                igst: 1800,
                totalAmount: 11800,
                status: "sent",
                createdById: adminUser.id,
                InvoiceItem: {
                    create: [{
                        id: randomUUID(),
                        description: "Brochures",
                        quantity: 2000,
                        unitPrice: 5,
                        taxRate: 18,
                        amount: 10000
                    }]
                }
            }
        });
    }

    // Bills (Payable)
    for (let i = 0; i < 5; i++) {
        await prisma.bill.create({
            data: {
                id: randomUUID(),
                updatedAt: new Date(),
                billNumber: `BILL-2024-${100 + i}`,
                billDate: new Date(),
                dueDate: new Date(Date.now() + 86400000 * 30),
                vendorId: vendors[i].id,
                subtotal: 5000,
                totalAmount: 5000, // Simplified tax
                status: "received",
                BillItem: {
                    create: [{
                        id: randomUUID(),
                        description: "Raw Material Supply",
                        quantity: 100,
                        unitPrice: 50,
                        taxRate: 0,
                        amount: 5000
                    }]
                }
            }
        });
    }

    // --- 8. HR & PAYROLL ---
    console.log("Creating HR Data (Attendance, Payroll)...");
    const today = new Date();

    // Attendance for last 5 days
    for (const emp of employees) {
        for (let d = 0; d < 5; d++) {
            const date = new Date();
            date.setDate(today.getDate() - d);

            await prisma.attendance.create({
                data: {
                    id: randomUUID(),
                    updatedAt: new Date(),
                    employeeId: emp.id,
                    date: date,
                    checkIn: new Date(date.setHours(9, 0, 0)),
                    checkOut: new Date(date.setHours(18, 0, 0)),
                    status: "present",
                    workHours: 9
                }
            });
        }

        // Assign Shift
        await prisma.shiftAssignment.create({
            data: {
                id: randomUUID(),
                createdAt: new Date(),
                employeeId: emp.id,
                shiftId: shifts[0].id, // Morning shift for all
                date: new Date()
            }
        });

        // Create Payroll for current month
        await prisma.payroll.create({
            data: {
                id: randomUUID(),
                updatedAt: new Date(),
                employeeId: emp.id,
                month: today.getMonth() + 1,
                year: today.getFullYear(),
                basicSalary: emp.basicSalary || 0,
                grossSalary: emp.basicSalary || 0,
                totalDeductions: 0,
                netSalary: emp.basicSalary || 0,
                status: "draft"
            }
        });
    }

    console.log("✅ COMPREHENSIVE SEED COMPLETE!");
    console.log("Modules Seeded: Auth, CRM, Production, Inventory, Logistics, Finance, HR");
}

main()
    .catch((e) => {
        console.error("❌ Error seeding database:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
