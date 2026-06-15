import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext";
import {
  fetchPublicFixedDestinations,
  __resetFixedDestinationsCacheForTests,
  type FixedDestinationDTO,
} from "../services/fixedDestinationsService";

type UseFixedDestinationsReturn = {
  destinations: FixedDestinationDTO[];
  loading: boolean;
  error: Error | null;
};

const INITIAL: UseFixedDestinationsReturn = {
  destinations: [],
  loading: true,
  error: null,
};
const RETRY_DELAY_MS = 400;

export const __FIXED_DEST_RETRY_DELAY_MS_FOR_TESTS = RETRY_DELAY_MS;

export function useFixedDestinations(): UseFixedDestinationsReturn {
  const { i18n } = useTranslation();
  const { status: authStatus } = useAuth();
  const [state, setState] = useState<UseFixedDestinationsReturn>(INITIAL);
  const [retryToken, setRetryToken] = useState(0);

  // BE-2: the endpoint is company-scoped behind auth. While auth is still
  // resolving, stay in the loading state. When the user is anonymous, return
  // an empty list (no error) — the picker just shows "empty" until they log
  // in. authStatus in the deps means the dropdown auto-populates the moment
  // the OTP gate completes. i18n.language is in the deps to refetch on locale
  // switch (mirrors useTimeSlots), and resets the once-only retry budget.
  useEffect(() => {
    // While auth is still resolving, leave the state as-is (INITIAL starts
    // `loading: true`). No synchronous setState here — that would trigger a
    // cascading render (react-hooks/set-state-in-effect).
    if (authStatus === "loading") {
      return;
    }
    if (authStatus !== "authenticated") {
      // Anonymous: empty list, no error. Reset the shared cache so a later
      // login does a fresh fetch instead of serving a stale anonymous miss.
      // queueMicrotask keeps the setState off the synchronous effect path.
      let cancelled = false;
      queueMicrotask(() => {
        if (cancelled) return;
        __resetFixedDestinationsCacheForTests();
        setState({ destinations: [], loading: false, error: null });
      });
      return () => {
        cancelled = true;
      };
    }

    const ctrl = new AbortController();
    fetchPublicFixedDestinations(ctrl.signal)
      .then((destinations) => {
        if (ctrl.signal.aborted) return;
        setState({ destinations, loading: false, error: null });
      })
      .catch((err: unknown) => {
        if (ctrl.signal.aborted) return;
        if ((err as Error).name === "AbortError") return;
        if (retryToken === 0) {
          // Single transient failure (race on fast post-login navigation,
          // slow first paint) used to lock the dropdown empty until reload —
          // retry once before surfacing the error. Mirrors useTimeSlots F-016.
          window.setTimeout(() => {
            if (!ctrl.signal.aborted) setRetryToken(1);
          }, RETRY_DELAY_MS);
          return;
        }
        console.warn("useFixedDestinations: fetch failed", err);
        setState({ destinations: [], loading: false, error: err as Error });
      });
    return () => ctrl.abort();
  }, [retryToken, i18n.language, authStatus]);

  return state;
}
