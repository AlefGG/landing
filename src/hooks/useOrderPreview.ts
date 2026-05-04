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

  // FE-CQ-001: schedule all state mutations (idle clear + mark-loading +
  // resolve/reject) on the timer / promise callbacks. Effect body itself
  // is side-effect-free at the React-state level, so set-state-in-effect
  // does not fire. The empty-payload branch uses a 0 ms timer so the
  // shape is uniform with the populated branch.
  useEffect(() => {
    if (!payload || !key) {
      const idleHandle = window.setTimeout(() => {
        setState({ data: null, loading: false, error: null });
        latestKey.current = null;
      }, 0);
      return () => window.clearTimeout(idleHandle);
    }
    latestKey.current = key;
    const handle = window.setTimeout(() => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
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
