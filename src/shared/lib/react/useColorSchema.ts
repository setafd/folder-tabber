import { UseMediaQueryOptions, useMediaQuery } from './useMediaQuery';

export function useColorScheme(initialValue: 'light' | 'dark', options?: UseMediaQueryOptions) {
  return useMediaQuery('(prefers-color-scheme: dark)', initialValue === 'dark', options) ? 'dark' : 'light';
}
