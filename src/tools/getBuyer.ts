import { z } from "zod";
import type { AtlasClient } from "../lib/client.js";
import type { BuyerProfile, WinningContractorsResponse } from "../lib/types.js";
import { buyerUrl, formatCurrencyPLN, formatDate, provinceLabel, truncate } from "../lib/format.js";

export const getBuyerShape = {
  nip: z.string().regex(/^\d{10}$/, "NIP must be 10 digits").describe("Polish tax ID (NIP) of the procuring entity — 10 digits"),
  include_winning_contractors: z.boolean().optional().describe("If true, also fetch the list of contractors that most frequently win this buyer's tenders. Default: true."),
} as const;

export const getBuyerSchema = z.object(getBuyerShape);
export type GetBuyerInput = z.infer<typeof getBuyerSchema>;

export async function getBuyer(client: AtlasClient, input: GetBuyerInput): Promise<string> {
  const nip = input.nip.trim();
  const includeWinning = input.include_winning_contractors ?? true;

  const buyer = await client.get<BuyerProfile>(`/api/buyers/${encodeURIComponent(nip)}`);

  const lines: string[] = [];
  lines.push(`# Zamawiający: ${buyer.displayName ?? buyer.name}`);
  lines.push("");
  lines.push(`- **NIP:** ${buyer.nip}`);
  const location = [buyer.city, provinceLabel(buyer.province)].filter(Boolean).join(", ");
  if (location) lines.push(`- **Lokalizacja:** ${location}`);
  if (typeof buyer.total_tenders === "number") lines.push(`- **Liczba postępowań łącznie:** ${buyer.total_tenders}`);
  if (typeof buyer.total_value === "number") lines.push(`- **Łączna wartość:** ${formatCurrencyPLN(buyer.total_value)}`);
  lines.push(`- **Profil:** ${buyerUrl(buyer.nip, (buyer as { slug?: string }).slug)}`);
  lines.push("");

  const recent = Array.isArray(buyer.recent_tenders) ? buyer.recent_tenders : [];
  if (recent.length > 0) {
    lines.push("## Ostatnie przetargi (do 10)");
    for (const t of recent.slice(0, 10)) {
      const valueStr = t.estimatedValue != null ? ` — ${formatCurrencyPLN(t.estimatedValue, t.currency ?? "PLN")}` : "";
      const dateStr = t.date ? formatDate(t.date) : "—";
      lines.push(`- [${dateStr}] **${truncate(t.title, 140)}** (ID: ${t.id})${valueStr}`);
    }
    lines.push("");
  }

  if (includeWinning) {
    try {
      const winners = await client.get<WinningContractorsResponse>(
        `/api/buyers/${encodeURIComponent(nip)}/winning-contractors`,
        { limit: 10 },
      );
      const contractors = winners.contractors ?? [];
      if (contractors.length > 0) {
        lines.push("## Najczęściej wygrywający wykonawcy");
        for (const c of contractors.slice(0, 10)) {
          const nipLabel = c.nip ? ` (NIP ${c.nip})` : "";
          const valueLabel = c.totalValue != null ? ` — ${formatCurrencyPLN(c.totalValue)}` : "";
          lines.push(`- **${c.name}**${nipLabel} — ${c.wins} wygranych${valueLabel}`);
        }
        lines.push("");
      }
    } catch {
      // silent — endpoint optional
    }
  }

  return lines.join("\n");
}

export const getBuyerToolDef = {
  name: "get_buyer",
  title: "Get profile of a procuring entity (zamawiający)",
  description:
    "Fetch a profile of a Polish public procuring entity (zamawiający) by its NIP (tax ID). Returns name, location, statistics, recent tenders, and top winning contractors. Use for due diligence on who buys what and from whom.",
  inputShape: getBuyerShape,
  inputSchema: getBuyerSchema,
};
