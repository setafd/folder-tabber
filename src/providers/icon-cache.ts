import { isProviderIconPath } from './address';
import { providerIconRequest } from './client';
import type { Source } from './store';

const cacheName = (source: Pick<Source, 'id' | 'revision'>) => `foldertabber:icons:${source.id}:${source.revision}`;

export async function loadProviderIcon(
  source: Source,
  path: string,
  signal: AbortSignal,
  getToken: () => Promise<string>,
) {
  if (!isProviderIconPath(path)) throw new Error('Invalid provider icon path');

  const url = new URL(path, source.address).href;
  const cache = await globalThis.caches?.open(cacheName(source)).catch(() => undefined);
  const saved = await cache?.match(url).catch(() => undefined);
  if (saved) return saved.blob();

  const token = await getToken();
  signal.throwIfAborted();
  const image = await providerIconRequest(source.address, token, path, {
    signal,
    dataTypes: source.manifest.dataTypes,
  });
  if (!signal.aborted) await cache?.put(url, new Response(image)).catch(() => undefined);
  return image;
}

export async function deleteProviderIconCache(source: Pick<Source, 'id' | 'revision'>) {
  await globalThis.caches?.delete(cacheName(source)).catch(() => undefined);
}
