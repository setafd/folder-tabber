import { useEffect } from 'react';

import { DndContext, DragOverlay, MeasuringStrategy } from '@dnd-kit/core';
import 'react-responsive-modal/styles.css';
import { useStore } from 'zustand';

import { GridContent } from '@widgets/GridContent';
import { Sidebar } from '@widgets/Sidebar';

import { bookmarkStore } from '@entities/bookmark';

import { MainLayout } from '@shared/ui/MainLayout';

import { useAppDnd } from './app.dnd';

import './global.css';

export const App: React.FC = () => {
  const fetchFolders = useStore(bookmarkStore, (state) => state.fetchFolders);

  const { sensors, collisionDetection, activeNode, dndContextProps } = useAppDnd();

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      {...dndContextProps}
    >
      <MainLayout sidebar={<Sidebar />}>
        <GridContent />
      </MainLayout>
      <DragOverlay dropAnimation={null}>{activeNode && <div className="dnd-overlay">{activeNode.title}</div>}</DragOverlay>
    </DndContext>
  );
};
