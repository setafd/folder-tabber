type MockRuntime = {
  lastError: chrome.runtime.LastError | undefined;
  getURL: (path: string) => string;
};

export const mockRuntime: MockRuntime = {
  lastError: undefined,
  getURL: () => {
    // This service ignores path params so can return google icon in any case
    return 'https://icon.horse/icon/google.com';
  },
};
