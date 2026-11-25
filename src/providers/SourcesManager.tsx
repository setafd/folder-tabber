import { useEffect, useRef, useState } from 'react';

import { platform } from '@/platform';
import { Button } from '@/ui/Button';
import { Input } from '@/ui/Input';
import { Modal } from '@/ui/Modal';

import { normalizeAddress, permissionPattern } from './address';
import { providerRequest } from './client';
import { type Manifest, manifestSchema } from './protocol';
import { type Source, readToken, removeSource, saveSource } from './store';
import { validateCss } from './styles';

type Discovery = { manifest: Manifest; address: string; token?: string };
export function SourcesManager({ sources, onClose }: { sources: Source[]; onClose: () => void }) {
  const [editing, setEditing] = useState<Source | null>(null);
  const [address, setAddress] = useState('');
  const [token, setToken] = useState('');
  const [clearToken, setClearToken] = useState(false);
  const [discovery, setDiscovery] = useState<Discovery | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [localCss, setLocalCss] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const request = useRef<AbortController | null>(null);
  const generation = useRef(0);
  useEffect(
    () => () => {
      generation.current++;
      request.current?.abort();
    },
    [],
  );
  const edit = (source: Source | null) => {
    generation.current++;
    request.current?.abort();
    setBusy(false);
    setEditing(source);
    setAddress(source?.address ?? '');
    setToken('');
    setClearToken(false);
    setDiscovery(source ? { manifest: source.manifest, address: source.address } : null);
    setSelected(source?.pageIds ?? []);
    setLocalCss(source?.localCss ?? {});
    setEnabled(source?.enabled ?? true);
    setError('');
  };
  const invalidate = () => {
    generation.current++;
    request.current?.abort();
    setDiscovery(null);
    setError('');
  };
  const connect = async () => {
    const run = ++generation.current;
    setBusy(true);
    setError('');
    setDiscovery(null);
    try {
      const normalized = normalizeAddress(address);
      const permission = platform.permissions.request(permissionPattern(normalized));
      if (!(await permission)) throw new Error('Site permission was not granted');
      if (run !== generation.current) return;
      const secret = clearToken ? '' : token || (editing?.address === normalized ? await readToken(editing) : '');
      const controller = new AbortController();
      request.current = controller;
      const manifest = await providerRequest(normalized, secret, 'v1/manifest', manifestSchema, {
        signal: controller.signal,
      });
      if (run !== generation.current) return;
      setDiscovery({ manifest, address: normalized, token: secret });
      setSelected((current) => current.filter((id) => manifest.pages.some((page) => page.id === id)));
    } catch (failure) {
      if (run === generation.current) setError(failure instanceof Error ? failure.message : 'Could not connect');
    } finally {
      if (run === generation.current) setBusy(false);
    }
  };
  const save = async () => {
    if (!discovery) return;
    setError('');
    setBusy(true);
    try {
      Object.values(localCss).forEach(validateCss);
      if (!(await platform.permissions.request(permissionPattern(discovery.address), discovery.manifest.dataTypes)))
        throw new Error('Source data permissions were not granted');
      await saveSource(
        {
          id: editing?.id ?? crypto.randomUUID(),
          address: discovery.address,
          manifest: discovery.manifest,
          pageIds: selected,
          enabled,
          revision: crypto.randomUUID(),
          localCss,
        },
        discovery.token,
      );
      edit(null);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Could not save source');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal open onClose={onClose} title="Custom pages" center>
      <div className="provider-manager">
        <p className="provider-description">
          Connect your own service to add pages. It receives its access token, page filters and values you submit. Your
          bookmarks are not sent to it.
        </p>
        <div className="provider-source-list">
          {sources.map((source) => (
            <div key={source.id} className="provider-source-row">
              <div>
                <strong>{source.manifest.name}</strong>
                <small>{source.address}</small>
                <small>{source.enabled ? `${source.pageIds.length} pages selected` : 'Disabled'}</small>
              </div>
              <div className="provider-toolbar">
                <Button variant="default" disabled={busy} onClick={() => edit(source)}>
                  Edit
                </Button>
                <Button
                  variant="danger"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    setError('');
                    try {
                      await removeSource(source);
                      if (editing?.id === source.id) edit(null);
                    } catch {
                      setError('Could not remove the source');
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
        <div className="provider-editor-heading">
          <h3>{editing ? `Edit ${editing.manifest.name}` : 'Add source'}</h3>
          {editing && (
            <Button variant="default" disabled={busy} onClick={() => edit(null)}>
              Add another source
            </Button>
          )}
        </div>
        <label className="provider-field">
          Service address
          <Input
            value={address}
            placeholder="https://workspace.example.com/"
            disabled={busy}
            onChange={(event) => {
              setAddress(event.target.value);
              invalidate();
            }}
          />
        </label>
        <label className="provider-field">
          Access token
          <Input
            type="password"
            autoComplete="off"
            value={token}
            placeholder={editing ? 'Leave blank to keep the saved token' : 'Optional'}
            disabled={busy || clearToken}
            onChange={(event) => {
              setToken(event.target.value);
              invalidate();
            }}
          />
        </label>
        {editing && (
          <label className="provider-checkbox">
            <input
              type="checkbox"
              checked={clearToken}
              disabled={busy}
              onChange={(event) => {
                setClearToken(event.target.checked);
                invalidate();
              }}
            />
            Clear the saved token
          </label>
        )}
        <div>
          <Button variant="default" aria-busy={busy} disabled={busy || !address.trim()} onClick={() => void connect()}>
            Connect
          </Button>
        </div>
        {discovery && (
          <>
            <div className="provider-discovery">
              <strong>{discovery.manifest.name}</strong>
              <span>Protocol v1 · Choose the pages to display</span>
            </div>
            {!discovery.manifest.pages.length && (
              <p className="provider-description">This source does not provide any pages yet.</p>
            )}
            {discovery.manifest.pages.map((page) => (
              <div key={page.id} className="provider-page-option">
                <label className="provider-checkbox">
                  <input
                    type="checkbox"
                    disabled={busy}
                    checked={selected.includes(page.id)}
                    onChange={(event) =>
                      setSelected((current) =>
                        event.target.checked ? [...current, page.id] : current.filter((id) => id !== page.id),
                      )
                    }
                  />
                  {page.title}
                </label>
                <details>
                  <summary>Local CSS overrides</summary>
                  <textarea
                    aria-label={`CSS for ${page.title}`}
                    className="provider-css"
                    spellCheck={false}
                    maxLength={65_536}
                    disabled={busy}
                    value={localCss[page.id] ?? ''}
                    placeholder=":host { --accent-color: #1971c2; }"
                    onChange={(event) => setLocalCss((current) => ({ ...current, [page.id]: event.target.value }))}
                  />
                </details>
              </div>
            ))}
            <label className="provider-checkbox">
              <input
                type="checkbox"
                checked={enabled}
                disabled={busy}
                onChange={(event) => setEnabled(event.target.checked)}
              />
              Source enabled
            </label>
          </>
        )}
        {error && (
          <div role="alert" className="provider-notice provider-error">
            {error}
          </div>
        )}
        <div className="provider-toolbar provider-editor-footer">
          <Button variant="default" onClick={onClose}>
            Close
          </Button>
          <Button disabled={busy || !discovery} onClick={() => void save()}>
            Save source
          </Button>
        </div>
      </div>
    </Modal>
  );
}
