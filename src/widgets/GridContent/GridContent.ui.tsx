import { memo, useCallback, useLayoutEffect, useRef } from 'react';

import { modals } from '@mantine/modals';

import Packery from 'packery';

import { type BookmarkItemProps, DEFAULT_FOLDER_ID } from '@entities/bookmark';
import { openTab } from '@entities/tab';

import { PlusIcon } from '@shared/icons';
import { Button } from '@shared/ui/Button';

import { useBookmarks } from './GridContent.lib';
import { EmptyContent, FolderWrapper } from './ui';

const GridContent: React.FC = () => {
  const { folders, isEmpty, title, folderId } = useBookmarks();

  const gridRef = useRef<HTMLDivElement>(null);
  const packeryRef = useRef<typeof Packery | null>(null);

  useLayoutEffect(() => {
    if (isEmpty || !gridRef.current) return;

    const grid = gridRef.current;

    if (!packeryRef.current) {
      packeryRef.current = new Packery(grid, {
        itemSelector: '.element-item',
        gutter: 8,
        columnWidth: 250,
      });
    } else {
      packeryRef.current.reloadItems();
      packeryRef.current.layout();
    }

    return () => {
      packeryRef.current?.destroy();
      packeryRef.current = null;
    };
  }, [folders, isEmpty]);

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
    (parentId?: string, option?: 'bookmark' | 'folder') => {
      let parsedParentId = parentId;
      if (parentId === DEFAULT_FOLDER_ID) {
        parsedParentId = folderId;
      }
      const context = modals.openContextModal({
        modal: 'create-bookmark',
        innerProps: {
          parentId: parsedParentId,
          option,
          onFinish: () => modals.close(context),
          onCancel: () => modals.close(context),
        },
        title: 'Create bookmark',
      });
    },
    [folderId],
  );

  const onEditBookmark = useCallback((type: 'bookmark' | 'folder', id: string, title: string, url?: string) => {
    const modalTitle = type === 'bookmark' ? 'Edit bookmark' : 'Edit folder';
    const context = modals.openContextModal({
      modal: 'edit-bookmark',
      innerProps: {
        id,
        title,
        url,
        option: type,
        onFinish: () => modals.close(context),
        onCancel: () => modals.close(context),
      },
      title: modalTitle,
    });
  }, []);

  if (isEmpty) {
    return <EmptyContent onCreateBookmark={onCreateBookmark} />;
  }

  return (
    <div ref={gridRef} style={{ padding: '1rem' }}>
      <FolderWrapper
        folders={folders}
        className="element-item"
        onClickBookmark={onClickBookmark}
        onClickCreateButton={onCreateBookmark}
        onClickEditButton={onEditBookmark}
      />
      <Button
        style={{ position: 'fixed', right: 16, bottom: 16, padding: '0.5rem', borderRadius: 100, height: '2.5rem' }}
        onClick={() => onCreateBookmark(folderId, 'folder')}
      >
        <PlusIcon size={24} color="white" />
      </Button>
    </div>
  );
};

export default memo(GridContent);
