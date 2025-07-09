import { memo } from 'react';

import { ActionIcon, Group, Tabs, TextInput } from '@mantine/core';
import { useHotkeys } from '@mantine/hooks';

import { useStore } from 'zustand';

import { useCreateFolder } from '@features/folder/create';
import { useDeleteFolder } from '@features/folder/delete';
import { useRenameFolder } from '@features/folder/edit';

import { bookmarkStore } from '@entities/bookmark';

import { AddFolderIcon, DeleteSquareIcon } from '@shared/icons';

import { NUMBER_HOTKEYS } from './Header.const';
import { getIndexByKeyboardNumber } from './Header.lib';

import styles from './Header.module.scss';

const Header: React.FC = () => {
  const folders = useStore(bookmarkStore, (state) => state.folders);
  const selectedFolder = useStore(bookmarkStore, (state) => state.selectedFolder);
  const setSelectedFolder = useStore(bookmarkStore, (state) => state.setSelectedFolder);

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

  const onChangeFolder = (folderId: string | null) => {
    if (folderId && folderId !== selectedFolder?.id) {
      setSelectedFolder(folderId);
    }
  };

  useHotkeys(
    NUMBER_HOTKEYS.map((key) => [key, () => onChangeFolder(folders?.[getIndexByKeyboardNumber(key)]?.id || null)]),
  );

  return (
    <Group h="100%" align="center" justify="space-between" wrap="nowrap" px="sm">
      <Tabs variant="pills" value={selectedFolder?.id} onChange={onChangeFolder}>
        <Tabs.List>
          {folders.map((folder) => (
            <Tabs.Tab
              classNames={{ tab: folder.id === editableId ? styles.editTab : undefined, tabLabel: styles.tabLabel }}
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
  );
};

export default memo(Header);
