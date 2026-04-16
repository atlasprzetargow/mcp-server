import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { z } from "zod";
import type { AtlasClient } from "../lib/client.js";
import { searchTendersToolDef, searchTenders } from "./searchTenders.js";
import { getTenderToolDef, getTender } from "./getTender.js";
import { getBuyerToolDef, getBuyer } from "./getBuyer.js";
import { getContractorToolDef, getContractor } from "./getContractor.js";
import { searchEntitiesToolDef, searchEntities } from "./searchEntities.js";
import { getCategoryStatsToolDef, getCategoryStats } from "./getCategoryStats.js";
import { getProvinceStatsToolDef, getProvinceStats } from "./getProvinceStats.js";
import { searchCpvToolDef, searchCpv } from "./searchCpv.js";
import { AtlasApiError, AtlasTimeoutError, AtlasValidationError } from "../lib/errors.js";

export interface ToolContext {
  client: AtlasClient;
  apiKeyPresent: boolean;
}

type ZodLike = { parse: (input: unknown) => unknown };

interface ToolDef {
  name: string;
  title: string;
  description: string;
  inputShape: Record<string, unknown>;
  inputSchema: ZodLike;
}

export function registerTools(server: McpServer, ctx: ToolContext): void {
  register(server, searchTendersToolDef, (input) => searchTenders(ctx.client, input as never));
  register(server, getTenderToolDef, (input) => getTender(ctx.client, input as never, ctx.apiKeyPresent));
  register(server, getBuyerToolDef, (input) => getBuyer(ctx.client, input as never));
  register(server, getContractorToolDef, (input) => getContractor(ctx.client, input as never));
  register(server, searchEntitiesToolDef, (input) => searchEntities(ctx.client, input as never));
  register(server, getCategoryStatsToolDef, (input) => getCategoryStats(ctx.client, input as never));
  register(server, getProvinceStatsToolDef, (input) => getProvinceStats(ctx.client, input as never));
  register(server, searchCpvToolDef, (input) => searchCpv(ctx.client, input as never));
}

function register(
  server: McpServer,
  def: ToolDef,
  handler: (input: unknown) => Promise<string>,
): void {
  server.registerTool(
    def.name,
    {
      title: def.title,
      description: def.description,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      inputSchema: def.inputShape as any,
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (async (rawInput: unknown) => {
      try {
        const parsed = def.inputSchema.parse(rawInput);
        const text = await handler(parsed);
        return {
          content: [
            {
              type: "text" as const,
              text,
            },
          ],
        };
      } catch (err) {
        return {
          content: [
            {
              type: "text" as const,
              text: formatError(err, def.name),
            },
          ],
          isError: true,
        };
      }
    }) as any,
  );
}

function formatError(err: unknown, toolName: string): string {
  if (err instanceof AtlasApiError) {
    if (err.status === 404) {
      return `Nie znaleziono zasobu (404). Endpoint: ${err.endpoint}. Sprawdź, czy ID / NIP / slug jest poprawny.`;
    }
    if (err.status === 401 || err.status === 403) {
      return `Brak uprawnień (${err.status}) do ${err.endpoint}. Niektóre funkcje (np. AI summary) wymagają ATLAS_API_KEY. Pozostałe narzędzia działają bez klucza.`;
    }
    if (err.status === 429) {
      return `Rate limit — zbyt wiele zapytań do Atlas API. Zaczekaj chwilę i spróbuj ponownie.`;
    }
    if (err.status >= 500) {
      return `Błąd po stronie Atlas API (${err.status}). Spróbuj ponownie za chwilę. Jeśli problem się powtarza: https://atlasprzetargow.pl/status`;
    }
    return `Błąd Atlas API (${err.status}) dla ${err.endpoint}: ${err.bodyExcerpt.slice(0, 200)}`;
  }
  if (err instanceof AtlasTimeoutError) {
    return `Zapytanie do Atlas API przekroczyło limit czasu. Endpoint: ${err.endpoint}. Spróbuj zawęzić kryteria lub ponowić za chwilę.`;
  }
  if (err instanceof AtlasValidationError) {
    return `Błąd walidacji argumentów w ${toolName}: ${err.message}`;
  }
  if (err && typeof err === "object" && "issues" in err) {
    // zod error
    const zerr = err as z.ZodError;
    const issues = zerr.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    return `Błąd walidacji w ${toolName}: ${issues}`;
  }
  if (err instanceof Error) {
    return `Błąd w ${toolName}: ${err.message}`;
  }
  return `Nieznany błąd w ${toolName}`;
}
