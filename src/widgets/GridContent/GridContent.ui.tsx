import { memo, useCallback } from 'react';

import { BookmarkCreateFormModal, useCreateBookmarkState } from '@features/bookmark/create';
import { BookmarkUpdateModal, useEditBookmarkState } from '@features/bookmark/edit';

import { type BookmarkItemProps } from '@entities/bookmark';
import { openTab } from '@entities/tab';

import { GRID_CARD_WIDTH, GRID_GAP } from '@shared/config';
import { PlusIcon } from '@shared/icons';
import { Button } from '@shared/ui/Button';

import { useBookmarks } from './GridContent.lib';
import { useMasonryLayout } from './GridContent.masonry';
import { EmptyContent, GridFolder, MasonryItem } from './ui';

import styles from './GridContent.module.scss';

const GridContent: React.FC = () => {
  const { folders, isEmpty, title, folderId } = useBookmarks();

  const { containerRef, containerHeight, positions, registerItem } = useMasonryLayout(folders, {
    cardWidth: GRID_CARD_WIDTH,
    gap: GRID_GAP,
  });

  const { setOpen: openCreateModal } = useCreateBookmarkState();
  const { setOpen: openEditModal } = useEditBookmarkState();

  const onClickBookmark = useCallback<Required<BookmarkItemProps>['onClick']>(
    (event) => {
      event.preventDefault();
      const inCurrent = !event.ctrlKey;
      const url = event.currentTarget.dataset.url!;

      openTab(url, title!, inCurrent);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [folders],
  );

  const onCreateBookmark = useCallback(
    (parentId?: string, option: 'bookmark' | 'folder' = 'bookmark') => {
      // The root card already carries the real selected-folder id, so parentId is used as-is.
      openCreateModal(parentId ?? folderId!, option);
    },
    [folderId, openCreateModal],
  );

  const onEditBookmark = useCallback((type: 'bookmark' | 'folder' = 'bookmark', id: string, title: string, url?: string) => {

    openEditModal(id, title, url, type);
  }, [openEditModal]);

  if (isEmpty) {
    return <EmptyContent onCreateBookmark={onCreateBookmark} />;
  }

  return (
    <>
      <div className={styles.gridWrapper}>
        <div className={styles.grid} ref={containerRef} style={{ height: containerHeight }}>
          {folders.map((folder) => (
            <MasonryItem
              key={folder.id}
              id={folder.id}
              width={GRID_CARD_WIDTH}
              position={positions.get(folder.id)}
              registerItem={registerItem}
            >
              <GridFolder
                folder={folder}
                isRoot={folder.id === folderId}
                onClickBookmark={onClickBookmark}
                onClickCreateButton={onCreateBookmark}
                onClickEditButton={onEditBookmark}
              />
            </MasonryItem>
          ))}
        </div>
      </div>
      <Button className={styles.addButton} onClick={() => onCreateBookmark(folderId!, 'folder')}>
        <PlusIcon size={24} color="white" />
      </Button>
      <BookmarkCreateFormModal />
      <BookmarkUpdateModal />
    </>
  );
};

export default memo(GridContent);
