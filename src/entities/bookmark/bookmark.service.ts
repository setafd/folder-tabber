import { createBookmark, deleteBookmark, deleteBookmarkTree, editBookmark } from './bookmark.api';
import { bookmarkStore } from './bookmark.model';

export const createBookmarkFolder = async (title: string) => {
  const possibleParentsIds = bookmarkStore.getState().rootParentsIds;
  if (possibleParentsIds.length === 0) {
    return;
  }
  const parentId = possibleParentsIds[possibleParentsIds.length - 1];

  const newFolder = await createBookmark({ title, parentId }).then((newFolder) => {
    const mappedFolder = {
      index: 0,
      id: newFolder.id,
      title: newFolder.title,
    };
    bookmarkStore.setState(({ folders }) => ({ folders: [...folders, mappedFolder] }));
    bookmarkStore.getState().fetchFolders();
  });

  return newFolder;
};

export const editBookmarkFolder = async (id: string, changes: chrome.bookmarks.UpdateChanges) => {
  return editBookmark(id, changes).then(() => {
    bookmarkStore.getState().fetchFolders();
  });
};

export const deleteBookmarkFolder = async (id: string, force: boolean = false) => {
  if (force) {
    return deleteBookmarkTree(id).then(() => {
      bookmarkStore.getState().fetchFolders();
    });
  }

  return deleteBookmark(id).then(() => {
    bookmarkStore.getState().fetchFolders();
  });
};
