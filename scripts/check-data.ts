
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const customers = await prisma.customer.count();
    const salesOrders = await prisma.salesOrder.count();
    const quotations = await prisma.quotation.count();
    console.log(`Customers: ${customers}`);
    console.log(`SalesOrders: ${salesOrders}`);
    console.log(`Quotations: ${quotations}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
