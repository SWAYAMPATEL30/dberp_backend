import { initTRPC, TRPCError } from "@trpc/server";
import { type CreateNextContextOptions } from "@trpc/server/adapters/next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import superjson from "superjson";

import { type FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";

export const createTRPCContext = async (opts: FetchCreateContextFnOptions) => {
    const session = await getServerSession(authOptions);

    return {
        session,
        prisma,
    };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
    transformer: superjson,
    errorFormatter({ shape }) {
        return shape;
    },
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

// Middleware to check if user is authenticated
const isAuthed = t.middleware(({ ctx, next }) => {
    if (!ctx.session || !ctx.session.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return next({
        ctx: {
            session: { ...ctx.session, user: ctx.session.user },
        },
    });
});

// Protected procedure that requires authentication
export const protectedProcedure = t.procedure.use(isAuthed);

// Middleware to check specific permissions
export const hasPermission = (module: string, action: string) =>
    t.middleware(({ ctx, next }) => {
        if (!ctx.session || !ctx.session.user) {
            throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        const hasAccess = ctx.session.user.permissions.some(
            (p) => p.module === module && p.action === action
        );

        if (!hasAccess) {
            throw new TRPCError({ code: "FORBIDDEN" });
        }

        return next({
            ctx: {
                session: { ...ctx.session, user: ctx.session.user },
            },
        });
    });
