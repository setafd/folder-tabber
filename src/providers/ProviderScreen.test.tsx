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

describe('provider search forms', () => {
  const searchPage = ({ id = 'first', root = 'root', text = 'Results', q = '', automatic = true, searchLast = false } = {}) => {
    const search = {
      id: 'service-search',
      type: 'form',
      mode: 'query',
      ...(automatic ? { debounceMs: 300 } : { submitLabel: 'Apply' }),
      fields: [
        { name: 'q', label: 'Search', type: 'text', value: q },
        { name: 'status', label: 'Status', type: 'text', value: 'open' },
      ],
    };
    const results = { id: 'results', type: 'text', text };
    return pageSchema.parse({
      id,
      title: id,
      content: {
        id: root,
        type: 'stack',
        children: searchLast ? [results, search] : [search, results],
      },
    });
  };
  const advance = async (milliseconds: number) => {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(milliseconds);
    });
  };
  const queries = () => vi.mocked(providerRequest).mock.calls.map((call) => call[4]?.query);
  const searchControl = (view: ReturnType<typeof render>) =>
    content(view).getByRole('textbox', { name: 'Search' }) as HTMLInputElement;
  const typeSearch = (view: ReturnType<typeof render>, value: string) =>
    fireEvent.change(searchControl(view), { target: { value } });
  const openPage = async () => {
    const view = render(<ProviderScreen source={source} pageId="first" onManage={vi.fn()} />);
    await act(async () => {});
    return view;
  };

  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('sends one query 300 ms after the last edit with every field and the current view parameters', async () => {
    vi.mocked(readLastQuery).mockResolvedValue('view=due&team=infra');
    vi.mocked(providerRequest).mockResolvedValue(searchPage());
    const view = await openPage();
    expect(content(view).queryByRole('button')).toBeNull();
    await advance(500);
    expect(queries()).toEqual(['view=due&team=infra']);

    typeSearch(view, 'c');
    await advance(100);
    typeSearch(view, 'cv');
    await advance(100);
    typeSearch(view, 'cve');
    await advance(299);
    expect(queries()).toEqual(['view=due&team=infra']);
    await advance(1);
    expect(queries()).toEqual(['view=due&team=infra', 'view=due&team=infra&q=cve&status=open']);

    await advance(500);
    expect(queries()).toHaveLength(2);
  });

  it('sends an explicitly empty q when the search is cleared', async () => {
    vi.mocked(readLastQuery).mockResolvedValue('view=cve&q=apache');
    vi.mocked(providerRequest)
      .mockResolvedValueOnce(searchPage({ q: 'apache' }))
      .mockResolvedValueOnce(searchPage());
    const view = await openPage();
    typeSearch(view, '');
    await advance(300);
    expect(queries()).toEqual(['view=cve&q=apache', 'view=cve&q=&status=open']);
  });

  it('keeps typing available during loading and preserves the focused draft and selection after results', async () => {
    let finish: (value: unknown) => void = () => {};
    vi.mocked(providerRequest)
      .mockResolvedValueOnce(searchPage())
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          }),
      )
      .mockResolvedValueOnce(searchPage({ root: 'updated-layout', text: 'Rearranged results' }));
    const view = await openPage();
    const shadow = view.container.querySelector('[data-provider-content]')!.shadowRoot!;
    const search = searchControl(view);
    search.focus();
    typeSearch(view, 'cv');
    await advance(300);
    expect(queries()).toEqual(['', 'q=cv&status=open']);
    expect(search.disabled).toBe(false);

    typeSearch(view, 'cve-2026');
    search.setSelectionRange(1, 3, 'backward');
    await act(async () => {
      finish(searchPage({ q: 'cv', text: 'Previous search results', searchLast: true }));
    });
    expect(searchControl(view)).toBe(search);
    expect(shadow.activeElement).toBe(search);
    expect(search.value).toBe('cve-2026');
    expect([search.selectionStart, search.selectionEnd, search.selectionDirection]).toEqual([1, 3, 'backward']);

    await advance(300);
    const current = searchControl(view);
    expect(queries()).toEqual(['', 'q=cv&status=open', 'q=cve-2026&status=open']);
    expect(content(view).getByText('Rearranged results')).toBeTruthy();
    expect(shadow.activeElement).toBe(current);
    expect(current.value).toBe('cve-2026');
    expect([current.selectionStart, current.selectionEnd, current.selectionDirection]).toEqual([1, 3, 'backward']);
  });

  it('aborts the older GET when a newer debounced query is submitted', async () => {
    let resolveOld: (value: unknown) => void = () => {};
    vi.mocked(providerRequest)
      .mockResolvedValueOnce(searchPage())
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveOld = resolve;
          }),
      )
      .mockResolvedValueOnce(searchPage({ text: 'New results' }));
    const view = await openPage();
    typeSearch(view, 'cve');
    await advance(300);
    const previous = vi.mocked(providerRequest).mock.calls[1]?.[4]?.signal;
    expect(previous?.aborted).toBe(false);
    typeSearch(view, 'cve-2026');
    await advance(300);
    expect(previous?.aborted).toBe(true);
    await act(async () => {
      resolveOld(searchPage({ text: 'Old results' }));
    });
    expect(content(view).getByText('New results')).toBeTruthy();
    expect(content(view).queryByText('Old results')).toBeNull();
  });

  it('cancels scheduled queries on navigation and unmount', async () => {
    vi.mocked(providerRequest)
      .mockResolvedValueOnce(searchPage())
      .mockResolvedValueOnce(searchPage({ id: 'second' }));
    const view = await openPage();
    typeSearch(view, 'old page');
    view.rerender(<ProviderScreen source={source} pageId="second" onManage={vi.fn()} />);
    await advance(300);
    expect(queries()).toEqual(['', '']);
    expect(vi.mocked(providerRequest).mock.calls[1]?.[2]).toBe('v1/pages/second');
    typeSearch(view, 'unmounted');
    view.unmount();
    await advance(300);
    expect(queries()).toEqual(['', '']);
  });

  it('uses the submit button for a query form without debounceMs', async () => {
    vi.mocked(providerRequest).mockResolvedValue(searchPage({ automatic: false }));
    const view = await openPage();
    typeSearch(view, 'manual');
    await advance(500);
    expect(queries()).toEqual(['']);
    fireEvent.click(content(view).getByRole('button', { name: 'Apply' }));
    await advance(0);
    expect(queries()).toEqual(['', 'q=manual&status=open']);
  });
});

describe('provider modal action forms', () => {
  const modalPage = (title = 'Existing package') =>
    pageSchema.parse({
      id: 'first',
      title: 'Packages',
      content: {
        id: 'packages',
        type: 'stack',
        children: [
          {
            id: 'add-package',
            type: 'button',
            action: {
              id: 'create',
              label: 'Add package',
              form: { submitLabel: 'Add', fields: [{ name: 'name', label: 'Package name', type: 'text' }] },
            },
          },
          {
            id: 'package-list',
            type: 'table',
            columns: [{ field: 'name', title: 'Package' }],
            rows: [
              {
                id: 'package-1',
                values: { name: title },
                actions: [
                  {
                    id: 'update',
                    label: 'Edit',
                    input: { packageId: 'package-1' },
                    form: {
                      title: 'Edit package',
                      submitLabel: 'Save',
                      fields: [{ name: 'name', label: 'Package name', type: 'text', value: title }],
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    });
  const openPage = async () => {
    const view = render(<ProviderScreen source={source} pageId="first" onManage={vi.fn()} />);
    await screen.findByRole('heading', { name: 'Packages' });
    return view;
  };

  beforeEach(() => {
    Object.defineProperties(HTMLDialogElement.prototype, {
      showModal: {
        configurable: true,
        value(this: HTMLDialogElement) {
          this.setAttribute('open', '');
          this.querySelector('input')?.focus();
        },
      },
      close: {
        configurable: true,
        value(this: HTMLDialogElement) {
          this.removeAttribute('open');
        },
      },
    });
  });
  afterEach(() => {
    cleanup();
    Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal');
    Reflect.deleteProperty(HTMLDialogElement.prototype, 'close');
  });

  it('shows prefilled values, keeps a failed draft, and closes on success before refreshing with the same query', async () => {
    let finishRefresh: (value: unknown) => void = () => {};
    vi.mocked(readLastQuery).mockResolvedValue('view=due&q=ssl');
    vi.mocked(providerRequest)
      .mockResolvedValueOnce(modalPage())
      .mockResolvedValueOnce({ status: 'error', message: 'Check the name', fieldErrors: { name: 'Too short' } })
      .mockResolvedValueOnce({ status: 'success', message: 'Saved', refresh: true })
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finishRefresh = resolve;
          }),
      );
    const view = await openPage();
    const controls = content(view);
    expect(controls.queryByRole('textbox')).toBeNull();

    fireEvent.click(controls.getByRole('button', { name: 'Edit' }));
    const dialog = within(controls.getByRole('dialog', { name: 'Edit package' }));
    const name = dialog.getByRole('textbox', { name: 'Package name' }) as HTMLInputElement;
    expect(name.value).toBe('Existing package');
    expect(providerRequest).toHaveBeenCalledTimes(1);
    fireEvent.change(name, { target: { value: 'x' } });
    fireEvent.click(dialog.getByRole('button', { name: 'Save' }));
    await dialog.findByText('Too short');
    expect(screen.queryByText('Check the name')).toBeNull();
    expect(name.value).toBe('x');
    expect(name.getAttribute('aria-invalid')).toBe('true');
    expect(vi.mocked(providerRequest).mock.calls[1]?.[4]?.body).toMatchObject({
      action: 'update',
      input: { packageId: 'package-1', name: 'x' },
    });

    fireEvent.change(name, { target: { value: 'Updated package' } });
    fireEvent.click(dialog.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(controls.queryByRole('dialog')).toBeNull());
    expect(controls.getByRole('cell', { name: 'Existing package' })).toBeTruthy();
    expect(providerRequest).toHaveBeenCalledTimes(4);
    expect(vi.mocked(providerRequest).mock.calls[3]?.[4]).toMatchObject({ query: 'view=due&q=ssl' });
    await act(async () => {
      finishRefresh(modalPage('Updated package'));
    });
    expect(controls.getByRole('cell', { name: 'Updated package' })).toBeTruthy();
  });

  it('discards drafts on Cancel and Escape and returns focus to the trigger', async () => {
    vi.mocked(providerRequest).mockResolvedValueOnce(modalPage());
    const view = await openPage();
    const controls = content(view);
    const shadow = view.container.querySelector('[data-provider-content]')!.shadowRoot!;
    const trigger = controls.getByRole('button', { name: 'Add package' });

    fireEvent.click(trigger);
    const dialog = () => controls.getByRole('dialog', { name: 'Add package' });
    const name = () => within(dialog()).getByRole('textbox', { name: 'Package name' }) as HTMLInputElement;
    expect(shadow.activeElement).toBe(name());
    fireEvent.change(name(), { target: { value: 'Discard this' } });
    await act(async () => {
      fireEvent.click(within(dialog()).getByRole('button', { name: 'Cancel' }));
    });
    expect(controls.queryByRole('dialog')).toBeNull();
    expect(shadow.activeElement).toBe(trigger);

    fireEvent.click(trigger);
    expect(name().value).toBe('');
    await act(async () => {
      fireEvent(dialog(), new Event('cancel', { cancelable: true }));
    });
    expect(controls.queryByRole('dialog')).toBeNull();
    expect(shadow.activeElement).toBe(trigger);
    expect(providerRequest).toHaveBeenCalledTimes(1);
  });
});
