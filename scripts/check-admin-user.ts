
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    console.log("🔍 Checking Admin User...");
    const email = "admin@skyprint.com";

    // 1. Find User
    const user = await prisma.user.findUnique({
        where: { email },
        include: { Role: true }
    });

    if (!user) {
        console.error("❌ User NOT FOUND in database!");
        return;
    }

    console.log(`✅ User Found: ${user.name} (${user.id})`);
    console.log(`STATUS: ${user.isActive ? "Active" : "Inactive"}`);
    console.log(`ROLE: ${user.Role ? user.Role.name : "No Role Assigned"}`);

    // 2. Check Password
    const passwordAttempt = "admin123";
    const isMatch = await bcrypt.compare(passwordAttempt, user.password);

    if (isMatch) {
        console.log("✅ Password 'admin123' MATCHES the stored hash.");
    } else {
        console.error("❌ Password 'admin123' DOES NOT MATCH the stored hash.");

        // Attempt to generate a new hash to show what it should be
        const newHash = await bcrypt.hash(passwordAttempt, 10);
        console.log("   Stored Hash:", user.password);
        console.log("   Expected Hash Format (example):", newHash);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
