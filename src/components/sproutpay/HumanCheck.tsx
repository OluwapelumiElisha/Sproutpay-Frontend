import ReCAPTCHA from "react-google-recaptcha";

interface HumanCheckProps {
  captchaReady: boolean;
  captchaToken: string;
  onVerify: (token: string) => void;
}

export function HumanCheck({
  captchaToken,
  onVerify,
}: HumanCheckProps) {
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI";

  return (
    <div className="flex w-full justify-center my-2">
      <ReCAPTCHA
        sitekey={siteKey}
        onChange={(token) => onVerify(token || "")}
        onExpired={() => onVerify("")}
        onErrored={() => onVerify("")}
      />
    </div>
  );
}
