import { z } from "zod";
import { createTRPCRouter, protectedProcedure, hasPermission } from "../trpc";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

export const authRouter = createTRPCRouter({
    // Register new user (admin only)
    register: protectedProcedure
        .use(hasPermission("users", "create"))
        .input(
            z.object({
                email: z.string().email(),
                password: z.string().min(8),
                name: z.string(),
                phone: z.string().optional(),
                roleId: z.string(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const hashedPassword = await bcrypt.hash(input.password, 10);

            const user = await ctx.prisma.user.create({
                data: {
                    id: randomUUID(),
                    updatedAt: new Date(),
                    email: input.email,
                    password: hashedPassword,
                    name: input.name,
                    phone: input.phone,
                    roleId: input.roleId,
                },
                include: {
                    Role: true,
                },
            });

            return {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.Role.name,
            };
        }),

    // Get current user
    me: protectedProcedure.query(async ({ ctx }) => {
        const user = await ctx.prisma.user.findUnique({
            where: { id: ctx.session.user.id },
            include: {
                Role: {
                    include: {
                        RolePermission: {
                            include: {
                                Permission: true,
                            },
                        },
                    },
                },
            },
        });

        return user;
    }),

    // Get all users (admin only)
    getUsers: protectedProcedure
        .use(hasPermission("users", "read"))
        .query(async ({ ctx }) => {
            const users = await ctx.prisma.user.findMany({
                include: {
                    Role: true,
                },
                orderBy: {
                    createdAt: "desc",
                },
            });

            return users.map((user) => ({
                ...user,
                password: undefined,
            }));
        }),

    // Update user
    updateUser: protectedProcedure
        .use(hasPermission("users", "update"))
        .input(
            z.object({
                id: z.string(),
                name: z.string().optional(),
                phone: z.string().optional(),
                roleId: z.string().optional(),
                isActive: z.boolean().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { id, ...data } = input;

            const user = await ctx.prisma.user.update({
                where: { id },
                data,
                include: {
                    Role: true,
                },
            });

            return {
                ...user,
                password: undefined,
            };
        }),

    // Get all roles
    getRoles: protectedProcedure.query(async ({ ctx }) => {
        return await ctx.prisma.role.findMany({
            include: {
                RolePermission: {
                    include: {
                        Permission: true,
                    },
                },
            },
        });
    }),
});
