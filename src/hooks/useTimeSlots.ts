import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  fetchPublicTimeSlots,
  type TimeSlotDTO,
} from "../services/timeSlotsService";

type UseTimeSlotsReturn = {
  slots: TimeSlotDTO[];
  loading: boolean;
  error: Error | null;
};

const INITIAL: UseTimeSlotsReturn = { slots: [], loading: true, error: null };
const RETRY_DELAY_MS = 400;

export const __TIME_SLOTS_RETRY_DELAY_MS_FOR_TESTS = RETRY_DELAY_MS;

export function useTimeSlots(): UseTimeSlotsReturn {
  const { i18n } = useTranslation();
  const [state, setState] = useState<UseTimeSlotsReturn>(INITIAL);
  const [retryToken, setRetryToken] = useState(0);

  // FE-DT-004: include i18n.language in deps so locale switch refetches
  // (the underlying service caches by `slug:locale` so the new key misses
  // and triggers a fresh fetch with the correct Accept-Language header).
  useEffect(() => {
    const ctrl = new AbortController();
    fetchPublicTimeSlots(ctrl.signal)
      .then((slots) => {
        if (ctrl.signal.aborted) return;
        setState({ slots, loading: false, error: null });
      })
      .catch((err: unknown) => {
        if (ctrl.signal.aborted) return;
        if ((err as Error).name === "AbortError") return;
        if (retryToken === 0) {
          // F-016: a single transient failure (AbortError on fast
          // post-login navigation, slow first paint, etc.) used to lock
          // the dropdown empty until the user reloaded. Retry once before
          // surfacing the error.
          window.setTimeout(() => {
            if (!ctrl.signal.aborted) setRetryToken(1);
          }, RETRY_DELAY_MS);
          return;
        }
        console.warn("useTimeSlots: fetch failed", err);
        setState({ slots: [], loading: false, error: err as Error });
      });
    return () => ctrl.abort();
  }, [retryToken, i18n.language]);

  return state;
}
