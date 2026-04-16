import { z } from "zod";
import type { AtlasClient } from "../lib/client.js";
import type { CategoryStats } from "../lib/types.js";
import { formatCurrencyPLN } from "../lib/format.js";

export const getCategoryStatsShape = {
  cpv: z.string().describe("CPV code or prefix, e.g. '45' (construction), '72' (IT), '45240000-1'"),
  window: z.enum(["month", "quarter", "year"]).optional().describe("Statistics window: month=30d, quarter=90d, year=365d. Default: year"),
} as const;

export const getCategoryStatsSchema = z.object(getCategoryStatsShape);
export type GetCategoryStatsInput = z.infer<typeof getCategoryStatsSchema>;

export async function getCategoryStats(client: AtlasClient, input: GetCategoryStatsInput): Promise<string> {
  const stats = await client.get<CategoryStats>("/api/tenders/agg/category-stats", {
    cpv: input.cpv,
    window: input.window ?? "year",
  });

  const lines: string[] = [];
  lines.push(`# Statystyki CPV ${stats.cpv} (okno: ${stats.days} dni)`);
  lines.push("");
  lines.push(`- **Liczba przetargów w okresie:** ${stats.count_period.toLocaleString("pl-PL")}`);
  lines.push(`- **Liczba przetargów łącznie (wszystkie dane):** ${stats.count_total.toLocaleString("pl-PL")}`);
  if (stats.avg_value !== null && stats.avg_value !== undefined) {
    lines.push(`- **Średnia wartość:** ${formatCurrencyPLN(stats.avg_value)} (próba: ${stats.value_sample_size.toLocaleString("pl-PL")})`);
  }
  if (stats.median_value !== null && stats.median_value !== undefined) {
    lines.push(`- **Mediana wartości:** ${formatCurrencyPLN(stats.median_value)}`);
  }
  if (stats.avg_offers_count !== null && stats.avg_offers_count !== undefined) {
    lines.push(`- **Średnia liczba ofert:** ${stats.avg_offers_count.toFixed(1)} (próba: ${stats.offers_sample_size.toLocaleString("pl-PL")})`);
  }
  if (stats.avg_deadline_days !== null && stats.avg_deadline_days !== undefined) {
    lines.push(`- **Średnia długość okresu na oferty:** ${stats.avg_deadline_days} dni (próba: ${stats.deadline_sample_size.toLocaleString("pl-PL")})`);
  }
  lines.push("");
  lines.push(`_Źródło: Atlas Przetargów — https://atlasprzetargow.pl/przetargi/kategoria/_`);

  return lines.join("\n");
}

export const getCategoryStatsToolDef = {
  name: "get_category_stats",
  title: "Get tender statistics for a CPV category",
  description:
    "Retrieve aggregate statistics for a CPV category: count, average/median value, average number of offers, average deadline period. Based on historical BZP+TED data. Useful for market sizing and competitive benchmarking.",
  inputShape: getCategoryStatsShape,
  inputSchema: getCategoryStatsSchema,
};
