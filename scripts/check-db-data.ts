
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Checking database counts...");
    const shipmentCount = await prisma.shipment.count();
    const soCount = await prisma.salesOrder.count();
    const customerCount = await prisma.customer.count();
    const invoiceCount = await prisma.invoice.count();
    const jobCount = await prisma.job.count();

    console.log(`Shipments: ${shipmentCount}`);
    console.log(`SalesOrders: ${soCount}`);
    console.log(`Customers: ${customerCount}`);
    console.log(`Invoices: ${invoiceCount}`);
    console.log(`Jobs: ${jobCount}`);

    // Check first shipment details if exists
    if (shipmentCount > 0) {
        const firstShipment = await prisma.shipment.findFirst();
        console.log("First Shipment Sample:", firstShipment);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
