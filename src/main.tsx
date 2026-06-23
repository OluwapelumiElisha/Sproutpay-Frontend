import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "@/hooks/useAuth";
import { LoginPage } from "@/components/sproutpay/LoginPage";
import  SignUpPage  from "@/components/sproutpay/signUp";
import { AppShell } from "@/components/sproutpay/AppShell";
import { DashboardHome } from "@/components/sproutpay/DashboardHome";
import { CheckRate } from "@/components/sproutpay/CheckRate";
import { BuyCrypto } from "@/components/sproutpay/BuyCrypto";
import { TransactionsPage } from "@/components/sproutpay/Transactions";
import { KycFlow } from "@/components/sproutpay/KycFlow";
import { Settings } from "@/components/sproutpay/Settings";
import "./styles.css";

function BuyCryptoPage() {
  return (
    <div className="max-w-[520px] mx-auto">
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "var(--card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-soft)" }}
      >
        <BuyCrypto />
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <a
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Go home
        </a>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route element={<AppShell />}>
            <Route path="/" element={<DashboardHome />} />
            <Route path="/rate" element={<CheckRate />} />
            <Route path="/buy" element={<BuyCryptoPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/kyc" element={<KycFlow />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster position="bottom-right" richColors closeButton />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
