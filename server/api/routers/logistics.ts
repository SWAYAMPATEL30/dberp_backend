import { z } from "zod";
import { createTRPCRouter, protectedProcedure, hasPermission } from "../trpc";
import { randomUUID } from "crypto";

export const logisticsRouter = createTRPCRouter({
    createShipment: protectedProcedure
        .use(hasPermission("logistics", "create"))
        .input(
            z.object({
                salesOrderId: z.string(),
                shipmentDate: z.date(),
                courierName: z.string().optional(),
                trackingNumber: z.string().optional(),
                vehicleNumber: z.string().optional(),
                driverName: z.string().optional(),
                driverPhone: z.string().optional(),
                notes: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const shipmentNumber = `SHIP${Date.now()}`;

            return await ctx.prisma.shipment.create({
                data: {
                    id: randomUUID(),
                    updatedAt: new Date(),
                    shipmentNumber,
                    ...input,
                    status: "pending",
                },
                include: {
                    SalesOrder: {
                        include: {
                            Customer: true,
                        },
                    },
                },
            });
        }),

    getShipments: protectedProcedure
        .use(hasPermission("logistics", "read"))
        .input(
            z.object({
                status: z.string().optional(),
                limit: z.number().default(50),
                offset: z.number().default(0),
            })
        )
        .query(async ({ ctx, input }) => {
            const where: any = {};
            if (input.status) where.status = input.status;

            const [shipments, total] = await Promise.all([
                ctx.prisma.shipment.findMany({
                    where,
                    include: {
                        SalesOrder: {
                            include: {
                                Customer: true,
                            },
                        },
                        EWayBill: true,
                    },
                    orderBy: { shipmentDate: "desc" },
                    take: input.limit,
                    skip: input.offset,
                }),
                ctx.prisma.shipment.count({ where }),
            ]);

            return { shipments, total };
        }),

    generateEWayBill: protectedProcedure
        .use(hasPermission("logistics", "create"))
        .input(
            z.object({
                shipmentId: z.string(),
                docType: z.enum(["invoice", "challan"]),
                docNumber: z.string(),
                docDate: z.date(),
                transporterId: z.string().optional(),
                transporterName: z.string().optional(),
                vehicleNumber: z.string(),
                vehicleType: z.string().optional(),
                distance: z.number().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            // Mock e-way bill generation
            const eWayBillNo = `EWB${Date.now()}`;

            return await ctx.prisma.eWayBill.create({
                data: {
                    id: randomUUID(),
                    updatedAt: new Date(),
                    shipmentId: input.shipmentId,
                    eWayBillNo,
                    docType: input.docType,
                    docNumber: input.docNumber,
                    docDate: input.docDate,
                    transporterId: input.transporterId,
                    transporterName: input.transporterName,
                    vehicleNumber: input.vehicleNumber,
                    vehicleType: input.vehicleType,
                    distance: input.distance,
                    status: "generated",
                    generatedAt: new Date(),
                    validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
                },
            });
        }),
});
