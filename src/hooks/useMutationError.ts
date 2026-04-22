import { useCallback, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { normalizeError, type NormalizedError } from "../services/errors";

export type UseMutationErrorResult = {
  error: NormalizedError | null;
  setError: (err: NormalizedError | null) => void;
  clear: () => void;
  pending: boolean;
  runSafe: <T>(fn: () => Promise<T>) => Promise<T | undefined>;
};

export function useMutationError(): UseMutationErrorResult {
  const [error, setError] = useState<NormalizedError | null>(null);
  const [pending, setPending] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const clear = useCallback(() => setError(null), []);

  const runSafe = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T | undefined> => {
      setPending(true);
      setError(null);
      try {
        const result = await fn();
        return result;
      } catch (err) {
        const normalized = normalizeError(err);
        if (normalized.kind === "auth") {
          const redirect = encodeURIComponent(location.pathname + location.search);
          navigate(`/login?redirect=${redirect}`);
          return undefined;
        }
        setError(normalized);
        return undefined;
      } finally {
        setPending(false);
      }
    },
    [location.pathname, location.search, navigate],
  );

  return { error, setError, clear, pending, runSafe };
}
