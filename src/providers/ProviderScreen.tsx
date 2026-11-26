import { useCallback, useEffect, useRef, useState } from 'react';

import { ProviderError, providerRequest } from './client';
import { PageSkeleton, ProviderFrame } from './page-frame';
import {
  type Action,
  type ActionResult,
  type ProviderPage,
  type Value,
  actionResultSchema,
  pageSchema,
} from './protocol';
import { Renderer } from './renderer';
import { type Source, readLastQuery, readSnapshot, readToken, writeSnapshot } from './store';
import { validateCss } from './styles';

export function ProviderScreen({ source, pageId, onManage }: { source: Source; pageId: string; onManage: () => void }) {
  const [page, setPage] = useState<ProviderPage | null>(null);
  const [query, setQuery] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [stale, setStale] = useState(true);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const generation = useRef(0);
  const request = useRef<AbortController | null>(null);
  const actionRequest = useRef<AbortController | null>(null);
  const actionBusy = useRef(false);
  const loadingRef = useRef(false);
  const mounted = useRef(false);
  const lastGoodQuery = useRef<string | null>(null);
  const displayedQuery = useRef<string | null>(null);
  useEffect(() => {
    let disposed = false;
    void readLastQuery(source, pageId).then((saved) => {
      if (!disposed) setQuery(saved);
    });
    return () => {
      disposed = true;
    };
  }, [source, pageId]);
  const load = useCallback(async () => {
    if (query === null) return;
    const run = ++generation.current;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setLoading(true);
    loadingRef.current = true;
    if (lastGoodQuery.current !== query) {
      setStale(true);
    }
    try {
      if (lastGoodQuery.current !== query) {
        const cached = await readSnapshot(source, pageId, query);
        if (cached && generation.current === run && !controller.signal.aborted) {
          validateCss(cached.page.css);
          displayedQuery.current = query;
          setPage(cached.page);
          setSavedAt(cached.savedAt);
        }
      }
      const token = await readToken(source);
      const result = await providerRequest(
        source.address,
        token,
        `v1/pages/${encodeURIComponent(pageId)}`,
        pageSchema,
        { signal: controller.signal, query, dataTypes: source.manifest.dataTypes },
      );
      if (result.id !== pageId) throw new ProviderError('Source returned the wrong page');
      validateCss(result.css);
      if (generation.current !== run || controller.signal.aborted) return;
      const now = Date.now();
      lastGoodQuery.current = query;
      displayedQuery.current = query;
      setPage(result);
      setSavedAt(now);
      setStale(false);
      setError('');
      try {
        await writeSnapshot(source, pageId, query, result, now);
      } catch {
        if (generation.current === run && !controller.signal.aborted)
          setMessage('Page loaded, but its offline snapshot could not be saved.');
      }
    } catch (failure) {
      if (generation.current !== run || controller.signal.aborted) return;
      setStale(true);
      setError(failure instanceof Error ? failure.message : 'Could not load the page');
      if (failure instanceof ProviderError && (failure.status === 401 || failure.status === 403)) setPage(null);
    } finally {
      if (generation.current === run && !controller.signal.aborted) {
        setLoading(false);
        loadingRef.current = false;
      }
    }
  }, [source, pageId, query]);
  useEffect(() => {
    mounted.current = true;
    void load();
    return () => {
      mounted.current = false;
      request.current?.abort();
      actionRequest.current?.abort();
    };
  }, [load]);
  useEffect(() => {
    const interval = setInterval(
      () => {
        if (!document.hidden && !actionBusy.current && !loadingRef.current) void load();
      },
      (page?.refreshAfterSeconds ?? 60) * 1000,
    );
    const visible = () => {
      if (!document.hidden && !actionBusy.current && !loadingRef.current) void load();
    };
    document.addEventListener('visibilitychange', visible);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', visible);
    };
  }, [load, page?.refreshAfterSeconds]);
  const onAction = async (action: Action, values: Record<string, Value> = {}): Promise<ActionResult | null> => {
    if (stale || actionBusy.current) return null;
    actionBusy.current = true;
    setBusy(true);
    setMessage('');
    request.current?.abort();
    generation.current++;
    setLoading(false);
    loadingRef.current = false;
    const controller = new AbortController();
    actionRequest.current = controller;
    let requestStarted = false;
    try {
      const token = await readToken(source);
      requestStarted = true;
      const result = await providerRequest(
        source.address,
        token,
        `v1/pages/${encodeURIComponent(pageId)}/actions`,
        actionResultSchema,
        {
          signal: controller.signal,
          dataTypes: source.manifest.dataTypes,
          body: { requestId: crypto.randomUUID(), action: action.id, input: { ...action.input, ...values } },
        },
      );
      if (!mounted.current || controller.signal.aborted) return null;
      setMessage(result.message);
      if (result.status === 'success' && result.refresh) await load();
      return result;
    } catch (failure) {
      if (mounted.current && !controller.signal.aborted) {
        setStale(true);
        const message = failure instanceof Error ? failure.message : 'Action failed';
        setError(
          requestStarted
            ? `${message} The operation may have reached the service. Refresh before trying again.`
            : message,
        );
      }
      return null;
    } finally {
      actionBusy.current = false;
      if (mounted.current) setBusy(false);
    }
  };
  const currentPage = page?.id === pageId ? page : null;
  const title = currentPage?.title ?? source.manifest.pages.find((item) => item.id === pageId)?.title ?? pageId;
  return (
    <ProviderFrame
      sourceName={source.manifest.name}
      title={title}
      savedAt={savedAt}
      loading={loading}
      busy={busy}
      savedCopy={stale && !!currentPage && !loading}
      previousResults={stale && !!currentPage && !loading && displayedQuery.current !== query}
      error={error}
      message={message}
      onManage={onManage}
      onRefresh={() => void load()}
      onDismiss={() => {
        setError('');
        setMessage('');
      }}
    >
      {!currentPage &&
        (loading ? (
          <PageSkeleton />
        ) : (
          <div className="provider-empty">This page could not be loaded. Check the source and try again.</div>
        ))}
      {currentPage && (
        <Renderer
          key={`${source.id}/${source.revision}/${pageId}`}
          page={currentPage}
          localCss={source.localCss[pageId] ?? ''}
          disabled={stale || busy}
          debouncedQueryDisabled={busy}
          onAction={onAction}
          onQuery={(input, options) => {
            const params = new URLSearchParams(options?.preserveQuery ? (query ?? '') : '');
            for (const [key, value] of Object.entries(input)) params.set(key, String(value ?? ''));
            const next = params.toString();
            if (next === query) void load();
            else setQuery(next);
          }}
        />
      )}
    </ProviderFrame>
  );
}
