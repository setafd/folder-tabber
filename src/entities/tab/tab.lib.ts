export const openTab = async (url: string, groupTitle: string, inCurrent: boolean) => {
  try {
    let tab: chrome.tabs.Tab;
    if (inCurrent) {
      tab = (await chrome.tabs.getCurrent())!;
      window.open(url, '_self');
    } else {
      tab = await chrome.tabs.create({ url, active: false });
    }

    const group = (await chrome.tabGroups.query({ title: groupTitle }))?.[0];

    if (group) {
      await chrome.tabs.group({ tabIds: [tab.id!], groupId: group.id });
    } else {
      const groupId = await chrome.tabs.group({ tabIds: [tab.id!] });
      await chrome.tabGroups.update(groupId, { title: groupTitle });
    }
  } catch (error) {
    console.error(`Error opening tab: ${error}`);
  }
};
