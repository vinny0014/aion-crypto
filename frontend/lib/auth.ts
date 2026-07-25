export type AuthUser = { email: string; role: string };
type Tokens = { access_token: string; refresh_token: string };

const ACCESS_KEY = "aion-access-token";
const REFRESH_KEY = "aion-refresh-token";
const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "");

// Per-request ceiling. Prevents any call from hanging forever while the
// backend is cold-starting (the free plan sleeps after inactivity).
const NETWORK_TIMEOUT_MS = 8_000;
// Backoff between session re-checks. Sum ~42s of waiting plus per-attempt
// timeouts: a bounded ceiling near 50s, never an endless retry loop.
const RETRY_DELAYS_MS = [1_000, 3_000, 6_000, 12_000, 20_000];

/**
 * Distinct outcomes, so the UI never confuses "you are logged out" with
 * "the backend has not answered yet":
 * - authenticated       : /auth/me confirmed the session
 * - signed_out          : no tokens stored (or the session ended cleanly)
 * - session_invalid     : the backend rejected the credentials (401/403) and
 *                        the tokens were cleared for that reason only
 * - backend_waking      : transient failure, a retry is scheduled (progress only)
 * - backend_unreachable : retries exhausted; tokens are KEPT untouched
 */
export type SessionState =
    | { status: "authenticated"; user: AuthUser }
  | { status: "signed_out" }
  | { status: "session_invalid" }
  | { status: "backend_waking"; attempt: number }
  | { status: "backend_unreachable" };

type ProgressListener = (state: SessionState) => void;

class NetworkError extends Error {
    constructor(message: string) {
          super(message);
          this.name = "NetworkError";
    }
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Statuses that mean "try again later", never "your session is gone". */
function isTransientStatus(status: number): boolean {
    return status === 408 || status === 425 || status === 429 || status >= 500;
}

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

async function fetchWithTimeout(input: string, init: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), NETWORK_TIMEOUT_MS);
    try {
          return await fetch(input, { ...init, signal: controller.signal });
    } catch (error) {
          // Aborts, DNS failures and dropped connections are all "backend not
      // answering" — never a reason to discard credentials.
      throw new NetworkError(error instanceof Error ? error.message : "network failure");
    } finally {
          clearTimeout(timer);
    }
}

let refreshInFlight: Promise<string | null> | null = null;

async function runRefresh(): Promise<string | null> {
    const tokens = getTokens();
    if (!BACKEND || !tokens) return null;
    const response = await fetchWithTimeout(`${BACKEND}/api/v1/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: tokens.refresh_token }),
    });
    // Only a proven-invalid refresh token ends the session. A 502/503/504 from
  // the edge while the service wakes up must never log the user out.
  if (response.status === 401 || response.status === 403) {
        clearSession();
        return null;
  }
    if (!response.ok) throw new NetworkError(`refresh unavailable: ${response.status}`);
    const next = (await response.json()) as Tokens;
    saveTokens(next);
    return next.access_token;
}

/** Deduplicated: concurrent callers share one refresh round-trip. */
function refresh(): Promise<string | null> {
    if (!refreshInFlight) {
          refreshInFlight = runRefresh().finally(() => {
                  refreshInFlight = null;
          });
    }
    return refreshInFlight;
}

export async function authenticatedFetch(path: string, init: RequestInit = {}, retried = false): Promise<Response> {
    if (!BACKEND) throw new Error("backend unavailable");
    const tokens = getTokens();
    if (!tokens) throw new Error("signed out");
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${tokens.access_token}`);
    let response = await fetchWithTimeout(`${BACKEND}${path}`, { ...init, headers });
    if (response.status === 401 && !retried) {
          const access = await refresh();
          if (access) response = await authenticatedFetch(path, init, true);
    }
    // 401 after a refresh attempt is a genuine credential rejection.
  if (response.status === 401) clearSession();
    return response;
}

const progressListeners = new Set<ProgressListener>();

function emitProgress(state: SessionState) {
    progressListeners.forEach((listener) => listener(state));
}

async function runResolveSession(maxRetries: number): Promise<SessionState> {
    if (!BACKEND) return { status: "backend_unreachable" };
    if (!getTokens()) return { status: "signed_out" };

  for (let attempt = 0; ; attempt += 1) {
        try {
                const response = await authenticatedFetch("/api/v1/auth/me");
                if (response.ok) return { status: "authenticated", user: (await response.json()) as AuthUser };
                if (response.status === 401 || response.status === 403) {
                          clearSession();
                          return { status: "session_invalid" };
                }
                if (!isTransientStatus(response.status)) return { status: "backend_unreachable" };
        } catch (error) {
                // Anything that is not a network failure (e.g. tokens vanished mid-flight)
          // is resolved from storage, still without clearing anything here.
          if (!(error instanceof NetworkError)) {
                    return getTokens() ? { status: "backend_unreachable" } : { status: "signed_out" };
          }
        }
        // A concurrent refresh may have cleared the session on a real 401.
      if (!getTokens()) return { status: "session_invalid" };
        if (attempt >= maxRetries) return { status: "backend_unreachable" };
        emitProgress({ status: "backend_waking", attempt: attempt + 1 });
        await sleep(RETRY_DELAYS_MS[Math.min(attempt, RETRY_DELAYS_MS.length - 1)]);
  }
}

let sessionInFlight: Promise<SessionState> | null = null;

/**
 * Resolves the current session. Concurrent callers (header + page) share a
 * single in-flight check instead of firing duplicate /auth/me requests.
 */
export function resolveSession(opts: { retries?: number; onProgress?: ProgressListener } = {}): Promise<SessionState> {
    const maxRetries = opts.retries ?? RETRY_DELAYS_MS.length;
    if (opts.onProgress) progressListeners.add(opts.onProgress);

  const detach = () => {
        if (opts.onProgress) progressListeners.delete(opts.onProgress);
  };

  if (maxRetries === 0) return runResolveSession(0).finally(detach);

  if (!sessionInFlight) {
        sessionInFlight = runResolveSession(maxRetries).finally(() => {
                sessionInFlight = null;
        });
  }
    return sessionInFlight.finally(detach);
}

/** Backwards-compatible helper: same latency as before (no retries). */
export async function verifySession(): Promise<AuthUser | null> {
    const state = await resolveSession({ retries: 0 });
    return state.status === "authenticated" ? state.user : null;
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
