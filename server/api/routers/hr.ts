import { z } from "zod";
import { createTRPCRouter, protectedProcedure, hasPermission } from "../trpc";
import { randomUUID } from "crypto";

export const hrRouter = createTRPCRouter({
    // ============================================
    // EMPLOYEES
    // ============================================

    getEmployees: protectedProcedure
        .use(hasPermission("hr", "read"))
        .query(async ({ ctx }) => {
            return await ctx.prisma.employee.findMany({
                where: { isActive: true },
                orderBy: { employeeCode: "asc" },
            });
        }),

    // ============================================
    // ATTENDANCE
    // ============================================

    recordAttendance: protectedProcedure
        .use(hasPermission("hr", "create"))
        .input(
            z.object({
                employeeId: z.string(),
                date: z.date(),
                checkIn: z.date().optional(),
                checkOut: z.date().optional(),
                status: z.enum(["present", "absent", "half_day", "leave"]),
                workHours: z.number().optional(),
                overtime: z.number().optional(),
                notes: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            return await ctx.prisma.attendance.upsert({
                where: {
                    employeeId_date: {
                        employeeId: input.employeeId,
                        date: input.date,
                    },
                },
                create: {
                    id: randomUUID(),
                    updatedAt: new Date(),
                    ...input,
                },
                update: {
                    updatedAt: new Date(),
                    ...input,
                },
            });
        }),

    getAttendance: protectedProcedure
        .use(hasPermission("hr", "read"))
        .input(
            z.object({
                employeeId: z.string().optional(),
                startDate: z.date(),
                endDate: z.date(),
            })
        )
        .query(async ({ ctx, input }) => {
            const where: any = {
                date: {
                    gte: input.startDate,
                    lte: input.endDate,
                },
            };

            if (input.employeeId) {
                where.employeeId = input.employeeId;
            }

            return await ctx.prisma.attendance.findMany({
                where,
                include: {
                    Employee: true,
                },
                orderBy: { date: "desc" },
            });
        }),

    // ============================================
    // LEAVE MANAGEMENT
    // ============================================

    createLeaveRequest: protectedProcedure
        .use(hasPermission("hr", "create"))
        .input(
            z.object({
                employeeId: z.string(),
                leaveType: z.enum(["casual", "sick", "earned", "unpaid"]),
                fromDate: z.date(),
                toDate: z.date(),
                days: z.number(),
                reason: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            return await ctx.prisma.leave.create({
                data: {
                    id: randomUUID(),
                    updatedAt: new Date(),
                    ...input,
                    status: "pending",
                },
                include: {
                    Employee: true,
                },
            });
        }),

    approveLeave: protectedProcedure
        .use(hasPermission("hr", "update"))
        .input(
            z.object({
                leaveId: z.string(),
                approved: z.boolean(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            return await ctx.prisma.leave.update({
                where: { id: input.leaveId },
                data: {
                    status: input.approved ? "approved" : "rejected",
                    approvedBy: ctx.session.user.name,
                    approvedAt: new Date(),
                },
            });
        }),

    // ============================================
    // PAYROLL
    // ============================================

    processPayroll: protectedProcedure
        .use(hasPermission("hr", "create"))
        .input(
            z.object({
                employeeId: z.string(),
                month: z.number(),
                year: z.number(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const employee = await ctx.prisma.employee.findUnique({
                where: { id: input.employeeId },
            });

            if (!employee || !employee.basicSalary) {
                throw new Error("Employee or salary not found");
            }

            const basicSalary = Number(employee.basicSalary);

            // Calculate PF (12% employee + 12% employer)
            const pfEmployee = basicSalary * 0.12;
            const pfEmployer = basicSalary * 0.12;

            // Calculate ESI (0.75% employee + 3.25% employer) - if applicable
            const esiEmployee = basicSalary <= 21000 ? basicSalary * 0.0075 : 0;
            const esiEmployer = basicSalary <= 21000 ? basicSalary * 0.0325 : 0;

            // Simplified TDS calculation (would need proper tax slab logic)
            const annualSalary = basicSalary * 12;
            let tds = 0;
            if (annualSalary > 500000) {
                tds = (annualSalary - 500000) * 0.2 / 12;
            }

            const grossSalary = basicSalary;
            const totalDeductions = pfEmployee + esiEmployee + tds;
            const netSalary = grossSalary - totalDeductions;

            return await ctx.prisma.payroll.upsert({
                where: {
                    employeeId_month_year: {
                        employeeId: input.employeeId,
                        month: input.month,
                        year: input.year,
                    },
                },
                create: {
                    id: `PAY${Date.now()}${Math.floor(Math.random() * 1000)}`,
                    updatedAt: new Date(),
                    employeeId: input.employeeId,
                    month: input.month,
                    year: input.year,
                    basicSalary,
                    allowances: 0,
                    overtime: 0,
                    grossSalary,
                    pfEmployee,
                    esiEmployee,
                    tds,
                    otherDeductions: 0,
                    totalDeductions,
                    pfEmployer,
                    esiEmployer,
                    netSalary,
                    status: "draft",
                },
                update: {
                    updatedAt: new Date(),
                    basicSalary,
                    grossSalary,
                    pfEmployee,
                    esiEmployee,
                    tds,
                    totalDeductions,
                    pfEmployer,
                    esiEmployer,
                    netSalary,
                },
                include: {
                    Employee: true,
                },
            });
        }),

    getPayrolls: protectedProcedure
        .use(hasPermission("hr", "read"))
        .input(
            z.object({
                month: z.number(),
                year: z.number(),
            })
        )
        .query(async ({ ctx, input }) => {
            return await ctx.prisma.payroll.findMany({
                where: {
                    month: input.month,
                    year: input.year,
                },
                include: {
                    Employee: true,
                },
                orderBy: {
                    Employee: {
                        employeeCode: "asc",
                    },
                },
            });
        }),
});
