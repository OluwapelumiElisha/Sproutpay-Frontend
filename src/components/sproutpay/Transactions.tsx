import { ArrowDownToLine, ChevronDown, Search } from "lucide-react";
import { useTransactions, type TxFilter } from "@/hooks/useTransactions";
import { type Transaction } from "@/services/api";
import { StatusPill, EmptyState } from "./shared";

const FILTERS: { id: TxFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "processing", label: "Processing" },
  { id: "completed", label: "Completed" },
  { id: "failed", label: "Failed" },
];

export function TransactionsPage() {
  const { txs, filtered, filter, setFilter, query, setQuery, openId, toggleOpen, error } = useTransactions();

  return (
    <div className="max-w-[1180px] mx-auto flex flex-col gap-5">
      <div>
        <h1 className="text-[26px] sm:text-[30px] font-black tracking-tight" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
          Transactions
        </h1>
        <p className="text-[14px] text-muted-foreground mt-1">A complete record of every transaction you&apos;ve made.</p>
      </div>

      {/* Filters */}
      <div className="rounded-2xl p-3 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="flex flex-wrap gap-2 flex-1">
          {FILTERS.map((f) => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className="text-[12px] font-bold px-3 py-1.5 rounded-full transition-all"
              style={{
                background: filter === f.id ? "var(--primary)" : "var(--surface-2)",
                color: filter === f.id ? "white" : "var(--muted-foreground)",
              }}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 rounded-xl px-3 py-2 sm:w-[260px]"
          style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
          <Search size={14} className="text-muted-foreground" />
          <input value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search reference, asset…"
            className="bg-transparent outline-none text-[13px] w-full" />
        </div>
      </div>

      {/* List */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: "var(--card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-soft)" }}>
        {!txs ? (
          <div className="p-10 flex justify-center"><span className="spinner" /></div>
        ) : error ? (
          <EmptyState icon="⚠️" title="Error loading transactions" body={error} />
        ) : filtered.length === 0 ? (
          <EmptyState title="No transactions found" body="Try changing your filters or search term." />
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {filtered.map((tx) => (
              <TxRow key={tx.id} tx={tx} open={openId === tx.id} onToggle={() => toggleOpen(tx.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TxRow({ tx, open, onToggle }: { tx: Transaction; open: boolean; onToggle: () => void }) {
  const displayRef = tx.reference || tx.id;
  return (
    <div>
      <button onClick={onToggle}
        className="w-full flex items-center gap-4 px-5 py-4 text-left transition-colors"
        style={{ background: open ? "var(--surface)" : undefined }}
        onMouseEnter={(e) => { if (!open) (e.currentTarget as HTMLButtonElement).style.background = "var(--surface-2)"; }}
        onMouseLeave={(e) => { if (!open) (e.currentTarget as HTMLButtonElement).style.background = ""; }}>
        <span className="flex items-center justify-center rounded-xl shrink-0"
          style={{ width: 40, height: 40, background: "color-mix(in oklab, var(--primary) 14%, transparent)", color: "var(--primary)" }}>
          <ArrowDownToLine size={16} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-bold capitalize">{tx.kind} {tx.asset}</div>
          <div className="text-[12px] text-muted-foreground truncate">
            {displayRef} · {tx.created_at ? new Date(tx.created_at).toLocaleString() : "—"}
          </div>
        </div>
        <div className="hidden sm:block text-right">
          <div className="text-[14px] font-extrabold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            {tx.from_amount > 0 ? `${tx.from_amount.toLocaleString()} ${tx.sourceCurrency ?? ""}` : "—"}
          </div>
          <div className="text-[12px] text-muted-foreground">
            {tx.to_amount > 0 ? `${tx.to_amount.toFixed(4)} ${tx.asset}` : ""}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <StatusPill status={tx.status} />
          <ChevronDown size={14} className="text-muted-foreground transition-transform"
            style={{ transform: open ? "rotate(180deg)" : "none" }} />
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 pt-1 grid grid-cols-2 sm:grid-cols-4 gap-4 fade-in"
          style={{ background: "var(--surface)" }}>
          <Detail label="Network" value={tx.network || "—"} />
          <Detail label="Rate" value={tx.rate > 0 ? tx.rate.toLocaleString() : "—"} />
          <Detail label="Paid" value={tx.from_amount > 0 ? `${tx.from_amount.toLocaleString()} ${tx.sourceCurrency ?? ""}` : "—"} />
          <Detail label={`Received (${tx.asset})`} value={tx.to_amount > 0 ? tx.to_amount.toFixed(4) : "—"} />
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.15em] font-bold text-muted-foreground mb-1">{label}</div>
      <div className="text-[13px] font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{value}</div>
    </div>
  );
}
