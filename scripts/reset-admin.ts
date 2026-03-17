
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

async function main() {
    console.log("🔧 Restoring Admin User...");

    // 1. Ensure Admin Role Exists
    let adminRole = await prisma.role.findUnique({ where: { name: "Admin" } });

    if (!adminRole) {
        console.log("   Creating Admin Role...");
        adminRole = await prisma.role.create({
            data: {
                id: randomUUID(),
                updatedAt: new Date(),
                name: "Admin",
                description: "Full system access"
            }
        });
    } else {
        console.log("   Admin Role exists.");
    }

    // 2. Create/Update Admin User
    const email = "admin@skyprint.com";
    const password = "admin123";
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.upsert({
        where: { email },
        update: {
            password: hashedPassword,
            isActive: true,
            roleId: adminRole.id
        },
        create: {
            id: randomUUID(),
            updatedAt: new Date(),
            email,
            password: hashedPassword,
            name: "Admin User",
            phone: "+91 9876543210",
            roleId: adminRole.id,
            isActive: true
        }
    });

    console.log(`✅ Admin User Restored: ${user.email}`);
    console.log(`🔑 Password set to: ${password}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
