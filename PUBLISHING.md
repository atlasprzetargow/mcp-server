# Instrukcja publikacji — krok po kroku

Ten dokument opisuje całą ścieżkę publikacji `@atlasprzetargow/mcp` od npm-a po rejestry.  
**Wszystkie kroki wymagają działania po stronie użytkownika (logowanie, hasła, tokeny GitHub).**

---

## ⚠️ Przed startem — decyzje, które musisz podjąć

### 1. Nazwa paczki npm

Obecnie w `package.json` jest `@atlasprzetargow/mcp` — to wymaga **scoped package** (organizacji `atlas-przetargow` na npm).

**Opcja A (rekomendowana):** założyć organizację `atlas-przetargow` na npm (darmowe dla publicznych paczek).  
**Opcja B:** zmienić na unscope (`atlas-przetargow-mcp`).  
**Opcja C:** użyć Twojego osobistego scope, np. `@michalpozoga/atlas-przetargow-mcp`.

### 2. GitHub repo

W `package.json` jest referencja do `github.com/atlasprzetargow/mcp-server`.  
Musisz stworzyć repo pod tą nazwą (lub zmienić referencję).

### 3. Email kontaktowy

Teraz `contact@atlasprzetargow.pl` — jeśli takiego nie masz, zmień lub załóż.

---

## Krok 1 — przygotowanie (jednorazowe, ~10 min)

### 1.1 Konto npm (jeśli nie masz)

```bash
# Utwórz konto:
# https://www.npmjs.com/signup
# Zweryfikuj email (npm nie pozwoli publikować bez weryfikacji).

# Zaloguj lokalnie:
npm login
# → podaj username, hasło, email, kod 2FA
```

### 1.2 Organizacja npm (jeśli Opcja A)

```bash
# Przez web UI: https://www.npmjs.com/org/create
# → nazwa: atlas-przetargow
# → Plan: Free (dla publicznych paczek)
```

### 1.3 Konto GitHub + repo

```bash
# Utwórz repo przez web UI:
# https://github.com/new
# → nazwa: mcp-server (w org atlas-przetargow albo Twojej)
# → Public
# → BEZ README / .gitignore / LICENSE (masz już lokalnie)

# Powiąż lokalny kod:
cd /home/ubuntu/apps/atlasprzetargow/mcp-server
git init
git add .
git commit -m "Initial release: Atlas Przetargów MCP Server v0.1.0"
git branch -M main
git remote add origin git@github.com:atlasprzetargow/mcp-server.git
git push -u origin main
```

---

## Krok 2 — publikacja npm (~5 min)

### 2.1 Weryfikacja przed publikacją

```bash
cd /home/ubuntu/apps/atlasprzetargow/mcp-server

# Fresh build + smoke test (muszą zielone):
npm run build
npm run smoke

# Zobacz co trafi do paczki:
npm pack --dry-run
# → przejrzyj listę. Powinno zawierać:
#   - dist/**
#   - README.md
#   - LICENSE
#   - package.json
# NIE powinno zawierać:
#   - src/, scripts/, examples/, tsconfig.json, node_modules/
```

### 2.2 Publikacja

```bash
# Dla scoped package ze scope "atlas-przetargow":
npm publish --access public

# Dla unscope:
# npm publish

# → wyjście powinno wyglądać:
# + @atlasprzetargow/mcp@0.1.0
```

### 2.3 Weryfikacja

```bash
# Otwórz w przeglądarce:
# https://www.npmjs.com/package/@atlasprzetargow/mcp

# Test instalacji w czystym środowisku:
npx -y @atlasprzetargow/mcp
# → powinieneś zobaczyć "[atlas-przetargow-mcp] ready, API base: https://atlasprzetargow.pl"
# → Ctrl+C aby zakończyć
```

---

## Krok 3 — rejestry MCP (~1 godzina łącznie)

### 3.1 Oficjalny rejestr Anthropic (najważniejszy!)

Anthropic prowadzi listę MCP serverów na GitHub jako część oficjalnej dokumentacji.

**Repo:** https://github.com/modelcontextprotocol/servers

**Krok po kroku:**

1. Fork repo `modelcontextprotocol/servers` na swoje konto GitHub
2. W lokalnej kopii dodaj wpis do `README.md` — sekcja "Community Servers":

```markdown
- **[Atlas Przetargów](https://github.com/atlasprzetargow/mcp-server)** — Search Polish public tenders (BZP + TED), buyer/contractor profiles, procurement analytics.
```

Utrzymuj format alfabetyczny (wpisy są sortowane po nazwie).

3. Utwórz PR z tytułem: `Add Atlas Przetargów MCP Server (Polish public tenders)`

Opis PR:

```markdown
This PR adds Atlas Przetargów MCP Server to the Community Servers list.

## About

Atlas Przetargów is the largest Polish public procurement search and analytics 
platform. This MCP server exposes our API to any MCP-compatible AI client.

## What it provides

- **8 tools**: search_tenders, get_tender, get_buyer, get_contractor, 
  search_entities, get_category_stats, get_province_stats, search_cpv
- **4 resources**: Polish public procurement glossary (90+ terms) and knowledge base
- **3 prompts**: tender analysis, buyer due diligence, opportunity discovery

## Links

- npm: https://www.npmjs.com/package/@atlasprzetargow/mcp
- Repo: https://github.com/atlasprzetargow/mcp-server
- Production site: https://atlasprzetargow.pl

This is the first MCP server targeting Polish public procurement data 
(BZP — Biuletyn Zamówień Publicznych, TED — Tenders Electronic Daily).
Covers 800 000+ tenders with ~700 new daily.

License: MIT. No API key required for public endpoints.
```

### 3.2 awesome-mcp-servers (najpopularniejsza lista community)

**Repo:** https://github.com/punkpeye/awesome-mcp-servers

Identyczny proces co 3.1, ale:

- Znajdź odpowiednią sekcję (jest kategoryzacja po typie — np. "Data & Analytics" lub "Search")
- Format wpisów:

```markdown
- [Atlas Przetargów](https://github.com/atlasprzetargow/mcp-server) 📇 — Polish public procurement search and analytics (BZP + TED, 800k+ tenders).
```

(Emoji 📇 oznacza "Structured Data" w ich systemie — sprawdź aktualną legendę).

### 3.3 mcp.so (agregator)

1. Wejdź na https://mcp.so
2. Szukaj formularza "Submit a Server" lub "Add MCP Server"
3. Wypełnij: nazwa, opis, repo, npm, kategorie (public data / search / business)

### 3.4 Smithery (agregator MCP)

1. https://smithery.ai
2. Zaloguj się przez GitHub
3. Submit server — podaj link do repo, Smithery sam ściągnie metadata z package.json

### 3.5 Glama MCP catalog

1. https://glama.ai/mcp/servers
2. Submit przez formularz

---

## Krok 4 — publikacje marketingowe (~30 min)

### 4.1 Blog post na atlasprzetargow.pl

Treść jest gotowa: `examples/BLOG_POST_PL.md`

1. Otwórz `next-client/src/data/posts.ts`
2. Dodaj nowy post **na początku** listy (zgodnie z konwencją projektu — ID malejąco)
3. Treść HTML/Markdown: skopiuj z `examples/BLOG_POST_PL.md` i sformatuj zgodnie z design systemem bloga
4. Zaktualizuj `public/sitemap-blog.xml` (ręczna sitemap!)
5. Build + deploy jak zwykle

### 4.2 LinkedIn (firmowy profil)

Treść: `examples/SOCIAL_POSTS.md` → sekcja "LinkedIn" (3 warianty do wyboru)

- Skopiuj, podmień `[LINK]` na URL opublikowanego blog posta
- Opublikuj z firmowego profilu Atlas Przetargów

### 4.3 X (Twitter)

Treść: `examples/SOCIAL_POSTS.md` → sekcja "X"

Masz do wyboru:
- Pojedynczy tweet (szybki, mniej zasięgu)
- Thread 4 tweetów (lepszy algorytm)

### 4.4 Reddit — r/Polska lub r/LocalLLaMA (opcjonalnie)

Treść: `examples/SOCIAL_POSTS.md` → sekcja "Reddit"

Jeśli publikujesz — bądź transparent że jesteś twórcą (flair "OC" lub disclaimer).

### 4.5 Hacker News (opcjonalnie — jeśli chcesz go grać na globalny zasięg)

Tytuł: `Show HN: Atlas Przetargów – MCP server for Polish public tenders`

Tekst: skrócona wersja blog posta (500 słów) + link. HN nie lubi marketingowego tonu — trzymaj się konkretu.

---

## Krok 5 — aktualizacja llms.txt (GEO boost)

Dodaj wpis do `atlasprzetargow.pl/llms.txt`:

```
## MCP Integration

Atlas Przetargów is available as a Model Context Protocol (MCP) server.

- **Install:** `npm install -g @atlasprzetargow/mcp` or use via `npx -y @atlasprzetargow/mcp`
- **Client config example:** https://atlasprzetargow.pl/blog/mcp-server
- **Repo:** https://github.com/atlasprzetargow/mcp-server
- **Tools:** search_tenders, get_tender, get_buyer, get_contractor, 
  search_entities, get_category_stats, get_province_stats, search_cpv
```

---

## Checklist końcowa

- [ ] npm publish zielone, paczka widoczna publicznie
- [ ] `npx -y @atlasprzetargow/mcp` uruchamia się czysto
- [ ] Repo na GitHub opublikowane, README czytelne
- [ ] PR do `modelcontextprotocol/servers` otwarty
- [ ] Wpis w `awesome-mcp-servers` (PR lub merged)
- [ ] Submit do mcp.so / smithery.ai / glama.ai
- [ ] Blog post opublikowany na atlasprzetargow.pl + sitemap zaktualizowana
- [ ] Post na LinkedIn (firmowy profil)
- [ ] Post na X (pojedynczy lub thread)
- [ ] `llms.txt` zaktualizowane o sekcję MCP

---

## Monitoring pierwszego tygodnia

- **npm downloads:** https://npmtrends.com/@atlasprzetargow/mcp
- **GitHub stars / forks / issues:** https://github.com/atlasprzetargow/mcp-server
- **Traffic referral na atlasprzetargow.pl** z domen: npmjs.com, github.com, mcp.so
- **Mentions w Google / X / LinkedIn** (set up alert na "atlas-przetargow mcp")

Cel po 30 dniach:
- 5–15 backlinków (npm + GitHub + oficjalny registry + awesome list + agregatory + blog PR)
- 50–200 pobrań z npm (bardzo zależne od wzmianek zewnętrznych)
- 1–3 "wzmianki organiczne" na LinkedIn/X/blogach
