import * as esbuild from "esbuild";
import { denoPlugins } from "@luca/esbuild-deno-loader";

const PORT = 3000;

// LOAD DATASET
///////////////

const DATA_DEST = "dist/torchfinder-dataset.jsonl";
const DATA_FIXTURE = "fixtures/torchfinder-dataset.jsonl";

try {
  await Deno.stat(DATA_DEST);
} catch {
  await Deno.mkdir("dist", { recursive: true });
  await Deno.copyFile(DATA_FIXTURE, DATA_DEST);
  console.log(`Loaded ${DATA_DEST} from fixture.`);
}

const ctx = await esbuild.context({
  entryPoints: ["src/app.ts", "src/worker.ts"],
  bundle: true,
  plugins: [...denoPlugins()],
  outdir: "js",
  write: false,
  format: "esm",
  platform: "browser",
  target: "es2022",
  sourcemap: "inline",
});

await ctx.serve({ servedir: ".", port: PORT });

console.log(`Dev server running at http://localhost:${PORT}`);
