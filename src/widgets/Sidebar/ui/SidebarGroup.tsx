import { useStore } from 'zustand';

import { FolderCreateItem } from '@features/folder/create';

import { type TopLevelFolder, bookmarkStore, useFolderDrop } from '@entities/bookmark';

import { SidebarItem } from './SidebarItem';

import styles from './Sidebar.module.scss';

export const SidebarGroup = ({
  parent,
  onChangeFolder,
}: {
  parent: TopLevelFolder;
  onChangeFolder: (id: string, title: string) => void;
}) => {
  const selectedId = useStore(bookmarkStore, (s) => s.selectedFolder?.id);
  const drop = useFolderDrop(parent.id, 'sidebar-root');
  return (
    <section aria-labelledby={`sidebar-section-${parent.id}`} className={styles.section}>
      <h2 id={`sidebar-section-${parent.id}`} className={styles.sectionTitle}>
        <button
          ref={drop.setNodeRef}
          data-drop={drop.intent}
          title={`Open ${parent.title}`}
          aria-current={selectedId === parent.id ? 'page' : undefined}
          onClick={() => onChangeFolder(parent.id, parent.title)}
        >
          {parent.title}
        </button>
      </h2>
      <ul className={styles.folderList}>
        {parent.children.map((folder) => (
          <SidebarItem
            key={folder.id}
            folder={folder}
            parentId={parent.id}
            isSelected={folder.id === selectedId}
            onChangeFolder={onChangeFolder}
          />
        ))}
        <li className={styles.folderWrapper}>
          <FolderCreateItem buttonClassName={styles.folderItem} parentId={parent.id} />
        </li>
      </ul>
    </section>
  );
};
