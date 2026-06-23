import { type ReactNode } from "react";
import type { AuthUser } from "@/services/api";

function initialsOf(user: AuthUser | null): string {
  if (!user?.display_name) return "U";
  return (
    user.display_name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U"
  );
}

interface TopHeaderProps {
  user: AuthUser | null;
  onMenu?: () => void;
  menuIcon?: ReactNode;
}

export function TopHeader({ user, onMenu, menuIcon }: TopHeaderProps) {
  const initials = initialsOf(user);
  return (
    <header
        className="w-full flex items-center justify-between px-4 sm:px-8 py-4"
        style={{
          background: "var(--card)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="flex items-center gap-3">
          {onMenu && (
            <button
              type="button"
              onClick={onMenu}
              className="lg:hidden flex items-center justify-center rounded-lg"
              style={{
                width: 36, height: 36,
                background: "var(--surface-2)",
                color: "var(--foreground)",
                border: "1px solid var(--border)",
              }}
              aria-label="Open menu"
            >
              {menuIcon}
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div
            className="flex items-center gap-2 rounded-full pl-1 pr-3 sm:pr-4 py-1"
            style={{
              background: "var(--primary)",
              color: "var(--primary-foreground)",
            }}
          >
            <div
              className="flex items-center justify-center rounded-full font-extrabold text-xs"
              style={{
                width: 30,
                height: 30,
                background: "color-mix(in oklab, white 25%, var(--primary))",
                color: "white",
                fontFamily: "'Cabinet Grotesk', sans-serif",
              }}
            >
              {initials}
            </div>
            <span className="text-[13px] font-semibold hidden sm:inline">
              {user?.account_email || user?.email || "User"}
            </span>
          </div>
        </div>
      </header>
  );
}
