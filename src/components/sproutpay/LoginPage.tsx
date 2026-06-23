import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLogin } from "@/hooks/useLogin";
import { Logo } from "./Logo";
import { PasswordInput } from "./PasswordInput";
import { Field } from "./shared";
import { HumanCheck } from "./HumanCheck";

export function LoginPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    email, setEmail,
    password, setPassword,
    captchaToken, setCaptchaToken,
    captchaReady,
    submitting,
    handleSubmit,
  } = useLogin();

  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  const canSubmit = !submitting && !!captchaToken;

  return (
    <div className="flex min-h-screen flex-col-reverse sm:flex-row" style={{ background: "var(--background)" }}>
      {/* Art panel */}
      <div
        className="relative hidden sm:flex flex-1 flex-col overflow-hidden p-12"
        style={{ background: "var(--gradient-primary)", minHeight: 300 }}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[
            { width: 500, height: 500, top: -200, left: -150 },
            { width: 350, height: 350, top: 50, right: -120 },
            { width: 200, height: 200, bottom: 80, left: 60 },
          ].map((style, i) => (
            <span key={i} className="absolute rounded-full" style={{ ...style, border: "1.5px solid rgba(255,255,255,0.22)" }} />
          ))}
        </div>
        <div className="relative z-10">
          <Logo variant="white" size={44} showName nameSize={22} />
        </div>
        <div className="relative z-10 mt-auto">
          <div
            className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold mb-6"
            style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: "white", backdropFilter: "blur(4px)" }}
          >
            <span className="live-dot inline-block w-1.5 h-1.5 rounded-full" style={{ background: "white" }} />
            Live Rates · Instant Settlement
          </div>
          <div className="text-[11px] font-bold tracking-[0.2em] uppercase opacity-70 mb-4" style={{ color: "white" }}>
            Crypto Ramp Platform
          </div>
          <h2 className="text-[clamp(36px,5vw,56px)] font-black leading-[1.05] tracking-tight" style={{ color: "white" }}>
            Buy crypto.<br />Move money<br />faster.
          </h2>
        </div>
      </div>

      {/* Form */}
      <div className="w-full sm:max-w-[480px] flex flex-col justify-start sm:justify-center px-6 sm:px-10 pt-6 pb-8 sm:py-12">
        <div className="mb-6 sm:mb-10">
          <Logo variant="green" size={42} showName nameSize={22} />
        </div>
        <h1 className="text-[clamp(26px,4vw,34px)] font-black tracking-tight mb-1">Welcome back</h1>
        <p className="text-muted-foreground text-[14px] mb-6 sm:mb-8">
          Don&apos;t have an account?{" "}
          <Link to="/signup" className="font-bold" style={{ color: "var(--primary)" }}>Sign up</Link>
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <Field label="Email Address">
            <input
              type="email" className="inp" placeholder="you@example.com"
              value={email} onChange={(e) => setEmail(e.target.value)}
              autoComplete="email" maxLength={255}
            />
          </Field>
          <Field label="Password">
            <PasswordInput
              placeholder="••••••••"
              value={password} onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password" maxLength={200}
            />
          </Field>

          <div className="flex justify-center">
            <HumanCheck
              captchaReady={captchaReady}
              captchaToken={captchaToken}
              onVerify={setCaptchaToken}
            />
          </div>

          <button type="submit" className="btn-fancy" disabled={!canSubmit}>
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                Signing in…
              </span>
            ) : "Sign In"}
          </button>
        </form>

        <p className="text-center mt-8 text-xs text-muted-foreground">Secured by SproutPay © 2026</p>
      </div>
    </div>
  );
}
