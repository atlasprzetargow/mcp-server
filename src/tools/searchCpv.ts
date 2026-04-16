import { z } from "zod";
import type { AtlasClient } from "../lib/client.js";
import type { CpvSearchResponse } from "../lib/types.js";

export const searchCpvShape = {
  query: z.string().min(2).describe("Search term for CPV (Common Procurement Vocabulary) codes — keyword in Polish, e.g. 'komputer', 'budowa drogi', 'usługi prawne'"),
  limit: z.number().int().min(1).max(30).optional().describe("Max results (1-30, default 10)"),
} as const;

export const searchCpvSchema = z.object(searchCpvShape);
export type SearchCpvInput = z.infer<typeof searchCpvSchema>;

export async function searchCpv(client: AtlasClient, input: SearchCpvInput): Promise<string> {
  const response = await client.get<CpvSearchResponse>("/api/cpv/search", {
    q: input.query,
    limit: input.limit ?? 10,
  });

  const items = response.data ?? [];
  if (items.length === 0) {
    return `Nie znaleziono kodów CPV dla zapytania: "${input.query}".`;
  }

  const lines: string[] = [];
  lines.push(`Znaleziono ${items.length} kodów CPV dla "${input.query}":`);
  lines.push("");

  for (const item of items) {
    lines.push(`- **${item.code}** — ${item.name}`);
    lines.push(`  Dział ${item.division}: ${item.divisionName} | Liczba przetargów: ${item.count.toLocaleString("pl-PL")}`);
  }

  return lines.join("\n");
}

export const searchCpvToolDef = {
  name: "search_cpv",
  title: "Search CPV codes by keyword",
  description:
    "Look up CPV (Common Procurement Vocabulary — EU procurement category) codes by Polish keyword. Use this before search_tenders to find the right CPV filter. Returns code, name, division, and historical tender count.",
  inputShape: searchCpvShape,
  inputSchema: searchCpvSchema,
};
