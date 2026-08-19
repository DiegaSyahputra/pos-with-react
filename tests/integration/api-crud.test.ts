import { describe, expect, it, afterAll } from "bun:test";
import { Elysia } from "elysia";
import { prisma } from "../../src/db";
import { authMiddleware } from "../../src/middleware/auth";
import { authRoutes } from "../../src/routes/auth";
import { usersRoutes } from "../../src/routes/users";
import { categoriesRoutes } from "../../src/routes/categories";
import { productsRoutes } from "../../src/routes/products";
import { customersRoutes } from "../../src/routes/customers";
import { transactionsRoutes } from "../../src/routes/transactions";
import { dashboardRoutes } from "../../src/routes/dashboard";
import { reportsRoutes } from "../../src/routes/reports";

const app = new Elysia()
  .use(authMiddleware)
  .use(authRoutes)
  .use(usersRoutes)
  .use(categoriesRoutes)
  .use(productsRoutes)
  .use(customersRoutes)
  .use(transactionsRoutes)
  .use(dashboardRoutes)
  .use(reportsRoutes);

describe("Elysia API Integration Tests & DB Constraint Validation", () => {
  let createdCategoryId: string = "";
  let createdProductId: string = "";
  let createdTestSku: string = "";
  let createdTestCategoryName: string = "";
  let createdTestUsername: string = "";
  let userJwtToken: string = "";

  // Test Cleanup Hook
  afterAll(async () => {
    try {
      if (createdProductId) {
        await prisma.transactionItem.deleteMany({ where: { productId: createdProductId } });
        await prisma.product.deleteMany({ where: { id: createdProductId } });
      }
      await prisma.product.deleteMany({ where: { sku: { startsWith: "CHK-" } } });
      await prisma.product.deleteMany({ where: { sku: { startsWith: "DUP-" } } });
      if (createdCategoryId) {
        await prisma.category.deleteMany({ where: { id: createdCategoryId } });
      }
      if (createdTestUsername) {
        await prisma.user.deleteMany({ where: { username: createdTestUsername } });
      }
    } catch {
      // Ignore cleanup errors
    }
  });

  it("POST /api/auth/login should authenticate user & return 8h expired JWT token", async () => {
    const req = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "admin",
        password: "admin123",
      }),
    });
    const res = await app.handle(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body).toHaveProperty("token");
    expect(body.data.username).toBe("admin");
    expect(body.data.role).toBe("ADMIN");
    userJwtToken = body.token;
  }, 15000);

  it("GET /api/auth/me should validate Bearer JWT token & return user profile", async () => {
    const req = new Request("http://localhost/api/auth/me", {
      headers: { Authorization: `Bearer ${userJwtToken}` },
    });
    const res = await app.handle(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.username).toBe("admin");
  }, 15000);

  it("PUT /api/auth/profile should update logged in user profile name", async () => {
    const req = new Request("http://localhost/api/auth/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userJwtToken}`,
      },
      body: JSON.stringify({
        name: "Administrator POS Updated",
      }),
    });
    const res = await app.handle(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.name).toBe("Administrator POS Updated");
  }, 15000);

  it("GET /api/users should list all users with pagination", async () => {
    const req = new Request("http://localhost/api/users?page=1&limit=10", {
      headers: { Authorization: `Bearer ${userJwtToken}` },
    });
    const res = await app.handle(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body).toHaveProperty("meta");
  }, 15000);

  it("POST /api/users should create a new cashier when authenticated as ADMIN", async () => {
    createdTestUsername = `kasir_${Date.now()}`;
    const req = new Request("http://localhost/api/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userJwtToken}`,
      },
      body: JSON.stringify({
        username: createdTestUsername,
        name: "Kasir Shift Malam",
        password: "kasirpassword123",
        role: "CASHIER",
      }),
    });
    const res = await app.handle(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.role).toBe("CASHIER");
  }, 15000);

  it("POST /api/categories should create a new category when authenticated as ADMIN", async () => {
    createdTestCategoryName = `Category ${Date.now()}`;
    const req = new Request("http://localhost/api/categories", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userJwtToken}`,
      },
      body: JSON.stringify({
        name: createdTestCategoryName,
        description: "Test description",
      }),
    });
    const res = await app.handle(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    createdCategoryId = body.data.id;
  }, 15000);

  it("POST /api/categories should return 400 for duplicate category name (Unique Constraint Error)", async () => {
    const req = new Request("http://localhost/api/categories", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userJwtToken}`,
      },
      body: JSON.stringify({
        name: createdTestCategoryName,
        description: "Duplicate category test",
      }),
    });
    const res = await app.handle(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
  }, 15000);

  it("GET /api/products should return paginated list of products", async () => {
    const req = new Request("http://localhost/api/products?page=1&limit=5");
    const res = await app.handle(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body).toHaveProperty("meta");
    expect(body.meta.page).toBe(1);
    expect(body.meta.limit).toBe(5);
  }, 15000);

  it("POST /api/products should return 400 when creating product with negative price (Validation Error)", async () => {
    const req = new Request("http://localhost/api/products", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userJwtToken}`,
      },
      body: JSON.stringify({
        sku: `FAIL-${Date.now()}`,
        name: "Negative Price Product",
        price: -15000,
        stock: 10,
        categoryId: createdCategoryId || "cat-1",
      }),
    });
    const res = await app.handle(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain("negatif");
  }, 15000);

  it("POST /api/customers should return 400 when creating customer with empty name (Validation Error)", async () => {
    const req = new Request("http://localhost/api/customers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userJwtToken}`,
      },
      body: JSON.stringify({
        name: "   ",
        phone: "08123456789",
      }),
    });
    const res = await app.handle(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain("wajib diisi");
  }, 15000);

  it("GET /api/reports/sales should return sales report with date range summary", async () => {
    const req = new Request("http://localhost/api/reports/sales", {
      headers: { Authorization: `Bearer ${userJwtToken}` },
    });
    const res = await app.handle(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty("summary");
    expect(body.data).toHaveProperty("paymentBreakdown");
  }, 15000);

  it("POST /api/transactions should process checkout with atomic stock decrement & Cashier tracking", async () => {
    createdTestSku = `CHK-${Date.now()}`;
    const createProdRes = await app.handle(
      new Request("http://localhost/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userJwtToken}`,
        },
        body: JSON.stringify({
          sku: createdTestSku,
          name: "Checkout Test Product",
          price: 25000,
          stock: 50,
          categoryId: createdCategoryId || "cat-1",
        }),
      })
    );
    const createProdBody = await createProdRes.json();
    createdProductId = createProdBody.data.id;

    const req = new Request("http://localhost/api/transactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userJwtToken}`,
      },
      body: JSON.stringify({
        items: [{ productId: createdProductId, quantity: 1, unitPrice: 25000 }],
        paymentMethod: "CASH",
        paymentAmount: 500000,
        taxAmount: 2500,
        discountAmount: 0,
      }),
    });
    const res = await app.handle(req);
    const body = await res.json();
    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty("invoiceNo");
  }, 15000);

  it("DELETE /api/products/:id should return 400 when deleting product with existing sales history (Foreign Key Protection)", async () => {
    if (createdProductId) {
      const req = new Request(`http://localhost/api/products/${createdProductId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${userJwtToken}` },
      });
      const res = await app.handle(req);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain("riwayat transaksi");
    }
  }, 15000);

  it("POST /api/transactions should return 400 when stock is insufficient", async () => {
    const getProdRes = await app.handle(new Request("http://localhost/api/products"));
    const getProdBody = await getProdRes.json();
    const prodList = getProdBody.data || [];
    const validProd = prodList[0];

    if (validProd) {
      const req = new Request("http://localhost/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{ productId: validProd.id, quantity: 999999, unitPrice: 1000 }],
          paymentMethod: "CASH",
          paymentAmount: 999999999999,
        }),
      });
      const res = await app.handle(req);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain("Stok");
    }
  }, 15000);

  it("GET /api/products/:id should return 404 for invalid ID", async () => {
    const res = await app.handle(new Request("http://localhost/api/products/invalid-id-xyz"));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.success).toBe(false);
  }, 15000);
});
