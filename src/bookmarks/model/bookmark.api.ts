import { platform } from '@/platform';

export const getBookmarksTree = platform.bookmarks.getTree;
export const getSubTree = platform.bookmarks.getSubTree;
export const editBookmark = platform.bookmarks.update;
export const createBookmark = platform.bookmarks.create;
export const deleteBookmark = platform.bookmarks.remove;
export const deleteBookmarkTree = platform.bookmarks.removeTree;
export const moveBookmark = platform.bookmarks.move;
