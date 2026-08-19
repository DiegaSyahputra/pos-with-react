import { Elysia, t } from "elysia";
import { POSStore } from "../services/store";
import { authMiddleware, requireRole } from "../middleware/auth";
import { validateProductInput } from "../lib/validators";

export const productsRoutes = new Elysia({ prefix: "/api/products" })
  .use(authMiddleware)
  // GET /api/products (Paginated with search & category filters)
  .get(
    "/",
    async ({ query }) => {
      const search = query?.search;
      const categoryId = query?.categoryId;
      const page = query?.page ? Number(query.page) : 1;
      const limit = query?.limit ? Number(query.limit) : 20;

      const result = await POSStore.getProducts({ search, categoryId, page, limit });
      return { success: true, ...result };
    },
    {
      query: t.Object({
        search: t.Optional(t.String()),
        categoryId: t.Optional(t.String()),
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      }),
    }
  )
  // GET /api/products/:id
  .get("/:id", async ({ params: { id }, set }) => {
    const product = await POSStore.getProductById(id);
    if (!product) {
      set.status = 404;
      return { success: false, error: "Product not found" };
    }
    return { success: true, data: product };
  })
  // POST /api/products (Protected: Admin Only Middleware)
  .post(
    "/",
    async ({ body, set }) => {
      try {
        const val = validateProductInput(body);
        if (!val.valid) {
          set.status = 400;
          return { success: false, error: val.error };
        }
        const created = await POSStore.createProduct(body);
        set.status = 201;
        return { success: true, data: created, message: "Product created successfully" };
      } catch (err: any) {
        set.status = 400;
        return { success: false, error: err.message || "Failed to create product" };
      }
    },
    {
      beforeHandle: requireRole(["ADMIN"]),
      body: t.Object({
        sku: t.String(),
        name: t.String(),
        description: t.Optional(t.String()),
        price: t.Number(),
        costPrice: t.Optional(t.Number()),
        stock: t.Number(),
        imageUrl: t.Optional(t.String()),
        categoryId: t.String(),
      }),
    }
  )
  // PUT /api/products/:id (Protected: Admin Only Middleware)
  .put(
    "/:id",
    async ({ params: { id }, body, set }) => {
      try {
        const updated = await POSStore.updateProduct(id, body);
        return { success: true, data: updated, message: "Product updated successfully" };
      } catch (err: any) {
        set.status = 404;
        return { success: false, error: err.message || "Product not found" };
      }
    },
    {
      beforeHandle: requireRole(["ADMIN"]),
      body: t.Object({
        sku: t.Optional(t.String()),
        name: t.Optional(t.String()),
        description: t.Optional(t.String()),
        price: t.Optional(t.Number()),
        costPrice: t.Optional(t.Number()),
        stock: t.Optional(t.Number()),
        imageUrl: t.Optional(t.String()),
        categoryId: t.Optional(t.String()),
      }),
    }
  )
  // DELETE /api/products/:id (Protected: Admin Only Middleware)
  .delete(
    "/:id",
    async ({ params: { id }, set }) => {
      try {
        const deleted = await POSStore.deleteProduct(id);
        return { success: true, data: deleted, message: "Product deleted successfully" };
      } catch (err: any) {
        set.status = 400;
        return { success: false, error: err.message || "Failed to delete product" };
      }
    },
    {
      beforeHandle: requireRole(["ADMIN"]),
    }
  );
