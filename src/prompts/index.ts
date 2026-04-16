import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerPrompts(server: McpServer): void {
  registerAnalyzeTender(server);
  registerBuyerDueDiligence(server);
  registerFindOpportunities(server);
}

function registerAnalyzeTender(server: McpServer): void {
  const argsSchema = {
    tender_id: z.string(),
  };
  server.registerPrompt(
    "analyze-tender",
    {
      title: "Przeanalizuj ogłoszenie o zamówieniu",
      description:
        "Przeprowadza kompleksową analizę ogłoszenia BZP/TED: kluczowe warunki, kryteria oceny, ryzyka, terminy, wadium.",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      argsSchema: argsSchema as any,
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((args: { tender_id: string }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `Przeanalizuj polskie zamówienie publiczne o ID "${args.tender_id}".

Kroki:
1. Wywołaj narzędzie "get_tender" z argumentem tender_id="${args.tender_id}" i include_ai_summary=true.
2. Na podstawie uzyskanych danych przedstaw uporządkowaną analizę w języku polskim:
   - **Przedmiot zamówienia** — krótki opis (2-3 zdania)
   - **Zamawiający** — kto kupuje, lokalizacja, typ jednostki
   - **Wartość i wadium** — szacunkowa wartość, wysokość wadium
   - **Terminy krytyczne** — data publikacji, termin składania ofert (z liczbą dni pozostających)
   - **Kryteria kwalifikacji i oceny** — co wynika z treści ogłoszenia
   - **Kategoria CPV** — kody + dział branżowy
   - **Ryzyka dla wykonawcy** — np. krótki termin, wysokie wadium, trudne kryteria
   - **Rekomendacja** — czy warto się starać? Dla kogo ta oferta?
3. Na końcu podaj link do pełnej treści ogłoszenia na atlasprzetargow.pl.

Bądź precyzyjny — operuj liczbami i datami z danych, nie wymyślaj informacji których brak.`,
          },
        },
      ],
    })) as any,
  );
}

function registerBuyerDueDiligence(server: McpServer): void {
  const argsSchema = {
    nip: z.string(),
  };
  server.registerPrompt(
    "buyer-due-diligence",
    {
      title: "Due diligence zamawiającego",
      description:
        "Przeprowadza analizę zamawiającego (procuring entity) na podstawie danych Atlas Przetargów: historia, typowi wykonawcy, wzorce, red flagi.",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      argsSchema: argsSchema as any,
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((args: { nip: string }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `Przeprowadź due diligence polskiego zamawiającego o NIP ${args.nip}.

Kroki:
1. Wywołaj narzędzie "get_buyer" z argumentem nip="${args.nip}" i include_winning_contractors=true.
2. Na podstawie danych przygotuj raport w języku polskim:
   - **Profil** — pełna nazwa, lokalizacja, typ jednostki, łączna liczba postępowań i wartość
   - **Profil zakupowy** — co kupuje (główne kategorie CPV z recent_tenders), jak często, w jakich przedziałach wartości
   - **Sieć wykonawców** — lista top wygrywających wykonawców, ile razy, za jaką kwotę; zwróć uwagę na koncentrację
   - **Rytmika zamówień** — częstotliwość publikacji, typowa wartość, sezonowość
   - **Red flagi i obserwacje** — np. unieważnienia, krótkie terminy, nietypowo wysokie wartości, powtarzający się wykonawcy
   - **Rekomendacja dla potencjalnego oferenta** — czy to dobry zamawiający? Na co uważać?
3. Na końcu podaj link do profilu zamawiającego na atlasprzetargow.pl.

Interpretuj dane — nie tylko cytuj liczby.`,
          },
        },
      ],
    })) as any,
  );
}

function registerFindOpportunities(server: McpServer): void {
  const argsSchema = {
    cpv: z.string(),
    city: z.string().optional(),
    province: z.string().optional(),
    value_min: z.string().optional(),
    value_max: z.string().optional(),
  };
  server.registerPrompt(
    "find-opportunities",
    {
      title: "Znajdź okazje przetargowe dla mojej firmy",
      description:
        "Wyszukuje aktywne przetargi dopasowane do profilu firmy w danej kategorii CPV, lokalizacji i przedziale wartości.",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      argsSchema: argsSchema as any,
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((args: { cpv: string; city?: string; province?: string; value_min?: string; value_max?: string }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `Znajdź aktywne okazje przetargowe z polskiego rynku zamówień publicznych dla następującego profilu:

- Kategoria CPV: ${args.cpv}
${args.city ? `- Miasto: ${args.city}` : ""}
${args.province ? `- Województwo: ${args.province}` : ""}
${args.value_min ? `- Wartość min: ${args.value_min} PLN` : ""}
${args.value_max ? `- Wartość max: ${args.value_max} PLN` : ""}

Kroki:
1. Wywołaj "get_category_stats" dla CPV="${args.cpv}" — poznaj skalę rynku.
2. Wywołaj "search_tenders" z filtrami: cpv="${args.cpv}", noticeType="ContractNotice", sort="newest", limit=20${args.city ? `, city="${args.city}"` : ""}${args.province ? `, province="${args.province}"` : ""}${args.value_min ? `, valueMin=${args.value_min}` : ""}${args.value_max ? `, valueMax=${args.value_max}` : ""}.
3. Dla 3-5 najciekawszych pozycji wywołaj "get_tender" aby pokazać szczegóły.
4. Przedstaw podsumowanie w języku polskim:
   - **Skala rynku** (z get_category_stats) — jaka konkurencja
   - **Top okazje** — 5 najciekawszych aktywnych przetargów dopasowanych do kryteriów
   - **Co pominąć** — krótkie terminy, nietypowi zamawiający
   - **Rekomendacja** — pod które 2-3 przetargi warto podejść w pierwszej kolejności i dlaczego

Filtruj z sensem — pokazuj tylko ContractNotice z terminem w przyszłości.`,
          },
        },
      ],
    })) as any,
  );
}
