import { platform } from '@/platform';

export const openTab = async (url: string, groupTitle: string, inCurrent: boolean) => {
  try {
    await platform.tabs.open(url, groupTitle, inCurrent);
  } catch (error) {
    console.error(`Error opening tab: ${error}`);
  }
};
