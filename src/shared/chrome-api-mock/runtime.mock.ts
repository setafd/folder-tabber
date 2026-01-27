type MockRuntime = {
  lastError: chrome.runtime.LastError | undefined;
  getURL: (path: string) => string;
  getManifest: () => chrome.runtime.Manifest;
};

export const mockRuntime: MockRuntime = {
  lastError: undefined,
  getURL: () => {
    // This service ignores path params so can return google icon in any case
    return 'https://icon.horse/icon/google.com';
  },
  getManifest: () => {
    return {
      manifest_version: 3,
      name: 'Bookmark Extension',
      version: 'dev-version'
    }
  }
};
