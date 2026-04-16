#!/usr/bin/env node
// Smoke test: runs each tool against production API, prints summary.
// Usage: npm run build && npm run smoke

import { loadConfig } from "./lib/config.js";
import { createClient } from "./lib/client.js";
import { searchTenders } from "./tools/searchTenders.js";
import { getTender } from "./tools/getTender.js";
import { getBuyer } from "./tools/getBuyer.js";
import { searchEntities } from "./tools/searchEntities.js";
import { getCategoryStats } from "./tools/getCategoryStats.js";
import { getProvinceStats } from "./tools/getProvinceStats.js";
import { searchCpv } from "./tools/searchCpv.js";
import { listGlossary, listKnowledge } from "./resources/index.js";

interface Result {
  name: string;
  ok: boolean;
  ms: number;
  sample?: string;
  error?: string;
}

async function runStep(name: string, fn: () => Promise<string>): Promise<Result> {
  const start = Date.now();
  try {
    const text = await fn();
    const sample = text.split("\n").slice(0, 3).join(" | ").slice(0, 200);
    return { name, ok: true, ms: Date.now() - start, sample };
  } catch (err) {
    return {
      name,
      ok: false,
      ms: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function main(): Promise<void> {
  const config = loadConfig();
  const client = createClient(config);
  const apiKeyPresent = Boolean(config.apiKey);

  console.log(`\n=== Atlas MCP smoke test ===`);
  console.log(`API base: ${config.apiBase}`);
  console.log(`API key:  ${apiKeyPresent ? "present" : "absent (LLM summaries will be skipped)"}`);
  console.log("");

  const results: Result[] = [];

  results.push(await runStep("search_tenders (budowa, limit=3)", () =>
    searchTenders(client, { query: "budowa", limit: 3 }),
  ));

  // Get a real ID from the first tender
  let realTenderId = "2026/BZP 00202613";
  try {
    const first = await client.get<{ data: Array<{ id: string }> }>("/api/tenders", { per_page: 1 });
    if (first.data?.[0]?.id) realTenderId = first.data[0].id;
  } catch {
    // fallback
  }

  results.push(await runStep(`get_tender (${realTenderId})`, () =>
    getTender(client, { tender_id: realTenderId, include_ai_summary: false }, apiKeyPresent),
  ));

  results.push(await runStep("search_entities (warszawa)", () =>
    searchEntities(client, { query: "warszawa", type: "buyer", limit: 3 }),
  ));

  results.push(await runStep("get_buyer (5252248481 = M.St. Warszawa)", () =>
    getBuyer(client, { nip: "5252248481", include_winning_contractors: false }),
  ));

  results.push(await runStep("get_category_stats (CPV=45)", () =>
    getCategoryStats(client, { cpv: "45", window: "year" }),
  ));

  results.push(await runStep("get_province_stats (all provinces)", () =>
    getProvinceStats(client, {}),
  ));

  results.push(await runStep("search_cpv (komputer)", () =>
    searchCpv(client, { query: "komputer", limit: 3 }),
  ));

  // Resources
  const glossary = listGlossary();
  results.push({
    name: `resource: atlas://glossary (${glossary.length} terms)`,
    ok: glossary.length > 0,
    ms: 0,
    sample: glossary.slice(0, 3).map((g) => g.term).join(", "),
  });

  const knowledge = listKnowledge();
  results.push({
    name: `resource: atlas://knowledge (${knowledge.length} articles)`,
    ok: knowledge.length > 0,
    ms: 0,
    sample: knowledge.slice(0, 3).map((k) => k.slug).join(", "),
  });

  console.log("\n--- Results ---\n");
  let failed = 0;
  for (const r of results) {
    const status = r.ok ? "✓" : "✗";
    console.log(`${status} [${r.ms}ms] ${r.name}`);
    if (r.sample) console.log(`    ${r.sample}`);
    if (r.error) {
      console.log(`    ERROR: ${r.error}`);
      failed += 1;
    }
  }
  console.log("");
  if (failed === 0) {
    console.log(`✓ All ${results.length} checks passed`);
  } else {
    console.log(`✗ ${failed} of ${results.length} checks failed`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Smoke test fatal error:", err);
  process.exit(1);
});
