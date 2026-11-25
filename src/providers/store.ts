import { z } from 'zod';
import { createStore } from 'zustand';

import { platform } from '@/platform';

import { normalizeAddress } from './address';
import { type ProviderPage, manifestSchema, pageSchema } from './protocol';
import { validateCss } from './styles';

const sourcesKey = 'providers:sources:v1';
const credentialKey = (id: string) => `providers:credential:v2:${id}`;
const legacyCredentialKey = (id: string) => `providers:credential:${id}`;
const cacheKey = (id: string, page: string) => `providers:cache:${id}:${page}`;
const sourceSchema = z
  .object({
    id: z.uuid(),
    address: z.string().transform(normalizeAddress),
    manifest: manifestSchema,
    pageIds: z.array(z.string()).max(100),
    enabled: z.boolean(),
    revision: z.uuid(),
    localCss: z.record(z.string(), z.string().max(65_536)),
  })
  .strict();
export type Source = z.infer<typeof sourceSchema>;
const credentialSchema = z.strictObject({ address: z.string(), token: z.string() });
export type PageSelection = { sourceId: string; pageId: string };
export const sourceStore = createStore<{ sources: Source[]; ready: boolean; error: string | null }>(() => ({
  sources: [],
  ready: false,
  error: null,
}));
const reconcile = (sources: Source[]) =>
  sources.map((source) => {
    const previous = sourceStore.getState().sources.find((item) => item.id === source.id);
    return previous && JSON.stringify(previous) === JSON.stringify(source) ? previous : source;
  });
let writes: Promise<unknown> = Promise.resolve();
const serial = <T>(operation: () => Promise<T>): Promise<T> => {
  const result = writes.then(operation, operation);
  writes = result.catch(() => {});
  return result;
};

const parseSources = (stored: string | null) =>
  stored ? z.array(sourceSchema).max(100).parse(JSON.parse(stored)) : [];

async function readSources() {
  const sources = parseSources(await platform.storage.getItem(sourcesKey));
  sources.forEach((source) => Object.values(source.localCss).forEach(validateCss));
  return sources;
}
export async function loadSources() {
  try {
    sourceStore.setState({ sources: reconcile(await readSources()), ready: true, error: null });
  } catch {
    sourceStore.setState({ ready: true, error: 'Could not load saved sources. Your bookmarks are still available.' });
  }
}
export function subscribeSources() {
  return platform.storage.subscribe((key) => {
    if (key === sourcesKey) void loadSources();
  });
}
function tokenForAddress(stored: string, address: string) {
  let credential: z.infer<typeof credentialSchema>;
  try {
    credential = credentialSchema.parse(JSON.parse(stored));
  } catch {
    throw new Error('Could not read the saved source credential. Reconnect the source.');
  }
  if (credential.address !== address) throw new Error('The source address changed. Reopen the page and try again.');
  return credential.token;
}

export async function readToken(source: Pick<Source, 'id' | 'address'>) {
  const address = normalizeAddress(source.address);
  const key = credentialKey(source.id);
  const stored = await platform.storage.getItem(key);
  if (stored !== null) return tokenForAddress(stored, address);

  const legacyKey = legacyCredentialKey(source.id);
  const snapshot = await platform.storage.getItems([key, legacyKey, sourcesKey]);
  if (snapshot[key] !== null) return tokenForAddress(snapshot[key], address);
  const legacy = snapshot[legacyKey];
  if (!legacy) return '';
  const saved = parseSources(snapshot[sourcesKey]).find((item) => item.id === source.id);
  if (saved?.address !== address) throw new Error('The source address changed. Reopen the page and try again.');
  return legacy;
}
export const saveSource = (source: Source, token?: string) =>
  serial(async () => {
    const parsed = sourceSchema.parse(source);
    Object.values(parsed.localCss).forEach(validateCss);
    const sources = await readSources();
    const previous = sources.find((item) => item.id === source.id);
    const nextToken = token ?? (previous?.address === parsed.address ? await readToken(previous) : '');
    const next = previous ? sources.map((item) => (item.id === source.id ? parsed : item)) : [...sources, parsed];
    await platform.storage.setItems({
      [sourcesKey]: JSON.stringify(next),
      [credentialKey(source.id)]: JSON.stringify({ address: parsed.address, token: nextToken }),
      [legacyCredentialKey(source.id)]: '',
    });
    sourceStore.setState({ sources: reconcile(next), error: null });
  });
export const removeSource = (source: Source) =>
  serial(async () => {
    const sources = (await readSources()).filter((item) => item.id !== source.id);
    await platform.storage.setItem(sourcesKey, JSON.stringify(sources));
    sourceStore.setState({ sources: reconcile(sources) });
    await Promise.all([
      platform.storage.removeItem(credentialKey(source.id)),
      platform.storage.removeItem(legacyCredentialKey(source.id)),
      ...source.manifest.pages.map((page) => platform.storage.removeItem(cacheKey(source.id, page.id))),
    ]);
  });
const snapshotSchema = z.object({ revision: z.uuid(), query: z.string(), savedAt: z.number(), page: pageSchema });
async function getSnapshot(source: Source, pageId: string) {
  try {
    const raw = await platform.storage.getItem(cacheKey(source.id, pageId));
    if (!raw) return null;
    const snapshot = snapshotSchema.parse(JSON.parse(raw));
    validateCss(snapshot.page.css);
    return snapshot.revision === source.revision && snapshot.page.id === pageId ? snapshot : null;
  } catch {
    return null;
  }
}
export async function readLastQuery(source: Source, pageId: string) {
  return (await getSnapshot(source, pageId))?.query ?? '';
}
export async function readSnapshot(source: Source, pageId: string, query: string) {
  const snapshot = await getSnapshot(source, pageId);
  return snapshot?.query === query ? snapshot : null;
}
export async function writeSnapshot(
  source: Source,
  pageId: string,
  query: string,
  page: ProviderPage,
  savedAt: number,
) {
  await platform.storage.setItem(
    cacheKey(source.id, pageId),
    JSON.stringify({ revision: source.revision, query, savedAt, page }),
  );
}
