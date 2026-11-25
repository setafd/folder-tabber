import { beforeEach, describe, expect, it, vi } from 'vitest';

import { platform } from '@/platform';

import { manifestSchema, pageSchema } from './protocol';
import {
  type Source,
  loadSources,
  readLastQuery,
  readSnapshot,
  readToken,
  removeSource,
  saveSource,
  sourceStore,
  writeSnapshot,
} from './store';

const memory = vi.hoisted(() => new Map<string, string>());
vi.mock('@/platform', () => ({
  platform: {
    storage: {
      getItem: vi.fn(async (key: string) => memory.get(key) ?? null),
      getItems: vi.fn(async (keys: string[]) => Object.fromEntries(keys.map((key) => [key, memory.get(key) ?? null]))),
      setItem: vi.fn(async (key: string, value: string) => {
        memory.set(key, value);
      }),
      setItems: vi.fn(async (items: Record<string, string>) => {
        for (const [key, value] of Object.entries(items)) memory.set(key, value);
      }),
      removeItem: vi.fn(async (key: string) => {
        memory.delete(key);
      }),
    },
  },
}));
const source = (): Source => ({
  id: crypto.randomUUID(),
  address: 'https://example.com/',
  manifest: manifestSchema.parse({ protocolVersion: 1, name: 'Source', pages: [{ id: 'tasks', title: 'Tasks' }] }),
  pageIds: ['tasks'],
  revision: crypto.randomUUID(),
  enabled: true,
  localCss: {},
});
beforeEach(() => {
  memory.clear();
  sourceStore.setState({ sources: [], ready: false, error: null });
  vi.clearAllMocks();
});
describe('provider persistence', () => {
  it('keeps tokens separate from source configuration and removes them on address changes', async () => {
    const item = source();
    await saveSource(item, 'secret');
    expect(await readToken(item)).toBe('secret');
    expect(memory.get('providers:sources:v1')).not.toContain('secret');
    const changed = { ...item, address: 'https://other.example.com/' };
    await saveSource(changed);
    await expect(readToken(item)).rejects.toThrow('The source address changed');
    expect(await readToken(changed)).toBe('');
  });
  it.each(['https://other.example.com/api/', 'https://example.com:8443/api/', 'https://example.com/other/'])(
    'does not expose the replacement token to a tab with the old address when switching to %s',
    async (address) => {
      const old = { ...source(), address: 'https://example.com/api/' };
      await saveSource(old, 'old-secret');
      const replacement = { ...old, address, revision: crypto.randomUUID() };
      await saveSource(replacement, 'new-secret');

      await expect(readToken(old)).rejects.toThrow('The source address changed');
      expect(await readToken(replacement)).toBe('new-secret');
    },
  );
  it('reads a legacy credential only for the stored address and migrates it when the source is saved', async () => {
    const item = { ...source(), address: 'https://example.com/api/' };
    const legacyKey = `providers:credential:${item.id}`;
    memory.set('providers:sources:v1', JSON.stringify([item]));
    memory.set(legacyKey, 'legacy-secret');

    expect(await readToken({ ...item, address: 'https://EXAMPLE.com/api' })).toBe('legacy-secret');
    await expect(readToken({ ...item, address: 'https://example.com/other/' })).rejects.toThrow(
      'The source address changed',
    );
    await saveSource({ ...item, enabled: false });
    expect(memory.get(legacyKey)).toBe('');
    expect(await readToken(item)).toBe('legacy-secret');
  });
  it('does not serve snapshots for another query or credential revision', async () => {
    const item = source();
    const page = pageSchema.parse({
      id: 'tasks',
      title: 'Tasks',
      content: { id: 'root', type: 'text', text: 'Cached' },
    });
    await writeSnapshot(item, 'tasks', 'status=Open', page, 123);
    expect((await readSnapshot(item, 'tasks', 'status=Open'))?.savedAt).toBe(123);
    expect(await readLastQuery(item, 'tasks')).toBe('status=Open');
    expect(await readSnapshot(item, 'tasks', '')).toBeNull();
    expect(await readSnapshot({ ...item, revision: crypto.randomUUID() }, 'tasks', 'status=Open')).toBeNull();
    await saveSource(item, 'secret');
    await removeSource(item);
    expect(await readSnapshot(item, 'tasks', 'status=Open')).toBeNull();
    expect(await readToken(item)).toBe('');
  });
  it('does not replace valid source state with malformed storage', async () => {
    const item = source();
    await saveSource(item);
    await platform.storage.setItem('providers:sources:v1', 'invalid');
    await loadSources();
    expect(sourceStore.getState().sources).toHaveLength(1);
    expect(sourceStore.getState().error).toBeTruthy();
  });
});

it('keeps the old address and token if saving the replacement fails', async () => {
  const item = source();
  await saveSource(item, 'old-secret');
  vi.mocked(platform.storage.setItems).mockRejectedValueOnce(new Error('Storage quota'));
  const replacement = { ...item, address: 'https://other.example.com/', revision: crypto.randomUUID() };
  await expect(saveSource(replacement, 'new-secret')).rejects.toThrow('Storage quota');
  expect(await readToken(item)).toBe('old-secret');
  await expect(readToken(replacement)).rejects.toThrow('The source address changed');
  expect(sourceStore.getState().sources[0].revision).toBe(item.revision);
});
