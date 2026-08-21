import tailwind from "bun-plugin-tailwind";
import { rm, copyFile } from "node:fs/promises";
import path from "node:path";

const outdir = path.join(process.cwd(), "dist");
await rm(outdir, { recursive: true, force: true });

// 1. Build Bundel Frontend (React + CSS)
await Bun.build({
  entrypoints: ["./src/frontend.tsx", "./src/index.css"],
  outdir,
  naming: "[name].[ext]",
  plugins: [tailwind],
  minify: true,
  target: "browser",
  sourcemap: "linked",
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
});

// 2. Build Entrypoint Backend (Elysia) -> Menjadi dist/index.js
await Bun.build({
  entrypoints: ["./src/index.ts"],
  outdir,
  target: "bun", // Format target khusus untuk runtime Bun/Vercel
  minify: true,
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
});

// 3. Salin index.html ke folder dist
await copyFile("./src/index.html", "./dist/index.html");

console.log("✅ Build completed successfully for Frontend & Backend!");
