import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { providerRequest } from './client';
import { manifestSchema, pageSchema } from './protocol';
import { ProviderScreen } from './ProviderScreen';
import { type Source, readLastQuery, readSnapshot, writeSnapshot } from './store';

vi.mock('./client', async (original) => ({
  ...(await original<typeof import('./client')>()),
  providerRequest: vi.fn(),
}));
vi.mock('./store', () => ({
  readToken: vi.fn(async () => ''),
  readLastQuery: vi.fn(async () => ''),
  readSnapshot: vi.fn(async () => null),
  writeSnapshot: vi.fn(async () => {}),
}));
const source: Source = {
  id: crypto.randomUUID(),
  revision: crypto.randomUUID(),
  address: 'https://example.com/',
  enabled: true,
  pageIds: ['first', 'second'],
  localCss: {},
  manifest: manifestSchema.parse({
    protocolVersion: 1,
    name: 'Source',
    pages: [
      { id: 'first', title: 'First' },
      { id: 'second', title: 'Second' },
    ],
  }),
};
const page = (id: string, title: string) =>
  pageSchema.parse({ id, title, content: { id: 'run', type: 'button', action: { id: 'run', label: 'Run' } } });
const content = (view: ReturnType<typeof render>) =>
  within(view.container.querySelector('[data-provider-content]')!.shadowRoot! as unknown as HTMLElement);
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(readLastQuery).mockResolvedValue('');
  vi.mocked(readSnapshot).mockResolvedValue(null);
  vi.mocked(writeSnapshot).mockResolvedValue(undefined);
});
afterEach(cleanup);

describe('provider page lifecycle', () => {
  it('disables actions in an offline snapshot and enables them after recovery', async () => {
    vi.mocked(readSnapshot).mockResolvedValue({
      revision: source.revision,
      query: '',
      savedAt: 123,
      page: page('first', 'First'),
    });
    vi.mocked(providerRequest).mockRejectedValueOnce(new Error('Offline'));
    const view = render(<ProviderScreen source={source} pageId="first" onManage={vi.fn()} />);
    await screen.findByText('Offline');
    expect((content(view).getByRole('button', { name: 'Run' }) as HTMLButtonElement).disabled).toBe(true);
    vi.mocked(providerRequest).mockResolvedValueOnce(page('first', 'First'));
    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    await waitFor(() =>
      expect((content(view).getByRole('button', { name: 'Run' }) as HTMLButtonElement).disabled).toBe(false),
    );
    expect(screen.queryByText('Offline')).toBeNull();
  });
  it('ignores a late response from the previous page', async () => {
    let finish: (value: unknown) => void = () => {};
    vi.mocked(providerRequest)
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          }),
      )
      .mockResolvedValueOnce(page('second', 'Second'));
    const view = render(<ProviderScreen source={source} pageId="first" onManage={vi.fn()} />);
    await waitFor(() => expect(providerRequest).toHaveBeenCalledTimes(1));
    view.rerender(<ProviderScreen source={source} pageId="second" onManage={vi.fn()} />);
    await screen.findByRole('heading', { name: 'Second' });
    await act(async () => {
      finish(page('first', 'First'));
    });
    expect(screen.getByRole('heading', { name: 'Second' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'First' })).toBeNull();
  });
  it('does not repeat a mutation after an ambiguous network failure', async () => {
    vi.mocked(providerRequest)
      .mockResolvedValueOnce(page('first', 'First'))
      .mockRejectedValueOnce(new Error('Connection lost'));
    const view = render(<ProviderScreen source={source} pageId="first" onManage={vi.fn()} />);
    await waitFor(() =>
      expect(view.container.querySelector('[data-provider-content]')?.shadowRoot?.querySelector('button')).toBeTruthy(),
    );
    fireEvent.click(content(view).getByRole('button', { name: 'Run' }));
    await screen.findByText(/The operation may have reached the service/);
    expect((content(view).getByRole('button', { name: 'Run' }) as HTMLButtonElement).disabled).toBe(true);
    expect(providerRequest).toHaveBeenCalledTimes(2);
  });
});

it('keeps the refresh label and mounted content while a refresh is pending', async () => {
  let finish: (value: unknown) => void = () => {};
  vi.mocked(providerRequest)
    .mockResolvedValueOnce(page('first', 'First'))
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
  const view = render(<ProviderScreen source={source} pageId="first" onManage={vi.fn()} />);
  await waitFor(() =>
    expect(view.container.querySelector('[data-provider-content]')?.shadowRoot?.querySelector('button')).toBeTruthy(),
  );
  const previous = content(view).getByRole('button', { name: 'Run' });
  const refresh = screen.getByRole('button', { name: 'Refresh' });
  fireEvent.click(refresh);
  await waitFor(() => expect(providerRequest).toHaveBeenCalledTimes(2));
  expect(refresh.textContent).toBe('Refresh');
  expect(refresh.getAttribute('aria-busy')).toBe('true');
  expect(content(view).getByRole('button', { name: 'Run' })).toBe(previous);
  expect(screen.queryByLabelText('Loading page')).toBeNull();
  await act(async () => {
    finish(page('first', 'First'));
  });
  expect(refresh.getAttribute('aria-busy')).toBe('false');
});

it('keeps the previous results and form draft during a query change', async () => {
  const interactive = (text: string) =>
    pageSchema.parse({
      id: 'first',
      title: 'First',
      content: {
        id: 'root',
        type: 'stack',
        children: [
          {
            id: 'filter',
            type: 'form',
            mode: 'query',
            submitLabel: 'Apply',
            fields: [{ name: 'status', label: 'Status', type: 'text' }],
          },
          {
            id: 'editor',
            type: 'form',
            mode: 'action',
            submitLabel: 'Save',
            action: { id: 'save', label: 'Save' },
            fields: [{ name: 'note', label: 'Note', type: 'textarea' }],
          },
          { id: 'results', type: 'text', text },
        ],
      },
    });
  let finish: (value: unknown) => void = () => {};
  vi.mocked(providerRequest)
    .mockResolvedValueOnce(interactive('Previous results'))
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
  const view = render(<ProviderScreen source={source} pageId="first" onManage={vi.fn()} />);
  await waitFor(() =>
    expect(view.container.querySelector('[data-provider-content]')?.shadowRoot?.querySelector('textarea')).toBeTruthy(),
  );
  const controls = content(view);
  fireEvent.change(controls.getByLabelText('Note'), { target: { value: 'Unsaved draft' } });
  fireEvent.change(controls.getByLabelText('Status'), { target: { value: 'Done' } });
  fireEvent.submit(controls.getByRole('button', { name: 'Apply' }).closest('form')!);
  await waitFor(() => expect(providerRequest).toHaveBeenCalledTimes(2));
  expect(controls.getByText('Previous results')).toBeTruthy();
  expect((controls.getByLabelText('Note') as HTMLTextAreaElement).value).toBe('Unsaved draft');
  await act(async () => {
    finish(interactive('Updated results'));
  });
  expect(controls.getByText('Updated results')).toBeTruthy();
  expect((controls.getByLabelText('Note') as HTMLTextAreaElement).value).toBe('Unsaved draft');
});
