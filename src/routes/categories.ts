import { Elysia, t } from "elysia";
import { POSStore } from "../services/store";
import { authMiddleware, requireRole } from "../middleware/auth";

export const categoriesRoutes = new Elysia({ prefix: "/api/categories" })
  .use(authMiddleware)
  // GET /api/categories (Open for both Admin & Cashier)
  .get("/", async () => {
    const categories = await POSStore.getCategories();
    return { success: true, data: categories };
  })
  // POST /api/categories (Protected: Admin Only Middleware)
  .post(
    "/",
    async ({ body, set }) => {
      try {
        if (!body.name || body.name.trim() === "") {
          set.status = 400;
          return { success: false, error: "Nama kategori wajib diisi" };
        }
        const created = await POSStore.createCategory(body);
        set.status = 201;
        return { success: true, data: created, message: "Kategori berhasil dibuat" };
      } catch (err: any) {
        set.status = 400;
        return { success: false, error: err.message || "Gagal membuat kategori" };
      }
    },
    {
      beforeHandle: requireRole(["ADMIN"]),
      body: t.Object({
        name: t.String(),
        description: t.Optional(t.String()),
      }),
    }
  )
  // PUT /api/categories/:id (Protected: Admin Only Middleware)
  .put(
    "/:id",
    async ({ params: { id }, body, set }) => {
      try {
        const updated = await POSStore.updateCategory(id, body);
        return { success: true, data: updated, message: "Kategori berhasil diperbarui" };
      } catch (err: any) {
        set.status = 404;
        return { success: false, error: err.message || "Kategori tidak ditemukan" };
      }
    },
    {
      beforeHandle: requireRole(["ADMIN"]),
      body: t.Object({
        name: t.Optional(t.String()),
        description: t.Optional(t.String()),
      }),
    }
  )
  // DELETE /api/categories/:id (Protected: Admin Only Middleware)
  .delete(
    "/:id",
    async ({ params: { id }, set }) => {
      try {
        const deleted = await POSStore.deleteCategory(id);
        return { success: true, data: deleted, message: "Kategori berhasil dihapus" };
      } catch (err: any) {
        set.status = 400;
        return { success: false, error: err.message || "Gagal menghapus kategori" };
      }
    },
    {
      beforeHandle: requireRole(["ADMIN"]),
    }
  );
