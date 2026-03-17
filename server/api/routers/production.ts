import { z } from "zod";
import { createTRPCRouter, protectedProcedure, hasPermission } from "../trpc";
import { randomUUID } from "crypto";

export const productionRouter = createTRPCRouter({
    // ============================================
    // JOBS
    // ============================================

    createJob: protectedProcedure
        .use(hasPermission("production", "create"))
        .input(
            z.object({
                salesOrderId: z.string(),
                description: z.string(),
                specifications: z.string().optional(),
                quantity: z.number(),
                dueDate: z.date(),
                priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
                estimatedCost: z.number(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const jobNumber = `JOB${Date.now()}`;

            const job = await ctx.prisma.job.create({
                data: {
                    id: randomUUID(),
                    updatedAt: new Date(),
                    jobNumber,
                    salesOrderId: input.salesOrderId,
                    description: input.description,
                    specifications: input.specifications,
                    quantity: input.quantity,
                    dueDate: input.dueDate,
                    priority: input.priority,
                    estimatedCost: input.estimatedCost,
                    status: "pending",
                    createdById: ctx.session.user.id,
                },
                include: {
                    SalesOrder: {
                        include: {
                            Customer: true,
                        },
                    },
                },
            });

            // Update sales order status
            await ctx.prisma.salesOrder.update({
                where: { id: input.salesOrderId },
                data: { status: "in_production" },
            });

            return job;
        }),

    getJobs: protectedProcedure
        .use(hasPermission("production", "read"))
        .input(
            z.object({
                status: z.string().optional(),
                priority: z.string().optional(),
                limit: z.number().default(50),
                offset: z.number().default(0),
            })
        )
        .query(async ({ ctx, input }) => {
            const where: any = {};

            if (input.status) where.status = input.status;
            if (input.priority) where.priority = input.priority;

            const [jobs, total] = await Promise.all([
                ctx.prisma.job.findMany({
                    where,
                    include: {
                        SalesOrder: {
                            include: {
                                Customer: true,
                            },
                        },
                        JobTicket: true,
                        MachineSchedule: {
                            include: {
                                Machine: true,
                            },
                        },
                    },
                    orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
                    take: input.limit,
                    skip: input.offset,
                }),
                ctx.prisma.job.count({ where }),
            ]);

            return { jobs, total };
        }),

    getJob: protectedProcedure
        .use(hasPermission("production", "read"))
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            return await ctx.prisma.job.findUnique({
                where: { id: input.id },
                include: {
                    SalesOrder: {
                        include: {
                            Customer: true,
                            SalesOrderItem: true,
                        },
                    },
                    JobTicket: {
                        include: {
                            Machine: true,
                        },
                    },
                    MachineSchedule: {
                        include: {
                            Machine: true,
                        },
                    },
                    JobProgress: {
                        orderBy: {
                            recordedAt: "desc",
                        },
                    },
                    QualityCheck: {
                        orderBy: {
                            checkDate: "desc",
                        },
                    },
                    MaterialIssue: {
                        include: {
                            Material: true,
                        },
                    },
                },
            });
        }),

    updateJobProgress: protectedProcedure
        .use(hasPermission("production", "update"))
        .input(
            z.object({
                jobId: z.string(),
                stage: z.enum(["prepress", "press", "postpress"]),
                status: z.enum(["started", "in_progress", "completed"]),
                percentage: z.number().min(0).max(100),
                notes: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const progress = await ctx.prisma.jobProgress.create({
                data: {
                    id: randomUUID(),
                    jobId: input.jobId,
                    stage: input.stage,
                    status: input.status,
                    percentage: input.percentage,
                    notes: input.notes,
                    recordedBy: ctx.session.user.name,
                },
            });

            // Update job status if all stages completed
            if (input.status === "completed" && input.stage === "postpress") {
                await ctx.prisma.job.update({
                    where: { id: input.jobId },
                    data: {
                        status: "completed",
                        endDate: new Date(),
                    },
                });
            } else if (input.status === "started") {
                await ctx.prisma.job.update({
                    where: { id: input.jobId },
                    data: {
                        status: "in_progress",
                        startDate: new Date(),
                    },
                });
            }

            return progress;
        }),

    recordQualityCheck: protectedProcedure
        .use(hasPermission("production", "create"))
        .input(
            z.object({
                jobId: z.string(),
                stage: z.enum(["prepress", "press", "postpress", "final"]),
                result: z.enum(["pass", "fail", "rework"]),
                parameters: z.string().optional(),
                notes: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            return await ctx.prisma.qualityCheck.create({
                data: {
                    id: randomUUID(),
                    jobId: input.jobId,
                    stage: input.stage,
                    checkDate: new Date(),
                    result: input.result,
                    parameters: input.parameters,
                    notes: input.notes,
                    checkedBy: ctx.session.user.name,
                },
            });
        }),

    // ============================================
    // MACHINES & SCHEDULING
    // ============================================

    getMachines: protectedProcedure
        .use(hasPermission("production", "read"))
        .query(async ({ ctx }) => {
            return await ctx.prisma.machine.findMany({
                where: { isActive: true },
                include: {
                    MachineSchedule: {
                        where: {
                            startTime: {
                                gte: new Date(),
                            },
                        },
                        include: {
                            Job: true,
                        },
                        orderBy: {
                            startTime: "asc",
                        },
                    },
                },
            });
        }),

    scheduleJob: protectedProcedure
        .use(hasPermission("production", "create"))
        .input(
            z.object({
                jobId: z.string(),
                machineId: z.string(),
                startTime: z.date(),
                endTime: z.date(),
                notes: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            // Check for conflicts
            const conflicts = await ctx.prisma.machineSchedule.findMany({
                where: {
                    machineId: input.machineId,
                    status: { in: ["scheduled", "in_progress"] },
                    OR: [
                        {
                            AND: [
                                { startTime: { lte: input.startTime } },
                                { endTime: { gte: input.startTime } },
                            ],
                        },
                        {
                            AND: [
                                { startTime: { lte: input.endTime } },
                                { endTime: { gte: input.endTime } },
                            ],
                        },
                    ],
                },
            });

            if (conflicts.length > 0) {
                throw new Error("Machine is already scheduled for this time slot");
            }

            const schedule = await ctx.prisma.machineSchedule.create({
                data: {
                    id: randomUUID(),
                    updatedAt: new Date(),
                    machineId: input.machineId,
                    jobId: input.jobId,
                    startTime: input.startTime,
                    endTime: input.endTime,
                    notes: input.notes,
                    status: "scheduled",
                },
                include: {
                    Machine: true,
                    Job: {
                        include: {
                            SalesOrder: {
                                include: {
                                    Customer: true,
                                },
                            },
                        },
                    },
                },
            });

            // Update job status
            await ctx.prisma.job.update({
                where: { id: input.jobId },
                data: { status: "scheduled" },
            });

            return schedule;
        }),

    getMachineSchedule: protectedProcedure
        .use(hasPermission("production", "read"))
        .input(
            z.object({
                startDate: z.date(),
                endDate: z.date(),
            })
        )
        .query(async ({ ctx, input }) => {
            return await ctx.prisma.machineSchedule.findMany({
                where: {
                    startTime: {
                        gte: input.startDate,
                        lte: input.endDate,
                    },
                },
                include: {
                    Machine: true,
                    Job: {
                        include: {
                            SalesOrder: {
                                include: {
                                    Customer: true,
                                },
                            },
                        },
                    },
                },
                orderBy: {
                    startTime: "asc",
                },
            });
        }),

    // ============================================
    // PRODUCTION ANALYTICS
    // ============================================

    getProductionMetrics: protectedProcedure
        .use(hasPermission("production", "read"))
        .input(
            z.object({
                startDate: z.date(),
                endDate: z.date(),
            })
        )
        .query(async ({ ctx, input }) => {
            const jobs = await ctx.prisma.job.findMany({
                where: {
                    createdAt: {
                        gte: input.startDate,
                        lte: input.endDate,
                    },
                },
                include: {
                    MaterialIssue: true,
                },
            });

            const totalJobs = jobs.length;
            const completedJobs = jobs.filter((j) => j.status === "completed").length;
            const onTimeJobs = jobs.filter(
                (j) => j.status === "completed" && j.endDate && j.endDate <= j.dueDate
            ).length;

            const totalEstimatedCost = jobs.reduce(
                (sum, j) => sum + Number(j.estimatedCost),
                0
            );
            const totalActualCost = jobs.reduce(
                (sum, j) => sum + Number(j.actualCost),
                0
            );

            const totalWastage = jobs.reduce((sum, j: any) => {
                const jobWastage = j.MaterialIssue.reduce(
                    (s: any, mi: any) => s + Number(mi.wastage),
                    0
                );
                return sum + jobWastage;
            }, 0);

            return {
                totalJobs,
                completedJobs,
                onTimeJobs,
                onTimePercentage: totalJobs > 0 ? (onTimeJobs / totalJobs) * 100 : 0,
                completionRate: totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0,
                totalEstimatedCost,
                totalActualCost,
                costVariance: totalActualCost - totalEstimatedCost,
                totalWastage,
            };
        }),
});
