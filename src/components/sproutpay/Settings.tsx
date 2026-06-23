import { useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { changePassword } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { PasswordInput } from "./PasswordInput";
import { Field } from "./shared";

/** Pull the most human-readable message out of an API error response. */
function extractErrorMessage(res: { message?: string; errors?: { field: string; message: string }[] }): string {
  if (res.errors && res.errors.length > 0) return res.errors[0].message;
  return res.message ?? "Something went wrong. Please try again.";
}

export function Settings() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function onLogout() {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
    navigate("/login", { replace: true });
  }

  async function handleSubmit() {
    if (!current || !next || !confirm) {
      toast.error("All fields are required.");
      return;
    }
    if (next !== confirm) {
      toast.error("New passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await changePassword({
        currentPassword: current,
        newPassword: next,
        confirmNewPassword: confirm,
      });

      if (!res.success) {
        toast.error(extractErrorMessage(res as { message?: string; errors?: { field: string; message: string }[] }));
        return;
      }

      setCurrent("");
      setNext("");
      setConfirm("");
      setSuccess(true);
      toast.success("Password updated successfully!");
      // Server invalidates session — redirect to login after a brief moment
      setTimeout(async () => {
        await signOut();
        navigate("/login", { replace: true });
      }, 2000);
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-[640px] mx-auto fade-in flex flex-col gap-5">
      <h3
        className="text-[18px] font-extrabold"
        style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}
      >
        Account
      </h3>

      <div
        className="rounded-xl flex justify-between items-center px-4 py-3.5"
        style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
      >
        <span className="text-[13px] text-muted-foreground">Signed in as</span>
        <span className="text-[14px] font-bold truncate ml-3">
          {user?.email || user?.userEmail || "—"}
        </span>
      </div>

      <div
        className="rounded-xl p-5"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <h4
          className="text-[15px] font-extrabold mb-1"
          style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}
        >
          Change Password
        </h4>
        <p className="text-[12px] text-muted-foreground mb-4">
          Must be at least 8 characters with uppercase, lowercase, number and special character.
        </p>

        {success && (
          <div
            className="rounded-xl px-3.5 py-3 text-[13px] font-medium mb-4 fade-in"
            style={{
              background: "color-mix(in oklab, var(--primary) 10%, transparent)",
              border: "1px solid color-mix(in oklab, var(--primary) 22%, transparent)",
              color: "var(--primary)",
            }}
          >
            Password changed. Redirecting you to login…
          </div>
        )}

        <div className="flex flex-col gap-4 mb-5">
          <Field label="Current Password">
            <PasswordInput
              placeholder="Your current password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              autoComplete="current-password"
            />
          </Field>
          <Field label="New Password">
            <PasswordInput
              placeholder="Min 8 chars · Aa1! required"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              autoComplete="new-password"
            />
          </Field>
          <Field label="Confirm New Password">
            <PasswordInput
              placeholder="Repeat new password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
            />
          </Field>
        </div>

        <button className="btn-fancy" onClick={handleSubmit} disabled={loading || success}>
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
              Updating…
            </span>
          ) : "Update Password"}
        </button>
      </div>

      <button
        type="button"
        onClick={onLogout}
        disabled={signingOut}
        className="w-full rounded-xl py-3.5 text-[14px] font-bold transition-colors"
        style={{
          background: "transparent",
          border: "1.5px solid color-mix(in oklab, var(--destructive) 35%, transparent)",
          color: "var(--destructive)",
          fontFamily: "'Cabinet Grotesk', sans-serif",
          opacity: signingOut ? 0.6 : 1,
        }}
      >
        {signingOut ? "Signing out…" : "Sign Out"}
      </button>
    </div>
  );
}
