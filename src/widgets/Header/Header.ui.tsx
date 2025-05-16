import { memo } from 'react';

import { ActionIcon, Group, ScrollArea, Tabs, TextInput } from '@mantine/core';
import { useHotkeys } from '@mantine/hooks';

import { useCreateFolder } from '@features/folder/create';
import { useDeleteFolder } from '@features/folder/delete';
import { useRenameFolder } from '@features/folder/edit';

import { useBookmarkStore } from '@entities/bookmark';

import { AddFolderIcon, DeleteSquareIcon } from '@shared/icons';

import { NUMBER_HOTKEYS } from './Header.const';
import { getIndexByKeyboardNumber } from './Header.lib';

import styles from './Header.module.scss';

const Header: React.FC = () => {
  const { folders, selectedFolderId, setSelectedFolderId } = useBookmarkStore();
  const {
    showInput: showCreateInput,
    isInput: isCreateInput,
    inputProps: createInputProps,
    hideInput: hideCreateInput,
  } = useCreateFolder();
  const {
    showInput: showEditInput,
    hideInput: hideEditInput,
    editableId,
    inputProps: editInputProps,
  } = useRenameFolder();
  const { onDeleteFolder } = useDeleteFolder();

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
                component={folder.id === editableId ? 'div' : 'button'}
                key={folder.id}
                value={folder.id}
                onDoubleClick={(event) => {
                  event.preventDefault();
                  showEditInput(folder.id);
                }}
                maw={150}
              >
                {folder.id === editableId ? (
                  <Group
                    wrap="nowrap"
                    gap={4}
                    onBlur={(event) => {
                      if (!event.currentTarget.contains(event.relatedTarget)) {
                        hideEditInput();
                      }
                    }}
                  >
                    <TextInput defaultValue={folder.title} p={0} size="xs" {...editInputProps} />
                    <ActionIcon
                      size={28}
                      p={0}
                      variant="transparent"
                      c="var(--mantine-color-white)"
                      onClick={() => onDeleteFolder(folder.id)}
                    >
                      <DeleteSquareIcon />
                    </ActionIcon>
                  </Group>
                ) : (
                  folder.title
                )}
              </Tabs.Tab>
            ))}
            {isCreateInput && <TextInput p={2} size="xs" onBlur={hideCreateInput} {...createInputProps} />}
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
