import { Elysia, t } from "elysia";
import { POSStore } from "../services/store";
import { authMiddleware, requireRole } from "../middleware/auth";

export const reportsRoutes = new Elysia({ prefix: "/api/reports" })
  .use(authMiddleware)
  // GET /api/reports/sales - Sales report with date range filter (Protected: Admin Only)
  .get(
    "/sales",
    async ({ query }) => {
      const startDate = query?.startDate;
      const endDate = query?.endDate;
      const report = await POSStore.getSalesReport({ startDate, endDate });
      return { success: true, data: report };
    },
    {
      beforeHandle: requireRole(["ADMIN"]),
      query: t.Object({
        startDate: t.Optional(t.String()),
        endDate: t.Optional(t.String()),
      }),
    }
  );
