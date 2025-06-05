import { memo, useEffect, useRef } from 'react';

import { Box, Button, Stack, Text } from '@mantine/core';

import Packery from 'packery';

import { BookmarkFolder, type BookmarkFolderProps, openTab, useBookmarkStore } from '@entities/bookmark';

const GridContent: React.FC = () => {
  const { folderChildrens: bookmarks, selectedFolder } = useBookmarkStore();

  const gridRef = useRef<HTMLDivElement>(null);

  const isEmpty = bookmarks.length === 0;

  useEffect(() => {
    if (isEmpty) {
      return;
    }
    new Packery(gridRef.current, {
      itemSelector: '.element-item',
      gutter: 8,
      columnWidth: 250,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookmarks]);

  const onCreateBookmark = () => {
    // TBD
  };

  if (isEmpty) {
    return <EmptyContent onCreateBookmark={onCreateBookmark} />;
  }

  return (
    <Box ref={gridRef}>
      {bookmarks.map((bookmark) => {
        return (
          <BookmarkFolder
            key={bookmark.id}
            className="element-item"
            title={bookmark.title}
            bookmarkTree={bookmark.children}
          />
        );
      })}
    </Box>
  );
};

export default memo(GridContent);

type EmptyContentProps = {
  onCreateBookmark: () => void;
};

const EmptyContent: React.FC<EmptyContentProps> = ({ onCreateBookmark }) => {
  return (
    <Stack
      align="center"
      justify="center"
      h="calc(100vh - var(--app-shell-header-height, 0px) - var(--app-shell-padding) * 2)"
    >
      <Text>No bookmarks found in this folder</Text>
      <Button onClick={onCreateBookmark} variant="subtle">
        Add bookmark
      </Button>
    </Stack>
  );
};
