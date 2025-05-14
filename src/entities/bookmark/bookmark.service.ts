import { createBookmark } from './bookmark.api';
import { bookmarkStore } from './bookmark.model';

export const createBookmarkFolder = async (title: string) => {
  const possibleParentsIds = bookmarkStore.getState().newFolderDestinationIds;
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
