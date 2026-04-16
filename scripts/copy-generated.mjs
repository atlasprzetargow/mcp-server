#!/usr/bin/env node
// Copies src/generated/*.json to dist/generated/ so the compiled JS can resolve require('../generated/*.json')
import { mkdirSync, copyFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SRC = join(ROOT, "src/generated");
const DST = join(ROOT, "dist/generated");

if (!existsSync(SRC)) {
  console.warn(`[copy-generated] ${SRC} does not exist — skipping`);
  process.exit(0);
}

mkdirSync(DST, { recursive: true });

const files = readdirSync(SRC).filter((f) => f.endsWith(".json"));
for (const f of files) {
  copyFileSync(join(SRC, f), join(DST, f));
}

console.log(`[copy-generated] ✓ copied ${files.length} JSON files to dist/generated/`);
