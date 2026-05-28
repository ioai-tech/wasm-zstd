/**
 * Patch Emscripten glue for Vite bundlers and inline (`blob:`) workers.
 *
 * Emscripten ES6 output uses `new URL("*.wasm", import.meta.url)` when locateFile
 * is unset. Vite worker bundles (especially `?worker&inline`) may provide an
 * import.meta.url base that cannot resolve sibling assets, which throws at runtime.
 *
 * @ioai/wasm-zstd always initializes through init({ wasmUrl }) or init({ wasmBinary }),
 * so the package sets Module.locateFile before the factory runs. This patch removes
 * the brittle import.meta.url fallback from generated glue as defense in depth.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const distDir = join(dirname(fileURLToPath(import.meta.url)), "..", "dist");
const gluePath = join(distDir, "wasm-zstd.js");

let js = readFileSync(gluePath, "utf8");

js = js.replace(
  "var _scriptDir = import.meta.url;",
  'var _scriptDir = (function () { try { return import.meta.url; } catch { return ""; } })();',
);

js = js.replace(
  'wasmBinaryFile=new URL("wasm-zstd.wasm",import.meta.url).toString()',
  'wasmBinaryFile="wasm-zstd.wasm"',
);

writeFileSync(gluePath, js);
