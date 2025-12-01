import { BookmarkFolder, BookmarkItem, BookmarkItemProps, FolderChildren } from '@entities/bookmark';

export const FolderWrapper = ({
  folders,
  className,
  onClickBookmark,
  onClickCreateButton,
  onClickEditButton,
}: {
  folders: FolderChildren[];
  className?: string;
  onClickBookmark: BookmarkItemProps['onClick'];
  onClickCreateButton: (parentId?: string) => void;
  onClickEditButton: (type: 'bookmark' | 'folder', id: string, title: string, url?: string) => void;
}) => {
  return folders.map((folder) => {
    return (
      <BookmarkFolder
        id={folder.id}
        key={folder.id}
        title={folder.id}
        data-index={folder.index}
        className={className}
        onClickCreateButton={() => onClickCreateButton(folder.id)}
        onEdit={onClickEditButton}
      >
        {folder.children?.map((bookmark) => {
          return bookmark.children ? (
            <FolderWrapper
              key={bookmark.id}
              folders={[bookmark]}
              onClickBookmark={onClickBookmark}
              onClickCreateButton={() => onClickCreateButton(bookmark.id)}
              onClickEditButton={onClickEditButton}
            />
          ) : (
            <BookmarkItem
              key={bookmark.id}
              id={bookmark.id}
              url={bookmark.url}
              title={bookmark.id}
              onClick={onClickBookmark}
              onEdit={onClickEditButton}
            />
          );
        })}
      </BookmarkFolder>
    );
  });
};
