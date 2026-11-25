import { z } from 'zod';

import { platform } from '@/platform';

import { normalizeAddress, permissionPattern } from './address';
import { checkTreeLimits } from './protocol';

export class ProviderError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
  }
}

export async function providerRequest<T>(
  address: string,
  token: string,
  path: string,
  schema: z.ZodType<T>,
  options: { signal?: AbortSignal; body?: unknown; query?: string; dataTypes?: string[] } = {},
): Promise<T> {
  const base = normalizeAddress(address);
  const requiredData = [...new Set([...(options.dataTypes ?? []), ...(token ? ['authenticationInfo'] : [])])];
  if (!(await platform.permissions.contains(permissionPattern(base), requiredData)))
    throw new ProviderError('Site permission is missing. Reconnect the source to grant access.');
  const url = new URL(path, base);
  if (url.origin !== new URL(base).origin || !url.pathname.startsWith(new URL(base).pathname))
    throw new ProviderError('Invalid provider endpoint');
  if (options.query) url.search = options.query;
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (options.signal?.aborted) controller.abort();
  options.signal?.addEventListener('abort', abort, { once: true });
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, 15_000);
  try {
    const response = await fetch(url, {
      method: options.body === undefined ? 'GET' : 'POST',
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: controller.signal,
      redirect: 'error',
      credentials: 'omit',
      cache: 'no-store',
      referrerPolicy: 'no-referrer',
    });
    if (!response.ok)
      throw new ProviderError(
        response.status === 401 || response.status === 403
          ? 'Source authentication failed. Check its token and access settings.'
          : `Source returned HTTP ${response.status}.`,
        response.status,
      );
    if (!response.headers.get('content-type')?.toLowerCase().includes('application/json'))
      throw new ProviderError('Source must return application/json');
    const reader = response.body?.getReader();
    let body = '';
    if (reader) {
      const decoder = new TextDecoder();
      let size = 0;
      try {
        for (;;) {
          const chunk = await reader.read();
          if (chunk.done) break;
          size += chunk.value.byteLength;
          if (size > 1_048_576) {
            await reader.cancel();
            throw new ProviderError('Source response exceeds 1 MB');
          }
          body += decoder.decode(chunk.value, { stream: true });
        }
        body += decoder.decode();
      } finally {
        reader.releaseLock();
      }
    }
    let data: unknown;
    try {
      data = JSON.parse(body);
      checkTreeLimits(data);
    } catch {
      throw new ProviderError('Source returned invalid or excessively complex JSON');
    }
    const result = schema.safeParse(data);
    if (!result.success) throw new ProviderError('Source returned an unsupported or invalid protocol response');
    return result.data;
  } catch (error) {
    if (timedOut) throw new ProviderError('Source did not respond within 15 seconds');
    if (controller.signal.aborted) throw new DOMException('Request cancelled', 'AbortError');
    if (error instanceof ProviderError) throw error;
    throw new ProviderError('Cannot reach the source. Check that the service is running.');
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener('abort', abort);
  }
}
