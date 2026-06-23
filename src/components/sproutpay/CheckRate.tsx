import { useNavigate } from "react-router-dom";
import { ArrowRight, Calculator, Clock } from "lucide-react";
import { useCheckRate } from "@/hooks/useCheckRate";
import { Field, ErrorBox, SectionCard } from "./shared";

export function CheckRate() {
  const navigate = useNavigate();
  const {
    currencies, assets, configLoading,
    sourceCurrency, setSourceCurrency,
    amount, setAmount,
    assetIdx, setAssetIdx,
    loading, error, result, setResult,
    check,
  } = useCheckRate();

  if (configLoading) {
    return (
      <div className="max-w-[640px] mx-auto">
        <div className="flex justify-center py-12"><span className="spinner" /></div>
      </div>
    );
  }

  return (
    <div className="max-w-[640px] mx-auto">
      <div className="mb-3 sm:mb-4">
        <h1 className="text-[26px] sm:text-[30px] font-black tracking-tight" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
          Check Rate
        </h1>
        <p className="text-[13px] sm:text-[14px] text-muted-foreground mt-0.5">
          See the current conversion rate before starting a transaction.
        </p>
      </div>

      <SectionCard>
        {error && <ErrorBox message={error} />}

        <div className="flex flex-col gap-4">
          <Field label="Fiat Currency">
            <select className="inp" value={sourceCurrency}
              onChange={(e) => { setSourceCurrency(e.target.value); setResult(null); }}>
              {currencies.map((c) => <option key={c.currency} value={c.currency}>{c.currency}</option>)}
            </select>
          </Field>

          <Field label="Amount">
            <input type="number" className="inp" placeholder="100"
              value={amount} onChange={(e) => { setAmount(e.target.value); setResult(null); }} min={0} />
          </Field>

          <Field label="Crypto Asset">
            <select className="inp" value={assetIdx}
              onChange={(e) => { setAssetIdx(Number(e.target.value)); setResult(null); }}>
              {assets.map((a, i) => (
                <option key={`${a.symbol}-${a.network}`} value={i}>{a.symbol} — {a.network}</option>
              ))}
            </select>
          </Field>

          <button className="btn-fancy" onClick={check} disabled={loading}>
            <Calculator size={15} className="inline mr-1.5 -mt-0.5" />
            {loading ? "Checking…" : "Check Rate"}
          </button>
        </div>

        {result && (
          <div className="fade-in mt-5">
            <div className="rounded-xl p-4 flex flex-col gap-2.5"
              style={{ background: "color-mix(in oklab, var(--primary) 6%, transparent)", border: "1px solid color-mix(in oklab, var(--primary) 18%, transparent)" }}>
              <SummaryRow label="Amount" value={result.amount} />
              <SummaryRow label="Exchange Rate" value={result.rate} />
              <SummaryRow label="Network Fee" value={result.fee} />
              <SummaryRow label="You'll Receive" value={result.receive} accent />
              {result.limits.min > 0 && (
                <SummaryRow label="Limits" value={`${result.limits.min.toLocaleString()} – ${result.limits.max.toLocaleString()} ${sourceCurrency}`} />
              )}
              <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground pt-1">
                <Clock size={12} /> Estimated processing time: 5 – 15 minutes
              </div>
            </div>
            <button className="btn-fancy w-full mt-4" onClick={() => navigate("/buy")}>
              Initiate Transaction <ArrowRight size={15} className="inline ml-1 -mt-0.5" />
            </button>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

function SummaryRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between items-center text-[13px]">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-bold" style={{ color: accent ? "var(--primary)" : "var(--foreground)", fontFamily: "'Cabinet Grotesk', sans-serif", fontSize: accent ? 15 : 13 }}>
        {value}
      </span>
    </div>
  );
}
