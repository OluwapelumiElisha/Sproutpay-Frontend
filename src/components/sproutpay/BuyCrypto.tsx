import { ExternalLink } from "lucide-react";
import { useBuyCrypto, type BuyStep } from "@/hooks/useBuyCrypto";

export function BuyCrypto() {
  const h = useBuyCrypto();

  if (h.configLoading) {
    return <div className="flex justify-center items-center py-16"><span className="spinner" /></div>;
  }

  return (
    <div className="px-6 pt-3 pb-7">
      <StepDots step={h.step} />
      {h.error && h.step <= 2 && <ErrorBox message={h.error} />}
      {!h.error && h.quoteError && h.step === 1 && <ErrorBox message={h.quoteError} />}

      {h.step === 1 && (
        <div className="fade-in flex flex-col gap-5">
          <Field label="You Pay">
            <div className="flex gap-2 items-stretch">
              <select className="inp" style={{ maxWidth: 110 }}
                value={h.sourceCurrency}
                onChange={(e) => { h.setSourceCurrency(e.target.value); h.setPaymentMethodIdx(0); }}>
                {h.currencies.map((c) => <option key={c.currency} value={c.currency}>{c.currency}</option>)}
              </select>
              <input type="number" className="inp flex-1" placeholder="100"
                value={h.amount} onChange={(e) => h.setAmount(e.target.value)} min={0} />
            </div>
          </Field>

          <div className="flex justify-center text-muted-foreground" style={{ marginTop: -6, marginBottom: -6 }}>↓</div>

          <Field label="You Receive">
            <div className="inp flex items-center justify-between" style={{ background: "var(--surface-2)", cursor: "default" }}>
              <span style={{ fontFamily: "'Cabinet Grotesk', sans-serif", fontWeight: 700, fontSize: 16 }}>
                {h.quoteLoading ? "Fetching rate…" : h.quote ? `${h.quote.destinationAmount.toFixed(4)} ${h.selectedAsset?.symbol ?? ""}` : "—"}
              </span>
              <span className="text-[12px] font-bold px-2 py-0.5 rounded-lg ml-2"
                style={{ background: "color-mix(in oklab, var(--primary) 12%, transparent)", color: "var(--primary)" }}>
                {h.selectedAsset?.symbol ?? "—"}
              </span>
            </div>
          </Field>

          <Field label="Crypto Asset">
            <select className="inp" value={h.assetIdx} onChange={(e) => h.setAssetIdx(Number(e.target.value))}>
              {h.assets.map((a, i) => (
                <option key={`${a.symbol}-${a.network}`} value={i}>{a.symbol} — {a.network}</option>
              ))}
            </select>
          </Field>

          {h.selectedCurrencyObj && h.selectedCurrencyObj.paymentMethods.length > 1 && (
            <Field label="Payment Method">
              <select className="inp" value={h.paymentMethodIdx} onChange={(e) => h.setPaymentMethodIdx(Number(e.target.value))}>
                {h.selectedCurrencyObj.paymentMethods.map((m, i) => (
                  <option key={m.paymentCode} value={i}>{m.name}</option>
                ))}
              </select>
            </Field>
          )}

          <RateSummary
            rate={h.quote ? `1 ${h.selectedAsset?.symbol} = ${h.quote.exchangeRate.toLocaleString()} ${h.sourceCurrency}` : "—"}
            fee={h.quote ? `${h.quote.fees.total} ${h.selectedAsset?.symbol}` : "—"}
            receive={h.quote ? `${h.quote.destinationAmount.toFixed(4)} ${h.selectedAsset?.symbol}` : "—"}
          />

          <button className="btn-fancy" onClick={h.toStep2} disabled={h.quoteLoading || !h.quote}>Continue →</button>
        </div>
      )}

      {h.step === 2 && (
        <div className="fade-in flex flex-col gap-5">
          <RateSummary
            rate={`${parseFloat(h.amount).toLocaleString()} ${h.sourceCurrency}`}
            fee={`${h.quote?.fees.total ?? 0} ${h.selectedAsset?.symbol}`}
            receive={h.quote ? `${h.quote.destinationAmount.toFixed(4)} ${h.selectedAsset?.symbol}` : "—"}
          />
          <Field label={`${h.selectedAsset?.symbol ?? "USDT"} Wallet Address`}>
            <input type="text" className="inp" placeholder="Enter your wallet address…" maxLength={200}
              value={h.wallet} onChange={(e) => h.setWallet(e.target.value)} />
          </Field>
          <button className="btn-fancy" onClick={h.handleInitiate} disabled={h.submitting}>
            {h.submitting ? "Creating Order…" : "Create Order →"}
          </button>
          <button className="btn-ghost" onClick={h.toStep1} disabled={h.submitting}>← Back</button>
        </div>
      )}

      {h.step === 3 && (
        <div className="fade-in flex flex-col gap-5 text-center">
          <div className="text-4xl mt-2">💳</div>
          <h3 className="text-[18px] font-extrabold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            Complete Your Payment
          </h3>
          <p className="text-[13px] text-muted-foreground leading-relaxed">
            Your order is ready. Click below to complete payment on our secure partner platform.
          </p>
          {h.orderId && (
            <p className="text-[12px] text-muted-foreground">
              Order ID: <strong style={{ color: "var(--foreground)" }}>{h.orderId}</strong>
            </p>
          )}
          {h.payUrl ? (
            <a href={h.payUrl} target="_blank" rel="noopener noreferrer"
              className="btn-fancy inline-flex items-center justify-center gap-2" style={{ textDecoration: "none" }}>
              <ExternalLink size={15} /> Pay Now
            </a>
          ) : (
            <p className="text-[13px] text-muted-foreground">Payment link unavailable. Contact support with your order ID.</p>
          )}
          <p className="text-[12px] text-muted-foreground leading-relaxed px-2">
            Once confirmed, your {h.selectedAsset?.symbol} will be sent to your wallet automatically.
          </p>
          <button className="btn-ghost" onClick={h.reset}>Start New Transaction</button>
        </div>
      )}
    </div>
  );
}

function StepDots({ step }: { step: BuyStep }) {
  return (
    <div className="flex justify-center gap-2 mb-6">
      {([1, 2, 3] as BuyStep[]).map((i) => (
        <span key={i} className="rounded-full transition-all"
          style={{
            height: 8, width: i === step ? 28 : 8,
            background: i <= step ? "var(--primary)" : "color-mix(in oklab, var(--primary) 22%, transparent)",
          }} />
      ))}
    </div>
  );
}

function RateSummary({ rate, fee, receive }: { rate: string; fee: string; receive: string }) {
  return (
    <div className="rounded-xl p-3.5 text-[13px]"
      style={{ background: "color-mix(in oklab, var(--primary) 6%, transparent)", border: "1px solid color-mix(in oklab, var(--primary) 18%, transparent)" }}>
      <Row label="Rate" value={rate} />
      <Row label="Network Fee" value={fee} />
      <Row label="You Receive" value={receive} accent />
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between py-1.5 first:pt-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-bold" style={{ color: accent ? "var(--primary)" : "var(--foreground)", fontFamily: "'Cabinet Grotesk', sans-serif" }}>
        {value}
      </span>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-bold tracking-[0.15em] uppercase text-muted-foreground mb-2">{label}</label>
      {children}
    </div>
  );
}

export function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-xl px-3.5 py-3 text-[13px] mb-4 fade-in"
      style={{ background: "color-mix(in oklab, var(--destructive) 8%, transparent)", border: "1px solid color-mix(in oklab, var(--destructive) 22%, transparent)", color: "var(--destructive)" }}>
      {message}
    </div>
  );
}
