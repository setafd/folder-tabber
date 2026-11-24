import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { getBookmarksTree, moveBookmark } from './bookmark.api';
import { type FolderChildren, bookmarkStore } from './bookmark.model';

vi.mock('./bookmark.api', () => ({ getBookmarksTree: vi.fn(), moveBookmark: vi.fn() }));
const link: FolderChildren = {
  id: 'L',
  title: 'Loose link',
  url: 'https://example.com',
  parentId: '1',
};
const nested: FolderChildren = { id: 'N', title: 'Nested', parentId: 'F', children: [] };
const folder: FolderChildren = { id: 'F', title: 'Folder', parentId: '1', children: [nested] };
const tree: FolderChildren[] = [{ id: '1', title: 'Root', parentId: '0', children: [link, folder] }];
const load = vi.mocked(getBookmarksTree);
const move = vi.mocked(moveBookmark);
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((a, b) => {
    resolve = a;
    reject = b;
  });
  return { resolve, reject, promise };
}
beforeAll(async () => {
  await bookmarkStore.persist.rehydrate();
});
beforeEach(() => {
  vi.resetAllMocks();
  bookmarkStore.setState({
    tree,
    folders: [],
    selectedFolder: { id: '1', title: 'Root' },
    folderChildrens: [],
    folderChildrenRaw: [],
    breadcrumbs: [],
    isMoving: false,
    isLoading: false,
    error: null,
  });
  load.mockResolvedValue(tree);
  move.mockResolvedValue(link);
});
describe('authoritative bookmark snapshots and move lifecycle', () => {
  it('filters sidebar links while preserving access through their root', async () => {
    await bookmarkStore.getState().fetchFolders();
    expect(bookmarkStore.getState().folders[0].children.map((node) => node.id)).toEqual(['F']);
    expect(bookmarkStore.getState().folderChildrens.map((node) => node.id)).toEqual(['1', 'F']);
    expect(bookmarkStore.getState().folderChildrenRaw[0]).toBe(link);
  });
  it('does not create a synthetic empty card', async () => {
    await bookmarkStore.getState().setSelectedFolder(folder);
    expect(bookmarkStore.getState().folderChildrens.map((node) => node.id)).toEqual(['N']);
  });
  it('cannot select a URL node as a folder', async () => {
    await bookmarkStore.getState().setSelectedFolder(link);
    expect(bookmarkStore.getState().selectedFolder?.id).toBe('1');
  });
  it('uses the current selection when an older refresh resolves', async () => {
    const pending = deferred<FolderChildren[]>();
    load.mockReturnValueOnce(pending.promise);
    const refresh = bookmarkStore.getState().fetchFolders();
    await bookmarkStore.getState().setSelectedFolder(folder);
    pending.resolve(tree);
    await refresh;
    expect(bookmarkStore.getState().selectedFolder?.id).toBe('F');
    expect(bookmarkStore.getState().folderChildrenRaw[0].id).toBe('N');
  });
  it('ignores out-of-order responses rather than reverting a newer snapshot', async () => {
    const old = deferred<FolderChildren[]>();
    load.mockReturnValueOnce(old.promise);
    const first = bookmarkStore.getState().fetchFolders();
    await bookmarkStore.getState().fetchFolders();
    old.resolve([]);
    await first;
    expect(bookmarkStore.getState().tree).toBe(tree);
    expect(bookmarkStore.getState().isLoading).toBe(false);
  });
  it('awaits the write before refreshing and blocks a concurrent write', async () => {
    const pending = deferred<FolderChildren>();
    move.mockReturnValueOnce(pending.promise);
    const first = bookmarkStore.getState().moveNode('L', 'F');
    expect(load).not.toHaveBeenCalled();
    expect(bookmarkStore.getState().isMoving).toBe(true);
    expect(await bookmarkStore.getState().moveNode('L', 'F')).toBe(false);
    pending.resolve(link);
    expect(await first).toBe(true);
    expect(move).toHaveBeenCalledOnce();
    expect(load).toHaveBeenCalledOnce();
    expect(bookmarkStore.getState().isMoving).toBe(false);
  });
  it('rejects URL containers and descendant moves before calling Chrome', async () => {
    expect(await bookmarkStore.getState().moveNode('F', 'L')).toBe(false);
    expect(await bookmarkStore.getState().moveNode('F', 'N')).toBe(false);
    expect(await bookmarkStore.getState().moveNode('F', 'F')).toBe(false);
    expect(move).not.toHaveBeenCalled();
  });
  it('reports API rejection and keeps the tree intact', async () => {
    move.mockRejectedValueOnce(new Error('not allowed'));
    expect(await bookmarkStore.getState().moveNode('L', 'F')).toBe(false);
    expect(bookmarkStore.getState().tree).toBe(tree);
    expect(bookmarkStore.getState().error).toContain('Could not move');
    expect(load).not.toHaveBeenCalled();
  });
  it('distinguishes failed reconciliation from a failed move', async () => {
    load.mockRejectedValueOnce(new Error('read failed'));
    expect(await bookmarkStore.getState().moveNode('L', 'F')).toBe(true);
    expect(bookmarkStore.getState().error).toContain('Moved, but');
    expect(bookmarkStore.getState().isMoving).toBe(false);
  });
});

it('passes the final position to the platform when moving forward', async () => {
  bookmarkStore.setState({ tree: [{ id: 'root', title: 'Toolbar', parentId: 'root________', children: [
    { id: 'A', title: 'A', parentId: 'root', url: 'https://a.example' },
    { id: 'separator', title: '', parentId: 'root', type: 'separator' },
    { id: 'B', title: 'B', parentId: 'root', url: 'https://b.example' },
  ] }] });
  expect(await bookmarkStore.getState().moveNode('A', 'root', 3)).toBe(true);
  expect(move).toHaveBeenCalledWith('A', { parentId: 'root', index: 2, previousParentId: 'root', previousIndex: 0 });
});

it('protects browser root folders without relying on Chromium IDs', async () => {
  bookmarkStore.setState({ tree: [{ id: 'toolbar_____', title: 'Toolbar', parentId: 'root________', children: [] }, { id: 'unfiled_____', title: 'Other', parentId: 'root________', children: [] }] });
  expect(await bookmarkStore.getState().moveNode('toolbar_____', 'unfiled_____')).toBe(false);
  expect(move).not.toHaveBeenCalled();
});

it('keeps separators in the source snapshot without rendering them as links or folders', async () => {
  const snapshot: FolderChildren[] = [{ id: 'toolbar_____', title: 'Toolbar', children: [
    { id: 'separator', title: '', type: 'separator' },
    { id: 'A', title: 'Docs', url: 'https://example.com' },
  ] }];
  load.mockResolvedValue(snapshot);
  await bookmarkStore.getState().fetchFolders();
  const state = bookmarkStore.getState();
  expect(state.tree[0].children).toHaveLength(2);
  expect(state.folders[0].children).toHaveLength(0);
  expect(state.folderChildrens[0].children?.map(node => node.id)).toEqual(['A']);
});
