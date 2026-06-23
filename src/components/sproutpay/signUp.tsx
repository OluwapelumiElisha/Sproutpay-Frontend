import { Link } from "react-router-dom";
import { useSignUp } from "@/hooks/useSignUp";
import { Logo } from "./Logo";
import { PasswordInput } from "./PasswordInput";
import { Field } from "./shared";
import { HumanCheck } from "./HumanCheck";

export default function SignupPage() {
  const {
    firstName, setFirstName,
    lastName, setLastName,
    email, setEmail,
    password, setPassword,
    captchaToken, setCaptchaToken,
    captchaReady,
    fieldErrors,
    submitting,
    success,
    handleSubmit,
  } = useSignUp();

  const canSubmit = !submitting && !!captchaToken;

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6" style={{ background: "var(--background)" }}>
        <div className="max-w-sm w-full text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-[22px] font-black mb-2" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            Account created!
          </h2>
          <p className="text-[14px] text-muted-foreground mb-6">Your account is ready. Please log in to continue.</p>
          <Link to="/login" className="btn-fancy block text-center" style={{ textDecoration: "none" }}>
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col-reverse sm:flex-row" style={{ background: "var(--background)" }}>
      {/* Art panel */}
      <div
        className="relative hidden sm:flex flex-1 flex-col overflow-hidden p-12"
        style={{ background: "var(--gradient-primary)", minHeight: 300 }}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <span className="absolute rounded-full" style={{ width: 500, height: 500, top: -200, left: -150, border: "1.5px solid rgba(255,255,255,0.25)" }} />
          <span className="absolute rounded-full" style={{ width: 350, height: 350, top: 50, right: -120, border: "1.5px solid rgba(255,255,255,0.2)" }} />
          <span className="absolute rounded-full" style={{ width: 200, height: 200, bottom: 80, left: 60, border: "1.5px solid rgba(255,255,255,0.2)" }} />
        </div>
        <div className="relative z-10">
          <Logo variant="white" size={44} showName nameSize={22} />
        </div>
        <div className="relative z-10 mt-auto">
          <div className="text-[11px] font-bold tracking-[0.2em] uppercase opacity-70 mb-4" style={{ color: "white" }}>
            Get Started
          </div>
          <h2 className="text-[clamp(36px,5vw,56px)] font-black leading-[1.05] tracking-tight" style={{ color: "white" }}>
            Create your<br />SproutPay<br />account.
          </h2>
        </div>
      </div>

      {/* Signup form */}
      <div className="w-full sm:max-w-[480px] flex flex-col justify-start sm:justify-center px-6 sm:px-10 pt-6 pb-8 sm:py-12 overflow-y-auto">
        <div className="mb-6 sm:mb-10">
          <Logo variant="green" size={42} showName nameSize={22} />
        </div>
        <h1 className="text-[clamp(26px,4vw,34px)] font-black tracking-tight mb-2">Create account</h1>
        <p className="text-muted-foreground text-[15px] mb-6 sm:mb-8">
          Sign up to start buying crypto
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <div className="grid grid-cols-2 gap-3">
            <Field label="First Name" hint={fieldErrors.firstName}>
              <input
                type="text" className="inp" placeholder="Jane"
                value={firstName} onChange={(e) => setFirstName(e.target.value)}
                autoComplete="given-name" maxLength={80}
                style={fieldErrors.firstName ? { borderColor: "var(--destructive)" } : undefined}
              />
            </Field>
            <Field label="Last Name" hint={fieldErrors.lastName}>
              <input
                type="text" className="inp" placeholder="Doe"
                value={lastName} onChange={(e) => setLastName(e.target.value)}
                autoComplete="family-name" maxLength={80}
                style={fieldErrors.lastName ? { borderColor: "var(--destructive)" } : undefined}
              />
            </Field>
          </div>

          <Field label="Email Address" hint={fieldErrors.email}>
            <input
              type="email" className="inp" placeholder="you@sproutpay.net"
              value={email} onChange={(e) => setEmail(e.target.value)}
              autoComplete="email" maxLength={255}
              style={fieldErrors.email ? { borderColor: "var(--destructive)" } : undefined}
            />
          </Field>

          <Field label="Password" hint={fieldErrors.password}>
            <PasswordInput
              placeholder="••••••••"
              value={password} onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password" maxLength={200}
              style={fieldErrors.password ? { borderColor: "var(--destructive)" } : undefined}
            />
          </Field>

          <div className="flex justify-center">
            <HumanCheck
              captchaReady={captchaReady}
              captchaToken={captchaToken}
              onVerify={setCaptchaToken}
            />
          </div>

          <button type="submit" className="btn-fancy mt-2" disabled={!canSubmit}>
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                Creating account…
              </span>
            ) : "Create account"}
          </button>
        </form>

        <p className="text-center mt-6 text-[13px] text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold" style={{ color: "var(--primary)" }}>Log in</Link>
        </p>
        <p className="text-center mt-4 text-xs text-muted-foreground">Secured by SproutPay © 2026</p>
      </div>
    </div>
  );
}
