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

export function useTimeSlots(): UseTimeSlotsReturn {
  const [state, setState] = useState<UseTimeSlotsReturn>(INITIAL);

  useEffect(() => {
    let cancelled = false;
    fetchPublicTimeSlots()
      .then((slots) => {
        if (cancelled) return;
        setState({ slots, loading: false, error: null });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        console.warn("useTimeSlots: fetch failed", err);
        setState({ slots: [], loading: false, error: err as Error });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
