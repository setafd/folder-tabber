import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { FolderEditItemWrapper } from './folder-edit.ui';

const editor = (title: string) => (
  <FolderEditItemWrapper id="folder" title={title}>
    {(open) => <button onDoubleClick={open}>Rename</button>}
  </FolderEditItemWrapper>
);
afterEach(cleanup);

describe('inline folder rename', () => {
  it('uses the latest title when an existing folder is renamed externally', () => {
    const { rerender } = render(editor('Old title'));
    rerender(editor('New title'));
    fireEvent.doubleClick(screen.getByRole('button', { name: 'Rename' }));
    expect((screen.getByRole('textbox', { name: 'Rename folder' }) as HTMLInputElement).value).toBe('New title');
  });
  it('discards cancelled edits and reopens with the current saved title', () => {
    const { rerender } = render(editor('Saved title'));
    fireEvent.doubleClick(screen.getByRole('button', { name: 'Rename' }));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Unsaved draft' } });
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Escape' });
    rerender(editor('Latest title'));
    fireEvent.doubleClick(screen.getByRole('button', { name: 'Rename' }));
    expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('Latest title');
  });
  it('preserves a draft when the external title changes during editing', () => {
    const { rerender } = render(editor('Saved title'));
    fireEvent.doubleClick(screen.getByRole('button', { name: 'Rename' }));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Current draft' } });
    rerender(editor('External title'));
    expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('Current draft');
  });
  it('uses the latest title after losing focus and opening the editor again', async () => {
    const { rerender } = render(
      <>
        {editor('Saved title')}
        <button>Outside</button>
      </>,
    );
    fireEvent.doubleClick(screen.getByRole('button', { name: 'Rename' }));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Abandoned draft' } });
    fireEvent.focusOut(screen.getByRole('textbox'), { relatedTarget: screen.getByRole('button', { name: 'Outside' }) });
    await waitFor(() => expect(screen.queryByRole('textbox')).toBeNull());
    rerender(
      <>
        {editor('Latest title')}
        <button>Outside</button>
      </>,
    );
    fireEvent.doubleClick(screen.getByRole('button', { name: 'Rename' }));
    expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('Latest title');
  });
});
