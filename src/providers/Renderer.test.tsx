import { cleanup, fireEvent, render, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { type ActionResult, pageSchema } from './protocol';
import { Renderer } from './renderer';

const page = () =>
  pageSchema.parse({
    id: 'tasks',
    title: 'Tasks',
    content: {
      id: 'root',
      type: 'stack',
      children: [
        { id: 'text', type: 'text', text: '<img src=x onerror=alert(1)>' },
        {
          id: 'form',
          type: 'form',
          mode: 'action',
          action: { id: 'save', label: 'Save', input: {} },
          submitLabel: 'Save',
          fields: [{ name: 'note', label: 'Note', type: 'textarea' }],
        },
      ],
    },
  });
afterEach(cleanup);
describe('isolated provider rendering', () => {
  it('renders provider text without interpreting HTML', () => {
    const view = render(<Renderer page={page()} localCss="" disabled={false} onAction={vi.fn()} onQuery={vi.fn()} />);
    const root = view.container.querySelector('[data-provider-content]')!.shadowRoot!;
    expect(root.textContent).toContain('<img src=x onerror=alert(1)>');
    expect(root.querySelector('img')).toBeNull();
  });
  it('preserves edits during refresh and displays server field errors', async () => {
    const onAction = vi.fn(async (): Promise<ActionResult> => ({
      status: 'error',
      message: 'Check note',
      fieldErrors: { note: 'Too short' },
    }));
    const props = { page: page(), localCss: '', disabled: false, onAction, onQuery: vi.fn() };
    const view = render(<Renderer {...props} />);
    const root = within(view.container.querySelector('[data-provider-content]')!.shadowRoot! as unknown as HTMLElement);
    fireEvent.change(root.getByLabelText('Note'), { target: { value: 'Draft text' } });
    view.rerender(<Renderer {...props} page={page()} />);
    expect((root.getByLabelText('Note') as HTMLTextAreaElement).value).toBe('Draft text');
    fireEvent.submit(root.getByRole('button', { name: 'Save' }).closest('form')!);
    expect(await root.findByText('Too short')).toBeTruthy();
    expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ id: 'save' }), { note: 'Draft text' });
    view.rerender(<Renderer {...props} disabled />);
    expect((root.getByRole('button', { name: 'Save' }) as HTMLButtonElement).disabled).toBe(true);
  });
});
