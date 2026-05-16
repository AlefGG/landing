import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { configureApiClient, resetApiClientToUnauthDefault } from "../services/apiClient";
import {
  fetchMe,
  logout as logoutRequest,
  refresh,
  sendOtp as sendOtpRequest,
  updateProfile as updateProfileRequest,
  verifyOtp,
  type AuthUser,
  type ProfilePatch,
} from "../services/authService";
import { getCsrfToken } from "../services/csrf";

type AuthStatus = "loading" | "authenticated" | "anonymous";

type AuthContextValue = {
  user: AuthUser | null;
  status: AuthStatus;
  sendOtp: (phone: string) => Promise<{ expiresIn: number }>;
  login: (phone: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (patch: ProfilePatch) => Promise<AuthUser>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

// Post-logout flag resolved once at module import — before any
// AuthProvider effect runs. The sessionStorage entry is cleared on read
// so a subsequent login → logout cycle in the same tab can re-arm it,
// but the captured boolean stays true for the lifetime of this page load.
// Both passes of React StrictMode's double-invoked bootstrap effect read
// the same captured value here, so neither pass fires the refresh probe.
const justLoggedOutOnBootstrap: boolean = (() => {
  try {
    const v = window.sessionStorage.getItem("auth.justLoggedOut") === "1";
    if (v) window.sessionStorage.removeItem("auth.justLoggedOut");
    return v;
  } catch {
    return false;
  }
})();

export function AuthProvider({ children }: { children: ReactNode }) {
  const accessTokenRef = useRef<string | null>(null);
  // Incremented on every logout(); handleRefresh captures it before the
  // network await and drops the resolved access token if the epoch advanced
  // mid-flight (logout-during-refresh resurrection guard, cookie variant).
  const sessionEpochRef = useRef(0);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const navigate = useNavigate();

  const handleAuthError = useCallback(() => {
    const hadSession = accessTokenRef.current !== null;
    accessTokenRef.current = null;
    setUser(null);
    setStatus("anonymous");
    if (hadSession) {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  const handleRefresh = useCallback(async (): Promise<string | null> => {
    const epoch = sessionEpochRef.current;
    try {
      const { access } = await refresh();
      // Logout-during-refresh guard: if logout() bumped the epoch while the
      // network request was in flight, do not write the resolved access token.
      if (sessionEpochRef.current !== epoch) return null;
      accessTokenRef.current = access;
      return access;
    } catch {
      accessTokenRef.current = null;
      setUser(null);
      setStatus("anonymous");
      return null;
    }
  }, []);

  useEffect(() => {
    configureApiClient({
      getAccessToken: () => accessTokenRef.current,
      onRefresh: handleRefresh,
      onAuthError: handleAuthError,
    });
    // FE-DT-002: drop the configured client when AuthProvider unmounts so
    // residual fetches (e.g. teardown of a test, route-level remount, HMR)
    // do not retain a reference to the unmounted provider's closures.
    return () => {
      resetApiClientToUnauthDefault();
    };
  }, [handleRefresh, handleAuthError]);

  useEffect(() => {
    let cancelled = false;
    // One-time legacy purge for users who had pre-step-2 localStorage refresh.
    try {
      window.localStorage.removeItem("auth.refresh");
      window.localStorage.removeItem("auth.access");
    } catch {
      // ignore
    }
    (async () => {
      // F-001: skip the bootstrap refresh entirely when no CSRF cookie is
      // present. CookieTokenRefreshView is csrf_protect-decorated, so an
      // anonymous browser (no cookies) gets a 403 logged to the console on
      // every page load — noisy and misleading. Real returning users who
      // were logged in have csrftoken set by Django's middleware on prior
      // 2xx responses, so the bootstrap still runs for them.
      if (!getCsrfToken()) {
        if (cancelled) return;
        accessTokenRef.current = null;
        setStatus("anonymous");
        return;
      }
      // AUTH-GUEST-REFRESH-400: guests pick up csrftoken from any backend
      // 2xx GET (CsrfViewMiddleware), so the !csrf gate above does not
      // catch a guest who browsed before reload. localStorage marker is
      // set on login, cleared on logout — absent marker = never logged in
      // in this browser, so the refresh probe is guaranteed to 400.
      let hadSession = false;
      try {
        hadSession = window.localStorage.getItem("auth.hadSession") === "1";
      } catch {
        // ignore
      }
      if (!hadSession) {
        if (cancelled) return;
        accessTokenRef.current = null;
        setStatus("anonymous");
        return;
      }
      // Skip the probe right after logout — refresh_token cookie was
      // cleared server-side but csrftoken survives, so without this guard
      // every post-logout page load hits /api/auth/refresh/ → 400.
      if (justLoggedOutOnBootstrap) {
        if (cancelled) return;
        accessTokenRef.current = null;
        setStatus("anonymous");
        return;
      }
      try {
        const { access } = await refresh();
        if (cancelled) return;
        accessTokenRef.current = access;
        const me = await fetchMe();
        if (cancelled) return;
        setUser(me);
        setStatus("authenticated");
      } catch {
        if (cancelled) return;
        accessTokenRef.current = null;
        setStatus("anonymous");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const sendOtp = useCallback((phone: string) => {
    return sendOtpRequest(phone);
  }, []);

  const login = useCallback(async (phone: string, code: string) => {
    const { access, user: nextUser } = await verifyOtp(phone, code);
    accessTokenRef.current = access;
    setUser(nextUser);
    setStatus("authenticated");
    try {
      window.localStorage.setItem("auth.hadSession", "1");
    } catch {
      // ignore
    }
  }, []);

  const logoutInFlightRef = useRef<Promise<void> | null>(null);
  const logout = useCallback(async () => {
    // LOGOUT-DOUBLE-CALL: in dev StrictMode (and on rare prod double-clicks)
    // logout() can fire twice in quick succession. Coalesce concurrent
    // calls onto the same in-flight promise so we hit POST /api/auth/logout/
    // exactly once per session-end.
    if (logoutInFlightRef.current) {
      return logoutInFlightRef.current;
    }
    const run = (async () => {
      sessionEpochRef.current += 1;
      // Capture the Bearer access token before we drop it — backend
      // LogoutView is IsAuthenticated and needs Authorization: Bearer to
      // clear the refresh cookie. Local state is cleared optimistically so
      // the UI flips to anonymous immediately; then we await the backend
      // round-trip so the cookie is gone before any caller (e.g. Header)
      // hard-redirects.
      const accessToken = accessTokenRef.current;
      accessTokenRef.current = null;
      setUser(null);
      setStatus("anonymous");
      // Mark the just-completed logout so the next AuthProvider bootstrap
      // skips its refresh probe — csrftoken cookie survives logout, so
      // without this flag the post-logout page reload always hits
      // /api/auth/refresh/ → 400 (refresh_token cookie cleared) and pollutes
      // the console. sessionStorage scope = single browser tab, cleared
      // on tab close.
      try {
        window.sessionStorage.setItem("auth.justLoggedOut", "1");
        window.localStorage.removeItem("auth.hadSession");
      } catch {
        // ignore (storage may be blocked)
      }
      try {
        await logoutRequest(accessToken);
      } finally {
        logoutInFlightRef.current = null;
      }
    })();
    logoutInFlightRef.current = run;
    return run;
  }, []);

  const updateProfile = useCallback(async (patch: ProfilePatch) => {
    const next = await updateProfileRequest(patch);
    setUser(next);
    return next;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, status, sendOtp, login, logout, updateProfile }),
    [user, status, sendOtp, login, logout, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// FE-CQ-003: useAuth lives next to AuthProvider for ergonomic imports.
// Splitting it to a sibling file would require updating 9 production
// import sites + 2 test mock files (vi.mock targets) for a dev-HMR-only
// benefit (react-refresh fast-refresh of files that mix component +
// non-component exports). Folded back into Wave-4 if the HMR pain
// becomes real.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
