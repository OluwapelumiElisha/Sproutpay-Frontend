import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import QoreID from "@qore-id/web-sdk";
import {
  errorMessage,
  getCachedOnrampConfig,
  getKycStatus,
  getOnrampConfig,
  initiateKyc,
  mapKycStatus,
  type KycRecord,
  type QoreidWidgetConfig,
} from "@/services/api";

const DEFAULT_CURRENCIES = ["NGN", "USD"];

// How long to keep polling kyc/status after the QoreID widget closes before
// giving up and falling back to the "we'll review this" messaging.
const POLL_INTERVAL_MS = 4000;
const POLL_MAX_ATTEMPTS = 15;

function convertDob(htmlDate: string): string {
  const [y, m, d] = htmlDate.split("-");
  if (!y || !m || !d) return htmlDate;
  return `${d}-${m}-${y}`;
}

export function useKycFlow() {
  const location = useLocation();
  const incomingCurrency = (location.state as { sourceCurrency?: string } | null)?.sourceCurrency;

  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState<KycRecord>({
    status: "not_started",
    step: 0,
    data: { sourceCurrency: incomingCurrency },
  });
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // QoreID "KYC with NIN" widget state (NGN only).
  const [widgetConfig, setWidgetConfig] = useState<QoreidWidgetConfig | null>(null);
  const [widgetBusy, setWidgetBusy] = useState(false);
  const [polling, setPolling] = useState(false);

  const cachedConfig = getCachedOnrampConfig();
  const [currencies, setCurrencies] = useState<string[]>(
    cachedConfig?.sourceCurrencies.map((c) => c.currency) ?? DEFAULT_CURRENCIES,
  );

  useEffect(() => {
    if (cachedConfig) return;
    getOnrampConfig().then((res) => {
      if (res.success && res.data) {
        setCurrencies(res.data.sourceCurrencies.map((c) => c.currency));
      }
    });
  }, [cachedConfig]);

  useEffect(() => {
    getKycStatus()
      .then((r) => {
        setRecord((prev) => ({
          ...r,
          data: { ...prev.data, ...r.data },
        }));
        if (r.status !== "not_started") setStep(1);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function update<K extends keyof KycRecord["data"]>(key: K, value: KycRecord["data"][K]) {
    setRecord((r) => ({ ...r, data: { ...r.data, [key]: value } }));
  }

  function validate(s: number): string | null {
    const d = record.data;
    if (s === 0) {
      if (!d.sourceCurrency?.trim()) return "Select the currency you'll transact with.";
      if (d.sourceCurrency === "NGN") {
        if (!d.nin?.trim() || !/^\d{11}$/.test(d.nin.trim())) return "Enter a valid 11-digit NIN.";
      }
      if (!d.phoneCode?.trim()) return "Select your country code.";
      if (!d.phone?.trim() || d.phone.trim().length < 5) return "Enter a valid phone number.";
      if (!d.gender?.trim()) return "Select your gender.";
      if (!d.dob?.trim()) return "Select your date of birth.";
    }
    if (s === 1) {
      if (!d.country?.trim()) return "Country is required.";
      if (!d.address?.trim()) return "Street address is required.";
      if (!d.city?.trim()) return "City is required.";
      if (!d.state?.trim()) return "State is required.";
    }
    return null;
  }

  function next() {
    setError(null);
    const err = validate(step);
    if (err) { setError(err); return; }
    setStep((s) => s + 1);
  }

  function back() {
    setError(null);
    setStep((s) => Math.max(0, s - 1));
  }

  // Poll kyc/status until QoreID's webhook confirms a final result (or we give up).
  async function pollKycStatus() {
    setPolling(true);
    try {
      for (let attempt = 0; attempt < POLL_MAX_ATTEMPTS; attempt++) {
        const latest = await getKycStatus();
        setRecord((r) => ({ ...latest, data: r.data }));
        if (latest.status !== "in_review") {
          if (latest.status === "verified") toast.success("Identity verified! You can now make transfers.");
          if (latest.status === "rejected") toast.error("Identity verification was rejected. Please contact support or try again.");
          return;
        }
        if (attempt < POLL_MAX_ATTEMPTS - 1) await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      }
    } finally {
      setPolling(false);
    }
  }

  // Launch the QoreID "KYC with NIN" verification widget.
  async function startVerification() {
    if (!widgetConfig) return;
    setWidgetBusy(true);
    try {
      QoreID.removeAllListeners();
      QoreID.on("loading", (isLoading) => setWidgetBusy(Boolean(isLoading)));
      QoreID.on("error", (payload) => {
        console.error("QoreID widget error event:", payload);
        const detail =
          typeof payload === "string"
            ? payload
            : (payload as { message?: string } | null)?.message ?? "Please try again.";
        toast.error(`Verification widget error: ${detail}`);
      });
      QoreID.once("close", () => {
        QoreID.removeAllListeners();
        setWidgetBusy(false);
        void pollKycStatus();
      });
      await QoreID.start(widgetConfig);
    } catch (err) {
      setWidgetBusy(false);
      const detail = err instanceof Error ? err.message : String(err);
      console.error("QoreID widget failed to start:", err);
      toast.error(`Could not load the verification widget: ${detail}`);
    }
  }

  async function finish() {
    setError(null);
    const err = validate(step);
    if (err) { setError(err); return; }

    const d = record.data;
    const sourceCurrency = d.sourceCurrency!.trim();
    setSubmitting(true);
    try {
      const res = await initiateKyc({
        sourceCurrency,
        phone: d.phone!.trim(),
        phoneCode: d.phoneCode!.trim(),
        country: d.country!.trim(),
        gender: d.gender!.trim(),
        dateOfBirth: convertDob(d.dob!),
        address: {
          street: d.address!.trim(),
          city: d.city!.trim(),
          state: (d.state ?? "").trim(),
          postalCode: (d.postal ?? "").trim(),
        },
        ...(sourceCurrency === "NGN" ? { nin: d.nin!.trim() } : {}),
      });

      if (!res.success) {
        switch (res.code) {
          case "NIN_REQUIRED":
            setError("NIN is required to verify a Naira account.");
            break;
          case "AGE_RESTRICTION":
            setError("You must be at least 18 years old to complete verification.");
            break;
          case "KYC_ALREADY_APPROVED": {
            const latest = await getKycStatus();
            setRecord((r) => ({ ...latest, data: r.data }));
            setStep(2);
            toast.success("Your identity is already verified.");
            return;
          }
          case "KYC_WIDGET_UNAVAILABLE":
            setError("The verification widget is temporarily unavailable. Please try again in a moment.");
            break;
          default:
            setError(errorMessage(res, "KYC initiation failed. Please try again."));
        }
        return;
      }

      const { provider, kycUrl, status, sessionId, widgetConfig: wc } = res.data!;
      const mappedStatus = mapKycStatus(status);

      setRecord((r) => ({
        ...r,
        status: mappedStatus,
        provider,
        step: 2,
        kycUrl: kycUrl ?? undefined,
        sessionId,
        submitted_at: Date.now(),
      }));
      setStep(2);
      setWidgetConfig(wc ?? null);

      if (mappedStatus === "verified") {
        toast.success(res.message ?? "Identity verified successfully. You can now make transfers.");
      } else if (provider === "qoreid" && wc) {
        toast.success("Identity verification started — complete the verification widget to finish.");
      } else {
        toast.success("KYC session started — complete verification at the link provided.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setRecord({ status: "not_started", step: 0, data: {} });
    setStep(0);
    setError(null);
    setWidgetConfig(null);
    setWidgetBusy(false);
    setPolling(false);
  }

  return {
    loading,
    record,
    step,
    error,
    submitting,
    currencies,
    widgetConfig,
    widgetBusy,
    polling,
    startVerification,
    update,
    next,
    back,
    finish,
    reset,
  };
}
