import { createRequire } from "node:module";

interface WikiEntry {
  slug: string;
  file: string;
  title: string;
  content: string;
}

const require = createRequire(import.meta.url);
const entries: WikiEntry[] = require("../generated/wiki.json") as WikiEntry[];

const bySlug = new Map<string, WikiEntry>();
for (const entry of entries) {
  bySlug.set(entry.slug.toLowerCase(), entry);
}

export function listKnowledge(): WikiEntry[] {
  return entries;
}

export function getKnowledgeEntry(slug: string): WikiEntry | undefined {
  return bySlug.get(slug.toLowerCase());
}

export function knowledgeIndexMarkdown(): string {
  const lines = [
    "# Baza wiedzy — Atlas Przetargów",
    "",
    `Dostępne ${entries.length} artykuły merytoryczne o zamówieniach publicznych w Polsce.`,
    "",
    "Uzyskaj pełną treść: `atlas://knowledge/<slug>`.",
    "",
  ];
  for (const entry of [...entries].sort((a, b) => a.slug.localeCompare(b.slug))) {
    lines.push(`- **${entry.title || entry.slug}** (\`${entry.slug}\`)`);
  }
  return lines.join("\n");
}
