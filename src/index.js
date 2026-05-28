import createModule from "./wasm-zstd.js";

let modulePromise;
let moduleInstance;

function toUint8Array(value) {
  if (value instanceof Uint8Array) {
    return value;
  }
  if (value instanceof ArrayBuffer) {
    return new Uint8Array(value);
  }
  if (ArrayBuffer.isView(value)) {
    return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  }
  throw new TypeError("Expected a Uint8Array, ArrayBuffer, or ArrayBuffer view");
}

function normalizeInitOptions(options = {}) {
  const moduleOptions = { ...options.module };

  if (options.wasmBinary != undefined) {
    moduleOptions.wasmBinary = toUint8Array(options.wasmBinary);
  }

  if (options.wasmUrl != undefined) {
    const wasmUrl = String(options.wasmUrl);
    moduleOptions.locateFile = (path, prefix) => (path.endsWith(".wasm") ? wasmUrl : `${prefix}${path}`);
  } else if (options.locateFile != undefined) {
    moduleOptions.locateFile = options.locateFile;
  }

  return moduleOptions;
}

export async function init(options = {}) {
  if (moduleInstance != undefined) {
    return;
  }
  modulePromise ??= createModule(normalizeInitOptions(options)).then((mod) => {
    moduleInstance = mod;
  });
  await modulePromise;
}

function getModule() {
  if (moduleInstance == undefined) {
    throw new Error("wasm-zstd has not been initialized. Call and await init() before using it.");
  }
  return moduleInstance;
}

export function compressBound(srcSize) {
  return getModule()._compressBound(srcSize);
}

export function compress(src, compressionLevel = 3) {
  const module = getModule();
  const input = toUint8Array(src);
  const srcSize = input.byteLength;
  const destSize = compressBound(srcSize);

  const srcPointer = module._malloc(srcSize);
  const destPointer = module._malloc(destSize);

  try {
    new Uint8Array(module.HEAPU8.buffer, srcPointer, srcSize).set(input);
    const resultSize = module._compress(destPointer, destSize, srcPointer, srcSize, compressionLevel);
    if (resultSize === -1) {
      throw new Error("zstd compression failed");
    }
    return module.HEAPU8.slice(destPointer, destPointer + resultSize);
  } finally {
    module._free(srcPointer);
    module._free(destPointer);
  }
}

export function decompress(src, destSize) {
  const module = getModule();
  const input = toUint8Array(src);
  const outputSize = Number(destSize);
  if (!Number.isFinite(outputSize) || outputSize < 0) {
    throw new RangeError("Expected destSize to be a non-negative finite number");
  }

  const srcPointer = module._malloc(input.byteLength);
  const destPointer = module._malloc(outputSize);

  try {
    new Uint8Array(module.HEAPU8.buffer, srcPointer, input.byteLength).set(input);
    const resultSize = module._decompress(destPointer, outputSize, srcPointer, input.byteLength);
    if (resultSize === -1) {
      throw new Error("zstd decompression failed");
    }
    return module.HEAPU8.slice(destPointer, destPointer + resultSize);
  } finally {
    module._free(srcPointer);
    module._free(destPointer);
  }
}

export function getModuleForTesting() {
  return getModule();
}
