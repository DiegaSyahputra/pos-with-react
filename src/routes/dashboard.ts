import { Elysia } from "elysia";
import { POSStore } from "../services/store";

export const dashboardRoutes = new Elysia({ prefix: "/api/dashboard" })
  // GET /api/dashboard/stats
  .get("/stats", async () => {
    const stats = await POSStore.getDashboardStats();
    return { success: true, data: stats };
  });
