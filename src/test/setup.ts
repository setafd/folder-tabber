globalThis.chrome ??= {} as typeof chrome;
globalThis.chrome.storage ??= {
  local: {
    get: async () => ({}),
    set: async () => {},
    remove: async () => {},
  },
} as unknown as typeof chrome.storage;
