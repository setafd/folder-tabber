export const getBookmarksTree = async (): Promise<chrome.bookmarks.BookmarkTreeNode[]> => {
  return new Promise((resolve, reject) => {
    chrome.bookmarks.getTree((nodes) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError?.message));
      } else {
        resolve(nodes[0].children ?? []);
      }
    })
  });
};

export const getSubTree = async (id: string): Promise<chrome.bookmarks.BookmarkTreeNode[]> => {
  return new Promise((resolve, reject) => {
    chrome.bookmarks.getSubTree(id, (nodes) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError?.message));
      } else {
        resolve(nodes);
      }
    });
  });
};

export const editBookmark = (id: string, changes: chrome.bookmarks.UpdateChanges) =>
  chrome.bookmarks.update(id, changes);

export const createBookmark = (bookmark: chrome.bookmarks.CreateDetails) =>
  chrome.bookmarks.create(bookmark);

export const deleteBookmark = (id: string) => chrome.bookmarks.remove(id);

export const deleteBookmarkTree = (id: string) => chrome.bookmarks.removeTree(id);
