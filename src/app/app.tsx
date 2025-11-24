import { useEffect } from 'react';

import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';

import { useStore } from 'zustand';

import { GridContent } from '@widgets/GridContent';
import { Sidebar } from '@widgets/Sidebar';

import { BookmarkCreateModal } from '@features/bookmark/create';
import { BookmarkUpdateModal } from '@features/bookmark/edit';

import { bookmarkStore } from '@entities/bookmark';

import { useColorScheme } from '@shared/lib/react';
import { MainLayout } from '@shared/ui/MainLayout';

import './global.css';

export const App: React.FC = () => {
  const preferredColorScheme = useColorScheme('light', { getInitialValueInEffect: false });

  const fetchFolders = useStore(bookmarkStore, (state) => state.fetchFolders);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  return (
    <MantineProvider forceColorScheme={preferredColorScheme}>
      <ModalsProvider modals={{ 'create-bookmark': BookmarkCreateModal, 'edit-bookmark': BookmarkUpdateModal }}>
        <MainLayout sidebar={<Sidebar />}>
          <GridContent />
        </MainLayout>
      </ModalsProvider>
    </MantineProvider>
  );
};
