import logoGreen from "@/assets/sproutpay-logo-green.png";
import logoWhite from "@/assets/sproutpay-logo-white.png";

interface LogoProps {
  size?: number;
  showName?: boolean;
  nameSize?: number;
  variant?: "green" | "white";
}

export function Logo({ size = 38, showName = false, nameSize = 20, variant = "green" }: LogoProps) {
  const src = variant === "white" ? logoWhite : logoGreen;
  const height = showName ? Math.max(size, nameSize * 1.6) : size;
  return (
    <img
      src={src}
      alt="SproutPay"
      style={{ height, width: "auto", objectFit: "contain" }}
    />
  );
}