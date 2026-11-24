import { useState } from 'react';

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { MainLayout } from './MainLayout.ui';

const Folder = () => {
  const [editing, setEditing] = useState(false);
  return editing ? (
    <input aria-label="Rename folder" />
  ) : (
    <button title="Folder" onDoubleClick={() => setEditing(true)}>
      Folder
    </button>
  );
};
afterEach(cleanup);

describe('folder drawer', () => {
  it('stays open through the first click so double-click rename is reachable', () => {
    render(<MainLayout sidebar={<Folder />}>Content</MainLayout>);
    fireEvent.click(screen.getByRole('button', { name: 'Open folders' }));
    fireEvent.click(screen.getByRole('button', { name: 'Folder' }));
    expect(screen.getByRole('button', { name: 'Close folders', expanded: true }).getAttribute('aria-expanded')).toBe(
      'true',
    );
    fireEvent.doubleClick(screen.getByRole('button', { name: 'Folder' }));
    expect(screen.getByRole('textbox', { name: 'Rename folder' })).toBeTruthy();
  });
  it('can still be closed explicitly or with Escape', () => {
    render(<MainLayout sidebar={<Folder />}>Content</MainLayout>);
    fireEvent.click(screen.getByRole('button', { name: 'Open folders' }));
    fireEvent.keyDown(screen.getByRole('complementary'), { key: 'Escape' });
    expect(screen.getByRole('button', { name: 'Open folders' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Open folders' }));
    const backdrop = screen
      .getAllByRole('button', { name: 'Close folders' })
      .find((element) => !element.hasAttribute('aria-controls'))!;
    fireEvent.click(backdrop);
    expect(screen.getByRole('button', { name: 'Open folders' })).toBeTruthy();
  });
});
