import { memo } from 'react';

import { Group, ScrollArea, Tabs } from '@mantine/core';
import { useHotkeys } from '@mantine/hooks';

import { useBookmarkStore } from '@entities/bookmark';

import styles from './Header.module.scss';

const Header: React.FC = () => {
  const { folders, selectedFolderId, setSelectedFolderId } = useBookmarkStore();

  const onChangeFolder = (value: string | null) => {
    if (value) {
      setSelectedFolderId(value);
    }
  };

  useHotkeys([
    ['1', () => folders?.[0] && onChangeFolder(folders[0].id)],
    ['2', () => folders?.[1] && onChangeFolder(folders[1].id)],
    ['3', () => folders?.[2] && onChangeFolder(folders[2].id)],
    ['4', () => folders?.[3] && onChangeFolder(folders[3].id)],
    ['5', () => folders?.[4] && onChangeFolder(folders[4].id)],
    ['6', () => folders?.[5] && onChangeFolder(folders[5].id)],
    ['7', () => folders?.[6] && onChangeFolder(folders[6].id)],
    ['8', () => folders?.[7] && onChangeFolder(folders[7].id)],
    ['9', () => folders?.[8] && onChangeFolder(folders[8].id)],
  ]);

  return (
    <ScrollArea classNames={{ viewport: styles.viewport }} display="flex" h="100%" scrollbars="x">
      <Group h="100%" align="center" justify="space-between" wrap="nowrap" px="sm">
        <Tabs variant="pills" value={selectedFolderId} onChange={onChangeFolder}>
          <Tabs.List>
            {folders.map((folder) => (
              <Tabs.Tab key={folder.id} value={folder.id}>
                {folder.title}
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs>
      </Group>
    </ScrollArea>
  );
};

export default memo(Header);
