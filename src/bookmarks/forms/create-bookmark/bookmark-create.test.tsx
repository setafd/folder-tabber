import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { platform } from '@/platform';

import { useCreateBookmarkState } from './bookmark-create.model';
import { BookmarkCreateFormModal } from './bookmark-create.ui';

afterEach(() => {
  cleanup();
  useCreateBookmarkState.getState().onClose();
});

describe('create dialog context', () => {
  it('creates a folder in the supplied parent after the closed modal was mounted', async () => {
    const [root] = await platform.bookmarks.getTree();
    render(<BookmarkCreateFormModal />);
    act(() => useCreateBookmarkState.getState().setOpen(root.id, 'folder'));
    fireEvent.change(await screen.findByLabelText('Title'), { target: { value: 'Created in the supplied folder' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    await waitFor(async () => {
      const [folder] = await platform.bookmarks.getSubTree(root.id);
      expect(folder.children?.some(node => node.title === 'Created in the supplied folder')).toBe(true);
    });
  });
  it('resets the destination and kind when opening the dialog for another parent', async () => {
    const roots = await platform.bookmarks.getTree();
    render(<BookmarkCreateFormModal />);
    act(() => useCreateBookmarkState.getState().setOpen(roots[0].id, 'folder'));
    await screen.findByLabelText('Title');
    act(() => useCreateBookmarkState.getState().onClose());
    act(() => useCreateBookmarkState.getState().setOpen(roots[1].id, 'bookmark'));
    fireEvent.change(await screen.findByLabelText('Title'), { target: { value: 'Bookmark in another folder' } });
    fireEvent.change(screen.getByLabelText('URL'), { target: { value: 'https://example.com/created' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    await waitFor(async () => {
      const [folder] = await platform.bookmarks.getSubTree(roots[1].id);
      expect(folder.children?.find(node => node.title === 'Bookmark in another folder')?.url).toBe('https://example.com/created');
    });
  });
});
