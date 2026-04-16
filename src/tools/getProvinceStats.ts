import { z } from "zod";
import type { AtlasClient } from "../lib/client.js";
import type { ProvinceAggResponse } from "../lib/types.js";
import { formatCurrencyPLN, provinceLabel } from "../lib/format.js";

export const getProvinceStatsShape = {
  province: z.string().optional().describe("Province code like 'PL14'. If omitted, returns totals for ALL provinces."),
  city: z.string().optional().describe("If provided, returns top buyers and top CPV categories for this city instead."),
} as const;

export const getProvinceStatsSchema = z.object(getProvinceStatsShape);
export type GetProvinceStatsInput = z.infer<typeof getProvinceStatsSchema>;

interface CityTopBuyer {
  nip: string | null;
  name: string;
  count: number;
  totalValue: number | null;
}

interface CityTopBuyersResponse {
  buyers?: CityTopBuyer[];
  [key: string]: unknown;
}

interface CityTopCpvItem {
  cpv: string;
  label?: string;
  count: number;
  value: number | null;
}

interface CityTopCpvResponse {
  cpv?: CityTopCpvItem[];
  data?: CityTopCpvItem[];
  [key: string]: unknown;
}

export async function getProvinceStats(client: AtlasClient, input: GetProvinceStatsInput): Promise<string> {
  if (input.city) {
    return await cityStats(client, input.city.trim());
  }

  const response = await client.get<ProvinceAggResponse>("/api/tenders/agg/provinces");
  const items = response.data ?? [];

  if (input.province) {
    const match = items.find((it) => it.value === input.province);
    if (!match) {
      return `Nie znaleziono statystyk dla województwa ${input.province}. Dostępne kody: ${items.map((it) => it.value).join(", ")}`;
    }
    return [
      `# Statystyki województwa ${provinceLabel(match.value)} (${match.value})`,
      "",
      `- **Łączna liczba przetargów:** ${match.total.toLocaleString("pl-PL")}`,
    ].join("\n");
  }

  const sorted = [...items].sort((a, b) => b.total - a.total);
  const lines: string[] = [];
  lines.push("# Statystyki przetargów wg województw");
  lines.push("");
  lines.push("| # | Województwo | Kod | Liczba przetargów |");
  lines.push("|---|---|---|---|");
  sorted.forEach((item, idx) => {
    lines.push(`| ${idx + 1} | ${provinceLabel(item.value)} | ${item.value} | ${item.total.toLocaleString("pl-PL")} |`);
  });
  lines.push("");
  lines.push(`_Źródło: Atlas Przetargów — https://atlasprzetargow.pl/przetargi/_`);

  return lines.join("\n");
}

async function cityStats(client: AtlasClient, city: string): Promise<string> {
  const lines: string[] = [];
  lines.push(`# Statystyki dla miasta: ${city}`);
  lines.push("");

  try {
    const topBuyers = await client.get<CityTopBuyersResponse>(
      `/api/stats/city/${encodeURIComponent(city)}/top-buyers`,
    );
    const buyers = topBuyers.buyers ?? [];
    if (buyers.length > 0) {
      lines.push("## Top zamawiający");
      for (const b of buyers.slice(0, 10)) {
        const nipLabel = b.nip ? ` (NIP ${b.nip})` : "";
        const valueLabel = b.totalValue != null ? ` — ${formatCurrencyPLN(b.totalValue)}` : "";
        lines.push(`- **${b.name}**${nipLabel} — ${b.count} postępowań${valueLabel}`);
      }
      lines.push("");
    }
  } catch {
    // continue
  }

  try {
    const topCpv = await client.get<CityTopCpvResponse>(
      `/api/stats/city/${encodeURIComponent(city)}/top-cpv`,
    );
    const cpvItems = topCpv.cpv ?? topCpv.data ?? [];
    if (cpvItems.length > 0) {
      lines.push("## Najczęstsze kategorie CPV");
      for (const item of cpvItems.slice(0, 10)) {
        const label = item.label ? `${item.cpv} (${item.label})` : item.cpv;
        const valueLabel = item.value != null ? ` — ${formatCurrencyPLN(item.value)}` : "";
        lines.push(`- **${label}** — ${item.count} postępowań${valueLabel}`);
      }
      lines.push("");
    }
  } catch {
    // continue
  }

  if (lines.length === 3) {
    lines.push(`Brak szczegółowych statystyk dla miasta "${city}". Sprawdź pisownię (np. "Warszawa", "Kraków").`);
  }

  return lines.join("\n");
}

export const getProvinceStatsToolDef = {
  name: "get_province_stats",
  title: "Get tender statistics by province or city",
  description:
    "Retrieve aggregate tender statistics by Polish province (all 16 voivodeships) or drill down to a specific city (top buyers, top CPV categories). Without arguments returns the full province ranking.",
  inputShape: getProvinceStatsShape,
  inputSchema: getProvinceStatsSchema,
};
