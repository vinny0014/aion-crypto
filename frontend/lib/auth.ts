export type AuthUser = { email: string; role: string };
type Tokens = { access_token: string; refresh_token: string };

const ACCESS_KEY = "aion-access-token";
const REFRESH_KEY = "aion-refresh-token";
const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "");

function storage(): Storage | null {
  return typeof window === "undefined" ? null : window.sessionStorage;
}

export function getTokens(): Tokens | null {
  const value = storage();
  const access_token = value?.getItem(ACCESS_KEY);
  const refresh_token = value?.getItem(REFRESH_KEY);
  return access_token && refresh_token ? { access_token, refresh_token } : null;
}

export function saveTokens(tokens: Tokens) {
  storage()?.setItem(ACCESS_KEY, tokens.access_token);
  storage()?.setItem(REFRESH_KEY, tokens.refresh_token);
}

export function clearSession() {
  storage()?.removeItem(ACCESS_KEY);
  storage()?.removeItem(REFRESH_KEY);
}

async function refresh(): Promise<string | null> {
  const tokens = getTokens();
  if (!BACKEND || !tokens) return null;
  const response = await fetch(`${BACKEND}/api/v1/auth/refresh`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refresh_token: tokens.refresh_token }),
  });
  if (!response.ok) { clearSession(); return null; }
  const next = await response.json() as Tokens;
  saveTokens(next);
  return next.access_token;
}

export async function authenticatedFetch(path: string, init: RequestInit = {}, retried = false): Promise<Response> {
  if (!BACKEND) throw new Error("backend unavailable");
  const tokens = getTokens();
  if (!tokens) throw new Error("signed out");
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${tokens.access_token}`);
  let response = await fetch(`${BACKEND}${path}`, { ...init, headers });
  if (response.status === 401 && !retried) {
    const access = await refresh();
    if (access) response = await authenticatedFetch(path, init, true);
  }
  if (response.status === 401) clearSession();
  return response;
}

export async function verifySession(): Promise<AuthUser | null> {
  try {
    const response = await authenticatedFetch("/api/v1/auth/me");
    if (!response.ok) return null;
    return await response.json() as AuthUser;
  } catch {
    return null;
  }
}

export async function logout() {
  const tokens = getTokens();
  try {
    if (BACKEND && tokens) await fetch(`${BACKEND}/api/v1/auth/logout`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refresh_token: tokens.refresh_token }),
    });
  } finally {
    clearSession();
  }
}

export { BACKEND };
