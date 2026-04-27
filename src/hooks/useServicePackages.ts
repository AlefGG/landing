import { useEffect, useState } from "react";
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
  const [state, setState] = useState<UseServicePackagesReturn>(INITIAL);

  useEffect(() => {
    let cancelled = false;
    fetchPublicServicePackages()
      .then((packages) => {
        if (cancelled) return;
        setState({ packages, loading: false, error: null });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        console.warn("useServicePackages: fetch failed", err);
        setState({ packages: [], loading: false, error: err as Error });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
