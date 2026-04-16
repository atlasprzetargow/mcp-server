import { AtlasApiError, AtlasTimeoutError } from "./errors.js";
import type { AtlasConfig } from "./config.js";

export type QueryValue = string | number | boolean | undefined | null;
export type QueryParams = Record<string, QueryValue | QueryValue[]>;

export interface AtlasClient {
  get<T = unknown>(path: string, params?: QueryParams): Promise<T>;
}

export function createClient(config: AtlasConfig): AtlasClient {
  return {
    get<T>(path: string, params?: QueryParams) {
      return request<T>(config, path, params);
    },
  };
}

async function request<T>(
  config: AtlasConfig,
  path: string,
  params?: QueryParams,
): Promise<T> {
  const url = buildUrl(config.apiBase, path, params);
  const endpoint = `${path}${url.search ? url.search : ""}`;

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= config.maxRetries; attempt += 1) {
    try {
      return await doFetch<T>(url, endpoint, config);
    } catch (err) {
      lastError = err as Error;
      if (!isRetryable(err) || attempt === config.maxRetries) {
        throw err;
      }
      const delay = config.retryBaseDelayMs * 2 ** attempt;
      await sleep(delay);
    }
  }

  throw lastError ?? new Error("Unknown request failure");
}

async function doFetch<T>(url: URL, endpoint: string, config: AtlasConfig): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.requestTimeoutMs);

  const headers: Record<string, string> = {
    Accept: "application/json",
    "User-Agent": config.userAgent,
  };
  if (config.apiKey && endpoint.startsWith("/api/llm/")) {
    headers["X-LLM-API-Key"] = config.apiKey;
  }

  try {
    const res = await fetch(url, {
      method: "GET",
      headers,
      signal: controller.signal,
    });

    const bodyText = await safeReadText(res);

    if (!res.ok) {
      throw new AtlasApiError(
        `Atlas API ${res.status} ${res.statusText} for ${endpoint}`,
        res.status,
        endpoint,
        bodyText.slice(0, 500),
      );
    }

    if (!bodyText) {
      return undefined as T;
    }

    try {
      return JSON.parse(bodyText) as T;
    } catch {
      throw new AtlasApiError(
        `Atlas API returned non-JSON body for ${endpoint}`,
        res.status,
        endpoint,
        bodyText.slice(0, 500),
      );
    }
  } catch (err) {
    if ((err as { name?: string }).name === "AbortError") {
      throw new AtlasTimeoutError(endpoint, config.requestTimeoutMs);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

function isRetryable(err: unknown): boolean {
  if (err instanceof AtlasTimeoutError) return true;
  if (err instanceof AtlasApiError) {
    return err.status === 408 || err.status === 429 || err.status >= 500;
  }
  const cause = (err as { cause?: { code?: string } })?.cause;
  if (cause?.code === "ECONNRESET" || cause?.code === "ETIMEDOUT" || cause?.code === "EAI_AGAIN") {
    return true;
  }
  return false;
}

function buildUrl(base: string, path: string, params?: QueryParams): URL {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${base}${normalizedPath}`);
  if (!params) return url;

  for (const [key, raw] of Object.entries(params)) {
    if (raw === undefined || raw === null) continue;
    const values = Array.isArray(raw) ? raw : [raw];
    for (const value of values) {
      if (value === undefined || value === null) continue;
      url.searchParams.append(key, String(value));
    }
  }

  return url;
}

async function safeReadText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return "";
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
