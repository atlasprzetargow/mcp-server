#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig } from "./lib/config.js";
import { createClient } from "./lib/client.js";
import { registerTools } from "./tools/index.js";
import { registerResources } from "./resources/index.js";
import { registerPrompts } from "./prompts/index.js";

async function main(): Promise<void> {
  const config = loadConfig();
  const client = createClient(config);

  const server = new McpServer(
    {
      name: "atlas-przetargow",
      version: "0.1.0",
    },
    {
      instructions: [
        "Atlas Przetargów MCP Server — dostęp do polskich zamówień publicznych (BZP + TED) z atlasprzetargow.pl.",
        "",
        "Narzędzia (tools):",
        "• search_tenders — wyszukiwanie przetargów z filtrami (CPV, lokalizacja, wartość, termin)",
        "• get_tender — szczegóły przetargu po ID",
        "• get_buyer — profil zamawiającego po NIP + top wygrywający wykonawcy",
        "• get_contractor — profil wykonawcy po NIP + top zamawiający",
        "• search_entities — wyszukiwanie zamawiających/wykonawców po nazwie (znajdź NIP)",
        "• get_category_stats — statystyki per kategoria CPV (mediana, liczba ofert, termin)",
        "• get_province_stats — statystyki per województwo/miasto",
        "• search_cpv — wyszukiwanie kodów CPV po słowie kluczowym",
        "",
        "Zasoby (resources):",
        "• atlas://glossary — słownik 90+ pojęć polskiego PZP",
        "• atlas://glossary/{slug} — pełna definicja terminu",
        "• atlas://knowledge — artykuły bazy wiedzy",
        "• atlas://knowledge/{slug} — pełny artykuł",
        "",
        "Prompty (workflow):",
        "• analyze-tender — kompleksowa analiza ogłoszenia",
        "• buyer-due-diligence — analiza zamawiającego (historia, wzorce, red flagi)",
        "• find-opportunities — znajdź aktywne okazje dla profilu firmy",
        "",
        "Wskazówki dla modelu:",
        "• W polskim PZP ID przetargów mają format '2026/BZP 00202613'. Akceptowana jest też wersja 2026-BZP-00202613.",
        "• NIP to 10 cyfr. Jeśli user nie zna NIP zamawiającego, zacznij od search_entities.",
        "• Kody województw: PL02..PL32 (patrz parametr province w search_tenders).",
        "• Aktywne przetargi to noticeType='ContractNotice'. Historyczne wyniki: 'TenderResultNotice'.",
        "• Ogłoszenia mogą być po polsku — nie tłumacz nazw zamawiających ani lokalizacji.",
        "",
        `Konfiguracja: apiBase=${config.apiBase}, apiKey=${config.apiKey ? "ustawiony" : "brak (opcjonalny, daje dostęp do AI summaries)"}`,
      ].join("\n"),
    },
  );

  registerTools(server, {
    client,
    apiKeyPresent: Boolean(config.apiKey),
  });
  registerResources(server);
  registerPrompts(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Keep stderr for logging — stdout is used by the MCP protocol
  process.stderr.write(`[atlas-przetargow-mcp] ready, API base: ${config.apiBase}\n`);
}

main().catch((err) => {
  process.stderr.write(`[atlas-przetargow-mcp] fatal error: ${err instanceof Error ? err.message : String(err)}\n`);
  if (err instanceof Error && err.stack) {
    process.stderr.write(err.stack + "\n");
  }
  process.exit(1);
});
