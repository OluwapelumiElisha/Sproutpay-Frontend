import { useEffect, useRef } from "react";

declare global {
  interface Window {
    hcaptcha?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          theme?: "light" | "dark";
          size?: "normal" | "compact" | "invisible";
        },
      ) => number;
      reset: (widgetId: number) => void;
      getResponse: (widgetId: number) => string;
    };
  }
}

let scriptPromise: Promise<void> | null = null;

function loadHCaptchaScript(): Promise<void> {
  if (scriptPromise) return scriptPromise;
  if (window.hcaptcha) return Promise.resolve();

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById("hcaptcha-script");
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", reject);
      return;
    }
    const script = document.createElement("script");
    script.id = "hcaptcha-script";
    script.src = "https://js.hcaptcha.com/1/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load hCaptcha"));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

interface HCaptchaProps {
  siteKey: string;
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
  widgetRef?: React.MutableRefObject<number | null>;
}

export function HCaptcha({ siteKey, onVerify, onExpire, onError, widgetRef }: HCaptchaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const internalWidgetRef = useRef<number | null>(null);
  const resolvedRef = widgetRef ?? internalWidgetRef;

  useEffect(() => {
    if (!siteKey || !containerRef.current) return;
    let cancelled = false;

    loadHCaptchaScript()
      .then(() => {
        if (cancelled || !containerRef.current || resolvedRef.current !== null) return;
        resolvedRef.current = window.hcaptcha!.render(containerRef.current, {
          sitekey: siteKey,
          callback: onVerify,
          "expired-callback": onExpire,
          "error-callback": onError,
          theme: "light",
          size: "normal",
        });
      })
      .catch(() => {
        if (!cancelled) onError?.();
      });

    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteKey]);

  return <div ref={containerRef} className="flex justify-center" />;
}
