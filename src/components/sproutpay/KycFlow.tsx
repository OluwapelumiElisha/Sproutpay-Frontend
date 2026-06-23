import { AlertCircle, ArrowLeft, CheckCircle2, ExternalLink, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useKycFlow } from "@/hooks/useKycFlow";
import { Field, ErrorBox, Stepper, SectionCard, StatusPill } from "./shared";

const STEPS = ["Personal", "Address"];

const COUNTRIES = [
  { code: "NG", name: "Nigeria" },
  { code: "GH", name: "Ghana" },
  { code: "KE", name: "Kenya" },
  { code: "ZA", name: "South Africa" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
];

const PHONE_CODES = [
  { code: "+234", label: "+234 (NG)" },
  { code: "+233", label: "+233 (GH)" },
  { code: "+254", label: "+254 (KE)" },
  { code: "+27",  label: "+27 (ZA)"  },
  { code: "+1",   label: "+1 (US/CA)" },
  { code: "+44",  label: "+44 (UK)"  },
];

export function KycFlow() {
  const {
    loading, record, step, error, submitting, currencies,
    widgetConfig, widgetBusy, polling, startVerification,
    update, next, back, finish, reset,
  } = useKycFlow();

  if (loading) return <div className="flex justify-center p-12"><span className="spinner" /></div>;

  if (record.status === "in_review" || record.status === "verified" || record.status === "rejected") {
    return (
      <KycResult
        record={record}
        widgetConfig={widgetConfig}
        widgetBusy={widgetBusy}
        polling={polling}
        onStartVerification={startVerification}
        onReset={reset}
      />
    );
  }

  return (
    <div className="max-w-[640px] mx-auto">
      <div className="mb-3 sm:mb-4">
        <h1 className="text-[26px] sm:text-[30px] font-black tracking-tight" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
          Identity Verification
        </h1>
        <p className="text-[13px] sm:text-[14px] text-muted-foreground mt-0.5">
          Complete KYC to unlock higher transaction limits.
        </p>
      </div>

      <SectionCard>
        <div className="mb-5 sm:mb-6">
          <Stepper steps={STEPS} current={step} />
        </div>

        {error && <ErrorBox message={error} />}

        {step === 0 && (
          <div className="fade-in grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Verification Currency">
              <select className="inp" value={record.data.sourceCurrency ?? ""}
                onChange={(e) => update("sourceCurrency", e.target.value)}>
                <option value="">Select currency</option>
                {currencies.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            {record.data.sourceCurrency === "NGN" ? (
              <Field label="NIN">
                <input className="inp" placeholder="12345678901" inputMode="numeric" maxLength={11}
                  value={record.data.nin ?? ""}
                  onChange={(e) => update("nin", e.target.value.replace(/\D/g, ""))} />
              </Field>
            ) : <div className="hidden sm:block" />}
            <Field label="Phone Code">
              <select className="inp" value={record.data.phoneCode ?? ""} onChange={(e) => update("phoneCode", e.target.value)}>
                <option value="">Select code</option>
                {PHONE_CODES.map((p) => <option key={p.code} value={p.code}>{p.label}</option>)}
              </select>
            </Field>
            <Field label="Phone Number">
              <input className="inp" placeholder="08012345678" type="tel" maxLength={20}
                value={record.data.phone ?? ""} onChange={(e) => update("phone", e.target.value)} />
            </Field>
            <Field label="Gender">
              <select className="inp" value={record.data.gender ?? ""} onChange={(e) => update("gender", e.target.value)}>
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </Field>
            <Field label="Date of Birth">
              <input type="date" className="inp" value={record.data.dob ?? ""}
                onChange={(e) => update("dob", e.target.value)}
                max={new Date(Date.now() - 18 * 365.25 * 24 * 3600 * 1000).toISOString().split("T")[0]}
              />
            </Field>
            {record.data.sourceCurrency === "NGN" && (
              <div className="sm:col-span-2">
                <div className="rounded-xl p-4 flex items-start gap-3"
                  style={{ background: "color-mix(in oklab, var(--primary) 6%, transparent)", border: "1px solid color-mix(in oklab, var(--primary) 18%, transparent)" }}>
                  <span className="flex items-center justify-center rounded-lg shrink-0"
                    style={{ width: 36, height: 36, background: "color-mix(in oklab, var(--primary) 14%, transparent)", color: "var(--primary)" }}>
                    <ShieldCheck size={18} />
                  </span>
                  <p className="text-[13px] leading-relaxed" style={{ color: "color-mix(in oklab, var(--primary) 75%, var(--foreground))" }}>
                    Naira accounts are verified via a quick identity widget (biometrics + face match against your NIN). Make sure your name, date of birth, gender and phone number match your NIN record.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 1 && (
          <div className="fade-in grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Country">
              <select className="inp" value={record.data.country ?? ""} onChange={(e) => update("country", e.target.value)}>
                <option value="">Select country</option>
                {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="City">
              <input className="inp" placeholder="Lagos"
                value={record.data.city ?? ""} onChange={(e) => update("city", e.target.value)} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Street Address">
                <input className="inp" placeholder="123 Main St"
                  value={record.data.address ?? ""} onChange={(e) => update("address", e.target.value)} />
              </Field>
            </div>
            <Field label="State / Region">
              <input className="inp" placeholder="Lagos"
                value={record.data.state ?? ""} onChange={(e) => update("state", e.target.value)} />
            </Field>
            <Field label="Postal Code">
              <input className="inp" placeholder="100001" maxLength={20}
                value={record.data.postal ?? ""} onChange={(e) => update("postal", e.target.value)} />
            </Field>
            <div className="sm:col-span-2">
              <div className="rounded-xl p-4 flex items-start gap-3"
                style={{ background: "color-mix(in oklab, var(--primary) 6%, transparent)", border: "1px solid color-mix(in oklab, var(--primary) 18%, transparent)" }}>
                <span className="flex items-center justify-center rounded-lg shrink-0"
                  style={{ width: 36, height: 36, background: "color-mix(in oklab, var(--primary) 14%, transparent)", color: "var(--primary)" }}>
                  <ShieldCheck size={18} />
                </span>
                <p className="text-[13px] leading-relaxed" style={{ color: "color-mix(in oklab, var(--primary) 75%, var(--foreground))" }}>
                  You&apos;ll be redirected to our secure verification partner to complete identity checks.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          {step > 0 && (
            <button className="btn-ghost flex-1" onClick={back} disabled={submitting}>
              <ArrowLeft size={14} className="inline mr-1" /> Back
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button className="btn-fancy flex-1" onClick={next}>Continue →</button>
          ) : (
            <button className="btn-fancy flex-1" onClick={finish} disabled={submitting}>
              {submitting ? "Starting KYC…" : "Start Verification →"}
            </button>
          )}
        </div>
      </SectionCard>
    </div>
  );
}

function KycResult({
  record, widgetConfig, widgetBusy, polling, onStartVerification, onReset,
}: {
  record: ReturnType<typeof useKycFlow>["record"];
  widgetConfig: ReturnType<typeof useKycFlow>["widgetConfig"];
  widgetBusy: boolean;
  polling: boolean;
  onStartVerification: () => void;
  onReset: () => void;
}) {
  const verified = record.status === "verified";
  const rejected = record.status === "rejected";
  const instant = verified && record.provider === "qoreid";
  const hasWidget = record.provider === "qoreid" && !!widgetConfig && !verified && !rejected;

  return (
    <div className="max-w-[560px] mx-auto">
      <SectionCard>
        <div className="flex flex-col items-center text-center py-4">
          <div className="rounded-full flex items-center justify-center mb-4"
            style={{
              width: 64, height: 64,
              background: rejected ? "rgba(239,68,68,0.12)" : "color-mix(in oklab, var(--primary) 14%, transparent)",
              color: rejected ? "#ef4444" : "var(--primary)",
            }}>
            {rejected ? <AlertCircle size={32} /> : <CheckCircle2 size={32} />}
          </div>
          <h2 className="text-[20px] font-extrabold mb-3" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            {verified ? "You're verified!" : rejected ? "Verification rejected" : "Verification in progress"}
          </h2>
          <StatusPill status={record.status} size="md" />

          {hasWidget && (
            <button className="btn-fancy mt-5 inline-flex items-center justify-center gap-2"
              style={{ maxWidth: 320, width: "100%" }}
              onClick={onStartVerification}
              disabled={widgetBusy || polling}>
              <ShieldCheck size={15} />
              {widgetBusy ? "Loading widget…" : polling ? "Checking status…" : "Start Verification Widget"}
            </button>
          )}

          {record.kycUrl && !verified && !rejected && (
            <a href={record.kycUrl} target="_blank" rel="noopener noreferrer"
              className="btn-fancy mt-5 inline-flex items-center justify-center gap-2"
              style={{ textDecoration: "none", maxWidth: 320 }}>
              <ExternalLink size={15} /> Complete Verification
            </a>
          )}

          {polling && (
            <p className="text-[12px] text-muted-foreground mt-3 flex items-center gap-1.5 justify-center">
              <span className="spinner" style={{ width: 12, height: 12 }} /> Confirming your result…
            </p>
          )}

          <p className="text-[13px] text-muted-foreground mt-4 max-w-[400px]">
            {instant
              ? "Your identity is verified. You can now make Naira transfers."
              : verified
                ? "Your account has full access. Higher limits are now active."
                : rejected
                  ? "We couldn't verify your identity with the details provided. Please try again or contact support."
                  : hasWidget
                    ? "Complete the secure identity widget (biometrics + face match against your NIN) to finish verification. We'll check your status automatically once you're done."
                    : record.kycUrl
                      ? "Click the button above to complete your identity verification with our secure partner."
                      : "We're reviewing your information. This usually takes under 24 hours."}
          </p>

          {verified && (
            <Link to="/buy" className="btn-fancy mt-5 inline-flex items-center justify-center"
              style={{ textDecoration: "none", maxWidth: 320, width: "100%" }}>
              Continue to Buy Crypto →
            </Link>
          )}

          {!verified && !widgetBusy && !polling && (
            <button className="btn-ghost mt-5" style={{ maxWidth: 320, width: "100%" }} onClick={onReset}>
              Re-submit verification
            </button>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
