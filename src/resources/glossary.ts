import { createRequire } from "node:module";

interface GlossaryEntry {
  slug: string;
  term: string;
  shortDef: string;
  definition: string;
  extended: string;
}

const require = createRequire(import.meta.url);
const entries: GlossaryEntry[] = require("../generated/glossary.json") as GlossaryEntry[];

const bySlug = new Map<string, GlossaryEntry>();
for (const entry of entries) {
  bySlug.set(entry.slug.toLowerCase(), entry);
}

export function listGlossary(): GlossaryEntry[] {
  return entries;
}

export function getGlossaryEntry(slug: string): GlossaryEntry | undefined {
  return bySlug.get(slug.toLowerCase());
}

export function formatGlossaryEntry(entry: GlossaryEntry): string {
  const parts: string[] = [];
  parts.push(`# ${entry.term}`);
  parts.push("");
  parts.push(`**Skrót:** ${entry.shortDef}`);
  parts.push("");
  parts.push("## Definicja");
  parts.push(entry.definition);
  if (entry.extended) {
    parts.push("");
    parts.push("## Rozszerzenie");
    parts.push(entry.extended);
  }
  parts.push("");
  parts.push(`**Źródło:** https://atlasprzetargow.pl/slownik/${entry.slug}`);
  return parts.join("\n");
}

export function glossaryIndexMarkdown(): string {
  const lines = ["# Słownik zamówień publicznych — Atlas Przetargów", ""];
  lines.push(`Dostępne ${entries.length} terminy.`);
  lines.push("");
  lines.push("Uzyskaj pełną definicję: `atlas://glossary/<slug>`.");
  lines.push("");
  for (const entry of [...entries].sort((a, b) => a.term.localeCompare(b.term, "pl"))) {
    lines.push(`- **${entry.term}** (\`${entry.slug}\`) — ${entry.shortDef}`);
  }
  return lines.join("\n");
}
