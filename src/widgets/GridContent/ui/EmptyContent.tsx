import { useStore } from 'zustand';

import { bookmarkStore } from '@entities/bookmark';

import { Button } from '@shared/ui/Button';

type EmptyContentProps = {
  onCreateBookmark: (parentId?: string) => void;
};

export const EmptyContent: React.FC<EmptyContentProps> = ({ onCreateBookmark }) => {
  const parentId = useStore(bookmarkStore, (state) => state.selectedFolder?.id);
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100dvh',
      }}
    >
      <h2>No bookmarks found in this folder</h2>
      <Button onClick={() => onCreateBookmark(parentId)} variant="default">
        Add bookmark
      </Button>
    </div>
  );
};
