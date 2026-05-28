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

export function init(options?: InitOptions): Promise<void>;
export function compressBound(size: number): number;
export function compress(buffer: Uint8Array | ArrayBuffer | ArrayBufferView, compressionLevel?: number): Uint8Array;
export function decompress(buffer: Uint8Array | ArrayBuffer | ArrayBufferView, size: number): Uint8Array;
```

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

This pattern works in browser main-thread code, Web Workers, and Vite production builds because
Vite owns the `.wasm` asset URL.

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

The generated package files are written to `dist/`.

## License

`@ioai/wasm-zstd` is licensed under the [MIT License](https://opensource.org/licenses/MIT).

