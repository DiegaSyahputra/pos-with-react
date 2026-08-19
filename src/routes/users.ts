import { Elysia, t } from "elysia";
import { POSStore } from "../services/store";
import { authMiddleware, requireRole } from "../middleware/auth";

export const usersRoutes = new Elysia({ prefix: "/api/users" })
  .use(authMiddleware)
  // GET /api/users (Protected: Admin Only Middleware, Paginated)
  .get(
    "/",
    async ({ query }) => {
      const page = query?.page ? Number(query.page) : 1;
      const limit = query?.limit ? Number(query.limit) : 20;
      const result = await POSStore.getUsers({ page, limit });
      return { success: true, ...result };
    },
    {
      beforeHandle: requireRole(["ADMIN"]),
      query: t.Object({
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      }),
    }
  )
  // POST /api/users (Protected: Admin Only Middleware)
  .post(
    "/",
    async ({ body, set }) => {
      try {
        if (!body.username || !body.name || !body.password) {
          set.status = 400;
          return { success: false, error: "Username, nama lengkap, dan password wajib diisi" };
        }
        const created = await POSStore.createUser(body);
        set.status = 201;
        return { success: true, data: created, message: "User/Kasir berhasil ditambahkan" };
      } catch (err: any) {
        set.status = 400;
        return { success: false, error: err.message || "Gagal membuat user" };
      }
    },
    {
      beforeHandle: requireRole(["ADMIN"]),
      body: t.Object({
        username: t.String(),
        name: t.String(),
        email: t.Optional(t.String()),
        password: t.String(),
        role: t.Optional(t.String()),
      }),
    }
  )
  // PUT /api/users/:id (Protected: Admin Only Middleware)
  .put(
    "/:id",
    async ({ params: { id }, body, set }) => {
      try {
        const updated = await POSStore.updateUser(id, body);
        return { success: true, data: updated, message: "Data user berhasil diperbarui" };
      } catch (err: any) {
        set.status = 400;
        return { success: false, error: err.message || "Gagal memperbarui user" };
      }
    },
    {
      beforeHandle: requireRole(["ADMIN"]),
      body: t.Object({
        name: t.Optional(t.String()),
        email: t.Optional(t.String()),
        role: t.Optional(t.String()),
        password: t.Optional(t.String()),
      }),
    }
  )
  // DELETE /api/users/:id (Protected: Admin Only Middleware)
  .delete(
    "/:id",
    async ({ params: { id }, set }) => {
      try {
        const deleted = await POSStore.deleteUser(id);
        return { success: true, data: deleted, message: "User berhasil dihapus" };
      } catch (err: any) {
        set.status = 400;
        return { success: false, error: err.message || "Gagal menghapus user" };
      }
    },
    {
      beforeHandle: requireRole(["ADMIN"]),
    }
  );
