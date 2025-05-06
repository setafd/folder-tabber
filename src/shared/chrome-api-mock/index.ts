import { mockBookmark } from './bookmark.mock';
import { mockRuntime } from './runtime.mock';
import { mockTabs } from './tab.mock';
import { mockTabGroups } from './tabGroups.mock';

export const mockChrome = {
  bookmarks: mockBookmark,
  tabs: mockTabs,
  tabGroups: mockTabGroups,
  runtime: mockRuntime,
};
