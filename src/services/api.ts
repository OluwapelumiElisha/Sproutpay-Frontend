// SproutPay — Real API client
// Base: VITE_API_BASE_URL env var (defaults to http://localhost:3000)

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const API_VERSION = import.meta.env.VITE_API_VERSION ?? "v1";
const isBrowser = typeof window !== "undefined";

// ── Token / User Storage ─────────────────────────────────────────────────────

const KEYS = {
  access: "sp_access_token",
  refresh: "sp_refresh_token",
  user: "sp_user",
} as const;

export const tokenStore = {
  getAccess(): string | null {
    return isBrowser ? localStorage.getItem(KEYS.access) : null;
  },
  getRefresh(): string | null {
    return isBrowser ? localStorage.getItem(KEYS.refresh) : null;
  },
  setTokens(access: string, refresh: string) {
    if (!isBrowser) return;
    localStorage.setItem(KEYS.access, access);
    localStorage.setItem(KEYS.refresh, refresh);
  },
  clear() {
    if (!isBrowser) return;
    (Object.values(KEYS) as string[]).forEach((k) => localStorage.removeItem(k));
  },
};

export const userStore = {
  get(): AuthUser | null {
    if (!isBrowser) return null;
    try {
      const raw = localStorage.getItem(KEYS.user);
      return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
      return null;
    }
  },
  set(user: AuthUser) {
    if (isBrowser) localStorage.setItem(KEYS.user, JSON.stringify(user));
  },
};

// ── Types ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id?: string;
  firstName?: string;
  lastName?: string;
  userEmail?: string;
  // Fields used by existing components (derived on login)
  display_name: string;
  email: string;
  account_email: string;
}

export type TxStatus = "pending" | "processing" | "completed" | "failed";
export type TxKind = "buy" | "sell";

export interface Transaction {
  id: string;
  reference: string;
  kind: TxKind;
  asset: string;
  network: string;
  from_amount: number;
  to_amount: number;
  rate: number;
  status: TxStatus;
  created_at: number;
  payUrl?: string;
  sourceCurrency?: string;
}

export type KycStatus = "not_started" | "in_review" | "verified" | "rejected";
export type KycProvider = "qoreid" | "transfi";

export interface KycRecord {
  status: KycStatus;
  step: number;
  kycUrl?: string;
  sessionId?: string;
  provider?: KycProvider | null;
  data: {
    first_name?: string;
    last_name?: string;
    dob?: string;
    phone?: string;
    phoneCode?: string;
    country?: string;
    gender?: string;
    address?: string;
    city?: string;
    state?: string;
    postal?: string;
    sourceCurrency?: string;
    nin?: string;
  };
  submitted_at?: number;
}

interface ApiSuccess<T = unknown> {
  success: true;
  message?: string;
  data?: T;
  meta?: PaginationMeta;
}

interface ApiError {
  success: false;
  message: string;
  code?: string;
  errors?: { field: string; message: string }[];
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface OnrampCurrency {
  currency: string;
  logoUrl: string;
  decimalPrecision: number;
  paymentMethods: {
    name: string;
    paymentCode: string;
    paymentType: string;
    minAmount: number;
    maxAmount: number;
  }[];
}

export interface OnrampAsset {
  asset: string;
  symbol: string;
  network: string;
  logoUrl: string;
}

// ── HTTP Status Messages ─────────────────────────────────────────────────────

const HTTP_MESSAGES: Record<number, string> = {
  400: "Bad request.",
  401: "Unauthorized. Please log in.",
  403: "Access denied.",
  404: "Resource not found.",
  408: "Request timed out. Please try again.",
  409: "Conflict — this resource may already exist.",
  410: "This resource is no longer available.",
  422: "Validation failed.",
  429: "Too many requests. Please wait a moment and try again.",
  500: "Internal server error. Please try again later.",
  502: "Server is temporarily unavailable.",
  503: "Service unavailable. Please try again shortly.",
  504: "Gateway timeout. Please try again.",
};

// ── HTTP Client ──────────────────────────────────────────────────────────────

let isRefreshing = false;
let refreshWaiters: Array<(ok: boolean) => void> = [];

function drainWaiters(ok: boolean) {
  refreshWaiters.forEach((cb) => cb(ok));
  refreshWaiters = [];
}

async function tryRefresh(): Promise<boolean> {
  const refreshToken = tokenStore.getRefresh();
  if (!refreshToken) return false;

  if (isRefreshing) {
    return new Promise<boolean>((resolve) => refreshWaiters.push(resolve));
  }

  isRefreshing = true;
  try {
    const res = await fetch(`${API_BASE}/api/${API_VERSION}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    const json = (await res.json()) as ApiResponse<{
      tokens: { accessToken: string; refreshToken: string };
    }>;
    if (json.success && json.data?.tokens) {
      tokenStore.setTokens(json.data.tokens.accessToken, json.data.tokens.refreshToken);
      isRefreshing = false;
      drainWaiters(true);
      return true;
    }
  } catch {
    // network failure
  }
  tokenStore.clear();
  isRefreshing = false;
  drainWaiters(false);
  // Tell the app the session is gone so it can redirect to login
  if (isBrowser) window.dispatchEvent(new CustomEvent("sproutpay:session-expired"));
  return false;
}

async function request<T = unknown>(
  path: string,
  init?: RequestInit,
  skipAuth = false,
  isRetry = false,
): Promise<ApiResponse<T>> {
  const url = `${API_BASE}/api/${API_VERSION}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> | undefined),
  };

  if (!skipAuth) {
    const token = tokenStore.getAccess();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(url, { ...init, headers });
  } catch {
    return { success: false, message: "Network error. Please check your connection." };
  }

  if (res.status === 401 && !skipAuth && !isRetry) {
    const ok = await tryRefresh();
    if (ok) return request<T>(path, init, false, true);
    return { success: false, message: "Session expired. Please log in again.", code: "SESSION_EXPIRED" };
  }

  // Try to parse the body as JSON
  let body: unknown;
  try {
    body = await res.json();
  } catch {
    // Non-JSON body (plain text rate-limit page, nginx error, etc.)
    // Use the HTTP status message instead of a generic string
    const fallback = HTTP_MESSAGES[res.status] ?? res.statusText ?? "Unexpected server response.";
    return { success: false, message: fallback };
  }

  // Body is JSON — if it already matches our ApiResponse shape, pass it through
  if (isApiResponse(body)) return body as ApiResponse<T>;

  // Some backends wrap errors differently — pull out whatever message is available
  if (typeof body === "object" && body !== null) {
    const b = body as Record<string, unknown>;
    const msg = String(b.message ?? b.error ?? b.detail ?? "");
    if (msg) return { success: false, message: msg };
  }

  // Last resort: HTTP status message
  const fallback = HTTP_MESSAGES[res.status] ?? res.statusText ?? "Unexpected server response.";
  return res.ok
    ? (body as ApiResponse<T>)
    : { success: false, message: fallback };
}

function isApiResponse(v: unknown): v is ApiResponse<unknown> {
  return typeof v === "object" && v !== null && "success" in v;
}

// Prefer the specific field-level validation message (e.g. "Invalid wallet address")
// over the generic top-level message (e.g. "Validation failed") so toasts are actionable.
export function errorMessage(res: ApiError, fallback = "Something went wrong. Please try again."): string {
  if (res.errors && res.errors.length > 0) {
    return res.errors.map((e) => e.message).join(" ");
  }
  return res.message || fallback;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

export function buildAuthUser(raw: Record<string, unknown>): AuthUser {
  const firstName = String(raw.firstName ?? raw.first_name ?? "");
  const lastName = String(raw.lastName ?? raw.last_name ?? "");
  const email = String(raw.userEmail ?? raw.email ?? "");
  const displayName =
    [firstName, lastName].filter(Boolean).join(" ").trim() ||
    email.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) ||
    "User";
  return {
    id: String(raw.id ?? raw._id ?? ""),
    firstName: firstName || undefined,
    lastName: lastName || undefined,
    userEmail: email || undefined,
    display_name: displayName,
    email,
    account_email: email,
  };
}

export function mapKycStatus(raw: string | undefined): KycStatus {
  switch (raw) {
    case "approved":
    case "verified": return "verified";
    case "pending":
    case "in_review": return "in_review";
    case "rejected":
    case "failed": return "rejected";
    default: return "not_started";
  }
}

// Normalize backend transaction to our frontend shape
export function normalizeTransaction(raw: Record<string, unknown>): Transaction {
  const statusRaw = String(raw.status ?? "pending").toLowerCase();
  const validStatuses: TxStatus[] = ["pending", "processing", "completed", "failed"];
  const status: TxStatus = validStatuses.includes(statusRaw as TxStatus)
    ? (statusRaw as TxStatus)
    : "pending";

  const createdAt = raw.createdAt
    ? new Date(String(raw.createdAt)).getTime()
    : raw.created_at
      ? Number(raw.created_at)
      : Date.now();

  return {
    id: String(raw.id ?? raw._id ?? raw.transactionId ?? ""),
    reference: String(raw.reference ?? raw.orderId ?? raw.id ?? ""),
    kind: (raw.kind ?? raw.type ?? "buy") as TxKind,
    asset: String(raw.asset ?? raw.cryptoAsset ?? "USDT"),
    network: String(raw.network ?? ""),
    from_amount: Number(raw.from_amount ?? raw.sourceAmount ?? raw.depositAmount ?? 0),
    to_amount: Number(raw.to_amount ?? raw.destinationAmount ?? raw.withdrawAmount ?? 0),
    rate: Number(raw.rate ?? raw.exchangeRate ?? 0),
    status,
    created_at: createdAt,
    payUrl: raw.payUrl ? String(raw.payUrl) : undefined,
    sourceCurrency: raw.sourceCurrency ? String(raw.sourceCurrency) : undefined,
  };
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export async function getClientConfig() {
  return request<{ verificationMethod: "checkbox" }>("/auth/client-config", undefined, true);
}

export async function register(payload: {
  firstName: string;
  lastName: string;
  userEmail: string;
  password: string;
  captchaToken: boolean;
}) {
  return request<Record<string, unknown>>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  }, true);
}

export interface LoginResult {
  tokens?: { accessToken: string; refreshToken: string };
  accessToken?: string;
  refreshToken?: string;
  user?: Record<string, unknown>;
}

export async function loginApi(userEmail: string, password: string, captchaToken: boolean) {
  return request<LoginResult>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ userEmail, password, captchaToken }),
  }, true);
}

export async function logoutApi() {
  const res = await request("/auth/logout", { method: "POST" });
  tokenStore.clear();
  return res;
}

export async function changePassword(payload: {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}) {
  return request("/auth/change-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ── KYC ─────────────────────────────────────────────────────────────────────

export interface KycInitiatePayload {
  // Determines the KYC provider: "NGN" -> QoreID ("KYC with NIN" widget),
  // anything else -> TransFi (hosted redirect flow).
  sourceCurrency: string;
  phone: string;
  phoneCode: string;
  country: string;
  gender: string;
  dateOfBirth: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
  };
  // Required only when sourceCurrency === "NGN" (11-digit NIN, for QoreID).
  nin?: string;
}

// Config returned for NGN — pass straight to QoreID.start() from "@qore-id/web-sdk".
export interface QoreidWidgetConfig {
  clientId: string;
  flowId: number;
  customerReference: string;
  applicantData: {
    firstname: string;
    lastname: string;
    gender?: string;
    dob?: string;
    phone?: string;
    email?: string;
  };
  identityData: {
    idType: string;
    idNumber: string;
  };
  addressData: {
    address: string;
    city: string;
    lgaName: string;
  };
}

export interface KycInitiateResult {
  provider: KycProvider;
  sessionId: string;
  kycUrl: string | null;
  status: string;
  // Only present for NGN (QoreID "KYC with NIN" workflow).
  widgetConfig?: QoreidWidgetConfig | null;
}

export async function initiateKyc(payload: KycInitiatePayload) {
  return request<KycInitiateResult>(
    "/kyc/initiate",
    { method: "POST", body: JSON.stringify(payload) },
  );
}

export async function getKycStatus(): Promise<KycRecord> {
  const res = await request<{
    kycStatus: string;
    kycVerified: boolean;
    kycProvider: KycProvider | null;
    session: Record<string, unknown> | null;
  }>("/kyc/status");

  if (!res.success || !res.data) {
    return { status: "not_started", step: 0, data: {} };
  }

  const { kycStatus, kycProvider, session } = res.data;
  const status = mapKycStatus(kycStatus);
  const kycUrl = session?.kycUrl ? String(session.kycUrl) : undefined;
  const sessionId = session?.sessionId ? String(session.sessionId) : undefined;

  return {
    status,
    step: status === "not_started" ? 0 : 2,
    kycUrl,
    sessionId,
    provider: kycProvider ?? undefined,
    data: {},
    submitted_at: session?.createdAt
      ? new Date(String(session.createdAt)).getTime()
      : undefined,
  };
}

// ── On-ramp ──────────────────────────────────────────────────────────────────

// Bump the version suffix whenever the shape of the cached config changes or
// the backend adds new currencies/assets that older cached sessions would hide.
const ONRAMP_CONFIG_VERSION = "v2";
const ONRAMP_CONFIG_KEY = `sproutpay:onramp-config:${ONRAMP_CONFIG_VERSION}`;
const ONRAMP_CONFIG_TTL_MS = 30 * 60 * 1000; // 30 minutes

export type OnrampConfigCache = {
  sourceCurrencies: OnrampCurrency[];
  destinationAssets: OnrampAsset[];
};

type CachedOnrampConfig = OnrampConfigCache & { _cachedAt: number };

export function getCachedOnrampConfig(): OnrampConfigCache | null {
  if (typeof sessionStorage === "undefined") return null;
  const raw = sessionStorage.getItem(ONRAMP_CONFIG_KEY);
  if (!raw) return null;
  try {
    const { _cachedAt, ...data } = JSON.parse(raw) as CachedOnrampConfig;
    if (Date.now() - _cachedAt > ONRAMP_CONFIG_TTL_MS) {
      sessionStorage.removeItem(ONRAMP_CONFIG_KEY);
      return null;
    }
    return data;
  } catch {
    sessionStorage.removeItem(ONRAMP_CONFIG_KEY);
    return null;
  }
}

function cacheOnrampConfig(data: OnrampConfigCache) {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(ONRAMP_CONFIG_KEY, JSON.stringify({ ...data, _cachedAt: Date.now() }));
}

export async function prefetchOnrampConfig() {
  const cached = getCachedOnrampConfig();
  if (cached) return cached;
  const res = await getOnrampConfig();
  if (res.success && res.data) {
    cacheOnrampConfig(res.data);
    return res.data;
  }
  return null;
}

export async function getOnrampConfig() {
  const cached = getCachedOnrampConfig();
  if (cached) {
    return {
      success: true,
      message: "Loaded from session cache.",
      data: cached,
    } as const;
  }

  const res = await request<OnrampConfigCache>("/onramp/config", undefined, true);
  if (res.success && res.data) {
    cacheOnrampConfig(res.data);
  }
  return res;
}

export async function getOnrampRate(payload: {
  sourceCurrency: string;
  cryptoAsset: string;
  network: string;
  amount: number;
  paymentType?: string;
  paymentCode?: string;
}) {
  return request<{
    sourceCurrency: string;
    sourceAmount: number;
    cryptoAsset: string;
    network: string;
    transfiCurrency: string;
    destinationAmount: number;
    exchangeRate: number;
    fees: { processing: number; customer: number; total: number };
    limits: { min: number; max: number };
    summary: string;
  }>("/onramp/rate", { method: "POST", body: JSON.stringify(payload) }, true);
}

export async function initiateOnramp(payload: {
  sourceCurrency: string;
  cryptoAsset: string;
  network: string;
  walletAddress: string;
  walletOwner: "self" | "exchange";
  paymentType?: string;
  purposeCode?: string;
  sourceAmount?: number;
  destinationAmount?: number;
  paymentCode?: string;
  exchangeName?: string;
}) {
  return request<{
    transactionId: string;
    orderId: string;
    payUrl: string;
    cryptoAsset: string;
    network: string;
    feeData: {
      depositAmount: number;
      withdrawAmount: number;
      exchangeRate: number;
      totalFee: number;
    };
  }>("/onramp/initiate", { method: "POST", body: JSON.stringify(payload) });
}

// ── Transactions ─────────────────────────────────────────────────────────────

export async function listTransactions(params?: {
  status?: string;
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}): Promise<{ transactions: Transaction[]; meta?: PaginationMeta }> {
  const entries = Object.entries(params ?? {}).filter(([, v]) => v != null) as [string, string][];
  const qs = entries.length ? "?" + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString() : "";
  const res = await request<unknown[]>(`/transactions${qs}`);
  if (!res.success || !res.data) return { transactions: [] };
  const transactions = (res.data as Record<string, unknown>[]).map(normalizeTransaction);
  return { transactions, meta: res.meta };
}

export async function getTransactionById(id: string): Promise<Transaction | null> {
  const res = await request<Record<string, unknown>>(`/transactions/${id}`);
  if (!res.success || !res.data) return null;
  return normalizeTransaction(res.data);
}

// ── Dashboard Summary (derived from transactions) ─────────────────────────────

export async function getDashboardSummary() {
  const { transactions, meta } = await listTransactions({ limit: 50, page: 1 });
  const total = meta?.total ?? transactions.length;
  const completed = transactions.filter((t) => t.status === "completed");
  const completionRate = total === 0 ? 0 : Math.round((completed.length / transactions.length) * 100);
  return {
    transactions_count: total,
    completion_rate: completionRate,
  };
}

// ── Legacy aliases kept so existing imports don't break ──────────────────────

// getKyc() used by DashboardHome — maps to getKycStatus
export const getKyc = getKycStatus;
