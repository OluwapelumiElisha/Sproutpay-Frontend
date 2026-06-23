import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDownToLine,
  Calculator,
  ShieldCheck,
  Activity,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  listTransactions,
  getKycStatus,
  type KycRecord,
  type Transaction,
} from "@/services/api";
import { StatCard, SectionCard, StatusPill, EmptyState } from "./shared";

export function DashboardHome() {
  const { user } = useAuth();
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [totalTxs, setTotalTxs] = useState<number | null>(null);
  const [completionRate, setCompletionRate] = useState<number | null>(null);
  const [kyc, setKyc] = useState<KycRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    Promise.all([
      listTransactions({ limit: 4, page: 1 }),
      listTransactions({ limit: 50, page: 1 }),
      getKycStatus(),
    ]).then(([recent, all, kycRecord]) => {
      if (!mounted) return;

      setTxs(recent.transactions);

      const allTxs = all.transactions;
      const total = all.meta?.total ?? allTxs.length;
      const completed = allTxs.filter((t) => t.status === "completed").length;
      setTotalTxs(total);
      setCompletionRate(total === 0 ? 0 : Math.round((completed / allTxs.length) * 100));

      setKyc(kycRecord);
      setLoading(false);
    }).catch(() => {
      if (mounted) setLoading(false);
    });

    return () => { mounted = false; };
  }, []);

  const firstName = user?.display_name?.split(" ")[0] ?? user?.firstName ?? "there";

  return (
    <div className="max-w-[1180px] mx-auto flex flex-col gap-6">
      {/* Greeting */}
      <div>
        <h1
          className="text-[26px] sm:text-[30px] font-black tracking-tight"
          style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}
        >
          Welcome back, {firstName} 👋
        </h1>
        <p className="text-[14px] text-muted-foreground mt-1">
          Here&apos;s a quick overview of your ramp activity.
        </p>
      </div>

      {/* Stat card */}
      <div className="grid grid-cols-1 sm:max-w-sm gap-4">
        <StatCard
          accent
          label="Transactions"
          value={loading ? "—" : `${totalTxs ?? 0}`}
          sub={
            loading
              ? "Loading…"
              : completionRate !== null
                ? `${completionRate}% completion rate`
                : "—"
          }
          icon={<Activity size={16} />}
        />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickAction
          to="/rate"
          icon={<Calculator size={22} />}
          title="Check Rate"
          body="See the current NGN → USDT rate"
        />
        <QuickAction
          to="/buy"
          icon={<ArrowDownToLine size={22} />}
          title="Buy Crypto"
          body="On-ramp to USDT in minutes"
        />
        <QuickAction
          to="/kyc"
          icon={<ShieldCheck size={22} />}
          title="Verify Identity"
          body="Unlock higher limits with KYC"
        />
      </div>

      {/* KYC + Recent transactions row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <SectionCard
            title="Recent Transactions"
            action={
              <Link
                to="/transactions"
                className="text-[12px] font-bold flex items-center gap-1"
                style={{ color: "var(--primary)" }}
              >
                View all <ArrowRight size={13} />
              </Link>
            }
            padded={false}
          >
            {loading ? (
              <div className="flex justify-center py-10"><span className="spinner" /></div>
            ) : txs.length === 0 ? (
              <EmptyState title="No transactions yet" body="Your activity will appear here." />
            ) : (
              <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                {txs.map((tx) => (
                  <TxRow key={tx.id} tx={tx} />
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        <KycCard kyc={kyc} loading={loading} />
      </div>
    </div>
  );
}

function QuickAction({ to, icon, title, body }: { to: string; icon: React.ReactNode; title: string; body: string }) {
  return (
    <Link
      to={to}
      className="group rounded-2xl p-5 flex items-start gap-4 transition-all"
      style={{ background: "var(--card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-soft)" }}
    >
      <span
        className="flex items-center justify-center rounded-xl shrink-0 transition-transform group-hover:scale-105"
        style={{
          width: 44, height: 44,
          background: "color-mix(in oklab, var(--primary) 12%, transparent)",
          color: "var(--primary)",
        }}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <div className="text-[15px] font-extrabold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            {title}
          </div>
          <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" style={{ color: "var(--primary)" }} />
        </div>
        <div className="text-[13px] text-muted-foreground mt-0.5">{body}</div>
      </div>
    </Link>
  );
}

function TxRow({ tx }: { tx: Transaction }) {
  return (
    <Link
      to="/transactions"
      className="flex items-center gap-4 px-5 py-4 hover:bg-(--surface-2) transition-colors"
    >
      <span
        className="flex items-center justify-center rounded-xl shrink-0"
        style={{
          width: 38, height: 38,
          background: "color-mix(in oklab, var(--primary) 14%, transparent)",
          color: "var(--primary)",
        }}
      >
        <ArrowDownToLine size={16} />
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-bold capitalize">{tx.kind} {tx.asset}</div>
        <div className="text-[12px] text-muted-foreground truncate">
          {tx.network} · {tx.created_at ? new Date(tx.created_at).toLocaleDateString() : "—"}
        </div>
      </div>
      <div className="text-right">
        <div className="text-[14px] font-extrabold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
          {tx.from_amount > 0 ? `${tx.from_amount.toLocaleString()} ${tx.sourceCurrency ?? ""}` : "—"}
        </div>
        <div className="mt-1">
          <StatusPill status={tx.status} />
        </div>
      </div>
    </Link>
  );
}

function KycCard({ kyc, loading }: { kyc: KycRecord | null; loading: boolean }) {
  const status = kyc?.status ?? "not_started";
  const stepPct = status === "verified" ? 100 : status === "in_review" ? 66 : 0;

  return (
    <SectionCard title="Verification">
      <div className="flex items-start gap-3 mb-4">
        <span
          className="flex items-center justify-center rounded-xl shrink-0"
          style={{ width: 44, height: 44, background: "color-mix(in oklab, var(--primary) 12%, transparent)", color: "var(--primary)" }}
        >
          <ShieldCheck size={22} />
        </span>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[14px] font-extrabold">KYC Status</span>
            {!loading && <StatusPill status={status} />}
          </div>
          <p className="text-[12px] text-muted-foreground leading-relaxed">
            {loading
              ? "Loading…"
              : status === "verified"
                ? "Your identity is verified. Enjoy higher limits."
                : status === "in_review"
                  ? "Documents submitted. Review completes within 24h."
                  : status === "rejected"
                    ? "Verification was rejected. Please re-submit."
                    : "Complete verification to unlock full features."}
          </p>
        </div>
      </div>

      <div className="h-2 rounded-full overflow-hidden mb-2" style={{ background: "var(--surface-2)" }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${stepPct}%`, background: "var(--gradient-primary)" }}
        />
      </div>
      <div className="flex justify-between text-[11px] text-muted-foreground mb-4">
        <span>{status === "verified" ? "2" : status === "in_review" ? "1" : "0"} / 2 steps</span>
        <span>{stepPct}%</span>
      </div>

      <Link to="/kyc" className="btn-fancy text-center block" style={{ textDecoration: "none" }}>
        {status === "verified" ? "View Details" : status === "in_review" ? "Track Status" : "Start Verification"}
      </Link>
    </SectionCard>
  );
}
