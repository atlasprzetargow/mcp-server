# Atlas Przetargów w Claude Desktop — pierwszy polski MCP serwer dla zamówień publicznych

**Data publikacji sugerowana:** dzień npm publish + PR do registry  
**Kategoria bloga:** Narzędzia / Aktualizacje  
**Autor:** Atlas Przetargów  
**Meta title:** Atlas Przetargów w Claude Desktop — pierwszy MCP dla BZP i TED  
**Meta description:** Udostępniliśmy darmowy MCP serwer, który pozwala zapytać Claude, Cursor czy ChatGPT Desktop o polskie przetargi publiczne bezpośrednio z okna czatu. Zobacz jak działa i jak go zainstalować.

---

## Dlaczego to jest ciekawe

**Model Context Protocol (MCP)** to standard ogłoszony przez Anthropic w listopadzie 2024 r., który pozwala aplikacjom AI — jak Claude Desktop, Cursor, Continue, Cline — rozmawiać z zewnętrznymi usługami w zestandaryzowany sposób. W praktyce: **AI zyskuje realne narzędzia zamiast tylko gadania**.

Po półtora roku od publikacji specyfikacji istnieje już ~500 publicznych MCP serwerów — dla GitHub, Slacka, Google Drive, Notion, Postgres, Stripe itd. **Do dziś brakowało jednego:** narzędzia, które pozwoli AI pracować z danymi polskich zamówień publicznych.

Zmienia się to teraz. Udostępniamy **[@atlasprzetargow/mcp](https://www.npmjs.com/package/@atlasprzetargow/mcp)** — darmowy MCP serwer, który daje każdemu klientowi AI dostęp do **ponad 800 000 przetargów** z BZP i TED, profili zamawiających i wykonawców, oraz statystyk rynkowych.

## Co to daje w praktyce

Zamiast ręcznie wchodzić na [atlasprzetargow.pl](https://atlasprzetargow.pl) i filtrować ogłoszenia, możesz w Claude Desktop napisać po prostu:

> *"Znajdź aktywne przetargi budowlane w Krakowie z budżetem 100–500 tys. PLN i terminem składania w ciągu 14 dni. Przeanalizuj top 5 pod kątem kryteriów oceny i zwróć te, które pasują do firmy wykonującej tynki."*

Claude sam wywoła odpowiednie narzędzia Atlas, ściągnie dane, przeanalizuje i zwróci uporządkowaną odpowiedź z linkami do pełnych ogłoszeń.

Albo:

> *"Zrób due diligence zamawiającego o NIP 5252248481 — historia zakupów, top wykonawcy, red flagi."*

> *"Jaka jest mediana wartości przetargów IT w Polsce w zeszłym roku? Ile średnio jest ofert na postępowanie?"*

> *"Wyszukaj kod CPV dla sprzętu medycznego i pokaż aktywne przetargi z tym kodem w mazowieckim."*

## Co dokładnie jest w środku

**8 narzędzi (tools)** — czyli akcji, które AI może wywołać:

| Narzędzie | Co robi |
|---|---|
| `search_tenders` | Wyszukiwanie przetargów z filtrami (słowo kluczowe, CPV, miasto, województwo, wartość, daty, sortowanie) |
| `get_tender` | Pełne szczegóły przetargu po ID, opcjonalnie z podsumowaniem AI |
| `get_buyer` | Profil zamawiającego po NIP + top wygrywający wykonawcy |
| `get_contractor` | Profil wykonawcy po NIP + zamawiający, od których wygrywa |
| `search_entities` | Wyszukiwanie zamawiających/wykonawców po nazwie (znajdź NIP) |
| `get_category_stats` | Statystyki rynku per kategoria CPV (mediana, liczba ofert, długość terminu) |
| `get_province_stats` | Statystyki per województwo lub miasto (top zamawiający, top CPV) |
| `search_cpv` | Wyszukiwanie kodów CPV po słowie kluczowym po polsku |

**4 zasoby (resources)** — statyczna wiedza domenowa:

- `atlas://glossary` — indeks i definicje 90+ terminów z polskiego prawa zamówień publicznych (JEDZ, SWZ, wadium, SIWZ, PZP itd.)
- `atlas://knowledge` — długoformatowe artykuły o procedurach, progach unijnych, błędach wykonawców, elektronizacji, trybie podstawowym

**3 prompty (gotowe workflow):**

- `analyze-tender` — kompleksowa analiza ogłoszenia (przedmiot, wartość, terminy, kryteria, ryzyka, rekomendacja)
- `buyer-due-diligence` — due diligence zamawiającego
- `find-opportunities` — znajdź aktywne okazje dla profilu firmy

## Jak zainstalować (2 minuty)

Jeśli używasz **Claude Desktop**, dodaj do pliku konfiguracyjnego:

- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

cztery linie:

```json
{
  "mcpServers": {
    "atlas-przetargow": {
      "command": "npx",
      "args": ["-y", "@atlasprzetargow/mcp"]
    }
  }
}
```

Zrestartuj Claude Desktop. Atlas jest gotowy do użycia — zobaczysz ikonę narzędzia w panelu.

Pełna dokumentacja, przykłady, zmienne środowiskowe: **[github.com/atlasprzetargow/mcp-server](https://github.com/atlasprzetargow/mcp-server)**.

Działa też z **Cursor**, **Continue**, **Cline** i każdym klientem wspierającym MCP.

## Co to zmienia dla Ciebie

Jeśli:

- **Jesteś wykonawcą** szukającym przetargów — przestajesz filtrować ręcznie. Opisujesz swój profil AI raz, a ona codziennie może robić dla Ciebie pre-selection.
- **Jesteś prawnikiem / konsultantem PZP** — analiza SWZ, due diligence zamawiającego, ocena ryzyk — wszystko z jednego okna rozmowy.
- **Jesteś analitykiem / dziennikarzem** — masz dostęp do surowych statystyk rynku 800 000 przetargów bez pisania scrapera.
- **Budujesz produkt AI dla sektora publicznego** — masz gotową warstwę integracji z polskim rynkiem ZP.

## Techniczny kontekst dla zainteresowanych

- **Licencja:** MIT — możesz forkować, modyfikować, używać komercyjnie.
- **Transport:** stdio (MVP). Wersja HTTP/SSE w planach na Q3.
- **Bez klucza API:** działa od razu, publiczne endpointy. Z kluczem `ATLAS_API_KEY` odblokowujesz AI summaries przetargów.
- **Rate limit:** automatyczny backoff na 429, 2 retries. 30 req/min default.
- **Repo:** [github.com/atlasprzetargow/mcp-server](https://github.com/atlasprzetargow/mcp-server)
- **npm:** [@atlasprzetargow/mcp](https://www.npmjs.com/package/@atlasprzetargow/mcp)

## Co dalej

Na najbliższe miesiące zaplanowaliśmy:

1. **HTTP/SSE transport** — żeby działało też z klientami przeglądarkowymi
2. **Więcej prompts** — np. "porównaj dwóch wykonawców", "przeanalizuj trend w branży"
3. **Webhooks MCP** — alerty o nowych przetargach dostarczane bezpośrednio do kontekstu AI
4. **Lokalizacja EN** — wariant dla zagranicznych firm startujących w polskich przetargach

Jeśli budujesz coś interesującego z tym MCP — napisz do nas na [kontakt@atlasprzetargow.pl](mailto:kontakt@atlasprzetargow.pl). Chętnie nagłośnimy.

---

*Atlas Przetargów jest największą polską wyszukiwarką zamówień publicznych agregującą BZP + TED, z codziennym strumieniem ok. 700 nowych ogłoszeń, bazą 800+ tys. postępowań i profili dla wszystkich zamawiających posiadających NIP.*
