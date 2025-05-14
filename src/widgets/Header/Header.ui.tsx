import { memo } from 'react';

import { ActionIcon, Group, ScrollArea, Tabs, TextInput } from '@mantine/core';
import { useHotkeys } from '@mantine/hooks';

import { useCreateFolder } from '@features/createFolder';
import { useRenameFolder } from '@features/editFolder';

import { useBookmarkStore } from '@entities/bookmark';

import { AddFolderIcon } from '@shared/icons';

import { NUMBER_HOTKEYS } from './Header.const';
import { getIndexByKeyboardNumber } from './Header.lib';

import styles from './Header.module.scss';

const Header: React.FC = () => {
  const { folders, selectedFolderId, setSelectedFolderId } = useBookmarkStore();
  const { showInput: showCreateInput, isInput: isCreateInput, inputProps: createInputProps } = useCreateFolder();
  const { showInput: showEditInput, editableId, inputProps: editInputProps } = useRenameFolder();

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
              <Tabs.Tab
                classNames={{ tab: folder.id === editableId ? styles.editTab : '', tabLabel: styles.tabLabel }}
                key={folder.id}
                value={folder.id}
                onDoubleClick={(event) => {
                  event.preventDefault();
                  showEditInput(folder.id);
                }}
                maw={120}
              >
                {folder.id === editableId ? (
                  <TextInput defaultValue={folder.title} p={0} size="xs" {...editInputProps} />
                ) : (
                  folder.title
                )}
              </Tabs.Tab>
            ))}
            {isCreateInput && <TextInput size="xs" {...createInputProps} />}
          </Tabs.List>
        </Tabs>
        <ActionIcon size="input-sm" onClick={showCreateInput}>
          <AddFolderIcon />
        </ActionIcon>
      </Group>
    </ScrollArea>
  );
};

export default memo(Header);
