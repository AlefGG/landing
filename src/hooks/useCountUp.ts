import { useState, useEffect, useRef } from "react";

type UseCountUpOptions = {
  end: number;
  duration?: number;
  start?: number;
  enabled?: boolean;
};

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export function useCountUp({
  end,
  duration = 2000,
  start = 0,
  enabled = true,
}: UseCountUpOptions) {
  const [value, setValue] = useState(start);
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!enabled) {
      // Intentionally do not reset value synchronously — initial state already equals `start`,
      // and the counter is expected to run once when enabled flips on.
      return;
    }

    if (duration <= 0) {
      // Zero-duration (reduced motion): jump to the final value in a microtask
      // to avoid a synchronous setState cascade during the effect body.
      const id = requestAnimationFrame(() => setValue(end));
      return () => cancelAnimationFrame(id);
    }

    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);
      setValue(Math.round(start + (end - start) * eased));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [end, duration, start, enabled]);

  return value;
}
