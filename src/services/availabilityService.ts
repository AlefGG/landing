import { fetchJson } from "./apiClient";

export type RentalServiceType =
  | "rental_event"
  | "rental_emergency"
  | "rental_construction";

export type CalendarServiceType = RentalServiceType | "sanitation";

export type RentalDay = {
  date: string;
  available_count: number;
  blocked: boolean;
  block_reason: string | null;
};

export type SanitationDay = {
  date: string;
  trucks_available: number;
  cleaners_available: number;
};

export type RentalCalendar = {
  cabin_type: string;
  fleet_size: number;
  days: RentalDay[];
};

export type SanitationCalendar = {
  fleet_trucks: number;
  fleet_cleaners: number;
  days: SanitationDay[];
};

function iso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function fetchRentalCalendar(params: {
  serviceType: RentalServiceType;
  cabinType: number;
  dateFrom: Date;
  dateTo: Date;
}): Promise<RentalCalendar> {
  const qs = new URLSearchParams({
    service_type: params.serviceType,
    cabin_type: String(params.cabinType),
    date_from: iso(params.dateFrom),
    date_to: iso(params.dateTo),
  });
  return fetchJson<RentalCalendar>(`/orders/availability/calendar/?${qs}`);
}

export async function fetchSanitationCalendar(params: {
  dateFrom: Date;
  dateTo: Date;
}): Promise<SanitationCalendar> {
  const qs = new URLSearchParams({
    service_type: "sanitation",
    date_from: iso(params.dateFrom),
    date_to: iso(params.dateTo),
  });
  return fetchJson<SanitationCalendar>(`/orders/availability/calendar/?${qs}`);
}
