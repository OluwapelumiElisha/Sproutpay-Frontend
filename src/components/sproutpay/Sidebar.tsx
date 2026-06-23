import { NavLink } from "react-router-dom";
import { Logo } from "./Logo";
import {
  LayoutDashboard,
  Calculator,
  ArrowDownToLine,
  ListOrdered,
  ShieldCheck,
  Settings as SettingsIcon,
} from "lucide-react";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/rate", label: "Check Rate", icon: Calculator },
  { to: "/buy", label: "Initiate Transaction", icon: ArrowDownToLine },
  { to: "/transactions", label: "Transactions", icon: ListOrdered },
  { to: "/kyc", label: "Verification", icon: ShieldCheck },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <aside
      className="h-full flex flex-col"
      style={{
        width: 248,
        background: "var(--card)",
        borderRight: "1px solid var(--border)",
      }}
    >
      <div className="px-5 py-5">
        <Logo variant="green" size={34} showName nameSize={20} />
      </div>

      <nav className="flex-1 px-3 py-2 flex flex-col gap-1">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-semibold transition-all ${
                isActive ? "sidebar-active" : "sidebar-link"
              }`
            }
          >
            <item.icon size={18} strokeWidth={2.2} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="px-5 py-4 text-[11px] text-muted-foreground">
        SproutPay © 2026
      </div>
    </aside>
  );
}