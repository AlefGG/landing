import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  fetchPublicServicePackages,
  type ServicePackageDTO,
} from "../services/servicePackagesService";

type UseServicePackagesReturn = {
  packages: ServicePackageDTO[];
  loading: boolean;
  error: Error | null;
};

const INITIAL: UseServicePackagesReturn = {
  packages: [],
  loading: true,
  error: null,
};

export function useServicePackages(): UseServicePackagesReturn {
  const { i18n } = useTranslation();
  const [state, setState] = useState<UseServicePackagesReturn>(INITIAL);

  // FE-DT-004: refetch on locale change (cache key includes locale).
  useEffect(() => {
    const ctrl = new AbortController();
    fetchPublicServicePackages(ctrl.signal)
      .then((packages) => {
        if (ctrl.signal.aborted) return;
        setState({ packages, loading: false, error: null });
      })
      .catch((err: unknown) => {
        if (ctrl.signal.aborted) return;
        if ((err as Error).name === "AbortError") return;
        console.warn("useServicePackages: fetch failed", err);
        setState({ packages: [], loading: false, error: err as Error });
      });
    return () => ctrl.abort();
  }, [i18n.language]);

  return state;
}
