import { useEffect } from 'react';

import { useStore } from 'zustand';
import 'react-responsive-modal/styles.css';

import { GridContent } from '@widgets/GridContent';
import { Sidebar } from '@widgets/Sidebar';

import { bookmarkStore } from '@entities/bookmark';

import { MainLayout } from '@shared/ui/MainLayout';

import './global.css';

export const App: React.FC = () => {
  const fetchFolders = useStore(bookmarkStore, (state) => state.fetchFolders);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  return (
    <MainLayout sidebar={<Sidebar />}>
      <GridContent />
    </MainLayout>
  );
};
