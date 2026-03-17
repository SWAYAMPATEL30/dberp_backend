import { z } from "zod";
import { createTRPCRouter, protectedProcedure, hasPermission } from "../trpc";
import { generateInvoiceNumber, calculateGST, generateIRN, generateQRCode } from "@/lib/gst";
import { randomUUID } from "crypto";

export const financeRouter = createTRPCRouter({
    // ============================================
    // INVOICES
    // ============================================

    createInvoice: protectedProcedure
        .use(hasPermission("finance", "create"))
        .input(
            z.object({
                customerId: z.string(),
                salesOrderId: z.string().optional(),
                invoiceDate: z.date(),
                dueDate: z.date(),
                items: z.array(
                    z.object({
                        description: z.string(),
                        quantity: z.number(),
                        unitPrice: z.number(),
                        taxRate: z.number(),
                        hsnCode: z.string().optional(),
                    })
                ),
                discount: z.number().default(0),
                notes: z.string().optional(),
                terms: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const customer = await ctx.prisma.customer.findUnique({
                where: { id: input.customerId },
            });

            if (!customer) {
                throw new Error("Customer not found");
            }

            // Calculate amounts
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

            subtotal -= input.discount;

            // Calculate GST based on customer state
            const gstCalculation = calculateGST(subtotal, customer.state || "");

            const totalAmount = subtotal + gstCalculation.cgst + gstCalculation.sgst + gstCalculation.igst;

            const invoiceNumber = await generateInvoiceNumber(ctx.prisma);

            const invoice = await ctx.prisma.invoice.create({
                data: {
                    id: randomUUID(),
                    updatedAt: new Date(),
                    invoiceNumber,
                    invoiceDate: input.invoiceDate,
                    dueDate: input.dueDate,
                    customerId: input.customerId,
                    salesOrderId: input.salesOrderId,
                    gstin: customer.gstin,
                    placeOfSupply: customer.state || "",
                    subtotal,
                    cgst: gstCalculation.cgst,
                    sgst: gstCalculation.sgst,
                    igst: gstCalculation.igst,
                    discount: input.discount,
                    totalAmount,
                    status: "draft",
                    notes: input.notes,
                    terms: input.terms,
                    createdById: ctx.session.user.id,
                    InvoiceItem: {
                        create: items,
                    },
                },
                include: {
                    InvoiceItem: true,
                    Customer: true,
                },
            });

            return invoice;
        }),

    getInvoices: protectedProcedure
        .use(hasPermission("finance", "read"))
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

            if (input.status) {
                where.status = input.status;
            }

            if (input.customerId) {
                where.customerId = input.customerId;
            }

            const [invoices, total] = await Promise.all([
                ctx.prisma.invoice.findMany({
                    where,
                    include: {
                        Customer: true,
                        InvoiceItem: true,
                    },
                    orderBy: {
                        invoiceDate: "desc",
                    },
                    take: input.limit,
                    skip: input.offset,
                }),
                ctx.prisma.invoice.count({ where }),
            ]);

            return { invoices, total };
        }),

    getInvoice: protectedProcedure
        .use(hasPermission("finance", "read"))
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            return await ctx.prisma.invoice.findUnique({
                where: { id: input.id },
                include: {
                    Customer: true,
                    InvoiceItem: true,
                    SalesOrder: true,
                    Payment: true,
                },
            });
        }),

    generateEInvoice: protectedProcedure
        .use(hasPermission("finance", "create"))
        .input(z.object({ invoiceId: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const invoice = await ctx.prisma.invoice.findUnique({
                where: { id: input.invoiceId },
                include: {
                    Customer: true,
                    InvoiceItem: true,
                },
            });

            if (!invoice) {
                throw new Error("Invoice not found");
            }

            // Generate IRN and QR Code (mock implementation)
            const irn = generateIRN(invoice);
            const qrCode = await generateQRCode(invoice, irn);

            const updatedInvoice = await ctx.prisma.invoice.update({
                where: { id: input.invoiceId },
                data: {
                    irn,
                    qrCode,
                    ackNo: `ACK${Date.now()}`,
                    ackDate: new Date(),
                    status: "sent",
                },
            });

            return updatedInvoice;
        }),

    // ============================================
    // PAYMENTS
    // ============================================

    recordPayment: protectedProcedure
        .use(hasPermission("finance", "create"))
        .input(
            z.object({
                invoiceId: z.string().optional(),
                billId: z.string().optional(),
                amount: z.number(),
                paymentDate: z.date(),
                paymentMethod: z.enum(["cash", "cheque", "bank_transfer", "upi"]),
                referenceNo: z.string().optional(),
                notes: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const paymentNumber = `PAY${Date.now()}`;

            const data: any = {
                id: randomUUID(),
                paymentNumber,
                paymentDate: input.paymentDate,
                amount: input.amount,
                paymentMethod: input.paymentMethod,
                referenceNo: input.referenceNo,
                notes: input.notes,
            };

            if (input.invoiceId) data.invoiceId = input.invoiceId;
            if (input.billId) data.billId = input.billId;

            const payment = await ctx.prisma.payment.create({
                data,
            });

            // Update invoice/bill paid amount
            if (input.invoiceId) {
                const invoice = await ctx.prisma.invoice.findUnique({
                    where: { id: input.invoiceId },
                });

                if (invoice) {
                    const newPaidAmount = Number(invoice.paidAmount) + input.amount;
                    const status =
                        newPaidAmount >= Number(invoice.totalAmount) ? "paid" : invoice.status;

                    await ctx.prisma.invoice.update({
                        where: { id: input.invoiceId },
                        data: {
                            paidAmount: newPaidAmount,
                            status,
                        },
                    });
                }
            }

            if (input.billId) {
                const bill = await ctx.prisma.bill.findUnique({
                    where: { id: input.billId },
                });

                if (bill) {
                    const newPaidAmount = Number(bill.paidAmount) + input.amount;
                    const status =
                        newPaidAmount >= Number(bill.totalAmount) ? "paid" : bill.status;

                    await ctx.prisma.bill.update({
                        where: { id: input.billId },
                        data: {
                            paidAmount: newPaidAmount,
                            status,
                        },
                    });
                }
            }

            return payment;
        }),

    // ============================================
    // FINANCIAL REPORTS
    // ============================================

    getFinancialSummary: protectedProcedure
        .use(hasPermission("finance", "read"))
        .input(
            z.object({
                startDate: z.date(),
                endDate: z.date(),
            })
        )
        .query(async ({ ctx, input }) => {
            const [invoices, bills, payments] = await Promise.all([
                ctx.prisma.invoice.findMany({
                    where: {
                        invoiceDate: {
                            gte: input.startDate,
                            lte: input.endDate,
                        },
                    },
                }),
                ctx.prisma.bill.findMany({
                    where: {
                        billDate: {
                            gte: input.startDate,
                            lte: input.endDate,
                        },
                    },
                }),
                ctx.prisma.payment.findMany({
                    where: {
                        paymentDate: {
                            gte: input.startDate,
                            lte: input.endDate,
                        },
                    },
                }),
            ]);

            const totalRevenue = invoices.reduce(
                (sum, inv) => sum + Number(inv.totalAmount),
                0
            );
            const totalExpenses = bills.reduce(
                (sum, bill) => sum + Number(bill.totalAmount),
                0
            );
            const totalReceived = payments
                .filter((p) => p.invoiceId)
                .reduce((sum, p) => sum + Number(p.amount), 0);
            const totalPaid = payments
                .filter((p) => p.billId)
                .reduce((sum, p) => sum + Number(p.amount), 0);

            const outstandingReceivables = invoices.reduce(
                (sum, inv) => sum + (Number(inv.totalAmount) - Number(inv.paidAmount)),
                0
            );
            const outstandingPayables = bills.reduce(
                (sum, bill) => sum + (Number(bill.totalAmount) - Number(bill.paidAmount)),
                0
            );

            return {
                totalRevenue,
                totalExpenses,
                totalReceived,
                totalPaid,
                outstandingReceivables,
                outstandingPayables,
                netProfit: totalRevenue - totalExpenses,
            };
        }),
});
