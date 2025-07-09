import { useEffect } from 'react';

import { AppShell, MantineProvider } from '@mantine/core';
import { useColorScheme } from '@mantine/hooks';
import { ModalsProvider } from '@mantine/modals';

import { useStore } from 'zustand';

import { GridContent } from '@widgets/GridContent';
import { Header } from '@widgets/Header';

import { bookmarkStore } from '@entities/bookmark';

export const App: React.FC = () => {
  const preferredColorScheme = useColorScheme('light', { getInitialValueInEffect: false });

  const fetchFolders = useStore(bookmarkStore, (state) => state.fetchFolders);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  return (
    <MantineProvider forceColorScheme={preferredColorScheme}>
      <ModalsProvider>
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
