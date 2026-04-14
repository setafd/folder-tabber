import React, { PropsWithChildren, memo } from 'react';

import { AddBookmarkIcon, EditIcon, FolderIcon } from '@shared/icons';
import { getFaviconUrl } from '@shared/lib/helpers';
import { Button } from '@shared/ui/Button';

import { DEFAULT_FOLDER_ID } from './bookmark.const';

import styles from './bookmark.module.scss';

export type BookmarkItemProps = {
  id: string;
  title: string;
  url?: string;
  onClick: React.MouseEventHandler<HTMLButtonElement>;
  onEdit: (type: 'bookmark', id: string, title: string, url?: string) => void;
};

export const BookmarkItem: React.FC<BookmarkItemProps> = ({ id, title, url, onClick, onEdit }) => {
  return (
    <div className={styles.bookmarkItem}>
      <Button
        role="link"
        variant="unstyled"
        type="button"
        onClick={onClick}
        data-url={url}
        className={styles.bookmarkLink}
      >
        <img src={getFaviconUrl(url ?? '')} alt="" role="presentation" width={16} height={16} />
        <span className={styles.bookmarkTitle}>{title}</span>
      </Button>
      <Button
        className={styles.iconButton}
        variant="icon"
        onClick={(e) => {
          e.stopPropagation();
          onEdit('bookmark', id, title, url);
        }}
      >
        <EditIcon className={styles.buttonIcon} width={16} height={16} />
      </Button>
    </div>
  );
};

type BookmarkFolderProps = {
  id: string;
  title: string;
  className?: string;
  onClickCreateButton: () => void;
  onEdit: (type: 'folder', id: string, title: string) => void;
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
    <div className={`${className} ${styles.folderContainer}`}>
      <div className={styles.folderItem}>
        <FolderIcon size={18} />
        <h4 className={styles.folderTitle}>{title}</h4>
        {id !== DEFAULT_FOLDER_ID && (
          <Button
            className={styles.iconButton}
            variant="icon"
            onClick={(e) => {
              e.stopPropagation();
              onEdit('folder', id, title);
            }}
          >
            <EditIcon className={styles.buttonIcon} width={16} height={16} />
          </Button>
        )}
        <Button className={styles.iconButton} variant="icon" onClick={onClickCreateButton}>
          <AddBookmarkIcon className={styles.buttonIcon} width={16} height={16} />
        </Button>
      </div>

      <div className={styles.folderContent}>
        <span className={styles.divider} />
        {children}
      </div>
    </div>
  );
});
