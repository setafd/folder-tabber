import { Suspense, lazy, useEffect, useRef, useState } from 'react';

import { useStore } from 'zustand';

import { platform } from '@/platform';
import { PageLoading, WorkspaceLoading } from '@/providers/page-frame';
import { type PageSelection, loadSources, sourceStore, subscribeSources } from '@/providers/store';

import { BookmarkWorkspace } from './BookmarkWorkspace';
import './providers.css';

const ProviderScreen = lazy(() =>
  import('@/providers/ProviderScreen').then((module) => ({ default: module.ProviderScreen })),
);
const SourcesManager = lazy(() =>
  import('@/providers/SourcesManager').then((module) => ({ default: module.SourcesManager })),
);
const selectionKey = 'providers:last-page:v1';
export const App = () => {
  const { sources, ready, error } = useStore(sourceStore);
  const [selection, setSelection] = useState<PageSelection | null>(null);
  const [restored, setRestored] = useState(false);
  const [manage, setManage] = useState(false);
  const selectionTouched = useRef(false);
  useEffect(() => {
    void loadSources();
    const unsubscribe = subscribeSources();
    let disposed = false;
    void platform.storage.getItem(selectionKey).then(
      (raw) => {
        if (disposed) return;
        try {
          const value = raw ? JSON.parse(raw) : null;
          if (
            !selectionTouched.current &&
            value &&
            typeof value.sourceId === 'string' &&
            typeof value.pageId === 'string'
          )
            setSelection(value);
        } catch {
          if (!selectionTouched.current) setSelection(null);
        }
        setRestored(true);
      },
      () => {
        if (!disposed) setRestored(true);
      },
    );
    return () => {
      disposed = true;
      unsubscribe();
    };
  }, []);
  const source = sources.find(
    (item) =>
      item.enabled &&
      item.id === selection?.sourceId &&
      item.pageIds.includes(selection.pageId) &&
      item.manifest.pages.some((page) => page.id === selection.pageId),
  );
  const navigate = (value: PageSelection | null) => {
    selectionTouched.current = true;
    setSelection(value);
    void platform.storage.setItem(selectionKey, JSON.stringify(value)).catch(() => {});
  };
  const navigation = (
    <nav className="workspace-pages" aria-label="Workspace">
      <div className="workspace-pages-heading">
        <span>Custom pages</span>
        <button title="Manage sources" aria-label="Manage sources" onClick={() => setManage(true)}>
          +
        </button>
      </div>
      <div className="workspace-page-list">
        {sources
          .filter((item) => item.enabled)
          .map((item) => {
            const pages = item.manifest.pages.filter((page) => item.pageIds.includes(page.id));
            return (
              pages.length > 0 && (
                <div key={item.id} className="workspace-source">
                  <span>{item.manifest.name}</span>
                  {pages.map((page) => (
                    <button
                      key={page.id}
                      aria-current={source?.id === item.id && selection?.pageId === page.id ? 'page' : undefined}
                      onClick={() => navigate({ sourceId: item.id, pageId: page.id })}
                    >
                      {page.title}
                    </button>
                  ))}
                </div>
              )
            );
          })}
        {!sources.some((item) => item.enabled && item.pageIds.length) && (
          <button className="workspace-connect" onClick={() => setManage(true)}>
            Connect a source
          </button>
        )}
        {error && (
          <div role="alert" className="provider-notice provider-error">
            {error}
          </div>
        )}
      </div>
    </nav>
  );
  const starting = !ready || !restored;
  return (
    <>
      <BookmarkWorkspace
        navigation={navigation}
        bookmarksActive={!source && !starting}
        onSelectFolder={() => navigate(null)}
      >
        {starting ? (
          <WorkspaceLoading />
        ) : source && selection ? (
          <Suspense
            fallback={
              <PageLoading
                sourceName={source.manifest.name}
                title={source.manifest.pages.find((page) => page.id === selection.pageId)?.title ?? selection.pageId}
                onManage={() => setManage(true)}
              />
            }
          >
            <ProviderScreen
              key={`${source.id}/${selection.pageId}/${source.revision}`}
              source={source}
              pageId={selection.pageId}
              onManage={() => setManage(true)}
            />
          </Suspense>
        ) : null}
      </BookmarkWorkspace>
      {manage && (
        <Suspense fallback={null}>
          <SourcesManager sources={sources} onClose={() => setManage(false)} />
        </Suspense>
      )}
    </>
  );
};
