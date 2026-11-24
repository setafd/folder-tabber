import { useEffect } from 'react';

import { DndContext, DragOverlay, MeasuringStrategy } from '@dnd-kit/core';
import 'react-responsive-modal/styles.css';
import { useStore } from 'zustand';

import { GridContent } from '@widgets/GridContent';
import { Sidebar } from '@widgets/Sidebar';

import { bookmarkStore } from '@entities/bookmark';

import { DropFeedbackContext } from '@shared/lib/dnd';
import { MainLayout } from '@shared/ui/MainLayout';

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
    const events = [
      chrome.bookmarks.onCreated,
      chrome.bookmarks.onRemoved,
      chrome.bookmarks.onChanged,
      chrome.bookmarks.onMoved,
      chrome.bookmarks.onChildrenReordered,
    ];
    events.forEach((event) => event?.addListener(scheduleRefresh));
    window.addEventListener('focus', scheduleRefresh);
    return () => {
      disposed = true;
      clearTimeout(refreshTimer);
      events.forEach((event) => event?.removeListener(scheduleRefresh));
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
