import { delay } from 'shared/lib/delay';

type MockTabs = {
  getCurrent: (callback?: (tab?: chrome.tabs.Tab) => void) => Promise<chrome.tabs.Tab | undefined | void>;
  create: (
    createProperties: chrome.tabs.CreateProperties,
    callback?: (tab: chrome.tabs.Tab) => void,
  ) => Promise<chrome.tabs.Tab | void>;
  group: (options: chrome.tabs.GroupOptions, callback: (groupId: number) => void) => Promise<number | void>;
};

export const mockTabs: MockTabs = {
  getCurrent: async (callback) => {
    await delay();
    console.log('getCurrentTab');
    if (callback) {
      callback(mockActiveTab);
    } else {
      return mockActiveTab;
    }
  },
  create: async (createProperties, callback) => {
    await delay();
    const newTab = {
      ...mockActiveTab,
      ...createProperties,
    };
    console.log('createTab');
    if (callback) {
      callback(newTab);
    } else {
      return newTab;
    }
  },
  group: async (_, callback) => {
    await delay();
    const groupId = Math.floor(Math.random() * 1000);
    console.log('groupTab');
    if (callback) {
      callback(groupId);
    } else {
      return groupId;
    }
  },
};

const mockActiveTab: chrome.tabs.Tab = {
  index: 0,
  pinned: false,
  highlighted: false,
  windowId: 0,
  active: true,
  frozen: false,
  incognito: false,
  selected: false,
  discarded: false,
  autoDiscardable: false,
  groupId: 0,
};
