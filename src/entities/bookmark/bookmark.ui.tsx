import React from 'react';

import { Divider, Group, Image, Stack, StackProps, Text, Title } from '@mantine/core';

import { FolderIcon } from '@shared/icons';
import { getFaviconUrl } from '@shared/lib/getFaviconUrl';

import { FolderChildren } from './bookmark.model';

import styles from './bookmark.module.scss';

type BookmarkItemProps = {
  title: string;
  onClick?: React.MouseEventHandler<HTMLParagraphElement>;
  url?: string;
};

type BookmarkFolderProps = {
  title: string;
  bookmarkTree: FolderChildren['children'];
  className?: StackProps['className'];
};

const BookmarkItem: React.FC<BookmarkItemProps> = ({ title, onClick, url }) => {
  return (
    <Group gap="xs" wrap="nowrap">
      <Image src={getFaviconUrl(url ?? '')} alt="" w={16} h={16} />
      <Text size="sm" className={styles.bookmarkItem} truncate role="link" onClick={onClick}>
        {title}
      </Text>
    </Group>
  );
};

export const BookmarkFolder: React.FC<BookmarkFolderProps> = ({ title, className, bookmarkTree }) => {
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
            return <BookmarkFolder key={bookmark.id} title={bookmark.title} bookmarkTree={bookmark.children} />;
          }

          return <BookmarkItem key={bookmark.id} url={bookmark.url} title={bookmark.title} />;
        })}
      </Stack>
    </Stack>
  );
};
