import { type CSSProperties, memo } from 'react';

import {
  BookmarkFolder,
  type BookmarkItemProps,
  type FolderChildren,
  bookmarkStore,
  isFolder,
  useBookmarkDrag,
  useFolderDrop,
} from '@entities/bookmark';

import { GRID_HEADER_HEIGHT, GRID_ROW_HEIGHT } from '@shared/config';
import { ChevronIcon, DragHandleIcon, FolderIcon } from '@shared/icons';

import { PREVIEW_COUNT, folderCardLayout } from '../GridContent.cards';
import styles from '../GridContent.module.scss';

import { GridBookmark } from './GridBookmark';


type GridFolderProps = {
  folder: FolderChildren;
  isRoot?: boolean;
  nested?: boolean;
  wide?: boolean;
  expanded: ReadonlySet<string>;
  showAll: ReadonlySet<string>;
  onToggle: (id: string) => void;
  onShowAll: (id: string) => void;
  onClickBookmark: BookmarkItemProps['onClick'];
  onClickCreateButton: (parentId: string) => void;
  onClickEditButton: (type: 'bookmark' | 'folder', id: string, title: string, url?: string) => void;
};
export const GridFolder = memo(function GridFolder(props: GridFolderProps) {
  const {
    folder,
    isRoot,
    nested,
    wide,
    expanded,
    showAll,
    onToggle,
    onShowAll,
    onClickBookmark,
    onClickCreateButton,
    onClickEditButton,
  } = props;
  const drag = useBookmarkDrag(folder, 'grid', isRoot, !nested);
  const drop = useFolderDrop(folder.id, 'grid');
  const open = !nested || expanded.has(folder.id);
  const layout = nested ? null : folderCardLayout(folder, expanded, showAll.has(folder.id));
  const children = nested ? (open ? (folder.children ?? []) : []) : layout!.children;
  const renderChild = (child: FolderChildren) =>
    isFolder(child) ? (
      <GridFolder key={child.id} {...props} folder={child} nested isRoot={false} wide={false} />
    ) : (
      <GridBookmark
        key={child.id}
        parentId={folder.id}
        id={child.id}
        title={child.title}
        url={child.url}
        onClick={onClickBookmark}
        onEdit={onClickEditButton}
      />
    );
  return (
    <div
      ref={drag.setNodeRef}
      style={
        {
          opacity: drag.isDragging ? 0.35 : undefined,
          '--bookmark-row': `${GRID_ROW_HEIGHT}px`,
          '--folder-header': `${GRID_HEADER_HEIGHT}px`,
        } as CSSProperties
      }
    >
      <BookmarkFolder
        id={folder.id}
        title={folder.title}
        isRoot={isRoot}
        nested={nested}
        count={folder.children?.length ?? 0}
        headerRef={isRoot ? undefined : drag.setDropRef}
        intent={drag.intent ?? drop.intent}
        onOpen={
          isRoot
            ? undefined
            : () => {
                void bookmarkStore.getState().setSelectedFolder(folder);
              }
        }
        onClickCreateButton={() => onClickCreateButton(folder.id)}
        onEdit={onClickEditButton}
        toggle={
          nested && (
            <button
              aria-expanded={open}
              aria-label={`${open ? 'Collapse' : 'Expand'} ${folder.title}`}
              className={styles.expandButton}
              onClick={() => onToggle(folder.id)}
            >
              <ChevronIcon expanded={open} />
            </button>
          )
        }
        dragHandle={
          isRoot ? undefined : (
            <button
              ref={drag.setActivatorNodeRef}
              {...drag.attributes}
              {...drag.listeners}
              disabled={drag.disabled}
              className={`drag-handle ${nested ? 'folder-drag-handle' : ''}`}
              aria-label={`Drag ${folder.title}`}
              title="Drag to move"
            >
              {nested ? <FolderIcon size={16} aria-hidden="true" /> : <DragHandleIcon />}
            </button>
          )
        }
      >
        {open && (
          <div
            ref={drop.setNodeRef}
            className={nested ? styles.nestedContent : styles.cardBody}
            data-inside={drop.intent === 'inside' || undefined}
          >
            {wide && !nested ? (
              <div className={styles.cardColumns}>
                <div>{children.slice(0, layout!.split).map(renderChild)}</div>
                <div>{children.slice(layout!.split).map(renderChild)}</div>
              </div>
            ) : (
              children.map(renderChild)
            )}
            {!nested && (folder.children?.length ?? 0) > PREVIEW_COUNT && (
              <button className={styles.showAll} onClick={() => onShowAll(folder.id)}>
                {showAll.has(folder.id) ? 'Show fewer' : `Show all ${folder.children!.length} items`}
              </button>
            )}
          </div>
        )}
      </BookmarkFolder>
    </div>
  );
});
