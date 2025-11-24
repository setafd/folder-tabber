import { useEffect } from 'react';

import { AppShell, MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';

import { useStore } from 'zustand';

import { GridContent } from '@widgets/GridContent';
import { Header } from '@widgets/Header';

import { BookmarkCreateModal } from '@features/bookmark/create';
import { BookmarkUpdateModal } from '@features/bookmark/edit';

import { bookmarkStore } from '@entities/bookmark';

import { useColorScheme } from '@shared/lib/react';

export const App: React.FC = () => {
  const preferredColorScheme = useColorScheme('light', { getInitialValueInEffect: false });

  const fetchFolders = useStore(bookmarkStore, (state) => state.fetchFolders);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  return (
    <MantineProvider forceColorScheme={preferredColorScheme}>
      <ModalsProvider modals={{ 'create-bookmark': BookmarkCreateModal, 'edit-bookmark': BookmarkUpdateModal }}>
        <AppShell padding="sm" header={{ height: 60 }}>
          <AppShell.Header>
            <Header />
          </AppShell.Header>
          <AppShell.Main>
            <GridContent />
          </AppShell.Main>
        </AppShell>
      </ModalsProvider>
    </MantineProvider>
  );
};
