export interface AtlasConfig {
  apiBase: string;
  apiKey: string | undefined;
  userAgent: string;
  requestTimeoutMs: number;
  maxRetries: number;
  retryBaseDelayMs: number;
}

export function loadConfig(): AtlasConfig {
  const apiBase = (process.env.ATLAS_API_BASE ?? "https://atlasprzetargow.pl").replace(/\/+$/, "");
  const apiKey = process.env.ATLAS_API_KEY?.trim() || undefined;
  const timeout = Number(process.env.ATLAS_TIMEOUT_MS ?? 20000);
  const retries = Number(process.env.ATLAS_MAX_RETRIES ?? 2);

  return {
    apiBase,
    apiKey,
    userAgent: `@atlasprzetargow/mcp/${pkgVersion()} (+https://atlasprzetargow.pl)`,
    requestTimeoutMs: Number.isFinite(timeout) && timeout > 0 ? timeout : 20000,
    maxRetries: Number.isFinite(retries) && retries >= 0 ? retries : 2,
    retryBaseDelayMs: 300,
  };
}

function pkgVersion(): string {
  return process.env.npm_package_version ?? "0.1.0";
}
