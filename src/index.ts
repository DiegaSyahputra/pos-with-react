import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { html } from "@elysiajs/html";
import path from "node:path";
import { authMiddleware } from "./middleware/auth";
import { authRoutes } from "./routes/auth";
import { usersRoutes } from "./routes/users";
import { categoriesRoutes } from "./routes/categories";
import { productsRoutes } from "./routes/products";
import { customersRoutes } from "./routes/customers";
import { transactionsRoutes } from "./routes/transactions";
import { dashboardRoutes } from "./routes/dashboard";
import { reportsRoutes } from "./routes/reports";

const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === "production";

const htmlPath = isProduction
  ? path.join(process.cwd(), "dist", "index.html")
  : path.join(process.cwd(), "src", "index.html");

const cssPath = isProduction
  ? path.join(process.cwd(), "dist", "index.css")
  : path.join(process.cwd(), "src", "index.css");

let cachedBundle = "";
let lastBuildTime = 0;

async function getFrontendBundle() {
  if (isProduction) {
    const bundleFile = Bun.file(
      path.join(process.cwd(), "dist", "frontend.js"),
    );
    if (await bundleFile.exists()) {
      return await bundleFile.text();
    }
  }

  if (Date.now() - lastBuildTime > 1000 || !cachedBundle) {
    try {
      const result = await Bun.build({
        entrypoints: ["./src/frontend.tsx"],
        target: "browser",
        define: {
          "process.env.NODE_ENV": JSON.stringify("development"),
        },
      });
      if (result.outputs && result.outputs[0]) {
        cachedBundle = await result.outputs[0].text();
        lastBuildTime = Date.now();
      }
    } catch (err) {
      console.error("Bundle build error:", err);
    }
  }
  return cachedBundle;
}

export const app = new Elysia()
  .use(cors())
  .use(html())
  .use(authMiddleware)

  // Register All POS API Routes (authRoutes dkk sudah punya prefix /api/auth, dst)
  .use(authRoutes)
  .use(usersRoutes)
  .use(categoriesRoutes)
  .use(productsRoutes)
  .use(customersRoutes)
  .use(transactionsRoutes)
  .use(dashboardRoutes)
  .use(reportsRoutes)

  // Serve Frontend Bundled Assets
  .get("/frontend.js", async () => {
    const jsCode = await getFrontendBundle();
    return new Response(jsCode, {
      headers: { "Content-Type": "application/javascript; charset=utf-8" },
    });
  })
  .get("/index.css", async () => {
    return new Response(Bun.file(cssPath), {
      headers: { "Content-Type": "text/css; charset=utf-8" },
    });
  })
  .get("/src/*", ({ params }) => {
    const filePath = `./src/${params["*"]}`;
    return new Response(Bun.file(filePath));
  })

  // Catch-All SPA HTML Fallback
  .get("/*", async ({ path: reqPath, set }) => {
    if (reqPath.includes(".")) {
      set.status = 404;
      return "File not found";
    }

    const htmlFile = Bun.file(htmlPath);
    if (!(await htmlFile.exists())) {
      set.status = 404;
      return "index.html not found";
    }

    const htmlContent = await htmlFile.text();
    return new Response(htmlContent, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  });

// Jalankan server lokal hanya jika bukan di environment Vercel
if (!process.env.VERCEL) {
  app.listen(PORT);
  console.log(
    `🚀 POS Web Application & Elysia Backend active on http://localhost:${PORT}`,
  );
}

export default app;
