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

// Tentukan lokasi file berdasarkan lingkungan (Production = dist, Dev = src)
const htmlPath = isProduction
  ? path.join(process.cwd(), "dist", "index.html")
  : path.join(process.cwd(), "src", "index.html");

const cssPath = isProduction
  ? path.join(process.cwd(), "dist", "index.css")
  : path.join(process.cwd(), "src", "index.css");

let cachedBundle = "";
let lastBuildTime = 0;

async function getFrontendBundle() {
  // Jika di Production, langsung baca file hasil build di folder dist/
  if (isProduction) {
    const bundleFile = Bun.file(
      path.join(process.cwd(), "dist", "frontend.js"),
    );
    if (await bundleFile.exists()) {
      return await bundleFile.text();
    }
  }

  // Jika di Development, lakukan live bundling on-the-fly
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
  // Enable CORS & HTML plugin
  .use(cors())
  .use(html())
  // Register Auth Middleware Macro Globally
  .use(authMiddleware)
  // Register POS API Routes
  .use(authRoutes)
  .use(usersRoutes)
  .use(categoriesRoutes)
  .use(productsRoutes)
  .use(customersRoutes)
  .use(transactionsRoutes)
  .use(dashboardRoutes)
  .use(reportsRoutes)

  // Serve Bundled React Application Code
  .get("/frontend.js", async () => {
    const jsCode = await getFrontendBundle();
    return new Response(jsCode, {
      headers: { "Content-Type": "application/javascript; charset=utf-8" },
    });
  })

  // Serve CSS Stylesheet
  .get("/index.css", async () => {
    return new Response(Bun.file(cssPath), {
      headers: { "Content-Type": "text/css; charset=utf-8" },
    });
  })

  // Serve Static Media / Images
  .get("/src/*", ({ params }) => {
    const filePath = `./src/${params["*"]}`;
    return new Response(Bun.file(filePath));
  })

  // Catch-All SPA Routing (HTML Fallback)
  .get("/*", async ({ path: reqPath, set }) => {
    // KUNCI PERBAIKAN: Jika request meminta file statis (.js, .css, .png, dll) yang tidak ditemukan,
    // kembalikan 404 dan BUKAN mengembalikan index.html (mencegah layar blank/MIME error).
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
  })
  .listen(PORT);

console.log(
  `🚀 POS Web Application & Elysia Backend active on http://localhost:${PORT}`,
);

export default app;
