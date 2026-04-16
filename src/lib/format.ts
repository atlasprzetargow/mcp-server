export function formatCurrencyPLN(value: number | null | undefined, currency = "PLN"): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  try {
    return new Intl.NumberFormat("pl-PL", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${Math.round(value).toLocaleString("pl-PL")} ${currency}`;
  }
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return "—";
  try {
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return date;
    return new Intl.DateTimeFormat("pl-PL", {
      dateStyle: "medium",
      timeStyle: date.includes("T") ? "short" : undefined,
      timeZone: "Europe/Warsaw",
    }).format(d);
  } catch {
    return date;
  }
}

export function truncate(text: string | null | undefined, maxLen = 300): string {
  if (!text) return "";
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= maxLen) return clean;
  return `${clean.slice(0, maxLen - 1)}…`;
}

export function tenderUrl(tenderId: string, base = "https://atlasprzetargow.pl"): string {
  return `${base}/przetarg/${encodeURIComponent(tenderId)}`;
}

export function buyerUrl(nip: string, slug: string | undefined, base = "https://atlasprzetargow.pl"): string {
  const pathSlug = slug ?? `n${nip}`;
  return `${base}/podmiot/zamawiajacy/${pathSlug}`;
}

export function contractorUrl(nip: string, slug: string | undefined, base = "https://atlasprzetargow.pl"): string {
  const pathSlug = slug ?? `n${nip}`;
  return `${base}/podmiot/wykonawca/${pathSlug}`;
}

export const PROVINCE_NAMES: Record<string, string> = {
  PL02: "dolnośląskie",
  PL04: "kujawsko-pomorskie",
  PL06: "lubelskie",
  PL08: "lubuskie",
  PL10: "łódzkie",
  PL12: "małopolskie",
  PL14: "mazowieckie",
  PL16: "opolskie",
  PL18: "podkarpackie",
  PL20: "podlaskie",
  PL22: "pomorskie",
  PL24: "śląskie",
  PL26: "świętokrzyskie",
  PL28: "warmińsko-mazurskie",
  PL30: "wielkopolskie",
  PL32: "zachodniopomorskie",
};

export function provinceLabel(code: string | null | undefined): string {
  if (!code) return "—";
  return PROVINCE_NAMES[code] ?? code;
}

export function normalizeTenderId(raw: string): string {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return "";
  const bzpDash = /^(\d{4})-BZP-(\d+)(?:-.*)?$/i.exec(trimmed);
  if (bzpDash) {
    return `${bzpDash[1]}/BZP ${bzpDash[2]}`;
  }
  return trimmed;
}
