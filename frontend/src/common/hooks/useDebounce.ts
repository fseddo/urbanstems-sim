import { useEffect, useState } from 'react';

// Returns a value that lags behind `value` by `ms` milliseconds, updating
// only once `value` has settled. Each change to `value` restarts the timer.
// Use it where you want render state (controlled inputs) to track the user
// instantly while expensive downstream work (e.g. network queries) waits
// for the typing to pause.

export const useDebounce = <T>(value: T, ms: number): T => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);

  return debounced;
};
