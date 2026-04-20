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
  refresh as refreshToken,
  sendOtp as sendOtpRequest,
  updateProfile as updateProfileRequest,
  verifyOtp,
  type AuthUser,
  type ProfilePatch,
} from "../services/authService";

type AuthStatus = "loading" | "authenticated" | "anonymous";

type AuthContextValue = {
  user: AuthUser | null;
  status: AuthStatus;
  sendOtp: (phone: string) => Promise<{ expiresIn: number }>;
  login: (phone: string, code: string) => Promise<void>;
  logout: () => void;
  updateProfile: (patch: ProfilePatch) => Promise<void>;
};

const STORAGE_KEYS = {
  refresh: "auth.refresh",
  // BUG-059: historical builds persisted the access JWT in localStorage.
  // Current build only keeps it in memory, but logout must still purge
  // the legacy key so a post-rewrite browser cannot leak a stale token
  // for the remainder of ACCESS_TOKEN_LIFETIME.
  legacyAccess: "auth.access",
} as const;

const AuthContext = createContext<AuthContextValue | null>(null);

function readRefresh(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(STORAGE_KEYS.refresh);
  } catch {
    return null;
  }
}

function writeRefresh(token: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEYS.refresh, token);
  } catch {
    // quota / private mode — ignore
  }
}

function clearRefresh(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEYS.refresh);
    window.localStorage.removeItem(STORAGE_KEYS.legacyAccess);
  } catch {
    // ignore
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const accessTokenRef = useRef<string | null>(null);
  const refreshTokenRef = useRef<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const navigate = useNavigate();

  const handleAuthError = useCallback(() => {
    const hadSession = accessTokenRef.current !== null || refreshTokenRef.current !== null;
    accessTokenRef.current = null;
    refreshTokenRef.current = null;
    clearRefresh();
    setUser(null);
    setStatus("anonymous");
    if (hadSession) {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  const handleRefresh = useCallback(async (): Promise<string | null> => {
    const current = refreshTokenRef.current;
    if (!current) return null;
    try {
      const { access, refresh: nextRefresh } = await refreshToken(current);
      accessTokenRef.current = access;
      if (nextRefresh) {
        refreshTokenRef.current = nextRefresh;
        writeRefresh(nextRefresh);
      }
      return access;
    } catch {
      accessTokenRef.current = null;
      refreshTokenRef.current = null;
      clearRefresh();
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
    const storedRefresh = readRefresh();

    if (!storedRefresh) {
      setStatus("anonymous");
      return;
    }

    refreshTokenRef.current = storedRefresh;
    (async () => {
      try {
        const { access, refresh: nextRefresh } = await refreshToken(storedRefresh);
        if (cancelled) return;
        accessTokenRef.current = access;
        if (nextRefresh) {
          refreshTokenRef.current = nextRefresh;
          writeRefresh(nextRefresh);
        }
        const me = await fetchMe();
        if (cancelled) return;
        setUser(me);
        setStatus("authenticated");
      } catch {
        if (cancelled) return;
        accessTokenRef.current = null;
        refreshTokenRef.current = null;
        clearRefresh();
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
    const result = await verifyOtp(phone, code);
    accessTokenRef.current = result.access;
    refreshTokenRef.current = result.refresh;
    writeRefresh(result.refresh);
    setUser(result.user);
    setStatus("authenticated");
  }, []);

  const logout = useCallback(() => {
    const current = refreshTokenRef.current;
    if (current) {
      void logoutRequest(current);
    }
    accessTokenRef.current = null;
    refreshTokenRef.current = null;
    clearRefresh();
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

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
