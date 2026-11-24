import { memo, useCallback, useContext, useMemo, useState } from 'react';

import { useStore } from 'zustand';

import { type BookmarkItemProps, bookmarkStore, useFolderDrop } from '@/bookmarks';
import { BookmarkCreateFormModal, useCreateBookmarkState } from '@/bookmarks/forms/create-bookmark';
import { BookmarkUpdateModal, useEditBookmarkState } from '@/bookmarks/forms/edit-bookmark';
import { DropFeedbackContext } from '@/lib/dnd';
import { openTab } from '@/tabs';
import { Button } from '@/ui/Button';

import { folderCardLayout } from './GridContent.cards';
import { useBookmarks } from './GridContent.lib';
import { useMasonryLayout } from './GridContent.masonry';
import { GridFolder, MasonryItem } from './ui';

import styles from './GridContent.module.scss';

const Breadcrumb = ({ id, title, current }: { id: string; title: string; current: boolean }) => {
  const drop = useFolderDrop(id, 'breadcrumb');
  return (
    <button
      ref={drop.setNodeRef}
      data-inside={drop.intent === 'inside' || undefined}
      aria-current={current ? 'page' : undefined}
      title={`Open ${title}; drop here to move into this folder`}
      onClick={() => {
        void bookmarkStore.getState().setSelectedFolder({ id, title });
      }}
    >
      {title}
    </button>
  );
};
const toggleSet = (previous: ReadonlySet<string>, id: string) => {
  const next = new Set(previous);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
};

const GridContent = () => {
  const { folders, isEmpty, title, folderId } = useBookmarks();
  const breadcrumbs = useStore(bookmarkStore, (s) => s.breadcrumbs);
  const pending = useStore(bookmarkStore, (s) => s.isMoving || s.isLoading);
  const { dragging } = useContext(DropFeedbackContext);
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set());
  const [showAll, setShowAll] = useState<ReadonlySet<string>>(() => new Set());
  const cards = useMemo(
    () => folders.map((folder) => folderCardLayout(folder, expanded, showAll.has(folder.id))),
    [folders, expanded, showAll],
  );
  const { containerRef, containerHeight, positions, ready } = useMasonryLayout(cards, dragging || pending);
  const { setOpen: openCreateModal } = useCreateBookmarkState();
  const { setOpen: openEditModal } = useEditBookmarkState();
  const onToggle = useCallback(
    (id: string) => {
      if (!dragging) setExpanded((previous) => toggleSet(previous, id));
    },
    [dragging],
  );
  const onShowAll = useCallback(
    (id: string) => {
      if (!dragging) setShowAll((previous) => toggleSet(previous, id));
    },
    [dragging],
  );
  const onClickBookmark = useCallback<BookmarkItemProps['onClick']>(
    (event) => {
      event.preventDefault();
      void openTab(
        event.currentTarget.dataset.url!,
        title ?? 'Bookmarks',
        !(event.ctrlKey || event.metaKey || event.button === 1),
      );
    },
    [title],
  );
  const onCreateBookmark = useCallback(
    (parentId?: string, option: 'bookmark' | 'folder' = 'bookmark') => {
      if (parentId ?? folderId) openCreateModal(parentId ?? folderId!, option);
    },
    [folderId, openCreateModal],
  );
  const onEditBookmark = useCallback(
    (type: 'bookmark' | 'folder', id: string, name: string, url?: string) => openEditModal(id, name, url, type),
    [openEditModal],
  );
  return (
    <>
      <header className={styles.toolbar}>
        <nav aria-label="Folder path" className={styles.breadcrumbs}>
          {breadcrumbs.map((node, index) => (
            <span key={node.id}>
              {index > 0 && <span aria-hidden="true"> / </span>}
              <Breadcrumb id={node.id} title={node.title} current={index === breadcrumbs.length - 1} />
            </span>
          ))}
        </nav>
        <div className={styles.toolbarActions}>
          <Button
            variant="default"
            disabled={!folderId || pending}
            onClick={() => onCreateBookmark(folderId, 'folder')}
          >
            New folder
          </Button>
          <Button disabled={!folderId || pending} onClick={() => onCreateBookmark(folderId)}>
            Add bookmark
          </Button>
        </div>
      </header>
      <div className={styles.gridWrapper} aria-busy={pending}>
        {isEmpty && (
          <div className={styles.empty}>
            <p>This folder is empty.</p>
            <p>Add a bookmark or drag items onto its path above.</p>
          </div>
        )}
        {!folderId && <p role="status">{pending ? 'Loading bookmarks…' : 'No bookmark folders available.'}</p>}
        <div
          ref={containerRef}
          className={styles.grid}
          style={{ height: containerHeight, visibility: ready ? 'visible' : 'hidden' }}
        >
          {folders.map((folder) => (
            <MasonryItem key={folder.id} id={folder.id} position={positions.get(folder.id)}>
              <GridFolder
                folder={folder}
                isRoot={folder.id === folderId}
                wide={positions.get(folder.id)?.span === 2}
                expanded={expanded}
                showAll={showAll}
                onToggle={onToggle}
                onShowAll={onShowAll}
                onClickBookmark={onClickBookmark}
                onClickCreateButton={onCreateBookmark}
                onClickEditButton={onEditBookmark}
              />
            </MasonryItem>
          ))}
        </div>
      </div>
      <BookmarkCreateFormModal />
      <BookmarkUpdateModal />
    </>
  );
};
export default memo(GridContent);
