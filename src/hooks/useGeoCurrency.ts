import { useEffect, useState } from "react";

const GEO_CACHE_KEY = "sproutpay:geo-country";
const GEO_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Maps an IP-detected country to the local fiat currency we'd want to
// prioritize in the onramp currency selectors.
const COUNTRY_CURRENCY: Record<string, string> = {
  NG: "NGN",
  GH: "GHS",
  KE: "KES",
  ZA: "ZAR",
  US: "USD",
  GB: "GBP",
};

function getCachedCountry(): string | null | undefined {
  if (typeof sessionStorage === "undefined") return undefined;
  const raw = sessionStorage.getItem(GEO_CACHE_KEY);
  if (!raw) return undefined;
  try {
    const { code, ts } = JSON.parse(raw) as { code: string | null; ts: number };
    if (Date.now() - ts > GEO_TTL_MS) return undefined;
    return code;
  } catch {
    return undefined;
  }
}

function cacheCountry(code: string | null) {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(GEO_CACHE_KEY, JSON.stringify({ code, ts: Date.now() }));
}

async function detectCountryCode(): Promise<string | null> {
  const cached = getCachedCountry();
  if (cached !== undefined) return cached;
  try {
    const res = await fetch("https://ipapi.co/json/");
    if (!res.ok) return null;
    const data = (await res.json()) as { country_code?: string };
    const code = typeof data.country_code === "string" ? data.country_code : null;
    cacheCountry(code);
    return code;
  } catch {
    return null;
  }
}

// Returns the fiat currency (e.g. "NGN") matching the visitor's IP-detected
// country, or null if it can't be determined / isn't mapped. Used to
// prioritize a local currency in onramp currency selectors.
export function useDetectedCurrency(): string | null {
  const [currency, setCurrency] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    detectCountryCode().then((code) => {
      if (cancelled || !code) return;
      const mapped = COUNTRY_CURRENCY[code.toUpperCase()];
      if (mapped) setCurrency(mapped);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return currency;
}
