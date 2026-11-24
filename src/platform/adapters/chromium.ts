import { type NativeBrowser, createNativePlatform } from './native';

export const createChromiumPlatform = (api: NativeBrowser) =>
  createNativePlatform(api, { moveIndex: 'before-removal', favicons: 'chromium' });
