import { afterEach, describe, expect, it, vi } from 'vitest';

import { platform } from '@/platform';

import { providerRequest } from './client';
import { manifestSchema } from './protocol';

vi.mock('@/platform', () => ({ platform: { permissions: { contains: vi.fn(async () => true) } } }));
const manifest = { protocolVersion: 1, name: 'Test', pages: [] };
const response = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  vi.mocked(platform.permissions.contains).mockResolvedValue(true);
  vi.useRealTimers();
});
describe('provider HTTP client', () => {
  it('sends credentials only to its configured endpoint and refuses redirects', async () => {
    const fetcher = vi.fn(async () => response(manifest));
    vi.stubGlobal('fetch', fetcher);
    await providerRequest('https://example.com/provider/', 'secret', 'v1/manifest', manifestSchema);
    const [url, options] = fetcher.mock.calls[0] as unknown as [URL, RequestInit];
    expect(url.href).toBe('https://example.com/provider/v1/manifest');
    expect(options).toMatchObject({
      redirect: 'error',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      headers: { Authorization: 'Bearer secret' },
    });
    await expect(
      providerRequest('https://example.com/', 'secret', 'https://evil.test/', manifestSchema),
    ).rejects.toThrow('endpoint');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it('does not make requests after site or data permission is revoked', async () => {
    vi.mocked(platform.permissions.contains).mockResolvedValue(false);
    const fetcher = vi.fn();
    vi.stubGlobal('fetch', fetcher);
    await expect(providerRequest('https://example.com/', '', 'v1/manifest', manifestSchema)).rejects.toThrow(
      'permission',
    );
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('reports authentication and invalid schema without exposing the response body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => response({ token: 'sensitive' }, 401)),
    );
    await expect(providerRequest('https://example.com/', '', 'v1/manifest', manifestSchema)).rejects.toThrow(
      'authentication',
    );
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => response({ protocolVersion: 99 })),
    );
    await expect(providerRequest('https://example.com/', '', 'v1/manifest', manifestSchema)).rejects.toThrow(
      'invalid protocol',
    );
  });
  it('bounds streamed responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => response({ data: 'x'.repeat(1_048_577) })),
    );
    await expect(providerRequest('https://example.com/', '', 'v1/manifest', manifestSchema)).rejects.toThrow('1 MB');
  });
  it('aborts a slow connection after 15 seconds', async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url, options: RequestInit) =>
          new Promise((_resolve, reject) => {
            options.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
          }),
      ),
    );
    const result = expect(providerRequest('https://example.com/', '', 'v1/manifest', manifestSchema)).rejects.toThrow(
      '15 seconds',
    );
    await vi.advanceTimersByTimeAsync(15_001);
    await result;
  });
});
