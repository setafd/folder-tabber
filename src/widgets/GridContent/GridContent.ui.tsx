import { memo, useCallback, useLayoutEffect, useRef } from 'react';

import { Box, Button, Stack, Text } from '@mantine/core';
import { modals } from '@mantine/modals';

import Packery from 'packery';
import { useStore } from 'zustand';

import {
  BookmarkFolder,
  BookmarkItem,
  type BookmarkItemProps,
  FolderChildren,
  bookmarkStore,
} from '@entities/bookmark';
import { openTab } from '@entities/tab';

import { useBookmarks } from './GridContent.lib';

const GridContent: React.FC = () => {
  const { folders, isEmpty, title } = useBookmarks();

  const gridRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (isEmpty) {
      return;
    }
    new Packery(gridRef.current, {
      itemSelector: '.element-item',
      gutter: 8,
      columnWidth: 250,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folders]);

  const onClickBookmark = useCallback<Required<BookmarkItemProps>['onClick']>(
    (event) => {
      event.preventDefault();
      const inCurrent = !event.ctrlKey;
      const url = event.currentTarget.dataset.url!;

      openTab(url, title!, inCurrent);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [folders],
  );

  const onCreateBookmark = useCallback((parentId?: string) => {
    modals.openContextModal({ modal: 'create-bookmark', innerProps: { parentId }, title: 'Create bookmark' });
  }, []);

  const onEditBookmark = useCallback(( type: 'Bookmark' | 'Folder', id: string, title: string, url?: string) => {
    const modalTitle = type === 'Bookmark' ? 'Edit bookmark' : 'Edit folder';
    modals.openContextModal({ modal: 'edit-bookmark', innerProps: { id, title, url, option: type }, title: modalTitle });
  }, []);

  if (isEmpty) {
    return <EmptyContent onCreateBookmark={onCreateBookmark} />;
  }

  return (
    <Box ref={gridRef}>
      <FolderWrapper
        folders={folders}
        className="element-item"
        onClickBookmark={onClickBookmark}
        onClickCreateButton={onCreateBookmark}
        onClickEditButton={onEditBookmark}
      />
    </Box>
  );
};

export default memo(GridContent);

type EmptyContentProps = {
  onCreateBookmark: (parentId?: string) => void;
};

const EmptyContent: React.FC<EmptyContentProps> = ({ onCreateBookmark }) => {
  const parentId = useStore(bookmarkStore, (state) => state.selectedFolder?.id);
  return (
    <Stack
      align="center"
      justify="center"
      h="calc(100vh - var(--app-shell-header-height, 0px) - var(--app-shell-padding) * 2)"
    >
      <Text>No bookmarks found in this folder</Text>
      <Button onClick={() => onCreateBookmark(parentId)} variant="subtle">
        Add bookmark
      </Button>
    </Stack>
  );
};

const FolderWrapper = ({
  folders,
  className,
  onClickBookmark,
  onClickCreateButton,
  onClickEditButton,
}: {
  folders: FolderChildren[];
  className?: string;
  onClickBookmark: BookmarkItemProps['onClick'];
  onClickCreateButton: (parentId?: string) => void;
  onClickEditButton: (type: 'Bookmark' | 'Folder', id: string, title: string, url?: string) => void;
}) => {
  return folders.map((folder) => {
    return (
      <BookmarkFolder
        key={folder.id}
        id={folder.id}
        title={folder.title}
        className={className}
        onClickCreateButton={() => onClickCreateButton(folder.id)}
        onEdit={onClickEditButton}
      >
        {folder.children?.map((bookmark) => {
          return bookmark.children ? (
            <FolderWrapper
              key={bookmark.id}
              folders={[bookmark]}
              onClickBookmark={onClickBookmark}
              onClickCreateButton={() => onClickCreateButton(bookmark.id)}
              onClickEditButton={onClickEditButton}
            />
          ) : (
            <BookmarkItem
              key={bookmark.id}
              id={bookmark.id}
              url={bookmark.url}
              title={bookmark.title}
              onClick={onClickBookmark}
              onEdit={onClickEditButton}
            />
          );
        })}
      </BookmarkFolder>
    );
  });
};
