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
import { configureApiClient } from "../services/apiClient";
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
  logout: () => void;
  updateProfile: (patch: ProfilePatch) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

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
  }, []);

  const logout = useCallback(() => {
    sessionEpochRef.current += 1;
    void logoutRequest();
    accessTokenRef.current = null;
    setUser(null);
    setStatus("anonymous");
  }, []);

  const updateProfile = useCallback(async (patch: ProfilePatch) => {
    const next = await updateProfileRequest(patch);
    setUser(next);
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
