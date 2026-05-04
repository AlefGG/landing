import { useEffect, useState } from "react";

const DEBOUNCE_MS = 500;

export type PreviewResult<T> = {
  data: T | null;
  loading: boolean;
  error: Error | null;
};

/**
 * Debounced POST /preview/ call.
 * `payload` must be null when inputs are incomplete — hook returns idle state.
 * Aborts in-flight requests on payload change / unmount via AbortSignal.
 */
export function useOrderPreview<TPayload, TResponse>(
  payload: TPayload | null,
  fetcher: (
    payload: TPayload,
    opts?: { signal?: AbortSignal },
  ) => Promise<TResponse>,
): PreviewResult<TResponse> {
  const [state, setState] = useState<PreviewResult<TResponse>>({
    data: null,
    loading: false,
    error: null,
  });
  const key = payload ? JSON.stringify(payload) : null;

  // FE-CQ-001: schedule all state mutations on timer / promise callbacks.
  // FE-DT-005: signal-based abort instead of latestKey-filtering — the
  // server stops processing when the dep changes / hook unmounts, not just
  // its response getting dropped client-side.
  useEffect(() => {
    if (!payload || !key) {
      const idleHandle = window.setTimeout(() => {
        setState({ data: null, loading: false, error: null });
      }, 0);
      return () => window.clearTimeout(idleHandle);
    }
    const ctrl = new AbortController();
    const handle = window.setTimeout(() => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      fetcher(payload, { signal: ctrl.signal })
        .then((data) => {
          if (ctrl.signal.aborted) return;
          setState({ data, loading: false, error: null });
        })
        .catch((err: unknown) => {
          if (ctrl.signal.aborted) return;
          if ((err as Error).name === "AbortError") return;
          setState({
            data: null,
            loading: false,
            error: err instanceof Error ? err : new Error(String(err)),
          });
        });
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(handle);
      ctrl.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return state;
}
