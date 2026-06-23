import type { ReactNode } from "react";
import type { TxStatus } from "@/services/api";

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <div>
      <label className="block text-[11px] font-bold tracking-[0.15em] uppercase text-muted-foreground mb-2">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-[12px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function ErrorBox({ message }: { message: string }) {
  return (
    <div
      className="rounded-xl px-3.5 py-3 text-[13px] mb-4 fade-in"
      style={{
        background: "color-mix(in oklab, var(--destructive) 8%, transparent)",
        border: "1px solid color-mix(in oklab, var(--destructive) 22%, transparent)",
        color: "var(--destructive)",
      }}
    >
      {message}
    </div>
  );
}

const STATUS_STYLES: Record<TxStatus | "verified" | "in_review" | "not_started" | "rejected", { bg: string; fg: string; label: string; dot: string }> = {
  pending:     { bg: "rgba(234,179,8,0.12)",  fg: "#a16207", dot: "#eab308", label: "Pending" },
  processing:  { bg: "rgba(59,130,246,0.12)", fg: "#1d4ed8", dot: "#3b82f6", label: "Processing" },
  completed:   { bg: "rgba(34,197,94,0.14)",  fg: "#15803d", dot: "#22c55e", label: "Completed" },
  failed:      { bg: "rgba(239,68,68,0.12)",  fg: "#b91c1c", dot: "#ef4444", label: "Failed" },
  verified:    { bg: "rgba(34,197,94,0.14)",  fg: "#15803d", dot: "#22c55e", label: "Verified" },
  in_review:   { bg: "rgba(234,179,8,0.12)",  fg: "#a16207", dot: "#eab308", label: "In Review" },
  not_started: { bg: "rgba(100,116,139,0.14)",fg: "#475569", dot: "#94a3b8", label: "Not Started" },
  rejected:    { bg: "rgba(239,68,68,0.12)",  fg: "#b91c1c", dot: "#ef4444", label: "Rejected" },
};

export function StatusPill({ status, size = "sm" }: { status: keyof typeof STATUS_STYLES; size?: "sm" | "md" }) {
  const s = STATUS_STYLES[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full font-semibold"
      style={{
        background: s.bg,
        color: s.fg,
        fontSize: size === "sm" ? 11 : 12,
        padding: size === "sm" ? "3px 9px" : "5px 12px",
        letterSpacing: 0.2,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: 999, background: s.dot }} />
      {s.label}
    </span>
  );
}

export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="w-full">
      <div className="flex items-center gap-2">
        {steps.map((label, i) => {
          const active = i === current;
          const done = i < current;
          return (
            <div key={label} className="flex items-center gap-2 flex-1 min-w-0">
              <div
                className="flex items-center justify-center rounded-full font-bold transition-all flex-shrink-0"
                style={{
                  width: 28,
                  height: 28,
                  fontSize: 12,
                  background: done
                    ? "var(--primary)"
                    : active
                      ? "color-mix(in oklab, var(--primary) 18%, transparent)"
                      : "var(--surface-2)",
                  color: done ? "white" : active ? "var(--primary)" : "var(--muted-foreground)",
                  border: active ? "1.5px solid var(--primary)" : "1.5px solid transparent",
                }}
              >
                {done ? "✓" : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div
                  className="flex-1 h-[2px] rounded-full"
                  style={{
                    background: done ? "var(--primary)" : "var(--border)",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-2.5">
        {steps.map((label, i) => (
          <span
            key={label}
            className="text-[11px] font-semibold uppercase tracking-wider"
            style={{
              color: i <= current ? "var(--primary)" : "var(--muted-foreground)",
              flex: 1,
              textAlign: i === 0 ? "left" : i === steps.length - 1 ? "right" : "center",
            }}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  accent,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
  icon?: ReactNode;
}) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: accent ? "var(--gradient-primary)" : "var(--card)",
        color: accent ? "white" : "var(--foreground)",
        border: accent ? "none" : "1px solid var(--border)",
        boxShadow: accent ? "var(--shadow-elegant)" : "var(--shadow-soft)",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span
          className="text-[11px] font-bold tracking-[0.15em] uppercase"
          style={{ opacity: accent ? 0.85 : 0.6 }}
        >
          {label}
        </span>
        {icon && (
          <span
            className="flex items-center justify-center rounded-lg"
            style={{
              width: 32,
              height: 32,
              background: accent ? "rgba(255,255,255,0.18)" : "color-mix(in oklab, var(--primary) 10%, transparent)",
              color: accent ? "white" : "var(--primary)",
            }}
          >
            {icon}
          </span>
        )}
      </div>
      <div
        className="text-[26px] font-black leading-none"
        style={{ fontFamily: "'Cabinet Grotesk', sans-serif", letterSpacing: "-0.02em" }}
      >
        {value}
      </div>
      {sub && (
        <div
          className="text-[12px] mt-2"
          style={{ opacity: accent ? 0.85 : 0.6 }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

export function SectionCard({
  title,
  action,
  children,
  padded = true,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  padded?: boolean;
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-soft)",
      }}
    >
      {(title || action) && (
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          {title && (
            <h3
              className="text-[15px] font-extrabold"
              style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}
            >
              {title}
            </h3>
          )}
          {action}
        </div>
      )}
      <div className={padded ? "px-5 pb-5" : ""}>{children}</div>
    </div>
  );
}

export function EmptyState({ icon = "📭", title, body }: { icon?: string; title: string; body?: string }) {
  return (
    <div className="text-center px-6 py-10">
      <div className="text-4xl mb-2">{icon}</div>
      <div className="text-[15px] font-bold mb-1">{title}</div>
      {body && <div className="text-[13px] text-muted-foreground">{body}</div>}
    </div>
  );
}