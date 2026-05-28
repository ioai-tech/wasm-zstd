import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { compress, decompress, getModuleForTesting, init } from "../dist/index.js";

const testDir = dirname(fileURLToPath(import.meta.url));
const compressed = await readFile(join(testDir, "compressed.zstd"));
const uncompressed = await readFile(join(testDir, "uncompressed.txt"));
const wasmBinary = await readFile(join(testDir, "../dist/wasm-zstd.wasm"));

assert.throws(() => decompress(compressed, uncompressed.byteLength));

await init({ wasmBinary });

{
  const result = decompress(compressed, uncompressed.byteLength);
  assert.equal(result.byteLength, uncompressed.byteLength);
  assert.deepEqual(result, new Uint8Array(uncompressed));
}

{
  const originalHeapSize = getModuleForTesting().HEAP8.buffer.byteLength;
  for (let i = 0; i < 10000; i++) {
    decompress(compressed, uncompressed.byteLength);
  }
  const newHeapSize = getModuleForTesting().HEAP8.buffer.byteLength;
  assert.equal(originalHeapSize, newHeapSize);
}

{
  const result = decompress(compressed, uncompressed.byteLength + 100);
  assert.equal(result.byteLength, uncompressed.byteLength);
  assert.deepEqual(result, new Uint8Array(uncompressed));
}

assert.throws(() => decompress(compressed, uncompressed.byteLength - 100));
assert.throws(() => decompress(new Uint8Array(10).fill(1), 100));

{
  const result = compress(uncompressed);
  assert(result.byteLength < uncompressed.byteLength);
  const decompressed = decompress(result, uncompressed.byteLength);
  assert.deepEqual(decompressed, new Uint8Array(uncompressed));
}

{
  const result3 = compress(uncompressed);
  const result19 = compress(uncompressed, 19);
  assert(result19.byteLength < result3.byteLength);
  const decompressed = decompress(result19, uncompressed.byteLength);
  assert.deepEqual(decompressed, new Uint8Array(uncompressed));
}

console.log("wasm-zstd tests passed");
