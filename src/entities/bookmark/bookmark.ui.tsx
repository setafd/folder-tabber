import React, { PropsWithChildren, memo } from 'react';

import {
  ActionIcon,
  Anchor,
  Box,
  Divider,
  type ElementProps,
  Group,
  Image,
  Stack,
  type StackProps,
  Text,
  Title,
} from '@mantine/core';

import { AddBookmarkIcon, EditIcon, FolderIcon } from '@shared/icons';
import { getFaviconUrl } from '@shared/lib/getFaviconUrl';

import styles from './bookmark.module.scss';

export type BookmarkItemProps = {
  id: string;
  title: string;
  url?: string;
  onClick: React.MouseEventHandler<HTMLButtonElement>;
  onEdit: (type: 'Bookmark', id: string, title: string, url?: string) => void;
};

export const BookmarkItem: React.FC<BookmarkItemProps> = ({ id, title, url, onClick, onEdit }) => {
  return (
    <Group p={4} wrap="nowrap" className={styles.bookmarkItem} gap={2} justify="space-between">
      <Anchor component="button" onClick={onClick} data-url={url} className={styles.bookmarkLink}>
        <Group gap="xs" wrap="nowrap">
          <Image src={getFaviconUrl(url ?? '')} alt="" maw={16} mah={16} w="100%" h="100%" />
          <Text size="sm" truncate role="link">
            {title}
          </Text>
        </Group>
      </Anchor>
      <Box className={styles.editBookmarkButton}>
        <EditBookmarkButton
          onClick={(e) => {
            e.stopPropagation();
            onEdit('Bookmark', id, title, url);
          }}
        />
      </Box>
    </Group>
  );
};

export type BookmarkFolderProps = {
  id: string;
  title: string;
  className?: StackProps['className'];
  onClickCreateButton: () => void;
  onEdit: (type: 'Folder', id: string, title: string) => void;
};

export const BookmarkFolder: React.FC<PropsWithChildren<BookmarkFolderProps>> = memo(function BookmarkFolder({
  id,
  title,
  className,
  children,
  onClickCreateButton,
  onEdit,
}) {
  return (
    <Stack gap={0} className={className} w="100%" maw={250}>
      <Group p={4} className={styles.folderItem} wrap="nowrap" gap={4}>
        <FolderIcon size={18} />
        <Title lineClamp={1} order={4} flex={1}>
          {title}
        </Title>
        <Box className={styles.editFolderButton}>
          <EditBookmarkButton
            onClick={(e) => {
              e.stopPropagation();
              onEdit('Folder', id, title);
            }}
          />
        </Box>
        <Box className={styles.creteButton}>
          <CreateBookmarkButton onClick={onClickCreateButton} />
        </Box>
      </Group>

      <Stack gap={0} pos="relative" pl="xs" className={styles.folderContent}>
        <Divider pos="absolute" left={0} orientation="vertical" h="100%" />
        {children}
      </Stack>
    </Stack>
  );
});

type IconProps = ElementProps<'button'>;

export const CreateBookmarkButton: React.FC<IconProps> = (props) => {
  return (
    <ActionIcon size="compact-xs" variant="subtle" {...props}>
      <AddBookmarkIcon width={18} height={18} />
    </ActionIcon>
  );
};

export const EditBookmarkButton: React.FC<IconProps> = (props) => {
  return (
    <ActionIcon size="compact-xs" variant="subtle" {...props}>
      <EditIcon width={18} height={18} />
    </ActionIcon>
  );
};
