import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  buildAuthUser,
  loginApi,
  logoutApi,
  prefetchOnrampConfig,
  tokenStore,
  userStore,
  type AuthUser,
  type LoginResult,
} from "@/services/api";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  signIn: (
    email: string,
    password: string,
    captchaToken?: string,
  ) => Promise<{ ok: boolean; message?: string }>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
  setUser: (u: AuthUser | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function extractTokensAndUser(data: LoginResult): {
  accessToken: string;
  refreshToken: string;
  user: AuthUser | null;
} | null {
  // Shape A: { tokens: { accessToken, refreshToken }, user: {...} }
  if (data.tokens?.accessToken && data.tokens?.refreshToken) {
    return {
      accessToken: data.tokens.accessToken,
      refreshToken: data.tokens.refreshToken,
      user: data.user ? buildAuthUser(data.user) : null,
    };
  }
  // Shape B: { accessToken, refreshToken, user: {...} }
  if (data.accessToken && data.refreshToken) {
    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      user: data.user ? buildAuthUser(data.user) : null,
    };
  }
  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Auto-logout when the refresh token expires or is rejected
  useEffect(() => {
    function handleSessionExpired() {
      setUser(null);
      toast.error("Your session has expired. Please log in again.");
      navigate("/login", { replace: true });
    }
    window.addEventListener("sproutpay:session-expired", handleSessionExpired);
    return () => window.removeEventListener("sproutpay:session-expired", handleSessionExpired);
  }, [navigate]);

  // On mount: restore user from storage, or try token refresh
  useEffect(() => {
    const stored = userStore.get();
    const accessToken = tokenStore.getAccess();
    const refreshToken = tokenStore.getRefresh();

    if (stored && accessToken) {
      setUser(stored);
      void prefetchOnrampConfig();
      setLoading(false);
      return;
    }

    if (!accessToken && refreshToken) {
      // Try to silently refresh
      import("@/services/api").then(({ tokenStore: ts, prefetchOnrampConfig: prefetch }) => {
        const rt = ts.getRefresh();
        if (!rt) { setLoading(false); return; }
        fetch(`${import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:3000"}/api/${import.meta.env.VITE_API_VERSION ?? "v1"}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: rt }),
        })
          .then((r) => r.json())
          .then((json: { success: boolean; data?: { tokens?: { accessToken: string; refreshToken: string } } }) => {
            if (json.success && json.data?.tokens) {
              ts.setTokens(json.data.tokens.accessToken, json.data.tokens.refreshToken);
              const restored = userStore.get();
              if (restored) {
                setUser(restored);
                void prefetch();
              }
            }
          })
          .catch(() => {/* ignore */})
          .finally(() => setLoading(false));
      });
      return;
    }

    setLoading(false);
  }, []);

  const signIn = useCallback(
    async (email: string, password: string, captchaToken = "") => {
      const res = await loginApi(email, password, captchaToken);
      if (!res.success) {
        return { ok: false, message: res.message ?? "Login failed." };
      }

      if (!res.data) {
        return { ok: false, message: "Empty response from server." };
      }

      const extracted = extractTokensAndUser(res.data);
      if (!extracted) {
        return { ok: false, message: "Could not read tokens from response." };
      }

      tokenStore.setTokens(extracted.accessToken, extracted.refreshToken);

      const authUser =
        extracted.user ??
        buildAuthUser({ userEmail: email });

      userStore.set(authUser);
      setUser(authUser);
      void prefetchOnrampConfig();
      return { ok: true };
    },
    [],
  );

  const signOut = useCallback(async () => {
    try {
      await logoutApi();
    } catch {
      // Best-effort; always clear local state
      tokenStore.clear();
    }
    setUser(null);
  }, []);

  const refresh = useCallback(async () => {
    const stored = userStore.get();
    if (stored && tokenStore.getAccess()) setUser(stored);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, signIn, signOut, refresh, setUser }),
    [user, loading, signIn, signOut, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
