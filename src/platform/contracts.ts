import type { BookmarkCreate, BookmarkMove, BookmarkNode, BookmarkUpdate } from '@/bookmarks/model/types';

export type BrowserPlatform = {
  bookmarks: {
    getTree: () => Promise<BookmarkNode[]>;
    getSubTree: (id: string) => Promise<BookmarkNode[]>;
    create: (details: BookmarkCreate) => Promise<BookmarkNode>;
    update: (id: string, changes: BookmarkUpdate) => Promise<BookmarkNode>;
    move: (id: string, destination: BookmarkMove) => Promise<BookmarkNode>;
    remove: (id: string) => Promise<void>;
    removeTree: (id: string) => Promise<void>;
    subscribe: (listener: () => void) => () => void;
  };
  storage: {
    getItem: (name: string) => Promise<string | null>;
    setItem: (name: string, value: string) => Promise<void>;
    removeItem: (name: string) => Promise<void>;
  };
  tabs: {
    open: (url: string, groupTitle: string, inCurrent: boolean) => Promise<void>;
  };
  favicons: {
    fallback: string;
    getUrl: (url: string) => string;
    subscribe: (listener: () => void) => () => void;
  };
};
