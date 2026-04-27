import { useEffect, useState } from "react";
import {
  fetchPublicZones,
  type ZoneServiceType,
  type ZonesFeatureCollection,
} from "../services/zonesService";

type UseZonesReturn = {
  zones: ZonesFeatureCollection | null;
  loading: boolean;
  error: Error | null;
};

const EMPTY: UseZonesReturn = { zones: null, loading: false, error: null };

export function useZones(serviceType: ZoneServiceType | null): UseZonesReturn {
  const [state, setState] = useState<UseZonesReturn>(EMPTY);

  useEffect(() => {
    if (!serviceType) {
      setState(EMPTY);
      return;
    }
    const ctrl = new AbortController();
    setState({ zones: null, loading: true, error: null });
    fetchPublicZones(serviceType, ctrl.signal)
      .then((zones) => {
        if (ctrl.signal.aborted) return;
        setState({ zones, loading: false, error: null });
      })
      .catch((err: unknown) => {
        if (ctrl.signal.aborted) return;
        if ((err as Error).name === "AbortError") return;
        // eslint-disable-next-line no-console
        console.warn("useZones: fetch failed, overlay disabled", err);
        setState({ zones: null, loading: false, error: err as Error });
      });

    return () => ctrl.abort();
  }, [serviceType]);

  return state;
}
