import { z } from "zod";
import type { AtlasClient } from "../lib/client.js";
import type { TenderDetail } from "../lib/types.js";
import { formatCurrencyPLN, formatDate, normalizeTenderId, provinceLabel, tenderUrl, truncate } from "../lib/format.js";

export const getTenderShape = {
  tender_id: z.string().min(3).describe("Tender ID in BZP format '2026/BZP 00202613' or dashed '2026-BZP-00202613'. TED IDs are also supported."),
  include_ai_summary: z.boolean().optional().describe("If true and ATLAS_API_KEY is configured, attach AI-generated summary of the tender notice. Default: false."),
} as const;

export const getTenderSchema = z.object(getTenderShape);
export type GetTenderInput = z.infer<typeof getTenderSchema>;

interface AiSummaryResponse {
  points?: string[] | Array<{ text?: string }>;
  summary?: string | null;
  [key: string]: unknown;
}

export async function getTender(
  client: AtlasClient,
  input: GetTenderInput,
  apiKeyPresent: boolean,
): Promise<string> {
  const normalized = normalizeTenderId(input.tender_id);
  if (!normalized) {
    return "Błąd: pusty tender_id.";
  }

  const tender = await client.get<TenderDetail>(`/api/tenders/${encodeURIComponent(normalized)}`);

  const lines: string[] = [];
  lines.push(`# ${tender.title}`);
  lines.push("");
  lines.push(`**ID:** ${tender.id}`);
  if (tender.bzpNumber) lines.push(`**Numer BZP:** ${tender.bzpNumber}`);
  if (tender.tedNumber) lines.push(`**Numer TED:** ${tender.tedNumber}`);
  if (tender.noticeType) lines.push(`**Typ ogłoszenia:** ${tender.noticeType}`);
  if (tender.tenderType) lines.push(`**Rodzaj zamówienia:** ${tender.tenderType}`);
  lines.push("");

  lines.push("## Zamawiający");
  lines.push(`- Nazwa: ${tender.buyer}`);
  if (tender.buyerNip) lines.push(`- NIP: ${tender.buyerNip}`);
  const location = [tender.city, provinceLabel(tender.province)].filter(Boolean).join(", ");
  if (location) lines.push(`- Lokalizacja: ${location}`);
  lines.push("");

  lines.push("## Terminy i wartość");
  if (tender.date) lines.push(`- Data publikacji: ${formatDate(tender.date)}`);
  if (tender.submittingOffersDate) lines.push(`- Termin składania ofert: ${formatDate(tender.submittingOffersDate)}`);
  if (tender.estimatedValue !== null && tender.estimatedValue !== undefined) {
    lines.push(`- Wartość szacunkowa: ${formatCurrencyPLN(tender.estimatedValue, tender.currency ?? "PLN")}`);
  }
  if (tender.depositAmount && tender.depositAmount > 0) {
    lines.push(`- Wadium: ${formatCurrencyPLN(tender.depositAmount, tender.currency ?? "PLN")}`);
  }
  if (tender.offersCount !== null && tender.offersCount !== undefined) {
    lines.push(`- Liczba ofert: ${tender.offersCount}`);
  }
  lines.push("");

  if (tender.cpvCode) {
    lines.push("## Kody CPV");
    lines.push(tender.cpvCode);
    lines.push("");
  }

  if (tender.contractorName) {
    lines.push("## Wykonawca (jeśli wyłoniony)");
    lines.push(`- Nazwa: ${tender.contractorName}`);
    if (tender.contractorNationalId) lines.push(`- NIP: ${tender.contractorNationalId}`);
    const cloc = [tender.contractorCity, provinceLabel(tender.contractorProvince ?? null)].filter(Boolean).join(", ");
    if (cloc) lines.push(`- Lokalizacja: ${cloc}`);
    lines.push("");
  }

  if (tender.procedureResult) {
    lines.push(`**Wynik postępowania:** ${tender.procedureResult}`);
    lines.push("");
  }

  if (tender.cancellationReason) {
    lines.push(`**Powód unieważnienia:** ${truncate(String(tender.cancellationReason), 500)}`);
    lines.push("");
  }

  if (tender.htmlBody) {
    const plainText = String(tender.htmlBody)
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (plainText) {
      lines.push("## Fragment treści ogłoszenia");
      lines.push(truncate(plainText, 1500));
      lines.push("");
    }
  }

  if (input.include_ai_summary && apiKeyPresent) {
    try {
      const summary = await client.get<AiSummaryResponse>(
        `/api/llm/tenders/${encodeURIComponent(normalized)}/ai-summary-cached`,
      );
      const rawPoints = summary.points ?? [];
      const pointsText = rawPoints
        .map((p) => (typeof p === "string" ? p : p?.text ?? ""))
        .filter((s): s is string => Boolean(s && s.trim()));
      if (pointsText.length > 0) {
        lines.push("## Podsumowanie AI (z Atlas Przetargów)");
        for (const point of pointsText) {
          lines.push(`- ${point}`);
        }
        lines.push("");
      }
    } catch {
      lines.push("_(Podsumowanie AI niedostępne — wymaga poprawnego ATLAS_API_KEY lub cache jeszcze nie wygenerowany.)_");
      lines.push("");
    }
  } else if (input.include_ai_summary && !apiKeyPresent) {
    lines.push("_(include_ai_summary=true, ale ATLAS_API_KEY nie jest ustawiony — pomijam AI summary.)_");
    lines.push("");
  }

  lines.push(`**Źródło:** ${tenderUrl(tender.id)}`);

  return lines.join("\n");
}

export const getTenderToolDef = {
  name: "get_tender",
  title: "Get full details of a public tender",
  description:
    "Retrieve detailed information about a specific Polish public tender by its ID. Returns buyer, location, deadlines, estimated value, CPV codes, contractor (if awarded), notice type and a content excerpt. Optionally includes AI-generated summary points (requires ATLAS_API_KEY).",
  inputShape: getTenderShape,
  inputSchema: getTenderSchema,
};
