import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/ui/Button';

type FrameProps = {
  sourceName: string;
  title: string;
  loading: boolean;
  busy?: boolean;
  savedAt?: number | null;
  savedCopy?: boolean;
  previousResults?: boolean;
  error?: string;
  message?: string;
  onManage: () => void;
  onRefresh?: () => void;
  onDismiss?: () => void;
  children: ReactNode;
};

export function PageSkeleton() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 150);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;
  return (
    <div className="provider-skeleton" role="status" aria-label="Loading page">
      <div aria-hidden="true">
        <div className="provider-skeleton-line" />
        <div className="provider-skeleton-metrics">
          {[0, 1, 2].map((id) => (
            <div className="provider-skeleton-card" key={id}>
              <span />
              <span />
            </div>
          ))}
        </div>
        <div className="provider-skeleton-table">
          {[0, 1, 2, 3, 4].map((id) => (
            <div key={id}>
              <span />
              <span />
              <span />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const refreshTurnMs = 480;

function RefreshButton({ loading, busy, onRefresh }: Pick<FrameProps, 'loading' | 'busy' | 'onRefresh'>) {
  const icon = useRef<SVGSVGElement>(null);
  const rotation = useRef<Animation | null>(null);
  const minimumTurns = useRef(1);
  const available = !!onRefresh;
  const spin = useCallback((iterations: number) => {
    const element = icon.current;
    if (!element?.animate || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const current = rotation.current;
    if (current?.playState === 'running') {
      current.effect?.updateTiming({ iterations });
    } else {
      minimumTurns.current = 1;
      rotation.current = element.animate([{ transform: 'rotate(0turn)' }, { transform: 'rotate(1turn)' }], {
        duration: refreshTurnMs,
        iterations,
      });
    }
  }, []);

  useEffect(() => {
    if (loading && available) {
      spin(Infinity);
    } else if (rotation.current?.playState === 'running') {
      const turns = Math.ceil(Number(rotation.current.currentTime ?? 0) / refreshTurnMs);
      rotation.current.effect?.updateTiming({ iterations: Math.max(minimumTurns.current, turns) });
    }
  }, [available, loading, spin]);
  useEffect(() => () => rotation.current?.cancel(), []);

  return (
    <Button
      className="provider-refresh"
      variant="default"
      aria-busy={loading}
      disabled={loading || busy || !available}
      onClick={() => {
        const current = rotation.current;
        const elapsed = current?.playState === 'running' ? Number(current.currentTime ?? 0) : 0;
        minimumTurns.current = Math.ceil(elapsed / refreshTurnMs + 1);
        spin(minimumTurns.current);
        onRefresh?.();
      }}
    >
      <svg
        ref={icon}
        className="provider-refresh-icon"
        aria-hidden="true"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 12a8 8 0 1 0-2.34 5.66M20 6v6h-6" />
      </svg>
      <span>Refresh</span>
    </Button>
  );
}

export function ProviderFrame({
  sourceName,
  title,
  loading,
  busy = false,
  savedAt,
  savedCopy,
  previousResults,
  error,
  message,
  onManage,
  onRefresh,
  onDismiss,
  children,
}: FrameProps) {
  const notice = error || (busy ? 'Running action…' : message);
  return (
    <section className="provider-screen">
      <header className="provider-header">
        <div className="provider-breadcrumbs">
          <span>{sourceName}</span>
          <span aria-hidden="true">/</span>
          <h1 title={title}>{title}</h1>
        </div>
        <div className="provider-toolbar">
          <Button variant="default" onClick={onManage}>
            Sources
          </Button>
          <RefreshButton loading={loading} busy={busy} onRefresh={onRefresh} />
        </div>
      </header>
      <div className="provider-meta">
        {savedAt ? `Updated ${new Date(savedAt).toLocaleString()}` : loading ? 'Loading page…' : 'Waiting for source'}
        {previousResults
          ? ' · Previous results · Actions unavailable'
          : savedCopy
            ? ' · Saved copy · Actions unavailable'
            : ''}
      </div>
      <div className="provider-stage" aria-busy={loading}>
        {children}
      </div>
      {notice && (
        <div
          className={`provider-notice provider-feedback ${error ? 'provider-error' : ''}`}
          role={error ? 'alert' : 'status'}
        >
          <span>{notice}</span>
          {!busy && onDismiss && (
            <button
              type="button"
              className="provider-feedback-close"
              aria-label="Dismiss notification"
              onClick={onDismiss}
            >
              ×
            </button>
          )}
        </div>
      )}
    </section>
  );
}

export function PageLoading({ sourceName, title, onManage }: Pick<FrameProps, 'sourceName' | 'title' | 'onManage'>) {
  return (
    <ProviderFrame sourceName={sourceName} title={title} loading onManage={onManage}>
      <PageSkeleton />
    </ProviderFrame>
  );
}

export function WorkspaceLoading() {
  return (
    <div className="provider-screen" role="status" aria-label="Loading workspace">
      <div className="provider-startup-header" aria-hidden="true">
        <span />
        <span />
      </div>
      <div className="provider-meta" aria-hidden="true">
        &nbsp;
      </div>
      <div className="provider-stage">
        <PageSkeleton />
      </div>
    </div>
  );
}
