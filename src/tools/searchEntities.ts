import { z } from "zod";
import type { AtlasClient } from "../lib/client.js";
import type { EntitySearchResult } from "../lib/types.js";
import { formatCurrencyPLN, provinceLabel } from "../lib/format.js";

export const searchEntitiesShape = {
  query: z.string().min(2).describe("Name (or fragment) of the entity to search, e.g. 'warszawa', 'gddkia', 'budimex'"),
  type: z.enum(["buyer", "contractor", "all"]).optional().describe("Limit to buyers (zamawiający), contractors (wykonawcy), or both. Default: all"),
  limit: z.number().int().min(1).max(30).optional().describe("Max results (1-30, default 10)"),
} as const;

export const searchEntitiesSchema = z.object(searchEntitiesShape);
export type SearchEntitiesInput = z.infer<typeof searchEntitiesSchema>;

export async function searchEntities(client: AtlasClient, input: SearchEntitiesInput): Promise<string> {
  const params = {
    q: input.query,
    type: input.type && input.type !== "all" ? input.type : undefined,
    limit: input.limit ?? 10,
  };

  const results = await client.get<EntitySearchResult[]>("/api/entities/search", params);

  if (!Array.isArray(results) || results.length === 0) {
    return `Nie znaleziono podmiotów dla zapytania: "${input.query}".`;
  }

  const lines: string[] = [];
  lines.push(`Znaleziono ${results.length} podmiotów dla "${input.query}":`);
  lines.push("");

  for (const entity of results) {
    const loc = [entity.city, provinceLabel(entity.province)].filter(Boolean).join(", ");
    const valueLabel = entity.value ? ` — ${formatCurrencyPLN(entity.value)}` : "";
    const parts = [
      `**${entity.displayName ?? entity.name}**`,
      `NIP: ${entity.nip}`,
      loc ? `Lokalizacja: ${loc}` : null,
      `Postępowania: ${entity.count}${valueLabel}`,
      entity.slug ? `Slug: ${entity.slug}` : null,
    ].filter(Boolean);
    lines.push(`- ${parts.join(" | ")}`);
  }

  return lines.join("\n");
}

export const searchEntitiesToolDef = {
  name: "search_entities",
  title: "Search procuring entities or contractors by name",
  description:
    "Search Polish public procurement entities (buyers / zamawiający) or contractors (wykonawcy) by name. Returns a list with NIP, location and volume. Useful to find the NIP for get_buyer / get_contractor tools.",
  inputShape: searchEntitiesShape,
  inputSchema: searchEntitiesSchema,
};
