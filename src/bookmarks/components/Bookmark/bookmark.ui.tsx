import React, { type PropsWithChildren } from 'react';

import { type DropIntent } from '@/lib/dnd';
import { Button } from '@/ui/Button';
import { AddBookmarkIcon, EditIcon, FolderIcon } from '@/ui/icons';

import { Favicon } from './Favicon';

import styles from './bookmark.module.scss';

export type BookmarkItemProps = {
  id: string;
  title: string;
  url?: string;
  onClick: React.MouseEventHandler<HTMLAnchorElement>;
  onEdit: (type: 'bookmark', id: string, title: string, url?: string) => void;
  dragHandle?: React.ReactNode;
};

export const BookmarkItem = ({ id, title, url, onClick, onEdit, dragHandle }: BookmarkItemProps) => (
  <div className={styles.bookmarkItem}>
    {dragHandle}
    <a
      href={url}
      onClick={onClick}
      onAuxClick={(event) => {
        if (event.button === 1) onClick(event);
      }}
      data-url={url}
      className={styles.bookmarkLink}
      title={`${title}\n${url ?? ''}`}
    >
      <Favicon url={url ?? ''} />
      <span className={styles.bookmarkTitle}>{title || url}</span>
    </a>
    <span className={styles.actions}>
      <Button
        className={styles.iconButton}
        variant="icon"
        title={`Edit ${title}`}
        aria-label={`Edit ${title}`}
        onClick={() => onEdit('bookmark', id, title, url)}
      >
        <EditIcon width={16} height={16} />
      </Button>
    </span>
  </div>
);

type BookmarkFolderProps = {
  id: string;
  title: string;
  isRoot?: boolean;
  nested?: boolean;
  count?: number;
  dragHandle?: React.ReactNode;
  toggle?: React.ReactNode;
  headerRef?: (element: HTMLDivElement | null) => void;
  intent?: DropIntent;
  onOpen?: () => void;
  onClickCreateButton: () => void;
  onEdit: (type: 'folder', id: string, title: string) => void;
};
export const BookmarkFolder = ({
  id,
  title,
  isRoot,
  nested,
  count,
  dragHandle,
  toggle,
  headerRef,
  intent,
  onOpen,
  children,
  onClickCreateButton,
  onEdit,
}: PropsWithChildren<BookmarkFolderProps>) => (
  <div
    className={`${styles.folderContainer} ${nested ? styles.nested : ''}`}
    data-inside={intent === 'inside' || undefined}
  >
    <div ref={headerRef} className={styles.folderItem} data-drop={intent}>
      <span className={styles.leadingControl}>{toggle || (!isRoot && dragHandle)}</span>
      <span className={styles.nodeIcon}>
        {nested && dragHandle ? dragHandle : <FolderIcon size={16} aria-hidden="true" />}
      </span>
      <h2 className={styles.folderTitle} title={title}>
        {onOpen ? (
          <button onClick={onOpen} title={`Open ${title}`}>
            {title}
          </button>
        ) : (
          title
        )}
      </h2>
      <span className={styles.count}>{count}</span>
      <span className={styles.folderActions}>
        {!isRoot && (
          <Button
            className={styles.iconButton}
            variant="icon"
            title={`Edit ${title}`}
            aria-label={`Edit ${title}`}
            onClick={() => onEdit('folder', id, title)}
          >
            <EditIcon width={16} height={16} />
          </Button>
        )}
        <Button
          className={styles.iconButton}
          variant="icon"
          title={`Add to ${title}`}
          aria-label={`Add to ${title}`}
          onClick={onClickCreateButton}
        >
          <AddBookmarkIcon width={16} height={16} />
        </Button>
      </span>
    </div>
    {children}
  </div>
);
