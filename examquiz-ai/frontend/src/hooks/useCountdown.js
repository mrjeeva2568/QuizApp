import { useEffect, useRef, useState } from 'react';

/**
 * Second-by-second countdown. `initialSeconds` only seeds state on mount -
 * this hook doesn't react to it changing later; if the caller needs a fresh
 * countdown for a new value, mount a new instance (e.g. via a `key` prop on
 * the parent) rather than expecting a reset.
 *
 * `onExpire` is read through a ref so the interval scheduling itself only
 * depends on `secondsLeft`/`autoStart` - the caller can pass a new closure
 * every render (e.g. one that captures fresh state) without resetting the timer.
 */
export function useCountdown(initialSeconds, { onExpire, autoStart = true } = {}) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;
  const hasExpiredRef = useRef(false);

  useEffect(() => {
    if (!autoStart) return undefined;

    if (secondsLeft <= 0) {
      if (!hasExpiredRef.current) {
        hasExpiredRef.current = true;
        onExpireRef.current?.();
      }
      return undefined;
    }

    const timeout = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timeout);
  }, [secondsLeft, autoStart]);

  return secondsLeft;
}
