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
import {
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
  user: "auth.user",
} as const;

const AuthContext = createContext<AuthContextValue | null>(null);

function readUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.user);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthUser;
    if (!parsed?.phone) return null;
    return parsed;
  } catch {
    return null;
  }
}

function readRefresh(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(STORAGE_KEYS.refresh);
  } catch {
    return null;
  }
}

function writeSession(user: AuthUser, refresh: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
    window.localStorage.setItem(STORAGE_KEYS.refresh, refresh);
  } catch {
    // quota / private mode — ignore
  }
}

function clearSession(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEYS.user);
    window.localStorage.removeItem(STORAGE_KEYS.refresh);
  } catch {
    // ignore
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const accessTokenRef = useRef<string | null>(null);
  const refreshTokenRef = useRef<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    let cancelled = false;
    const storedRefresh = readRefresh();
    const storedUser = readUser();

    if (!storedRefresh || !storedUser) {
      clearSession();
      setStatus("anonymous");
      return;
    }

    refreshTokenRef.current = storedRefresh;
    refreshToken(storedRefresh)
      .then(({ access }) => {
        if (cancelled) return;
        accessTokenRef.current = access;
        setUser(storedUser);
        setStatus("authenticated");
      })
      .catch(() => {
        if (cancelled) return;
        accessTokenRef.current = null;
        refreshTokenRef.current = null;
        clearSession();
        setStatus("anonymous");
      });

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
    writeSession(result.user, result.refresh);
    setUser(result.user);
    setStatus("authenticated");
  }, []);

  const logout = useCallback(() => {
    accessTokenRef.current = null;
    refreshTokenRef.current = null;
    clearSession();
    setUser(null);
    setStatus("anonymous");
  }, []);

  const updateProfile = useCallback(
    async (patch: ProfilePatch) => {
      if (!user) {
        throw new Error("Not authenticated");
      }
      const next = await updateProfileRequest(user, patch);
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem(
            STORAGE_KEYS.user,
            JSON.stringify(next),
          );
        } catch {
          // ignore
        }
      }
      setUser(next);
    },
    [user],
  );

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
