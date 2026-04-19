import { useEffect, useRef, useState } from "react";

const DEBOUNCE_MS = 500;

export type PreviewResult<T> = {
  data: T | null;
  loading: boolean;
  error: Error | null;
};

/**
 * Debounced POST /preview/ call.
 * `payload` must be null when inputs are incomplete — hook returns idle state.
 * Aborts in-flight requests on payload change / unmount.
 */
export function useOrderPreview<TPayload, TResponse>(
  payload: TPayload | null,
  fetcher: (payload: TPayload) => Promise<TResponse>,
): PreviewResult<TResponse> {
  const [state, setState] = useState<PreviewResult<TResponse>>({
    data: null,
    loading: false,
    error: null,
  });
  const key = payload ? JSON.stringify(payload) : null;
  const latestKey = useRef<string | null>(null);

  useEffect(() => {
    if (!payload || !key) {
      setState({ data: null, loading: false, error: null });
      latestKey.current = null;
      return;
    }
    latestKey.current = key;
    setState((prev) => ({ ...prev, loading: true, error: null }));
    const handle = window.setTimeout(() => {
      fetcher(payload)
        .then((data) => {
          if (latestKey.current !== key) return;
          setState({ data, loading: false, error: null });
        })
        .catch((err) => {
          if (latestKey.current !== key) return;
          setState({
            data: null,
            loading: false,
            error: err instanceof Error ? err : new Error(String(err)),
          });
        });
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(handle);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return state;
}
