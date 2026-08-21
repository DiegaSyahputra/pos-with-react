import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { html } from "@elysiajs/html";
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

let cachedBundle = "";
let lastBuildTime = 0;

async function getFrontendBundle() {
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
  .get("/index.css", () => {
    return new Response(Bun.file("./src/index.css"), {
      headers: { "Content-Type": "text/css; charset=utf-8" },
    });
  })
  // Serve Static Media / Images
  .get("/src/*", ({ params }) => {
    const filePath = `./src/${params["*"]}`;
    return new Response(Bun.file(filePath));
  })
  // Serve Single Page React Application HTML Content
  .get("/*", async () => {
    const htmlContent = await Bun.file("./src/index.html").text();
    return new Response(htmlContent, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  })
  .listen(PORT);

console.log(
  `🚀 POS Web Application & Elysia Backend active on http://localhost:${PORT}`,
);
