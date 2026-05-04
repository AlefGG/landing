import { useEffect, useState } from "react";
import {
  fetchRentalCalendar,
  fetchSanitationCalendar,
  type RentalCalendar,
  type RentalServiceType,
  type SanitationCalendar,
} from "../services/availabilityService";

const WINDOW_DAYS = 60;

export type DayMeta = {
  blocked: boolean;
  reason: string | null;
  availableCount: number;
};

export type RentalAvailabilityState = {
  loading: boolean;
  error: Error | null;
  calendar: RentalCalendar | null;
  dayMap: Map<string, DayMeta>;
};

export type SanitationAvailabilityState = {
  loading: boolean;
  error: Error | null;
  calendar: SanitationCalendar | null;
  dayMap: Map<string, { trucksAvailable: number; cleanersAvailable: number }>;
};

function rangeFromToday(days: number): { from: Date; to: Date } {
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  const to = new Date(from);
  to.setDate(to.getDate() + days);
  return { from, to };
}

export function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function useRentalAvailability(
  serviceType: RentalServiceType,
  cabinType: number | null,
): RentalAvailabilityState {
  const [state, setState] = useState<RentalAvailabilityState>({
    loading: false,
    error: null,
    calendar: null,
    dayMap: new Map(),
  });

  useEffect(() => {
    const ctrl = new AbortController();
    if (!cabinType) {
      // FE-CQ-001: defer the idle clear into a microtask so the effect
      // body has no synchronous setState.
      queueMicrotask(() => {
        if (ctrl.signal.aborted) return;
        setState({ loading: false, error: null, calendar: null, dayMap: new Map() });
      });
      return () => ctrl.abort();
    }
    const { from, to } = rangeFromToday(WINDOW_DAYS);
    queueMicrotask(() => {
      if (ctrl.signal.aborted) return;
      setState((s) => ({ ...s, loading: true, error: null }));
    });
    fetchRentalCalendar(
      {
        serviceType,
        cabinType,
        dateFrom: from,
        dateTo: to,
      },
      { signal: ctrl.signal },
    )
      .then((cal) => {
        if (ctrl.signal.aborted) return;
        const dayMap = new Map<string, DayMeta>();
        for (const d of cal.days) {
          dayMap.set(d.date, {
            blocked: d.blocked,
            reason: d.block_reason,
            availableCount: d.available_count,
          });
        }
        setState({ loading: false, error: null, calendar: cal, dayMap });
      })
      .catch((err: unknown) => {
        if (ctrl.signal.aborted) return;
        if ((err as Error).name === "AbortError") return;
        setState({
          loading: false,
          error: err instanceof Error ? err : new Error(String(err)),
          calendar: null,
          dayMap: new Map(),
        });
      });
    return () => ctrl.abort();
  }, [serviceType, cabinType]);

  return state;
}

export function useSanitationAvailability(): SanitationAvailabilityState {
  const [state, setState] = useState<SanitationAvailabilityState>({
    loading: false,
    error: null,
    calendar: null,
    dayMap: new Map(),
  });

  useEffect(() => {
    const ctrl = new AbortController();
    const { from, to } = rangeFromToday(WINDOW_DAYS);
    queueMicrotask(() => {
      if (ctrl.signal.aborted) return;
      setState((s) => ({ ...s, loading: true, error: null }));
    });
    fetchSanitationCalendar({ dateFrom: from, dateTo: to }, { signal: ctrl.signal })
      .then((cal) => {
        if (ctrl.signal.aborted) return;
        const dayMap = new Map<string, { trucksAvailable: number; cleanersAvailable: number }>();
        for (const d of cal.days) {
          dayMap.set(d.date, {
            trucksAvailable: d.trucks_available,
            cleanersAvailable: d.cleaners_available,
          });
        }
        setState({ loading: false, error: null, calendar: cal, dayMap });
      })
      .catch((err: unknown) => {
        if (ctrl.signal.aborted) return;
        if ((err as Error).name === "AbortError") return;
        setState({
          loading: false,
          error: err instanceof Error ? err : new Error(String(err)),
          calendar: null,
          dayMap: new Map(),
        });
      });
    return () => ctrl.abort();
  }, []);

  return state;
}
