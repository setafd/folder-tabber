import { useEffect, useState } from 'react';

export type UseMediaQueryOptions = {
  getInitialValueInEffect: boolean;
};

function attachMediaListener(query: MediaQueryList, callback: (event: MediaQueryListEvent) => void) {
  query.addEventListener('change', callback);
  return () => query.removeEventListener('change', callback);
}

function getInitialValue(query: string) {
  if (typeof window !== 'undefined' && 'matchMedia' in window) {
    return window.matchMedia(query).matches;
  }
  return false;
}

export function useMediaQuery(
  query: string,
  initialValue: boolean,
  { getInitialValueInEffect }: UseMediaQueryOptions = {
    getInitialValueInEffect: true,
  },
) {
  const [matches, setMatches] = useState(getInitialValueInEffect ? initialValue : getInitialValue(query));

  useEffect(() => {
    try {
      const mediaQuery = window.matchMedia(query);
      setMatches(mediaQuery.matches);
      return attachMediaListener(mediaQuery, (event) => setMatches(event.matches));
    } catch {
      return void 0;
    }
  }, [query]);
  return matches || false;
}
