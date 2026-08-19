import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { POSStore } from "../services/store";

const jwtSecret = process.env.JWT_SECRET || "pos-super-secret-jwt-key-2026-production";

export const transactionsRoutes = new Elysia({ prefix: "/api/transactions" })
  .use(
    jwt({
      name: "jwtAuth",
      secret: jwtSecret,
    })
  )
  // GET /api/transactions (Paginated)
  .get(
    "/",
    async ({ query }) => {
      const page = query?.page ? Number(query.page) : 1;
      const limit = query?.limit ? Number(query.limit) : 20;
      const result = await POSStore.getTransactions({ page, limit });
      return { success: true, ...result };
    },
    {
      query: t.Object({
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      }),
    }
  )
  // GET /api/transactions/:id
  .get("/:id", async ({ params: { id }, set }) => {
    const transaction = await POSStore.getTransactionById(id);
    if (!transaction) {
      set.status = 404;
      return { success: false, error: "Transaction not found" };
    }
    return { success: true, data: transaction };
  })
  // POST /api/transactions - Process POS Checkout with Cashier Tracking (userId)
  .post(
    "/",
    async ({ body, headers, jwtAuth, set }) => {
      try {
        if (!body.items || body.items.length === 0) {
          set.status = 400;
          return { success: false, error: "Cart items cannot be empty" };
        }

        let activeUserId = body.userId;
        if (!activeUserId) {
          const authHeader = headers["authorization"] || headers["Authorization"];
          if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.split(" ")[1];
            try {
              const payload: any = await jwtAuth.verify(token);
              if (payload && payload.id) {
                activeUserId = payload.id;
              }
            } catch {
              // Ignore JWT decode error if token expired/invalid
            }
          }
        }

        const transaction = await POSStore.createTransaction({
          ...body,
          userId: activeUserId,
        });

        set.status = 201;
        return {
          success: true,
          data: transaction,
          message: "POS Transaction completed successfully!",
        };
      } catch (err: any) {
        set.status = 400;
        return {
          success: false,
          error: err.message || "Failed to process transaction",
        };
      }
    },
    {
      body: t.Object({
        items: t.Array(
          t.Object({
            productId: t.String(),
            quantity: t.Number(),
            unitPrice: t.Number(),
          })
        ),
        paymentMethod: t.String(),
        paymentAmount: t.Number(),
        customerId: t.Optional(t.String()),
        userId: t.Optional(t.String()),
        taxAmount: t.Optional(t.Number()),
        discountAmount: t.Optional(t.Number()),
      }),
    }
  );
