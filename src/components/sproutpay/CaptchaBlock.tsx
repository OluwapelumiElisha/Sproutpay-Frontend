import { Lock, ShieldCheck } from "lucide-react";
import { HCaptcha } from "./HCaptcha";

interface CaptchaBlockProps {
  /** True once the client-config fetch settled (even if no key returned) */
  captchaReady: boolean;
  /** hCaptcha site key — null means no captcha is required */
  siteKey: string | null;
  captchaToken: string | null;
  onVerify: (token: string) => void;
  onExpire: () => void;
  widgetRef: React.MutableRefObject<number | null>;
  /** Button label while idle */
  label: string;
  /** Button label while submitting */
  loadingLabel: string;
  submitting: boolean;
}

export function CaptchaBlock({
  captchaReady,
  siteKey,
  captchaToken,
  onVerify,
  onExpire,
  widgetRef,
  label,
  loadingLabel,
  submitting,
}: CaptchaBlockProps) {
  const captchaRequired = captchaReady && !!siteKey;
  const canSubmit = !submitting && (!captchaRequired || !!captchaToken);

  return (
    <div className="flex flex-col gap-3 mt-2">
      {/* Captcha section — only when a site key exists */}
      {captchaRequired && (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: "1px solid var(--border)" }}
        >
          {/* Header bar */}
          <div
            className="flex items-center gap-2 px-4 py-2.5"
            style={{
              background: "var(--surface-2)",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <ShieldCheck size={13} style={{ color: "var(--primary)" }} />
            <span
              className="text-[11px] font-bold tracking-[0.15em] uppercase"
              style={{ color: "var(--muted-foreground)" }}
            >
              Security Verification
            </span>
            {captchaToken && (
              <span
                className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{
                  background: "color-mix(in oklab, var(--primary) 12%, transparent)",
                  color: "var(--primary)",
                }}
              >
                ✓ Verified
              </span>
            )}
          </div>

          {/* Widget area */}
          <div
            className="flex items-center justify-center py-4 px-4"
            style={{ background: "var(--card)", minHeight: 86 }}
          >
            {!captchaReady ? (
              <div className="skeleton rounded-xl" style={{ width: 303, height: 65 }} />
            ) : (
              <HCaptcha
                siteKey={siteKey}
                onVerify={onVerify}
                onExpire={onExpire}
                widgetRef={widgetRef}
              />
            )}
          </div>

          {/* Footer note */}
          <div
            className="px-4 py-2 text-[10px] text-center"
            style={{
              background: "var(--surface-2)",
              borderTop: "1px solid var(--border)",
              color: "var(--muted-foreground)",
            }}
          >
            Protected by hCaptcha —{" "}
            <a
              href="https://hcaptcha.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--primary)", textDecoration: "none" }}
            >
              Privacy
            </a>
            {" · "}
            <a
              href="https://hcaptcha.com/terms"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--primary)", textDecoration: "none" }}
            >
              Terms
            </a>
          </div>
        </div>
      )}

      {/* Submit button */}
      <button
        type="submit"
        className="btn-fancy"
        disabled={!canSubmit}
        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
      >
        {submitting ? (
          <>
            <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
            {loadingLabel}
          </>
        ) : (
          <>
            {captchaRequired && !captchaToken ? (
              <Lock size={14} style={{ opacity: 0.7 }} />
            ) : (
              <ShieldCheck size={14} />
            )}
            {label}
          </>
        )}
      </button>

      {/* Locked hint */}
      {captchaRequired && !captchaToken && !submitting && (
        <p className="text-center text-[11px]" style={{ color: "var(--muted-foreground)" }}>
          Complete the security check above to continue
        </p>
      )}
    </div>
  );
}
