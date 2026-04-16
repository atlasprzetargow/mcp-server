import { z } from "zod";
import type { AtlasClient } from "../lib/client.js";
import type { ContractorProfile } from "../lib/types.js";
import { contractorUrl, formatCurrencyPLN, provinceLabel } from "../lib/format.js";

export const getContractorShape = {
  nip: z.string().regex(/^\d{10}$/, "NIP must be 10 digits").describe("Polish tax ID (NIP) of the contractor — 10 digits"),
  include_winning_buyers: z.boolean().optional().describe("If true, also fetch the list of buyers this contractor most frequently wins tenders from. Default: true."),
} as const;

export const getContractorSchema = z.object(getContractorShape);
export type GetContractorInput = z.infer<typeof getContractorSchema>;

interface WinningBuyersResponse {
  buyers: Array<{
    nip: string | null;
    name: string;
    wins: number;
    totalValue: number | null;
    slug: string | null;
  }>;
  [key: string]: unknown;
}

export async function getContractor(client: AtlasClient, input: GetContractorInput): Promise<string> {
  const nip = input.nip.trim();
  const includeBuyers = input.include_winning_buyers ?? true;

  const contractor = await client.get<ContractorProfile>(`/api/contractors/${encodeURIComponent(nip)}`);

  const lines: string[] = [];
  lines.push(`# Wykonawca: ${contractor.displayName ?? contractor.name}`);
  lines.push("");
  lines.push(`- **NIP:** ${contractor.nip}`);
  const city = (contractor as { city?: string | null }).city;
  const province = (contractor as { province?: string | null }).province;
  const location = [city, provinceLabel(province)].filter(Boolean).join(", ");
  if (location) lines.push(`- **Lokalizacja:** ${location}`);
  const totalWins = (contractor as { total_wins?: number }).total_wins;
  if (typeof totalWins === "number") lines.push(`- **Wygrane łącznie:** ${totalWins}`);
  const totalValue = (contractor as { total_value?: number }).total_value;
  if (typeof totalValue === "number") lines.push(`- **Łączna wartość wygranych:** ${formatCurrencyPLN(totalValue)}`);
  const slug = (contractor as { slug?: string }).slug;
  lines.push(`- **Profil:** ${contractorUrl(contractor.nip, slug)}`);
  lines.push("");

  if (includeBuyers) {
    try {
      const result = await client.get<WinningBuyersResponse>(
        `/api/contractors/${encodeURIComponent(nip)}/winning-buyers`,
        { limit: 10 },
      );
      const buyers = result.buyers ?? [];
      if (buyers.length > 0) {
        lines.push("## Najczęściej wygrane zamówienia — top zamawiający");
        for (const b of buyers.slice(0, 10)) {
          const nipLabel = b.nip ? ` (NIP ${b.nip})` : "";
          const valueLabel = b.totalValue != null ? ` — ${formatCurrencyPLN(b.totalValue)}` : "";
          lines.push(`- **${b.name}**${nipLabel} — ${b.wins} wygranych${valueLabel}`);
        }
        lines.push("");
      }
    } catch {
      // silent
    }
  }

  return lines.join("\n");
}

export const getContractorToolDef = {
  name: "get_contractor",
  title: "Get profile of a contractor (wykonawca)",
  description:
    "Fetch a profile of a Polish tender contractor by its NIP. Returns name, location, total wins, total value and top buyers they win tenders from.",
  inputShape: getContractorShape,
  inputSchema: getContractorSchema,
};
