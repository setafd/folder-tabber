export const getCurrentTab = async (): Promise<chrome.tabs.Tab | undefined> => {
  return new Promise((resolve, reject) => {
    chrome.tabs.getCurrent((tab) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError?.message));
      } else {
        resolve(tab);
      }
    });
  });
};

export const createTab = async (createProperties: chrome.tabs.CreateProperties): Promise<chrome.tabs.Tab> => {
  return new Promise((resolve, reject) => {
    chrome.tabs.create(createProperties, (tab) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError?.message));
      } else {
        resolve(tab);
      }
    });
  });
};

export const groupTabs = async (options: chrome.tabs.GroupOptions): Promise<number> => {
  return new Promise((resolve, reject) => {
    chrome.tabs.group(options, (groupId) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError?.message));
      } else {
        resolve(groupId);
      }
    });
  });
};
