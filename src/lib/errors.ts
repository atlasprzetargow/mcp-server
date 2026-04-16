export class AtlasApiError extends Error {
  readonly status: number;
  readonly endpoint: string;
  readonly bodyExcerpt: string;

  constructor(message: string, status: number, endpoint: string, bodyExcerpt: string) {
    super(message);
    this.name = "AtlasApiError";
    this.status = status;
    this.endpoint = endpoint;
    this.bodyExcerpt = bodyExcerpt;
  }
}

export class AtlasTimeoutError extends Error {
  readonly endpoint: string;

  constructor(endpoint: string, timeoutMs: number) {
    super(`Request to Atlas API timed out after ${timeoutMs}ms: ${endpoint}`);
    this.name = "AtlasTimeoutError";
    this.endpoint = endpoint;
  }
}

export class AtlasValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AtlasValidationError";
  }
}
