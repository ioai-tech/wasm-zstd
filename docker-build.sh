#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$SCRIPT_DIR"

docker build --progress=plain . -t ioai-wasm-zstd

mkdir -p dist

docker run --rm -v "${SCRIPT_DIR}/dist":/src/dist ioai-wasm-zstd ./build.sh
