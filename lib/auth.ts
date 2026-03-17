import { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                console.log("🔐 Auth Request:", credentials?.email);
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Invalid credentials");
                }

                // 1. Fetch User (No Include to avoid crash)
                const user = await prisma.user.findUnique({
                    where: { email: credentials.email },
                });

                if (!user || !user.isActive) {
                    console.error("❌ Auth Failed: User not found or inactive", user ? "Inactive" : "Not Found");
                    throw new Error("Invalid credentials user");
                }
                console.log("✅ User found:", user.id);

                // 2. Verify Password BEFORE fetching role
                const isPasswordValid = await bcrypt.compare(
                    credentials.password,
                    user.password
                );

                if (!isPasswordValid) {
                    console.error("❌ Auth Failed: Invalid password");
                    throw new Error("Invalid credentials password");
                }
                console.log("✅ Password valid");

                console.log("✅ Password valid");
                console.log("🔍 Fetching Role for user.roleId:", user.roleId);

                // 3. Manual Role Fetch
                const role = await prisma.role.findUnique({
                    where: { id: user.roleId },
                });

                if (!role) {
                    console.error("❌ Auth Failed: Role not found for ID", user.roleId);
                    // Fallback or error if role missing
                    throw new Error("User role not found");
                }
                console.log("✅ Role found:", role.name);

                // 4. Fetch Permissions (Flat Query)
                const rolePermissions = await prisma.rolePermission.findMany({
                    where: { roleId: role.id },
                    include: {
                        Permission: true,
                    },
                });
                console.log("✅ Permissions fetched:", rolePermissions.length);

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: role.name,
                    permissions: rolePermissions.map((rp) => ({
                        module: rp.Permission.module,
                        action: rp.Permission.action,
                    })),
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.permissions = user.permissions;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
                session.user.permissions = token.permissions as Array<{
                    module: string;
                    action: string;
                }>;
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
    },
    session: {
        strategy: "jwt",
    },
    secret: process.env.NEXTAUTH_SECRET,
};
