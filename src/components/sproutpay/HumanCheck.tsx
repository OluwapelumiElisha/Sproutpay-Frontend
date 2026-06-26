import { Turnstile } from "@marsidev/react-turnstile";

interface HumanCheckProps {
  siteKey?: string | null;
  captchaReady: boolean;
  captchaToken: string;
  onVerify: (token: string) => void;
}

export function HumanCheck({
  siteKey,
  captchaToken,
  onVerify,
}: HumanCheckProps) {
  // Use the provided siteKey from config, or a fallback (1x00000000000000000000AA is the Turnstile test key that always passes)
  const actualSiteKey = siteKey || import.meta.env.VITE_TURNSTILE_SITE_KEY 

  return (
    <div className="flex w-full justify-center my-2">
      <Turnstile
        siteKey={actualSiteKey}
        onSuccess={(token) => onVerify(token || "")}
        onExpire={() => onVerify("")}
        onError={() => onVerify("")}
      />
    </div>
  );
}

