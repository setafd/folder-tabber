import { IS_DEV, IS_FIREFOX } from '@/lib/env';

import { createChromiumPlatform } from './adapters/chromium';
import { createFirefoxPlatform } from './adapters/firefox';
import type { NativeBrowser } from './adapters/native';
import { createMockPlatform } from './mock';

const nativeApi = () => {
  const scope = globalThis as typeof globalThis & { browser?: NativeBrowser };
  return IS_FIREFOX ? (scope.browser ?? scope.chrome) : scope.chrome;
};

export const platform = IS_DEV
  ? createMockPlatform()
  : IS_FIREFOX
    ? createFirefoxPlatform(nativeApi())
    : createChromiumPlatform(nativeApi());
export type { BrowserPlatform } from './contracts';
