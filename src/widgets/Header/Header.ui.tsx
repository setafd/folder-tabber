import { memo } from 'react';

import { ActionIcon, Group, Input, ScrollArea, Tabs } from '@mantine/core';
import { useHotkeys } from '@mantine/hooks';

import { useCreateFolder } from '@features/createFolder';

import { useBookmarkStore } from '@entities/bookmark';

import { AddFolderIcon } from '@shared/icons';

import { NUMBER_HOTKEYS } from './Header.const';
import { getIndexByKeyboardNumber } from './Header.lib';

import styles from './Header.module.scss';

const Header: React.FC = () => {
  const { folders, selectedFolderId, setSelectedFolderId } = useBookmarkStore();
  const { showInput, isInput, inputProps } = useCreateFolder();

  const onChangeFolder = (value: string | null) => {
    if (value) {
      setSelectedFolderId(value);
    }
  };

  useHotkeys(
    NUMBER_HOTKEYS.map((key) => [key, () => onChangeFolder(folders?.[getIndexByKeyboardNumber(key)]?.id || null)]),
  );

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
            {isInput && <Input p={0} size="xs" {...inputProps} />}
          </Tabs.List>
        </Tabs>
        <ActionIcon size="input-sm" onClick={showInput}>
          <AddFolderIcon />
        </ActionIcon>
      </Group>
    </ScrollArea>
  );
};

export default memo(Header);
