import { useEffect, useRef } from 'react';

const shouldFireEvent = (event: KeyboardEvent, tagsToIgnore: string[], triggerOnContentEditable = false) => {
  if (event.target instanceof HTMLElement) {
    if (triggerOnContentEditable) {
      return !tagsToIgnore.includes(event.target.tagName);
    }

    return !event.target.isContentEditable && !tagsToIgnore.includes(event.target.tagName);
  }

  return true;
};

export const useHotkeys = <const T extends readonly string[]>(
  keys: T,
  callback: (key: T[number]) => void,
  preventDefault = true,
  tagsToIgnore: string[] = ['INPUT', 'TEXTAREA', 'SELECT'],
  triggerOnContentEditable = false,
) => {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (keys.includes(event.key) && shouldFireEvent(event, tagsToIgnore, triggerOnContentEditable)) {
        if (preventDefault) event.preventDefault();
        callbackRef.current(event.key);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [keys, preventDefault, tagsToIgnore, triggerOnContentEditable]);
};
