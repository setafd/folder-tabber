import { useEffect, useRef } from 'react';

export const useHotkeys = <const T extends readonly string[]>(
  keys: T,
  callback: (key: T[number]) => void,
  preventDefault = true
) => {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (keys.includes(event.key)) {
        if (preventDefault) event.preventDefault();
        callbackRef.current(event.key);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [keys, preventDefault]);
};
