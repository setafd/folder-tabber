import { type NativeBrowser, createNativePlatform } from './native';

export const createFirefoxPlatform = (api: NativeBrowser) =>
  createNativePlatform(api, { moveIndex: 'after-removal', favicons: 'tabs', dataConsent: true });
