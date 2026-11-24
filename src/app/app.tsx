import { useEffect } from 'react';

import { DndContext, DragOverlay, MeasuringStrategy } from '@dnd-kit/core';
import 'react-responsive-modal/styles.css';
import { useStore } from 'zustand';

import { MainLayout } from '@/app/Layout';
import { bookmarkStore } from '@/bookmarks';
import { GridContent } from '@/bookmarks/components/Grid';
import { DropFeedbackContext } from '@/lib/dnd';
import { Sidebar } from '@/navigation/Sidebar';
import { platform } from '@/platform';

import { useAppDnd } from './app.dnd';
import './global.css';

export const App = () => {
  const error = useStore(bookmarkStore, (s) => s.error);
  const moving = useStore(bookmarkStore, (s) => s.isMoving);
  const { sensors, collisionDetection, activeNode, dndContextProps, feedback } = useAppDnd();
  useEffect(() => {
    let disposed = false;
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    const refresh = () => {
      if (!disposed)
        void bookmarkStore
          .getState()
          .fetchFolders()
          .catch(() => {});
    };
    const scheduleRefresh = () => {
      if (bookmarkStore.getState().isMoving) return;
      clearTimeout(refreshTimer);
      refreshTimer = setTimeout(refresh, 50);
    };
    void Promise.resolve(bookmarkStore.persist.rehydrate()).then(() => {
      if (!disposed) refresh();
    });
    const unsubscribe = platform.bookmarks.subscribe(scheduleRefresh);
    window.addEventListener('focus', scheduleRefresh);
    return () => {
      disposed = true;
      clearTimeout(refreshTimer);
      unsubscribe();
      window.removeEventListener('focus', scheduleRefresh);
    };
  }, []);
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      measuring={{ droppable: { strategy: MeasuringStrategy.WhileDragging } }}
      accessibility={{
        screenReaderInstructions: {
          draggable: 'Drag bookmarks or folders with the pointer. Press Escape to cancel.',
        },
      }}
      {...dndContextProps}
    >
      <DropFeedbackContext.Provider value={feedback}>
        <MainLayout sidebar={<Sidebar />}>
          {error && (
            <div role="alert" className="error-banner">
              {error}{' '}
              <button
                onClick={() => {
                  void bookmarkStore
                    .getState()
                    .fetchFolders()
                    .catch(() => {});
                }}
              >
                Reload bookmarks
              </button>
            </div>
          )}
          {moving && (
            <div role="status" className="move-status">
              Moving…
            </div>
          )}
          <GridContent />
        </MainLayout>
        <DragOverlay dropAnimation={null}>
          {activeNode && <div className="dnd-overlay">{activeNode.title}</div>}
        </DragOverlay>
      </DropFeedbackContext.Provider>
    </DndContext>
  );
};
