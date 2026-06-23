import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  errorMessage,
  getCachedOnrampConfig,
  getOnrampConfig,
  getOnrampRate,
  initiateOnramp,
  type OnrampAsset,
  type OnrampCurrency,
} from "@/services/api";
import { useAuth } from "./useAuth";
import { useDebouncedValue } from "./useDebouncedValue";
import { useDetectedCurrency } from "./useGeoCurrency";

export type BuyStep = 1 | 2 | 3;

export interface Quote {
  destinationAmount: number;
  exchangeRate: number;
  fees: { total: number };
  limits: { min: number; max: number };
}

export function useBuyCrypto() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [cachedConfig] = useState(() => getCachedOnrampConfig());
  const [currencies, setCurrencies] = useState<OnrampCurrency[]>(cachedConfig?.sourceCurrencies ?? []);
  const [assets, setAssets] = useState<OnrampAsset[]>(cachedConfig?.destinationAssets ?? []);
  const [configLoading, setConfigLoading] = useState(!cachedConfig);

  const [sourceCurrency, setSourceCurrency] = useState(cachedConfig?.sourceCurrencies[0]?.currency ?? "");
  const [assetIdx, setAssetIdx] = useState(0);
  const [amount, setAmount] = useState("100");
  const [wallet, setWallet] = useState("");
  const [paymentMethodIdx, setPaymentMethodIdx] = useState(0);

  const debouncedAmount = useDebouncedValue(amount, 500);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const [step, setStep] = useState<BuyStep>(1);
  const [payUrl, setPayUrl] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const selectedAsset = assets[assetIdx] ?? null;
  const selectedCurrencyObj = currencies.find((c) => c.currency === sourceCurrency) ?? null;
  const paymentMethod = selectedCurrencyObj?.paymentMethods[paymentMethodIdx] ?? null;

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
    setPaymentMethodIdx(0);
  }, [detectedCurrency, currencies]);

  useEffect(() => {
    const value = parseFloat(debouncedAmount);
    if (!selectedAsset || !sourceCurrency || isNaN(value) || value <= 0) {
      setQuote(null);
      setQuoteError(null);
      return;
    }
    let cancelled = false;
    setQuoteLoading(true);
    getOnrampRate({
      sourceCurrency,
      cryptoAsset: selectedAsset.symbol,
      network: selectedAsset.network,
      amount: value,
      paymentType: paymentMethod?.paymentType,
      paymentCode: paymentMethod?.paymentCode,
    })
      .then((res) => {
        if (cancelled) return;
        if (res.success && res.data) {
          setQuote(res.data);
          setQuoteError(null);
        } else {
          const msg = !res.success ? errorMessage(res, "Rate unavailable.") : "No rate data returned.";
          setQuote(null);
          setQuoteError(msg);
          toast.error(msg);
        }
      })
      .catch(() => {
        if (cancelled) return;
        const msg = "Could not fetch rate. Please try again.";
        setQuote(null);
        setQuoteError(msg);
        toast.error(msg);
      })
      .finally(() => { if (!cancelled) setQuoteLoading(false); });
    return () => { cancelled = true; };
  }, [debouncedAmount, sourceCurrency, selectedAsset, paymentMethod]);

  function toStep1() {
    setError(null);
    setStep(1);
  }

  function toStep2() {
    setError(null);
    const value = parseFloat(amount);
    if (!amount || isNaN(value) || value <= 0) {
      const msg = "Enter a valid amount.";
      setError(msg);
      toast.error(msg);
      return;
    }
    const min = paymentMethod?.minAmount ?? 0;
    const max = paymentMethod?.maxAmount ?? Infinity;
    if (min > 0 && value < min) {
      const msg = `Minimum is ${min.toLocaleString()} ${sourceCurrency}.`;
      setError(msg);
      toast.error(msg);
      return;
    }
    if (max < Infinity && value > max) {
      const msg = `Maximum is ${max.toLocaleString()} ${sourceCurrency}.`;
      setError(msg);
      toast.error(msg);
      return;
    }
    if (!quote) {
      const msg = quoteError ?? "Rate not loaded yet. Please wait.";
      setError(msg);
      toast.error(msg);
      return;
    }
    setStep(2);
  }

  async function handleInitiate() {
    setError(null);
    const trimmed = wallet.trim();
    if (!trimmed) {
      const msg = "Enter your wallet address.";
      setError(msg);
      toast.error(msg);
      return;
    }
    if (!user) {
      const msg = "You must be logged in.";
      setError(msg);
      toast.error(msg);
      return;
    }
    if (!selectedAsset) {
      const msg = "No asset selected.";
      setError(msg);
      toast.error(msg);
      return;
    }

    setSubmitting(true);
    try {
      const res = await initiateOnramp({
        sourceCurrency,
        cryptoAsset: selectedAsset.symbol,
        network: selectedAsset.network,
        walletAddress: trimmed,
        walletOwner: "self",
        paymentType: paymentMethod?.paymentType,
        paymentCode: paymentMethod?.paymentCode,
        purposeCode: "personal",
        sourceAmount: parseFloat(amount),
      });

      if (!res.success) {
        const isKyc =
          ("code" in res && typeof res.code === "string" && res.code.toUpperCase().includes("KYC")) ||
          (res.message?.toUpperCase().includes("KYC") ?? false);

        if (isKyc) {
          toast.error("KYC verification required. Redirecting you to complete it now.");
          navigate("/kyc", { state: { sourceCurrency } });
          return;
        }

        const msg = errorMessage(res, "Failed to create order.");
        setError(msg);
        toast.error(msg);
        return;
      }

      setPayUrl(res.data?.payUrl ?? null);
      setOrderId(res.data?.orderId ?? res.data?.transactionId ?? null);
      setStep(3);
      toast.success("Order created — complete payment to receive crypto.");
    } catch {
      const msg = "Network error. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setAmount("100");
    setWallet("");
    setQuote(null);
    setPayUrl(null);
    setOrderId(null);
    setError(null);
    setStep(1);
  }

  return {
    configLoading,
    currencies, setCurrencies,
    assets,
    sourceCurrency, setSourceCurrency,
    assetIdx, setAssetIdx,
    amount, setAmount,
    wallet, setWallet,
    paymentMethodIdx, setPaymentMethodIdx,
    selectedAsset,
    selectedCurrencyObj,
    paymentMethod,
    quote,
    quoteLoading,
    quoteError,
    step,
    payUrl,
    orderId,
    error,
    submitting,
    toStep1,
    toStep2,
    handleInitiate,
    reset,
  };
}
