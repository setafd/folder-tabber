import { memo, useCallback, useLayoutEffect, useRef } from 'react';

import { Box, Button, Stack, Text } from '@mantine/core';

import Packery from 'packery';

import { BookmarkFolder, type BookmarkFolderProps } from '@entities/bookmark';
import { openTab } from '@entities/tab';

import { useBookmarks } from './GridContent.lib';

const GridContent: React.FC = () => {
  const { bookmarks, isEmpty, title } = useBookmarks();

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
  }, [bookmarks]);

  const onClickBookmark = useCallback<Required<BookmarkFolderProps>['onClickBookmark']>(
    (event) => {
      event.preventDefault();
      const inCurrent = !event.ctrlKey;
      const url = event.currentTarget.dataset.url!;

      openTab(url, title!, inCurrent);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bookmarks],
  );

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
            onClickBookmark={onClickBookmark}
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
