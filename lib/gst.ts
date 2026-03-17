import { PrismaClient } from "@prisma/client";

// GST Utility Functions for Skyprint

export function calculateGST(amount: number, customerState: string) {
    const companyState = "Maharashtra"; // Skyprint's state
    const gstRate = 0.18; // 18% GST

    if (customerState === companyState) {
        // Intra-state: CGST + SGST
        const cgst = (amount * gstRate) / 2;
        const sgst = (amount * gstRate) / 2;
        return {
            cgst,
            sgst,
            igst: 0,
            total: cgst + sgst,
        };
    } else {
        // Inter-state: IGST
        const igst = amount * gstRate;
        return {
            cgst: 0,
            sgst: 0,
            igst,
            total: igst,
        };
    }
}

export async function generateInvoiceNumber(prisma: PrismaClient) {
    const year = new Date().getFullYear().toString().slice(-2);
    const month = (new Date().getMonth() + 1).toString().padStart(2, "0");

    const lastInvoice = await prisma.invoice.findFirst({
        where: {
            invoiceNumber: {
                startsWith: `SKY${year}${month}`,
            },
        },
        orderBy: {
            invoiceNumber: "desc",
        },
    });

    let sequence = 1;
    if (lastInvoice) {
        const lastSequence = parseInt(lastInvoice.invoiceNumber.slice(-4));
        sequence = lastSequence + 1;
    }

    return `SKY${year}${month}${sequence.toString().padStart(4, "0")}`;
}

export function generateIRN(invoice: any): string {
    // Mock IRN generation
    // In production, this would call the GST e-invoice API
    const timestamp = Date.now().toString();
    const hash = Buffer.from(
        `${invoice.invoiceNumber}${invoice.customerId}${timestamp}`
    ).toString("base64");

    return hash.slice(0, 64);
}

export async function generateQRCode(invoice: any, irn: string): Promise<string> {
    // Mock QR code generation
    // In production, this would use a QR code library
    const qrData = {
        irn,
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invoice.invoiceDate,
        totalAmount: invoice.totalAmount,
        gstin: process.env.GSTIN || "27SKYPRINT1234F1Z5",
    };

    return Buffer.from(JSON.stringify(qrData)).toString("base64");
}

export function validateGSTIN(gstin: string): boolean {
    // GSTIN format: 2 digits (state code) + 10 alphanumeric (PAN) + 1 digit + 1 alphanumeric + 1 alphanumeric
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstinRegex.test(gstin);
}

export async function generateGSTR1Data(
    prisma: PrismaClient,
    month: number,
    year: number
) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const invoices = await prisma.invoice.findMany({
        where: {
            invoiceDate: {
                gte: startDate,
                lte: endDate,
            },
            status: { not: "draft" },
        },
        include: {
            Customer: true,
            InvoiceItem: true,
        },
    });

    // Format data for GSTR-1
    const b2b = invoices
        .filter((inv) => inv.gstin)
        .map((inv) => ({
            ctin: inv.gstin,
            invoices: [
                {
                    inum: inv.invoiceNumber,
                    idt: inv.invoiceDate.toISOString().split("T")[0],
                    val: Number(inv.totalAmount),
                    pos: inv.placeOfSupply,
                    rchrg: inv.reverseCharge ? "Y" : "N",
                    inv_typ: "R",
                    items: inv.InvoiceItem.map((item) => ({
                        num: 1,
                        itm_det: {
                            txval: Number(item.amount),
                            rt: Number(item.taxRate),
                            camt: Number(inv.cgst),
                            samt: Number(inv.sgst),
                            iamt: Number(inv.igst),
                        },
                    })),
                },
            ],
        }));

    return {
        gstin: process.env.GSTIN || "27SKYPRINT1234F1Z5",
        fp: `${month.toString().padStart(2, "0")}${year}`,
        b2b,
    };
}
