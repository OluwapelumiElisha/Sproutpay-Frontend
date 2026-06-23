import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { toast } from "sonner";
import { useAuth } from "./useAuth";
import { getClientConfig, prefetchOnrampConfig, register } from "@/services/api";

const schema = z.object({
  firstName: z.string().trim().min(1, "First name is required.").max(100),
  lastName: z.string().trim().min(1, "Last name is required.").max(100),
  email: z.string().trim().min(1, "Email is required.").email("Enter a valid email.").max(255),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(200)
    .regex(/[A-Z]/, "Must include an uppercase letter.")
    .regex(/[0-9]/, "Must include a number.")
    .regex(/[^A-Za-z0-9]/, "Must include a special character."),
});

export function useSignUp() {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState(false);

  const [captchaReady, setCaptchaReady] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    getClientConfig()
      .then(() => setCaptchaReady(true))
      .catch(() => setCaptchaReady(true));

    // Warm the on-ramp config cache while the user signs up, so Check Rate
    // and Buy Crypto are ready instantly afterwards.
    void prefetchOnrampConfig();
  }, []);

  function resetCaptcha() {
    setCaptchaToken(false);
  }

  async function handleSubmit(e?: { preventDefault(): void }) {
    e?.preventDefault();
    setFieldErrors({});

    const parsed = schema.safeParse({ firstName, lastName, email, password });
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as string;
        if (!errs[key]) errs[key] = issue.message;
      }
      setFieldErrors(errs);
      // Also surface as toast so the user sees it immediately
      toast.error(parsed.error.issues[0]?.message ?? "Please fix the errors above.");
      return;
    }

    if (!captchaToken) {
      toast.error("Please confirm that you are not a robot.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await register({
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        userEmail: parsed.data.email,
        password: parsed.data.password,
        captchaToken,
      });

      if (!res.success) {
        // Server field errors → show inline AND toast the first one
        if ("errors" in res && Array.isArray(res.errors) && res.errors.length > 0) {
          const errs: Record<string, string> = {};
          for (const err of res.errors) errs[err.field] = err.message;
          setFieldErrors(errs);
          toast.error(res.errors[0].message);
        } else {
          toast.error(res.message ?? "Registration failed. Try again.");
        }
        resetCaptcha();
        return;
      }

      toast.success("Account created! Signing you in…");
      const loginRes = await signIn(parsed.data.email, parsed.data.password, captchaToken);
      if (loginRes.ok) {
        navigate("/", { replace: true });
      } else {
        setSuccess(true);
      }
    } catch {
      toast.error("Network error. Please try again.");
      resetCaptcha();
    } finally {
      setSubmitting(false);
    }
  }

  return {
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
  };
}
