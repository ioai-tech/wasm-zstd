export interface InitOptions {
  /**
   * URL for the generated wasm file. In Vite, import it with:
   * `import wasmUrl from "@ioai/wasm-zstd/wasm-zstd.wasm?url"`.
   */
  wasmUrl?: string | URL;

  /**
   * Raw wasm bytes. Useful for Node tests or custom loaders.
   */
  wasmBinary?: ArrayBuffer | ArrayBufferView;

  /**
   * Advanced Emscripten file resolver. Ignored when wasmUrl is provided.
   */
  locateFile?: (path: string, prefix: string) => string;

  /**
   * Additional Emscripten module options.
   */
  module?: Record<string, unknown>;
}

export function init(options?: InitOptions): Promise<void>;
export function compressBound(size: number): number;
export function compress(buffer: Uint8Array | ArrayBuffer | ArrayBufferView, compressionLevel?: number): Uint8Array;
export function decompress(buffer: Uint8Array | ArrayBuffer | ArrayBufferView, size: number): Uint8Array;

/**
 * Exposes the raw Emscripten module for tests and diagnostics.
 */
export function getModuleForTesting(): unknown;
