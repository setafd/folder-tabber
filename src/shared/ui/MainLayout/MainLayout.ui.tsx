import { type PropsWithChildren, useState } from 'react';

import styles from './MainLayout.module.scss';

export const MainLayout = ({ children, sidebar }: PropsWithChildren<{ sidebar: React.ReactNode }>) => {
  const [open, setOpen] = useState(false);
  return (
    <div className={styles.layout}>
      <button
        className={styles.menuButton}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls="bookmark-sidebar"
        aria-label={open ? 'Close folders' : 'Open folders'}
      >
        ☰
      </button>
      {open && <button className={styles.backdrop} aria-label="Close folders" onClick={() => setOpen(false)} />}
      <aside
        id="bookmark-sidebar"
        aria-label="Sidebar"
        className={`${styles.sidebar} ${open ? styles.open : ''}`}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setOpen(false);
        }}
      >
        {sidebar}
      </aside>
      <main className={styles.content}>{children}</main>
    </div>
  );
};
