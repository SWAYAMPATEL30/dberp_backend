import { z } from "zod";
import { createTRPCRouter, protectedProcedure, hasPermission } from "../trpc";
import { randomUUID } from "crypto";

export const inventoryRouter = createTRPCRouter({
    // ============================================
    // MATERIALS
    // ============================================

    createMaterial: protectedProcedure
        .use(hasPermission("inventory", "create"))
        .input(
            z.object({
                name: z.string(),
                category: z.enum(["paper", "ink", "plate", "chemical", "finishing"]),
                unit: z.string(),
                size: z.string().optional(),
                gsm: z.number().optional(),
                reorderPoint: z.number().optional(),
                reorderQty: z.number().optional(),
                standardCost: z.number().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const code = `MAT${Date.now().toString().slice(-6)}`;

            const material = await ctx.prisma.material.create({
                data: {
                    id: randomUUID(),
                    updatedAt: new Date(),
                    code,
                    ...input,
                },
            });

            // Initialize stock
            await ctx.prisma.stock.create({
                data: {
                    id: randomUUID(),
                    updatedAt: new Date(),
                    materialId: material.id,
                    quantity: 0,
                    value: 0,
                },
            });

            return material;
        }),

    getMaterials: protectedProcedure
        .use(hasPermission("inventory", "read"))
        .input(
            z.object({
                category: z.string().optional(),
                search: z.string().optional(),
                limit: z.number().default(100),
                offset: z.number().default(0),
            })
        )
        .query(async ({ ctx, input }) => {
            const where: any = { isActive: true };

            if (input.category) where.category = input.category;
            if (input.search) {
                where.OR = [
                    { name: { contains: input.search, mode: "insensitive" } },
                    { code: { contains: input.search, mode: "insensitive" } },
                ];
            }

            const [materials, total] = await Promise.all([
                ctx.prisma.material.findMany({
                    where,
                    include: {
                        Stock: true,
                    },
                    orderBy: { name: "asc" },
                    take: input.limit,
                    skip: input.offset,
                }),
                ctx.prisma.material.count({ where }),
            ]);

            return { materials, total };
        }),

    // ============================================
    // PURCHASE ORDERS
    // ============================================

    createPurchaseOrder: protectedProcedure
        .use(hasPermission("inventory", "create"))
        .input(
            z.object({
                vendorId: z.string(),
                poDate: z.date(),
                deliveryDate: z.date().optional(),
                items: z.array(
                    z.object({
                        materialId: z.string(),
                        description: z.string().optional(),
                        quantity: z.number(),
                        unitPrice: z.number(),
                        taxRate: z.number(),
                    })
                ),
                notes: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const poNumber = `PO${Date.now()}`;

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
            const totalAmount = subtotal + tax;

            return await ctx.prisma.purchaseOrder.create({
                data: {
                    id: randomUUID(),
                    updatedAt: new Date(),
                    poNumber,
                    poDate: input.poDate,
                    vendorId: input.vendorId,
                    deliveryDate: input.deliveryDate,
                    subtotal,
                    tax,
                    totalAmount,
                    status: "draft",
                    notes: input.notes,
                    PurchaseOrderItem: {
                        create: items,
                    },
                },
                include: {
                    PurchaseOrderItem: {
                        include: {
                            Material: true,
                        },
                    },
                    Vendor: true,
                },
            });
        }),

    getPurchaseOrders: protectedProcedure
        .use(hasPermission("inventory", "read"))
        .input(
            z.object({
                status: z.string().optional(),
                vendorId: z.string().optional(),
                limit: z.number().default(50),
                offset: z.number().default(0),
            })
        )
        .query(async ({ ctx, input }) => {
            const where: any = {};

            if (input.status) where.status = input.status;
            if (input.vendorId) where.vendorId = input.vendorId;

            const [pos, total] = await Promise.all([
                ctx.prisma.purchaseOrder.findMany({
                    where,
                    include: {
                        Vendor: true,
                        PurchaseOrderItem: {
                            include: {
                                Material: true,
                            },
                        },
                    },
                    orderBy: { poDate: "desc" },
                    take: input.limit,
                    skip: input.offset,
                }),
                ctx.prisma.purchaseOrder.count({ where }),
            ]);

            return { purchaseOrders: pos, total };
        }),

    recordGoodsReceipt: protectedProcedure
        .use(hasPermission("inventory", "create"))
        .input(
            z.object({
                poId: z.string(),
                grDate: z.date(),
                items: z.array(
                    z.object({
                        materialId: z.string(),
                        quantity: z.number(),
                        unitCost: z.number(),
                        batchNo: z.string().optional(),
                    })
                ),
                notes: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const grNumber = `GR${Date.now()}`;

            const grItems = input.items.map((item) => ({
                id: randomUUID(),
                ...item,
            }));

            const gr = await ctx.prisma.goodsReceipt.create({
                data: {
                    id: randomUUID(),
                    grNumber,
                    grDate: input.grDate,
                    poId: input.poId,
                    notes: input.notes,
                    GoodsReceiptItem: {
                        create: grItems,
                    },
                },
                include: {
                    GoodsReceiptItem: {
                        include: {
                            Material: true,
                        },
                    },
                },
            });

            // Update stock
            for (const item of input.items) {
                const stock = await ctx.prisma.stock.findFirst({
                    where: {
                        materialId: item.materialId,
                        location: "main_warehouse",
                    },
                });

                if (stock) {
                    const newQty = Number(stock.quantity) + item.quantity;
                    const newValue = Number(stock.value) + item.quantity * item.unitCost;

                    await ctx.prisma.stock.update({
                        where: { id: stock.id },
                        data: {
                            quantity: newQty,
                            value: newValue,
                        },
                    });
                }
            }

            // Update PO received quantities
            for (const item of input.items) {
                const poItem = await ctx.prisma.purchaseOrderItem.findFirst({
                    where: {
                        poId: input.poId,
                        materialId: item.materialId,
                    },
                });

                if (poItem) {
                    await ctx.prisma.purchaseOrderItem.update({
                        where: { id: poItem.id },
                        data: {
                            receivedQty: Number(poItem.receivedQty) + item.quantity,
                        },
                    });
                }
            }

            return gr;
        }),

    // ============================================
    // MATERIAL ISSUE
    // ============================================

    issueMaterial: protectedProcedure
        .use(hasPermission("inventory", "create"))
        .input(
            z.object({
                jobId: z.string(),
                materialId: z.string(),
                quantity: z.number(),
                wastage: z.number().default(0),
                notes: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const issueNumber = `MI${Date.now()}`;

            // Check stock availability
            const stock = await ctx.prisma.stock.findFirst({
                where: {
                    materialId: input.materialId,
                    location: "main_warehouse",
                },
            });

            if (!stock || Number(stock.quantity) < input.quantity) {
                throw new Error("Insufficient stock");
            }

            const issue = await ctx.prisma.materialIssue.create({
                data: {
                    id: randomUUID(),
                    issueNumber,
                    issueDate: new Date(),
                    jobId: input.jobId,
                    materialId: input.materialId,
                    quantity: input.quantity,
                    wastage: input.wastage,
                    notes: input.notes,
                    issuedBy: ctx.session.user.name,
                },
                include: {
                    Material: true,
                    Job: true,
                },
            });

            // Update stock
            const material = await ctx.prisma.material.findUnique({
                where: { id: input.materialId },
            });

            const unitCost = material?.standardCost || 0;
            const newQty = Number(stock.quantity) - input.quantity;
            const newValue = Number(stock.value) - input.quantity * Number(unitCost);

            await ctx.prisma.stock.update({
                where: { id: stock.id },
                data: {
                    quantity: newQty,
                    value: newValue,
                },
            });

            // Update job actual cost
            const job = await ctx.prisma.job.findUnique({
                where: { id: input.jobId },
            });

            if (job) {
                const materialCost = input.quantity * Number(unitCost);
                await ctx.prisma.job.update({
                    where: { id: input.jobId },
                    data: {
                        actualCost: Number(job.actualCost) + materialCost,
                    },
                });
            }

            return issue;
        }),

    // ============================================
    // STOCK & MRP
    // ============================================

    getStockLevels: protectedProcedure
        .use(hasPermission("inventory", "read"))
        .query(async ({ ctx }) => {
            const materials = await ctx.prisma.material.findMany({
                where: { isActive: true },
                include: {
                    Stock: true,
                },
            });

            const lowStock = materials.filter((m) => {
                const totalQty = m.Stock.reduce((sum: any, s: any) => sum + Number(s.quantity), 0);
                return m.reorderPoint && totalQty <= Number(m.reorderPoint);
            });

            return {
                materials,
                lowStock,
            };
        }),

    getMRPSuggestions: protectedProcedure
        .use(hasPermission("inventory", "read"))
        .query(async ({ ctx }) => {
            // Get pending and scheduled jobs
            const jobs = await ctx.prisma.job.findMany({
                where: {
                    status: { in: ["pending", "scheduled"] },
                },
                include: {
                    SalesOrder: {
                        include: {
                            SalesOrderItem: true,
                        },
                    },
                },
            });

            // This is a simplified MRP - in production, you'd calculate based on BOM
            const suggestions: any[] = [];

            // Get materials with low stock
            const materials = await ctx.prisma.material.findMany({
                where: { isActive: true },
                include: {
                    Stock: true,
                },
            });

            for (const material of materials) {
                const totalQty = material.Stock.reduce(
                    (sum, s) => sum + Number(s.quantity),
                    0
                );

                if (material.reorderPoint && totalQty <= Number(material.reorderPoint)) {
                    suggestions.push({
                        material,
                        currentStock: totalQty,
                        reorderPoint: material.reorderPoint,
                        suggestedQty: material.reorderQty || 0,
                        reason: "Below reorder point",
                    });
                }
            }

            return suggestions;
        }),

    // ============================================
    // VENDORS
    // ============================================

    getVendors: protectedProcedure
        .use(hasPermission("inventory", "read"))
        .query(async ({ ctx }) => {
            return await ctx.prisma.vendor.findMany({
                where: { isActive: true },
                include: {
                    _count: {
                        select: {
                            PurchaseOrder: true,
                        },
                    },
                },
                orderBy: { name: "asc" },
            });
        }),
});
