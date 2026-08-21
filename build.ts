// import tailwind from "bun-plugin-tailwind";
// import { rm } from "node:fs/promises";
// import path from "node:path";

// const outdir = path.join(process.cwd(), "dist");
// await rm(outdir, { recursive: true, force: true });

// const entrypoints = [...new Bun.Glob("src/**/*.html").scanSync()];

// const result = await Bun.build({
//   entrypoints,
//   outdir,
//   publicPath: "/", // <-- TAMBAHKAN INI
//   plugins: [tailwind],
//   minify: true,
//   target: "browser",
//   sourcemap: "linked",
//   define: {
//     "process.env.NODE_ENV": JSON.stringify("production"),
//   },
// });

// for (const output of result.outputs) {
//   console.log(
//     ` ${path.relative(process.cwd(), output.path)}  ${(output.size / 1024).toFixed(1)} KB`,
//   );
// }

import tailwind from "bun-plugin-tailwind";
import { rm, copyFile } from "node:fs/promises";
import path from "node:path";

const outdir = path.join(process.cwd(), "dist");
// Bersihkan folder dist sebelum build
await rm(outdir, { recursive: true, force: true });

// 1. Build TypeScript Frontend dan CSS
const result = await Bun.build({
  entrypoints: ["./src/frontend.tsx", "./src/index.css"],
  outdir,
  naming: "[name].[ext]", // Menjaga nama output menjadi frontend.js dan index.css
  plugins: [tailwind],
  minify: true,
  target: "browser",
  sourcemap: "linked",
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
});

// 2. Salin index.html langsung ke folder dist
await copyFile("./src/index.html", "./dist/index.html");

for (const output of result.outputs) {
  console.log(
    ` ${path.relative(process.cwd(), output.path)}  ${(output.size / 1024).toFixed(1)} KB`,
  );
}
