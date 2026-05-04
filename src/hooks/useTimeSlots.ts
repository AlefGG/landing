import { useEffect, useState } from "react";
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
  const [state, setState] = useState<UseTimeSlotsReturn>(INITIAL);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchPublicTimeSlots()
      .then((slots) => {
        if (cancelled) return;
        setState({ slots, loading: false, error: null });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (retryToken === 0) {
          // F-016: a single transient failure (AbortError on fast
          // post-login navigation, slow first paint, etc.) used to lock
          // the dropdown empty until the user reloaded. Retry once before
          // surfacing the error.
          window.setTimeout(() => {
            if (!cancelled) setRetryToken(1);
          }, RETRY_DELAY_MS);
          return;
        }
        console.warn("useTimeSlots: fetch failed", err);
        setState({ slots: [], loading: false, error: err as Error });
      });
    return () => {
      cancelled = true;
    };
  }, [retryToken]);

  return state;
}
