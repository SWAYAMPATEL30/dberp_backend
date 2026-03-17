import { z } from "zod";
import { createTRPCRouter, protectedProcedure, hasPermission } from "../trpc";
import { randomUUID } from "crypto";

export const crmRouter = createTRPCRouter({
    // ============================================
    // CUSTOMERS
    // ============================================

    createCustomer: protectedProcedure
        .use(hasPermission("crm", "create"))
        .input(
            z.object({
                name: z.string(),
                email: z.string().email().optional(),
                phone: z.string().optional(),
                gstin: z.string().optional(),
                pan: z.string().optional(),
                billingAddress: z.string().optional(),
                shippingAddress: z.string().optional(),
                city: z.string().optional(),
                state: z.string().optional(),
                pincode: z.string().optional(),
                creditLimit: z.number().optional(),
                creditDays: z.number().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const code = `CUST${Date.now().toString().slice(-6)}`;

            return await ctx.prisma.customer.create({
                data: {
                    id: randomUUID(),
                    updatedAt: new Date(),
                    code,
                    ...input,
                },
            });
        }),

    getCustomers: protectedProcedure
        .use(hasPermission("crm", "read"))
        .input(
            z.object({
                search: z.string().optional(),
                limit: z.number().default(50),
                offset: z.number().default(0),
            })
        )
        .query(async ({ ctx, input }) => {
            const where: any = { isActive: true };

            if (input.search) {
                where.OR = [
                    { name: { contains: input.search, mode: "insensitive" } },
                    { code: { contains: input.search, mode: "insensitive" } },
                    { email: { contains: input.search, mode: "insensitive" } },
                ];
            }

            const [customers, total] = await Promise.all([
                ctx.prisma.customer.findMany({
                    where,
                    include: {
                        _count: {
                            select: {
                                SalesOrder: true,
                                Invoice: true,
                            },
                        },
                    },
                    orderBy: { createdAt: "desc" },
                    take: input.limit,
                    skip: input.offset,
                }),
                ctx.prisma.customer.count({ where }),
            ]);

            return { customers, total };
        }),

    getCustomer: protectedProcedure
        .use(hasPermission("crm", "read"))
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            return await ctx.prisma.customer.findUnique({
                where: { id: input.id },
                include: {
                    Contact: true,
                    Quotation: { orderBy: { createdAt: "desc" }, take: 10 },
                    SalesOrder: { orderBy: { createdAt: "desc" }, take: 10 },
                    Invoice: { orderBy: { createdAt: "desc" }, take: 10 },
                },
            });
        }),

    // ============================================
    // QUOTATIONS
    // ============================================

    createQuotation: protectedProcedure
        .use(hasPermission("crm", "create"))
        .input(
            z.object({
                customerId: z.string(),
                quotationDate: z.date(),
                validUntil: z.date(),
                items: z.array(
                    z.object({
                        description: z.string(),
                        specifications: z.string().optional(),
                        productType: z.string().optional(),
                        size: z.string().optional(),
                        quantity: z.number(),
                        paperType: z.string().optional(),
                        paperGsm: z.number().optional(),
                        colors: z.string().optional(),
                        finishing: z.string().optional(),
                        paperCost: z.number().default(0),
                        inkCost: z.number().default(0),
                        plateCost: z.number().default(0),
                        laborCost: z.number().default(0),
                        machineCost: z.number().default(0),
                        finishingCost: z.number().default(0),
                        overheadCost: z.number().default(0),
                        unitPrice: z.number(),
                        taxRate: z.number(),
                    })
                ),
                discount: z.number().default(0),
                notes: z.string().optional(),
                terms: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const quotationNumber = `QT${Date.now()}`;

            let subtotal = 0;
            const items = input.items.map((item) => {
                const amount = item.quantity * item.unitPrice;
                subtotal += amount;
                return {
                    id: randomUUID(),
                    ...item,
                    amount,
                };
            });

            const tax = subtotal * 0.18; // 18% GST
            const totalAmount = subtotal + tax - input.discount;

            return await ctx.prisma.quotation.create({
                data: {
                    id: randomUUID(),
                    updatedAt: new Date(),
                    quotationNumber,
                    quotationDate: input.quotationDate,
                    validUntil: input.validUntil,
                    customerId: input.customerId,
                    subtotal,
                    tax,
                    discount: input.discount,
                    totalAmount,
                    notes: input.notes,
                    terms: input.terms,
                    QuotationItem: {
                        create: items,
                    },
                },
                include: {
                    QuotationItem: true,
                    Customer: true,
                },
            });
        }),

    getQuotations: protectedProcedure
        .use(hasPermission("crm", "read"))
        .input(
            z.object({
                status: z.string().optional(),
                customerId: z.string().optional(),
                limit: z.number().default(50),
                offset: z.number().default(0),
            })
        )
        .query(async ({ ctx, input }) => {
            const where: any = {};

            if (input.status) where.status = input.status;
            if (input.customerId) where.customerId = input.customerId;

            const [quotations, total] = await Promise.all([
                ctx.prisma.quotation.findMany({
                    where,
                    include: {
                        Customer: true,
                        QuotationItem: true,
                    },
                    orderBy: { createdAt: "desc" },
                    take: input.limit,
                    skip: input.offset,
                }),
                ctx.prisma.quotation.count({ where }),
            ]);

            return { quotations, total };
        }),

    convertToOrder: protectedProcedure
        .use(hasPermission("crm", "create"))
        .input(
            z.object({
                quotationId: z.string(),
                deliveryDate: z.date(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const quotation = await ctx.prisma.quotation.findUnique({
                where: { id: input.quotationId },
                include: { QuotationItem: true },
            });

            if (!quotation) {
                throw new Error("Quotation not found");
            }

            if (quotation.status === "converted") {
                throw new Error("Quotation already converted");
            }

            const orderNumber = `SO${Date.now()}`;

            const salesOrder = await ctx.prisma.salesOrder.create({
                data: {
                    id: randomUUID(),
                    updatedAt: new Date(),
                    orderNumber,
                    orderDate: new Date(),
                    deliveryDate: input.deliveryDate,
                    customerId: quotation.customerId,
                    quotationId: quotation.id,
                    subtotal: quotation.subtotal,
                    tax: quotation.tax,
                    discount: quotation.discount,
                    totalAmount: quotation.totalAmount,
                    status: "confirmed",
                    createdById: ctx.session.user.id,
                    SalesOrderItem: {
                        create: quotation.QuotationItem.map((item) => ({
                            id: randomUUID(),
                            description: item.description,
                            specifications: item.specifications,
                            productType: item.productType,
                            size: item.size,
                            quantity: item.quantity,
                            paperType: item.paperType,
                            paperGsm: item.paperGsm,
                            colors: item.colors,
                            finishing: item.finishing,
                            unitPrice: item.unitPrice,
                            taxRate: item.taxRate,
                            amount: item.amount,
                        })),
                    },
                },
                include: {
                    SalesOrderItem: true,
                    Customer: true,
                },
            });

            await ctx.prisma.quotation.update({
                where: { id: input.quotationId },
                data: { status: "converted", updatedAt: new Date() },
            });

            return salesOrder;
        }),

    // ============================================
    // SALES ORDERS
    // ============================================

    createSalesOrder: protectedProcedure
        .use(hasPermission("crm", "create"))
        .input(
            z.object({
                customerId: z.string(),
                orderDate: z.date(),
                deliveryDate: z.date(),
                items: z.array(
                    z.object({
                        description: z.string(),
                        specifications: z.string().optional(),
                        productType: z.string().optional(),
                        size: z.string().optional(),
                        quantity: z.number(),
                        paperType: z.string().optional(),
                        paperGsm: z.number().optional(),
                        colors: z.string().optional(),
                        finishing: z.string().optional(),
                        unitPrice: z.number(),
                        taxRate: z.number(),
                    })
                ),
                discount: z.number().default(0),
                priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
                notes: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const orderNumber = `SO${Date.now()}`;

            let subtotal = 0;
            const items = input.items.map((item) => {
                const amount = item.quantity * item.unitPrice;
                subtotal += amount;
                return {
                    id: randomUUID(),
                    ...item,
                    amount,
                };
            });

            const tax = subtotal * 0.18;
            const totalAmount = subtotal + tax - input.discount;

            return await ctx.prisma.salesOrder.create({
                data: {
                    id: randomUUID(),
                    updatedAt: new Date(),
                    orderNumber,
                    orderDate: input.orderDate,
                    deliveryDate: input.deliveryDate,
                    customerId: input.customerId,
                    subtotal,
                    tax,
                    discount: input.discount,
                    totalAmount,
                    priority: input.priority,
                    status: "confirmed",
                    notes: input.notes,
                    createdById: ctx.session.user.id,
                    SalesOrderItem: {
                        create: items,
                    },
                },
                include: {
                    SalesOrderItem: true,
                    Customer: true,
                },
            });
        }),

    getSalesOrders: protectedProcedure
        .use(hasPermission("crm", "read"))
        .input(
            z.object({
                status: z.string().optional(),
                customerId: z.string().optional(),
                limit: z.number().default(50),
                offset: z.number().default(0),
            })
        )
        .query(async ({ ctx, input }) => {
            const where: any = {};

            if (input.status) where.status = input.status;
            if (input.customerId) where.customerId = input.customerId;

            const [orders, total] = await Promise.all([
                ctx.prisma.salesOrder.findMany({
                    where,
                    include: {
                        Customer: true,
                        SalesOrderItem: true,
                        _count: {
                            select: { Job: true },
                        },
                    },
                    orderBy: { createdAt: "desc" },
                    take: input.limit,
                    skip: input.offset,
                }),
                ctx.prisma.salesOrder.count({ where }),
            ]);

            return { orders, total };
        }),

    getSalesOrder: protectedProcedure
        .use(hasPermission("crm", "read"))
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            return await ctx.prisma.salesOrder.findUnique({
                where: { id: input.id },
                include: {
                    Customer: true,
                    SalesOrderItem: true,
                    Job: true,
                    Invoice: true,
                    Shipment: true,
                },
            });
        }),
});
