import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "./Sidebar";
import { TopHeader } from "./TopHeader";

export function AppShell() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/login", { replace: true });
  }, [loading, user, navigate]);

  if (loading || !user) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: "var(--gradient-soft)" }}
      >
        <span className="spinner" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex"
      style={{ background: "var(--gradient-soft)" }}
    >
      {/* Desktop sidebar */}
      <div className="hidden lg:block flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40"
          onClick={() => setMobileOpen(false)}
          style={{ background: "rgba(15,23,42,0.45)" }}
        >
          <div
            className="absolute left-0 top-0 bottom-0 fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <TopHeader
          user={user}
          onMenu={() => setMobileOpen(true)}
          menuIcon={mobileOpen ? <X size={20} /> : <Menu size={20} />}
        />
        <main className="flex-1 px-4 sm:px-6 lg:px-8 pt-3 pb-6 sm:pt-5 sm:pb-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}