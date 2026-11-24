export type BookmarkKind = 'bookmark' | 'folder' | 'separator';

export type BookmarkNode = {
  id: string;
  title: string;
  parentId?: string;
  index?: number;
  type?: BookmarkKind;
  readOnly?: boolean;
  url?: string;
  children?: BookmarkNode[];
};

export type BookmarkCreate = {
  parentId: string;
  title?: string;
  url?: string;
  index?: number;
};

export type BookmarkUpdate = {
  title?: string;
  url?: string;
};

export type BookmarkMove = {
  parentId: string;
  index: number;
  previousParentId: string;
  previousIndex: number;
};
