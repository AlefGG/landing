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
    if (!cabinType) {
      setState({ loading: false, error: null, calendar: null, dayMap: new Map() });
      return;
    }
    let cancelled = false;
    const { from, to } = rangeFromToday(WINDOW_DAYS);
    setState((s) => ({ ...s, loading: true, error: null }));
    fetchRentalCalendar({
      serviceType,
      cabinType,
      dateFrom: from,
      dateTo: to,
    })
      .then((cal) => {
        if (cancelled) return;
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
      .catch((err) => {
        if (cancelled) return;
        setState({
          loading: false,
          error: err instanceof Error ? err : new Error(String(err)),
          calendar: null,
          dayMap: new Map(),
        });
      });
    return () => {
      cancelled = true;
    };
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
    let cancelled = false;
    const { from, to } = rangeFromToday(WINDOW_DAYS);
    setState((s) => ({ ...s, loading: true, error: null }));
    fetchSanitationCalendar({ dateFrom: from, dateTo: to })
      .then((cal) => {
        if (cancelled) return;
        const dayMap = new Map<string, { trucksAvailable: number; cleanersAvailable: number }>();
        for (const d of cal.days) {
          dayMap.set(d.date, {
            trucksAvailable: d.trucks_available,
            cleanersAvailable: d.cleaners_available,
          });
        }
        setState({ loading: false, error: null, calendar: cal, dayMap });
      })
      .catch((err) => {
        if (cancelled) return;
        setState({
          loading: false,
          error: err instanceof Error ? err : new Error(String(err)),
          calendar: null,
          dayMap: new Map(),
        });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
