import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface PasswordInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

export function PasswordInput(props: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        {...props}
        type={visible ? "text" : "password"}
        className={`inp pr-12 ${props.className || ""}`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors"
        aria-label={visible ? "Hide password" : "Show password"}
        tabIndex={-1}
      >
        {visible ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </div>
  );
}