import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const analyticsRouter = createTRPCRouter({
    getDashboardMetrics: protectedProcedure.query(async ({ ctx }) => {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        const [
            totalCustomers,
            totalOrders,
            totalJobs,
            totalInvoices,
            pendingOrders,
            activeJobs,
            overdueInvoices,
        ] = await Promise.all([
            ctx.prisma.customer.count({ where: { isActive: true } }),
            ctx.prisma.salesOrder.count({
                where: {
                    orderDate: { gte: startOfMonth, lte: endOfMonth },
                },
            }),
            ctx.prisma.job.count({
                where: {
                    createdAt: { gte: startOfMonth, lte: endOfMonth },
                },
            }),
            ctx.prisma.invoice.count({
                where: {
                    invoiceDate: { gte: startOfMonth, lte: endOfMonth },
                },
            }),
            ctx.prisma.salesOrder.count({
                where: { status: { in: ["pending", "confirmed"] } },
            }),
            ctx.prisma.job.count({
                where: { status: { in: ["scheduled", "in_progress"] } },
            }),
            ctx.prisma.invoice.count({
                where: {
                    status: { in: ["sent", "overdue"] },
                    dueDate: { lt: today },
                },
            }),
        ]);

        const invoices = await ctx.prisma.invoice.findMany({
            where: {
                invoiceDate: { gte: startOfMonth, lte: endOfMonth },
            },
        });

        const totalRevenue = invoices.reduce(
            (sum, inv) => sum + Number(inv.totalAmount),
            0
        );
        const totalReceived = invoices.reduce(
            (sum, inv) => sum + Number(inv.paidAmount),
            0
        );

        return {
            totalCustomers,
            totalOrders,
            totalJobs,
            totalInvoices,
            pendingOrders,
            activeJobs,
            overdueInvoices,
            totalRevenue,
            totalReceived,
            outstandingAmount: totalRevenue - totalReceived,
        };
    }),

    getSalesAnalytics: protectedProcedure
        .input(
            z.object({
                startDate: z.date(),
                endDate: z.date(),
            })
        )
        .query(async ({ ctx, input }) => {
            const orders = await ctx.prisma.salesOrder.findMany({
                where: {
                    orderDate: {
                        gte: input.startDate,
                        lte: input.endDate,
                    },
                },
                include: {
                    Customer: true,
                },
            });

            const quotations = await ctx.prisma.quotation.findMany({
                where: {
                    quotationDate: {
                        gte: input.startDate,
                        lte: input.endDate,
                    },
                },
            });

            const totalOrderValue = orders.reduce(
                (sum, o) => sum + Number(o.totalAmount),
                0
            );
            const totalQuotationValue = quotations.reduce(
                (sum, q) => sum + Number(q.totalAmount),
                0
            );
            const convertedQuotations = quotations.filter(
                (q) => q.status === "converted"
            ).length;

            const conversionRate =
                quotations.length > 0 ? (convertedQuotations / quotations.length) * 100 : 0;

            // Group by customer
            const customerSales = orders.reduce((acc: any, order) => {
                const customerId = order.customerId;
                if (!acc[customerId]) {
                    acc[customerId] = {
                        customer: (order as any).Customer,
                        totalOrders: 0,
                        totalValue: 0,
                    };
                }
                acc[customerId].totalOrders += 1;
                acc[customerId].totalValue += Number(order.totalAmount);
                return acc;
            }, {});

            const topCustomers = Object.values(customerSales)
                .sort((a: any, b: any) => b.totalValue - a.totalValue)
                .slice(0, 10);

            return {
                totalOrders: orders.length,
                totalOrderValue,
                totalQuotations: quotations.length,
                totalQuotationValue,
                conversionRate,
                topCustomers,
            };
        }),
});
