import { delay } from 'shared/lib/delay';

type TabGroup = chrome.tabGroups.TabGroup;

type MockTabGroups = {
  query: (queryInfo: chrome.tabGroups.QueryInfo, callback?: (result: TabGroup[]) => void) => Promise<TabGroup[] | void>;
  update: (
    groupId: number,
    updateProperties: chrome.tabGroups.UpdateProperties,
    callback?: (group: TabGroup) => void,
  ) => Promise<TabGroup | void>;
  move: (
    groupId: number,
    moveProperties: chrome.tabGroups.MoveProperties,
    callback?: (group: TabGroup) => void,
  ) => Promise<TabGroup | void>;
  get: (groupId: number, callback?: (group: TabGroup) => void) => Promise<TabGroup | void>;
};

const mockTabGroup: TabGroup = {
  id: 1,
  collapsed: false,
  color: 'blue',
  title: 'Mock Group',
  windowId: 1,
};

const tabGroupsCollection: TabGroup[] = [
  { ...mockTabGroup, id: 1, title: 'Work', color: 'red' },
  { ...mockTabGroup, id: 2, title: 'Personal', color: 'blue' },
  { ...mockTabGroup, id: 3, title: 'Shopping', color: 'green' },
];

export const mockTabGroups: MockTabGroups = {
  query: async (queryInfo, callback) => {
    await delay();
    console.log('queryTabGroups', queryInfo);

    let result = [...tabGroupsCollection];
    if (queryInfo.windowId !== undefined) {
      result = result.filter((group) => group.windowId === queryInfo.windowId);
    }
    if (queryInfo.collapsed !== undefined) {
      result = result.filter((group) => group.collapsed === queryInfo.collapsed);
    }
    if (queryInfo.title !== undefined) {
      result = result.filter((group) => group.title === queryInfo.title);
    }
    if (queryInfo.color !== undefined) {
      result = result.filter((group) => group.color === queryInfo.color);
    }

    if (callback) {
      callback(result);
    } else {
      return result;
    }
  },

  update: async (groupId, updateProperties, callback) => {
    await delay();
    console.log('updateTabGroup', groupId, updateProperties);

    const existingGroupIndex = tabGroupsCollection.findIndex((group) => group.id === groupId);
    if (existingGroupIndex === -1) {
      const error = new Error(`Tab group with id ${groupId} not found`);
      console.error(error);
      throw error;
    }

    const updatedGroup = {
      ...tabGroupsCollection[existingGroupIndex],
      ...updateProperties,
    };
    tabGroupsCollection[existingGroupIndex] = updatedGroup;

    if (callback) {
      callback(updatedGroup);
    } else {
      return updatedGroup;
    }
  },

  move: async (groupId, moveProperties, callback) => {
    await delay();
    console.log('moveTabGroup', groupId, moveProperties);

    const existingGroupIndex = tabGroupsCollection.findIndex((group) => group.id === groupId);
    if (existingGroupIndex === -1) {
      const error = new Error(`Tab group with id ${groupId} not found`);
      console.error(error);
      throw error;
    }

    if (moveProperties.windowId !== undefined) {
      tabGroupsCollection[existingGroupIndex].windowId = moveProperties.windowId;
    }

    const movedGroup = tabGroupsCollection[existingGroupIndex];

    if (callback) {
      callback(movedGroup);
    } else {
      return movedGroup;
    }
  },

  get: async (groupId, callback) => {
    await delay();
    console.log('getTabGroup', groupId);

    const group = tabGroupsCollection.find((group) => group.id === groupId);
    if (!group) {
      const error = new Error(`Tab group with id ${groupId} not found`);
      console.error(error);
      throw error;
    }

    if (callback) {
      callback(group);
    } else {
      return group;
    }
  },
};
