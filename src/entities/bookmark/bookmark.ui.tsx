import React, { memo } from 'react';

import { Anchor, Divider, Group, Image, Stack, StackProps, Text, Title } from '@mantine/core';

import { FolderIcon } from '@shared/icons';
import { getFaviconUrl } from '@shared/lib/getFaviconUrl';

import { FolderChildren } from './bookmark.model';

import styles from './bookmark.module.scss';

type BookmarkItemProps = {
  title: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  url?: string;
};

export type BookmarkFolderProps = {
  title: string;
  bookmarkTree: FolderChildren['children'];
  className?: StackProps['className'];
  onClickBookmark?: BookmarkItemProps['onClick'];
};

const BookmarkItem: React.FC<BookmarkItemProps> = ({ title, onClick, url }) => {
  return (
    <Anchor component="button" onClick={onClick} data-url={url} className={styles.bookmarkItem}>
      <Group gap="xs" wrap="nowrap">
        <Image src={getFaviconUrl(url ?? '')} alt="" w={16} h={16} />
        <Text size="sm" truncate role="link">
          {title}
        </Text>
      </Group>
    </Anchor>
  );
};

export const BookmarkFolder: React.FC<BookmarkFolderProps> = memo(function BookmarkFolder({
  title,
  className,
  bookmarkTree,
  onClickBookmark,
}) {
  return (
    <Stack gap="xs" className={className} maw={250}>
      <Group wrap="nowrap" gap="xs">
        <FolderIcon size={18} />
        <Title lineClamp={1} order={4}>
          {title}
        </Title>
      </Group>

      <Stack gap={2} pos="relative" pl="xs">
        <Divider pos="absolute" left={0} orientation="vertical" h="100%" />
        {bookmarkTree?.map((bookmark) => {
          if (bookmark.children) {
            return (
              <BookmarkFolder
                key={bookmark.id}
                title={bookmark.title}
                bookmarkTree={bookmark.children}
                onClickBookmark={onClickBookmark}
              />
            );
          }

          return <BookmarkItem key={bookmark.id} url={bookmark.url} title={bookmark.title} onClick={onClickBookmark} />;
        })}
      </Stack>
    </Stack>
  );
});
