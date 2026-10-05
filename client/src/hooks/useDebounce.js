import { useState, useEffect } from 'react';

/**
 * Custom hook that debounces a value by a specified delay.
 *
 * @param {any} value - The input value to debounce.
 * @param {number} [delay=400] - The debounce delay in milliseconds.
 * @returns {any} The debounced value.
 */
export default function useDebounce(value, delay = 400) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export { useDebounce };
