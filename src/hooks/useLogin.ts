import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { toast } from "sonner";
import { useAuth } from "./useAuth";
import { getClientConfig, prefetchOnrampConfig } from "@/services/api";

const schema = z.object({
  email: z.string().trim().min(1, "Email is required.").email("Enter a valid email.").max(255),
  password: z.string().min(1, "Password is required.").max(200),
});

export function useLogin() {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState(false);
  const [captchaReady, setCaptchaReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getClientConfig()
      .then(() => setCaptchaReady(true))
      .catch(() => setCaptchaReady(true));

    // Warm the on-ramp config cache while the user signs in, so Check Rate
    // and Buy Crypto are ready instantly afterwards.
    void prefetchOnrampConfig();
  }, []);

  function resetCaptcha() {
    setCaptchaToken(false);
  }

  async function handleSubmit(e?: { preventDefault(): void }) {
    e?.preventDefault();

    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid input.");
      return;
    }

    if (!captchaToken) {
      toast.error("Please confirm that you are not a robot.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await signIn(parsed.data.email, parsed.data.password, captchaToken);
      if (!result.ok) {
        toast.error(result.message ?? "Invalid email or password.");
        resetCaptcha();
        return;
      }
      toast.success("Welcome back!");
      navigate("/", { replace: true });
    } catch {
      toast.error("Network error. Please try again.");
      resetCaptcha();
    } finally {
      setSubmitting(false);
    }
  }

  return {
    email, setEmail,
    password, setPassword,
    captchaToken, setCaptchaToken,
    captchaReady,
    submitting,
    handleSubmit,
  };
}
