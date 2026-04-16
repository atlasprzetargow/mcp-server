# Atlas Przetargów — MCP Server

[![npm version](https://img.shields.io/npm/v/@atlasprzetargow/mcp.svg)](https://www.npmjs.com/package/@atlasprzetargow/mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

**The first MCP server for Polish public procurement data.** Query 800 000+ Polish public tenders (BZP + TED), buyer/contractor profiles, and category statistics directly from Claude Desktop, Cursor, Continue, Cline, or any MCP-compatible AI client.

Powered by [Atlas Przetargów](https://atlasprzetargow.pl) — the Polish public procurement search and analytics platform.

---

## What is this?

The [Model Context Protocol (MCP)](https://modelcontextprotocol.io) lets AI assistants connect to external tools and data. This server exposes the Atlas Przetargów API to any MCP client, giving your AI assistant the ability to:

- **Search Polish public tenders** by keyword, CPV category, location, value, or deadline
- **Get full tender details** including buyer, CPV codes, estimated value, deadlines, optional AI-generated summary
- **Profile any procuring entity (zamawiający)** by NIP — including who wins their contracts most often
- **Profile any contractor (wykonawca)** by NIP — including which buyers they win from
- **Analyze market statistics** for any CPV category (count, median value, avg offers, avg deadline)
- **Compare provinces and cities** in procurement volume
- **Access a glossary** of 90+ Polish public procurement terms
- **Use guided workflows** (prompts) for tender analysis, buyer due diligence, and opportunity discovery

---

## Quick start (Claude Desktop)

### Option A — via `npx` (recommended, no install)

Edit your Claude Desktop config file:

- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

Add:

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

Restart Claude Desktop. The Atlas tools will appear in the tools panel.

### Option B — global install

```bash
npm install -g @atlasprzetargow/mcp
```

Then in `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "atlas-przetargow": {
      "command": "atlas-przetargow-mcp"
    }
  }
}
```

---

## Usage examples (in Claude Desktop)

> **"Find active construction tenders in Warsaw with budget 500k–5M PLN and show me the top 5"**

> **"Use the buyer-due-diligence prompt for NIP 5252248481"**
> (→ runs due diligence on the City of Warsaw as a procuring entity)

> **"What's the median value of IT tenders in Poland last year?"**

> **"Look up tender 2026/BZP 00202613 and analyze its key terms and risks"**

> **"Find me the CPV code for medical equipment and show active tenders"**

> **"Who most frequently wins contracts from GDDKiA (National Roads Authority)?"**

---

## Tools

| Tool | Description |
|---|---|
| `search_tenders` | Search tenders with filters (query, CPV, city, province, value range, dates, sort) |
| `get_tender` | Full details of a tender by ID, optionally with AI summary |
| `get_buyer` | Profile of a procuring entity by NIP + top winning contractors |
| `get_contractor` | Profile of a contractor by NIP + top buyers they win from |
| `search_entities` | Find buyers / contractors by name (returns NIP for other tools) |
| `get_category_stats` | Aggregate stats for a CPV category (count, median, avg offers, avg deadline) |
| `get_province_stats` | Statistics by province or city (top buyers, top CPV) |
| `search_cpv` | Look up CPV codes by Polish keyword |

## Resources

| URI | Description |
|---|---|
| `atlas://glossary` | Index of 90+ Polish public procurement terms |
| `atlas://glossary/{slug}` | Full definition of a specific term |
| `atlas://knowledge` | Index of long-form knowledge base articles |
| `atlas://knowledge/{slug}` | Full knowledge base article |

## Prompts

| Prompt | Description |
|---|---|
| `analyze-tender` | Comprehensive analysis of a tender notice: scope, value, deadlines, risks, recommendation |
| `buyer-due-diligence` | Due diligence on a procuring entity: purchase profile, contractor network, red flags |
| `find-opportunities` | Find active tender opportunities matching a CPV + location + value profile |

---

## Configuration (environment variables)

All optional. Defaults are safe.

| Variable | Default | Description |
|---|---|---|
| `ATLAS_API_BASE` | `https://atlasprzetargow.pl` | API root. Useful for staging or self-hosted Atlas |
| `ATLAS_API_KEY` | _(none)_ | Optional key for `/api/llm/*` endpoints (AI summaries). Without it, the server still works with full public data |
| `ATLAS_TIMEOUT_MS` | `20000` | Request timeout |
| `ATLAS_MAX_RETRIES` | `2` | Retry count for 429 / 5xx / timeouts |

Pass them via your MCP client config:

```json
{
  "mcpServers": {
    "atlas-przetargow": {
      "command": "npx",
      "args": ["-y", "@atlasprzetargow/mcp"],
      "env": {
        "ATLAS_API_KEY": "your-optional-key-here"
      }
    }
  }
}
```

---

## Polish public procurement — quick reference

- **BZP** (Biuletyn Zamówień Publicznych) — Polish national tender registry. IDs look like `2026/BZP 00202613`.
- **TED** (Tenders Electronic Daily) — EU-wide tender registry, required for tenders above EU thresholds.
- **CPV** (Common Procurement Vocabulary) — 8-digit category codes, e.g. `45000000` = construction, `72000000` = IT.
- **NIP** — Polish 10-digit tax ID, used to identify every buyer / contractor.
- **Province codes:** `PL02` dolnośląskie · `PL04` kujawsko-pomorskie · `PL06` lubelskie · `PL08` lubuskie · `PL10` łódzkie · `PL12` małopolskie · `PL14` mazowieckie · `PL16` opolskie · `PL18` podkarpackie · `PL20` podlaskie · `PL22` pomorskie · `PL24` śląskie · `PL26` świętokrzyskie · `PL28` warmińsko-mazurskie · `PL30` wielkopolskie · `PL32` zachodniopomorskie
- **Notice types:**
  - `ContractNotice` — active tender, open for bids
  - `TenderResultNotice` / `ContractAwardNotice` — results (who won, at what price)
  - `CompetitionNotice`, `ConcessionNotice` — specialized notices

---

## Development

```bash
git clone https://github.com/atlasprzetargow/mcp-server.git
cd mcp-server
npm install
npm run build
npm run smoke   # runs all tools against production API

# Test locally in Claude Desktop:
# Point the "command" in claude_desktop_config.json to the absolute path of dist/index.js:
# "command": "node", "args": ["/abs/path/to/mcp-server/dist/index.js"]
```

---

## Rate limits & fair use

Atlas Przetargów API has a per-IP rate limit (30 req/min for LLM endpoints, more for public ones). The MCP server automatically retries 429 responses with exponential backoff.

If you hit rate limits frequently (e.g. in production automations), please reach out via [atlasprzetargow.pl/kontakt](https://atlasprzetargow.pl/kontakt) for higher-tier access.

---

## License

[MIT](./LICENSE) © Atlas Przetargów

## Data source attribution

All tender data is sourced from:
- **BZP** (Biuletyn Zamówień Publicznych) — public registry of the Polish Public Procurement Office
- **TED** (Tenders Electronic Daily) — EU public procurement registry

Processed, enriched, and served by [Atlas Przetargów](https://atlasprzetargow.pl).

---

## Related

- [Atlas Przetargów](https://atlasprzetargow.pl) — web interface
- [Model Context Protocol](https://modelcontextprotocol.io) — the standard
- [Claude Desktop](https://claude.ai/download) — reference client
- [awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers) — community list
