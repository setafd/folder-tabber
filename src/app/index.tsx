import React from 'react';

import '@mantine/core/styles.css';
import ReactDOM from 'react-dom/client';

import { mockChrome } from '@shared/chrome-api-mock';

import { App } from './app';

if (import.meta.env.DEV) {
  console.debug('Running in development mode, applying Chrome API mocks');
  if (typeof globalThis.chrome === 'undefined') {
    globalThis.chrome = {} as typeof chrome;
  }
  Object.assign(globalThis.chrome, mockChrome);
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
