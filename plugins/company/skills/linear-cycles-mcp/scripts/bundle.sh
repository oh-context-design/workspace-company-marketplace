#!/bin/bash
# Bundle the linear-cycles-mcp for distribution
# Outputs: dist/index.js (self-contained, no runtime deps)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MCP_DIR="$(dirname "$SCRIPT_DIR")"

cd "$MCP_DIR"

echo "Bundling linear-cycles-mcp..."

bun build src/index.ts \
  --target=node \
  --outdir=dist \
  --minify \
  --external=fs \
  --external=path \
  --external=os \
  --external=child_process \
  --external=crypto \
  --external=http \
  --external=https \
  --external=net \
  --external=tls \
  --external=stream \
  --external=url \
  --external=util \
  --external=events \
  --external=buffer \
  --external=querystring \
  --external=zlib

echo "Bundle created: dist/index.js"
ls -lh dist/index.js
