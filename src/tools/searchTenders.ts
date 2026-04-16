import { z } from "zod";
import type { AtlasClient } from "../lib/client.js";
import type { TenderListResponse } from "../lib/types.js";
import { formatCurrencyPLN, formatDate, provinceLabel, tenderUrl, truncate } from "../lib/format.js";

export const searchTendersShape = {
  query: z.string().optional().describe("Full-text search query (Polish terms work best), e.g. 'budowa drogi', 'komputer'"),
  cpv: z.string().optional().describe("CPV code prefix or full code. Examples: '45' (roboty budowlane), '72' (IT services), '45240000-1'"),
  city: z.string().optional().describe("City name, e.g. 'Warszawa', 'Kraków'"),
  province: z.string().optional().describe("Polish province code: PL02 dolnośląskie, PL04 kujawsko-pomorskie, PL06 lubelskie, PL08 lubuskie, PL10 łódzkie, PL12 małopolskie, PL14 mazowieckie, PL16 opolskie, PL18 podkarpackie, PL20 podlaskie, PL22 pomorskie, PL24 śląskie, PL26 świętokrzyskie, PL28 warmińsko-mazurskie, PL30 wielkopolskie, PL32 zachodniopomorskie"),
  buyerNip: z.string().optional().describe("NIP (tax ID) of the procuring entity (zamawiający)"),
  noticeType: z.enum(["ContractNotice", "TenderResultNotice", "ContractAwardNotice", "CompetitionNotice", "ConcessionNotice"]).optional().describe("ContractNotice = active tender; TenderResultNotice/ContractAwardNotice = results"),
  orderKind: z.enum(["works", "supplies", "services"]).optional().describe("Kind of procurement: works (roboty), supplies (dostawy), services (usługi)"),
  dateFrom: z.string().optional().describe("ISO date YYYY-MM-DD — filter publications from"),
  dateTo: z.string().optional().describe("ISO date YYYY-MM-DD — filter publications to"),
  valueMin: z.number().optional().describe("Minimum estimated value in PLN"),
  valueMax: z.number().optional().describe("Maximum estimated value in PLN"),
  sort: z.enum(["newest", "oldest", "deadline", "value_desc", "value_asc"]).optional().describe("Sort order (default: newest)"),
  limit: z.number().int().min(1).max(50).optional().describe("Max results per page (1-50, default 20)"),
  page: z.number().int().min(1).optional().describe("Page number (default 1)"),
} as const;

export const searchTendersSchema = z.object(searchTendersShape);
export type SearchTendersInput = z.infer<typeof searchTendersSchema>;

export async function searchTenders(
  client: AtlasClient,
  input: SearchTendersInput,
): Promise<string> {
  const params = {
    search: input.query,
    cpv: input.cpv,
    city: input.city,
    province: input.province,
    buyerNip: input.buyerNip,
    noticeType: input.noticeType,
    orderKind: input.orderKind,
    dateFrom: input.dateFrom,
    dateTo: input.dateTo,
    valueMin: input.valueMin,
    valueMax: input.valueMax,
    sort: input.sort,
    per_page: input.limit ?? 20,
    page: input.page ?? 1,
  };

  const response = await client.get<TenderListResponse>("/api/tenders", params);
  const tenders = response.data ?? [];

  if (tenders.length === 0) {
    return `Nie znaleziono przetargów dla zadanych kryteriów.\nKryteria: ${JSON.stringify(input)}`;
  }

  const headerLines: string[] = [];
  headerLines.push(`Znaleziono: ${response.total ?? tenders.length} przetargów (strona ${response.page ?? 1})`);
  if (response.pages) {
    headerLines.push(`Stron łącznie: ${response.pages}`);
  }
  headerLines.push("");

  const lines = tenders.map((tender, idx) => {
    const num = (input.page ? (input.page - 1) * (input.limit ?? 20) : 0) + idx + 1;
    const parts: string[] = [];
    parts.push(`${num}. ${tender.title}`);
    parts.push(`   ID: ${tender.id}`);
    parts.push(`   Zamawiający: ${tender.buyer}${tender.buyerNip ? ` (NIP ${tender.buyerNip})` : ""}`);
    const location = [tender.city, provinceLabel(tender.province)].filter(Boolean).join(", ");
    if (location) parts.push(`   Lokalizacja: ${location}`);
    if (tender.cpvCode) parts.push(`   CPV: ${truncate(tender.cpvCode, 120)}`);
    if (tender.estimatedValue !== null && tender.estimatedValue !== undefined) {
      parts.push(`   Wartość szacunkowa: ${formatCurrencyPLN(tender.estimatedValue, tender.currency ?? "PLN")}`);
    }
    if (tender.submittingOffersDate) {
      parts.push(`   Termin składania ofert: ${formatDate(tender.submittingOffersDate)}`);
    }
    if (tender.noticeType) parts.push(`   Typ ogłoszenia: ${tender.noticeType}`);
    parts.push(`   URL: ${tenderUrl(tender.id)}`);
    return parts.join("\n");
  });

  return [...headerLines, ...lines].join("\n\n");
}

export const searchTendersToolDef = {
  name: "search_tenders",
  title: "Search Polish public tenders",
  description:
    "Search public procurement tenders from BZP (Biuletyn Zamówień Publicznych) and TED (Tenders Electronic Daily) via Atlas Przetargów. Returns a list with titles, buyers, locations, CPV codes, estimated values and deadlines. Use for queries like 'aktywne przetargi budowlane w Warszawie', 'zamówienia IT powyżej 500k PLN', 'co kupuje ZUS'.",
  inputShape: searchTendersShape,
  inputSchema: searchTendersSchema,
};
