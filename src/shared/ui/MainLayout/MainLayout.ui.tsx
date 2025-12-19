import { PropsWithChildren } from 'react';

import styles from './MainLayout.module.scss';

type LayoutProps = {
  sidebar: React.ReactNode;
};

export const MainLayout: React.FC<PropsWithChildren<LayoutProps>> = ({ children, sidebar }) => {
  const version = chrome.runtime.getManifest().version
  return (
    <div className={styles.layout}>
      <aside aria-label="Sidebar" className={styles.sidebar}>{sidebar}</aside>
      <main className={styles.content}>{children}</main>

      <span className={styles.version}>v{version}</span>
    </div>
  );
};
