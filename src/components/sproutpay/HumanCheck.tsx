import { Check } from "lucide-react";

interface HumanCheckProps {
  captchaReady: boolean;
  captchaToken: boolean;
  onVerify: (verified: boolean) => void;
}

export function HumanCheck({
  captchaReady,
  captchaToken,
  onVerify,
}: HumanCheckProps) {
  const verified = captchaToken;

  return (
    <label
      className="flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors text-left w-full"
      style={{
        borderColor: verified ? "var(--primary)" : "var(--border)",
        background: verified ? "color-mix(in oklab, var(--primary) 8%, transparent)" : "var(--surface-2, var(--card))",
        cursor: captchaReady ? "pointer" : "wait",
        opacity: captchaReady ? 1 : 0.75,
      }}
    >
      <input
        type="checkbox"
        checked={verified}
        disabled={!captchaReady}
        onChange={(event) => onVerify(event.target.checked)}
        className="h-4 w-4 rounded-sm border text-primary focus:ring-primary"
      />
      <span className="flex-1 text-[14px] font-semibold" style={{ color: verified ? "var(--primary)" : "var(--foreground)" }}>
        {verified ? "Verified — I'm not a robot" : "I'm not a robot"}
      </span>
      {verified && <Check size={16} style={{ color: "var(--primary)" }} />}
    </label>
  );
}
