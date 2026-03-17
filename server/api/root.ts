import { createTRPCRouter } from "./trpc";
import { authRouter } from "./routers/auth";
import { financeRouter } from "./routers/finance";
import { crmRouter } from "./routers/crm";
import { productionRouter } from "./routers/production";
import { inventoryRouter } from "./routers/inventory";
import { logisticsRouter } from "./routers/logistics";
import { hrRouter } from "./routers/hr";
import { analyticsRouter } from "./routers/analytics";

export const appRouter = createTRPCRouter({
    auth: authRouter,
    finance: financeRouter,
    crm: crmRouter,
    production: productionRouter,
    inventory: inventoryRouter,
    logistics: logisticsRouter,
    hr: hrRouter,
    analytics: analyticsRouter,
});

export type AppRouter = typeof appRouter;
