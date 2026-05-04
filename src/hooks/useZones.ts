import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
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
  const { i18n } = useTranslation();
  const [state, setState] = useState<UseZonesReturn>(EMPTY);

  // FE-DT-004: locale dep so the zones overlay re-keys + refetches when
  // the user switches language.
  useEffect(() => {
    if (!serviceType) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
        console.warn("useZones: fetch failed, overlay disabled", err);
        setState({ zones: null, loading: false, error: err as Error });
      });

    return () => ctrl.abort();
  }, [serviceType, i18n.language]);

  return state;
}
