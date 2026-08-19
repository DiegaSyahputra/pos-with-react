import { Elysia, t } from "elysia";
import { POSStore } from "../services/store";
import { authMiddleware, requireRole } from "../middleware/auth";
import { validateCustomerInput } from "../lib/validators";

export const customersRoutes = new Elysia({ prefix: "/api/customers" })
  .use(authMiddleware)
  // GET /api/customers (Paginated - Open for both Admin & Cashier for POS checkout)
  .get(
    "/",
    async ({ query }) => {
      const page = query?.page ? Number(query.page) : 1;
      const limit = query?.limit ? Number(query.limit) : 20;
      const result = await POSStore.getCustomers({ page, limit });
      return { success: true, ...result };
    },
    {
      query: t.Object({
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      }),
    }
  )
  // POST /api/customers (Protected: Admin Only Middleware)
  .post(
    "/",
    async ({ body, set }) => {
      try {
        const val = validateCustomerInput(body);
        if (!val.valid) {
          set.status = 400;
          return { success: false, error: val.error };
        }
        const created = await POSStore.createCustomer(body);
        set.status = 201;
        return {
          success: true,
          data: created,
          message: "Pelanggan berhasil dibuat",
        };
      } catch (err: any) {
        set.status = 400;
        return {
          success: false,
          error: err.message || "Gagal membuat pelanggan",
        };
      }
    },
    {
      beforeHandle: requireRole(["ADMIN"]),
      body: t.Object({
        name: t.String(),
        phone: t.Optional(t.String()),
        email: t.Optional(t.String()),
        points: t.Optional(t.Number()),
      }),
    }
  )
  // PUT /api/customers/:id (Protected: Admin Only Middleware)
  .put(
    "/:id",
    async ({ params: { id }, body, set }) => {
      try {
        const updated = await POSStore.updateCustomer(id, body);
        return {
          success: true,
          data: updated,
          message: "Pelanggan berhasil diperbarui",
        };
      } catch (err: any) {
        set.status = 404;
        return {
          success: false,
          error: err.message || "Pelanggan tidak ditemukan",
        };
      }
    },
    {
      beforeHandle: requireRole(["ADMIN"]),
      body: t.Object({
        name: t.Optional(t.String()),
        phone: t.Optional(t.String()),
        email: t.Optional(t.String()),
        points: t.Optional(t.Number()),
      }),
    }
  )
  // DELETE /api/customers/:id (Protected: Admin Only Middleware)
  .delete(
    "/:id",
    async ({ params: { id }, set }) => {
      try {
        const deleted = await POSStore.deleteCustomer(id);
        return {
          success: true,
          data: deleted,
          message: "Pelanggan berhasil dihapus",
        };
      } catch (err: any) {
        set.status = 404;
        return {
          success: false,
          error: err.message || "Pelanggan tidak ditemukan",
        };
      }
    },
    {
      beforeHandle: requireRole(["ADMIN"]),
    }
  );
