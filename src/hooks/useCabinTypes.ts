import { useEffect, useState } from "react";
import { fetchJson } from "../services/apiClient";

export type CabinTypeDTO = {
  id: number;
  name: string;
  slug: string;
  description: string;
  photo: string | null;
  block_periods: Array<{
    date_from: string;
    date_to: string;
    reason_text: string;
  }>;
};

export type CabinTypeScenario = "rental" | "construction";

export function useCabinTypes(scenario: CabinTypeScenario) {
  const [types, setTypes] = useState<CabinTypeDTO[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchJson<CabinTypeDTO[]>(`/catalog/cabin-types/?scenario=${scenario}`)
      .then((data) => {
        if (cancelled) return;
        setTypes(data);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [scenario]);

  return { types, loading, error };
}

/** Map UI slug → backend slug. Frontend historically used 'lux'. */
const UI_TO_BACKEND: Record<string, string> = {
  standard: "standard",
  lux: "luxury",
  luxury: "luxury",
  vip: "vip",
};

export function findCabinIdBySlug(
  types: CabinTypeDTO[] | null,
  uiSlug: string,
): number | null {
  if (!types) return null;
  const backendSlug = UI_TO_BACKEND[uiSlug] ?? uiSlug;
  const found = types.find((t) => t.slug === backendSlug);
  return found ? found.id : null;
}
