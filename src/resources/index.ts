import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  glossaryIndexMarkdown,
  listGlossary,
  getGlossaryEntry,
  formatGlossaryEntry,
} from "./glossary.js";
import {
  knowledgeIndexMarkdown,
  listKnowledge,
  getKnowledgeEntry,
} from "./knowledge.js";

export function registerResources(server: McpServer): void {
  // Static index resources
  server.registerResource(
    "atlas-glossary-index",
    "atlas://glossary",
    {
      title: "Atlas — Słownik pojęć zamówień publicznych (indeks)",
      description: "Indeks 90+ terminów polskiego prawa zamówień publicznych z atlasprzetargow.pl/slownik",
      mimeType: "text/markdown",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/markdown",
          text: glossaryIndexMarkdown(),
        },
      ],
    }),
  );

  server.registerResource(
    "atlas-knowledge-index",
    "atlas://knowledge",
    {
      title: "Atlas — Baza wiedzy (indeks)",
      description: "Indeks artykułów merytorycznych o zamówieniach publicznych w PL",
      mimeType: "text/markdown",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/markdown",
          text: knowledgeIndexMarkdown(),
        },
      ],
    }),
  );

  // Resource templates for per-entry access
  server.registerResource(
    "atlas-glossary-term",
    {
      uriTemplate: "atlas://glossary/{slug}",
      name: "atlas-glossary-term",
    } as unknown as string,
    {
      title: "Atlas — Definicja terminu z słownika",
      description: "Pełna definicja pojedynczego terminu ZP. Użyj slug z indeksu atlas://glossary",
      mimeType: "text/markdown",
    },
    async (uri) => {
      const slug = extractSlugFromUri(uri.href, "glossary");
      const entry = slug ? getGlossaryEntry(slug) : undefined;
      if (!entry) {
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "text/markdown",
              text: `Nie znaleziono terminu: "${slug ?? ""}".\n\nDostępne terminy: atlas://glossary`,
            },
          ],
        };
      }
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "text/markdown",
            text: formatGlossaryEntry(entry),
          },
        ],
      };
    },
  );

  server.registerResource(
    "atlas-knowledge-article",
    {
      uriTemplate: "atlas://knowledge/{slug}",
      name: "atlas-knowledge-article",
    } as unknown as string,
    {
      title: "Atlas — Artykuł z bazy wiedzy",
      description: "Pełna treść artykułu bazy wiedzy. Użyj slug z indeksu atlas://knowledge",
      mimeType: "text/markdown",
    },
    async (uri) => {
      const slug = extractSlugFromUri(uri.href, "knowledge");
      const entry = slug ? getKnowledgeEntry(slug) : undefined;
      if (!entry) {
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "text/markdown",
              text: `Nie znaleziono artykułu: "${slug ?? ""}".\n\nDostępne artykuły: atlas://knowledge`,
            },
          ],
        };
      }
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "text/markdown",
            text: entry.content,
          },
        ],
      };
    },
  );
}

function extractSlugFromUri(uri: string, prefix: string): string | undefined {
  const marker = `atlas://${prefix}/`;
  const idx = uri.indexOf(marker);
  if (idx === -1) return undefined;
  const rest = uri.slice(idx + marker.length);
  return rest.split(/[?#]/)[0] || undefined;
}

// Re-export for smoke tests
export { listGlossary, listKnowledge };
