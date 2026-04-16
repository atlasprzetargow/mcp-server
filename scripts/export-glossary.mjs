#!/usr/bin/env node
// Pre-build script: extracts glossary entries from next-client/src/data/slownik.ts into a JSON bundle
// and copies knowledge-base wiki markdown files into src/generated/.
// Runs automatically before `npm run build` (see package.json prebuild hook).

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const MONOREPO_ROOT = resolve(ROOT, "..");

const SLOWNIK_SRC = join(MONOREPO_ROOT, "next-client/src/data/slownik.ts");
const WIKI_DIR = join(MONOREPO_ROOT, "knowledge-base/wiki");
const OUT_DIR = join(ROOT, "src/generated");
const GLOSSARY_OUT = join(OUT_DIR, "glossary.json");

mkdirSync(OUT_DIR, { recursive: true });

// --- Glossary extraction ---

function extractGlossary() {
  if (!existsSync(SLOWNIK_SRC)) {
    console.warn(`[export-glossary] slownik.ts not found at ${SLOWNIK_SRC} — writing empty glossary`);
    writeFileSync(GLOSSARY_OUT, "[]", "utf8");
    return 0;
  }

  const src = readFileSync(SLOWNIK_SRC, "utf8");
  const entries = [];
  const regex = /\{\s*slug:\s*'([^']+)',\s*term:\s*'([^']+)',\s*shortDef:\s*([`'"])([\s\S]*?)\3,\s*definition:\s*([`'"])([\s\S]*?)\5,\s*extended:\s*([`'"])([\s\S]*?)\7,/g;

  let m;
  while ((m = regex.exec(src)) !== null) {
    const [, slug, term, , shortDef, , definition, , extended] = m;
    entries.push({
      slug,
      term,
      shortDef: unescapeTs(shortDef),
      definition: unescapeTs(definition),
      extended: unescapeTs(extended),
    });
  }

  if (entries.length === 0) {
    console.warn("[export-glossary] No entries extracted — regex may need update for slownik.ts format");
  }

  writeFileSync(GLOSSARY_OUT, JSON.stringify(entries, null, 2), "utf8");
  return entries.length;
}

function unescapeTs(s) {
  return s
    .replace(/\\'/g, "'")
    .replace(/\\"/g, '"')
    .replace(/\\`/g, "`")
    .replace(/\\n/g, "\n")
    .replace(/\\\\/g, "\\");
}

// --- Wiki copy ---

function copyWiki() {
  if (!existsSync(WIKI_DIR)) {
    console.warn(`[export-glossary] Wiki dir not found at ${WIKI_DIR}`);
    writeFileSync(join(OUT_DIR, "wiki.json"), "[]", "utf8");
    return 0;
  }
  const files = readdirSync(WIKI_DIR).filter((f) => f.endsWith(".md"));
  const entries = files.map((f) => {
    const raw = readFileSync(join(WIKI_DIR, f), "utf8");
    const { title, body } = parseMarkdownFrontmatter(raw);
    return {
      slug: f.replace(/\.md$/, ""),
      file: f,
      title,
      content: body,
    };
  });
  writeFileSync(join(OUT_DIR, "wiki.json"), JSON.stringify(entries, null, 2), "utf8");
  return files.length;
}

function parseMarkdownFrontmatter(raw) {
  const fmMatch = /^---\n([\s\S]*?)\n---\n?/.exec(raw);
  if (!fmMatch) {
    const h1 = /^#\s+(.+)$/m.exec(raw);
    return { title: h1 ? h1[1].trim() : "", body: raw };
  }
  const fm = fmMatch[1];
  const body = raw.slice(fmMatch[0].length);
  const titleMatch = /^title:\s*['"]?(.+?)['"]?\s*$/m.exec(fm);
  const h1 = /^#\s+(.+)$/m.exec(body);
  return {
    title: titleMatch ? titleMatch[1].trim() : h1 ? h1[1].trim() : "",
    body,
  };
}

const glossaryCount = extractGlossary();
const wikiCount = copyWiki();

console.log(`[export-glossary] ✓ glossary: ${glossaryCount} terms → src/generated/glossary.json`);
console.log(`[export-glossary] ✓ wiki: ${wikiCount} articles → src/generated/wiki/`);
