import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  errorMessage,
  getCachedOnrampConfig,
  getOnrampConfig,
  getOnrampRate,
  type OnrampAsset,
  type OnrampCurrency,
} from "@/services/api";
import { useDetectedCurrency } from "./useGeoCurrency";

export interface RateResult {
  rate: string;
  receive: string;
  fee: string;
  amount: string;
  limits: { min: number; max: number };
}

export function useCheckRate() {
  const [cachedConfig] = useState(() => getCachedOnrampConfig());
  const [currencies, setCurrencies] = useState<OnrampCurrency[]>(cachedConfig?.sourceCurrencies ?? []);
  const [assets, setAssets] = useState<OnrampAsset[]>(cachedConfig?.destinationAssets ?? []);
  const [configLoading, setConfigLoading] = useState(!cachedConfig);
  const [sourceCurrency, setSourceCurrency] = useState(cachedConfig?.sourceCurrencies[0]?.currency ?? "");
  const [amount, setAmount] = useState("100");
  const [assetIdx, setAssetIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RateResult | null>(null);

  const selectedAsset = assets[assetIdx] ?? null;
  const paymentMethod = currencies.find((c) => c.currency === sourceCurrency)?.paymentMethods[0] ?? null;

  useEffect(() => {
    if (cachedConfig) return;
    getOnrampConfig()
      .then((res) => {
        if (res.success && res.data) {
          setCurrencies(res.data.sourceCurrencies);
          setAssets(res.data.destinationAssets);
          if (res.data.sourceCurrencies[0]) setSourceCurrency(res.data.sourceCurrencies[0].currency);
        }
      })
      .finally(() => setConfigLoading(false));
  }, [cachedConfig]);

  // If the visitor's IP maps to a supported local currency (e.g. NGN for
  // Nigeria), surface it first in the list and pre-select it.
  const detectedCurrency = useDetectedCurrency();
  const geoApplied = useRef(false);
  useEffect(() => {
    if (geoApplied.current || !detectedCurrency || currencies.length === 0) return;
    geoApplied.current = true;
    const idx = currencies.findIndex((c) => c.currency === detectedCurrency);
    if (idx <= 0) return;
    setCurrencies((prev) => {
      const i = prev.findIndex((c) => c.currency === detectedCurrency);
      if (i <= 0) return prev;
      const next = [...prev];
      const [match] = next.splice(i, 1);
      next.unshift(match);
      return next;
    });
    setSourceCurrency(detectedCurrency);
  }, [detectedCurrency, currencies]);

  async function check() {
    setError(null);
    const value = parseFloat(amount);
    if (!amount || isNaN(value) || value <= 0) {
      const msg = "Enter a valid amount.";
      setError(msg);
      toast.error(msg);
      return;
    }
    if (!selectedAsset) {
      const msg = "Select a crypto asset.";
      setError(msg);
      toast.error(msg);
      return;
    }

    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await getOnrampRate({
        sourceCurrency,
        cryptoAsset: selectedAsset.symbol,
        network: selectedAsset.network,
        amount: value,
        paymentType: paymentMethod?.paymentType,
        paymentCode: paymentMethod?.paymentCode,
      });

      if (!res.success || !res.data) {
        const msg = !res.success ? errorMessage(res, "Rate unavailable.") : "No rate data returned.";
        setError(msg);
        toast.error(msg);
        return;
      }

      const d = res.data;
      setResult({
        rate: `1 ${d.cryptoAsset} = ${d.exchangeRate.toLocaleString()} ${d.sourceCurrency}`,
        receive: `${d.destinationAmount.toFixed(4)} ${d.cryptoAsset}`,
        fee: `${d.fees.total} ${d.cryptoAsset}`,
        amount: `${value.toLocaleString()} ${sourceCurrency}`,
        limits: d.limits,
      });
    } catch {
      const msg = "Could not fetch rate. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return {
    currencies,
    assets,
    configLoading,
    sourceCurrency, setSourceCurrency,
    amount, setAmount,
    assetIdx, setAssetIdx,
    selectedAsset,
    loading,
    error,
    result, setResult,
    check,
  };
}
