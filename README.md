# @ioai/wasm-zstd

Vite-friendly WebAssembly bindings for [facebook/zstd](https://github.com/facebook/zstd).

## API

`@ioai/wasm-zstd` exports:

```typescript
export interface InitOptions {
  wasmUrl?: string | URL;
  wasmBinary?: ArrayBuffer | ArrayBufferView;
  locateFile?: (path: string, prefix: string) => string;
  module?: Record<string, unknown>;
}

export function init(options: InitOptions): Promise<void>;
export function compressBound(size: number): number;
export function compress(buffer: Uint8Array | ArrayBuffer | ArrayBufferView, compressionLevel?: number): Uint8Array;
export function decompress(buffer: Uint8Array | ArrayBuffer | ArrayBufferView, size: number): Uint8Array;
```

`init()` requires either `wasmUrl` or `wasmBinary`. The package does not rely on Emscripten's
default `import.meta.url` wasm resolution, which breaks in Vite inline worker bundles.

## Usage with Vite

Import the wasm binary as an explicit URL and initialize the module once before calling
`compress` or `decompress`.

```ts
import { compress, decompress, init } from "@ioai/wasm-zstd";
import wasmUrl from "@ioai/wasm-zstd/wasm-zstd.wasm?url";

await init({ wasmUrl });

const compressed = compress(new TextEncoder().encode("hello zstd"), 3);
const decompressed = decompress(compressed, "hello zstd".length);
```

This pattern works in browser main-thread code, dedicated Web Workers, and Vite production
builds because Vite owns the `.wasm` asset URL.

## Usage in inline workers (`?worker&inline`)

Vite inline workers are loaded from `blob:` URLs, so neither sibling `.wasm` files nor sibling
JS chunks can be resolved relative to the worker. To keep inline workers self-contained, the
Emscripten glue is imported **statically** (not via a runtime `import("./wasm-zstd.js")`), so
bundlers inline it into the worker chunk. You only need to supply the wasm **bytes** — fetch
them on the main thread and pass them into the worker:

```ts
// main thread
import wasmUrl from "@ioai/wasm-zstd/wasm-zstd.wasm?url";

const wasmBinary = await fetch(wasmUrl).then((response) => response.arrayBuffer());
const worker = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });
worker.postMessage({ wasmBinary }, [wasmBinary]);
```

```ts
// worker.ts
import { init } from "@ioai/wasm-zstd";

await init({ wasmBinary });
```

## Usage with custom loaders

If you already have the wasm bytes, pass them with `wasmBinary`:

```ts
import { init } from "@ioai/wasm-zstd";

await init({ wasmBinary });
```

## Developing locally

1. Run `npm install`.
2. Run `npm run build` to invoke emcc inside Docker and compile `src/wasm-zstd.c` plus the vendored zstd sources.
3. Run `npm test`.

The generated package files are written to `dist/`. Emscripten glue is post-processed to remove
`import.meta.url` wasm fallbacks that are incompatible with Vite worker bundling.

## License

`@ioai/wasm-zstd` is licensed under the [MIT License](https://opensource.org/licenses/MIT).
