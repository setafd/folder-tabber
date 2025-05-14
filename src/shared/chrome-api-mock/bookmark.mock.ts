import { delay } from '@shared/lib/delay';

type BTreeNode = chrome.bookmarks.BookmarkTreeNode;

export function deepFindTreeNode(array: BTreeNode[], predicate: (item: BTreeNode) => boolean): BTreeNode | null {
  for (const item of array) {
    if (predicate(item)) {
      return item;
    }
    if (Array.isArray(item.children)) {
      const found = deepFindTreeNode(item.children, predicate);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

type MockBookmark = {
  getTree: (
    callback?: (result: BTreeNode[]) => void,
  ) => Promise<BTreeNode[] | void>;
  getSubTree: (
    id: string,
    callback?: (result: BTreeNode[]) => void,
  ) => Promise<BTreeNode[] | void>;
  update: (
    id: string,
    changes: chrome.bookmarks.UpdateChanges,
    callback?: (result: BTreeNode) => void,
  ) => Promise<BTreeNode | void>;
  create: (
    createDetails: Required<chrome.bookmarks.CreateDetails>,
    callback: (result: BTreeNode) => void,
  ) => Promise<BTreeNode | void>;
  remove: (id: string, callback: () => void) => Promise<void>;
};

export const mockBookmark: MockBookmark = {
  getTree: async (callback) => {
    await delay();
    if (callback) {
      callback(mockData);
    } else {
      return mockData;
    }
  },
  getSubTree: async (id, callback) => {
    await delay(150);
    const node = deepFindTreeNode(mockData, (node) => node.id === id);
    
    if (!node) {
      throw new Error(`Node with id ${id} not found`);
    }
    
    const subTree = [node];
    
    if (callback) {
      callback(subTree);
    } else {
      return subTree;
    }
  },
  update: async (id, changes, callback) => {
    await delay();
    const originalNode = deepFindTreeNode(mockData, (node) => node.id === id);

    if (!originalNode) {
      throw new Error(`Node with id ${id} not found`);
    }

    const newNode = {
      ...originalNode,
      ...changes,
    };
    
    if (callback) {
      callback(newNode);
    } else {
      return newNode;
    }
  },
  create: async (bookmark, callback) => {
    await delay(200);
    const newNode = {
      ...bookmark,
      id: `${Date.now()}`,
      dateAdded: Date.now(),
      syncing: true,
    };

    const parentNode = deepFindTreeNode(mockData, (node) => node.id === bookmark.parentId);
    if (!parentNode || !Array.isArray(parentNode.children)) {
      throw new Error(`Parent node with id ${bookmark.parentId} not found`);
    }
    parentNode.children.push(newNode);

    if (callback) {
      callback(newNode);
    } else {
      return newNode;
    }
  },
  remove: async (id, callback) => {
    await delay();
    const nodeToDelete = deepFindTreeNode(mockData, (node) => node.id === id);
    if (!nodeToDelete) {
      throw new Error(`Node with id ${id} not found`);
    }
    const parentNode = deepFindTreeNode(mockData, (node) => node.id === nodeToDelete.parentId);
    if (!parentNode || !Array.isArray(parentNode.children)) {
      throw new Error(`Parent node with id ${nodeToDelete.parentId} not found`);
    }
    const index = parentNode.children.findIndex((node) => node.id === id);
    if (index === -1) {
      throw new Error(`Node with id ${id} not found in parent node`);
    }
    parentNode.children.splice(index, 1);
    if (callback) {
      callback();
    }
  },
};

const mockData: BTreeNode[] = [
  {
    children: [
      {
        children: [
          {
            children: [
              {
                children: [
                  {
                    children: [
                      {
                        dateAdded: 1565284326000,
                        id: '62',
                        index: 1,
                        parentId: '60',
                        syncing: false,
                        title: 'ТутТоп - только лучшие Игры',
                        url: 'https://www.tuttop.com/',
                      },
                    ],
                    dateAdded: 1736764109499,
                    id: '60',
                    index: 0,
                    parentId: '59',
                    syncing: false,
                    title: 'Сайты',
                  },
                  {
                    children: [
                      {
                        dateAdded: 1704961134000,
                        id: '79',
                        index: 14,
                        parentId: '64',
                        syncing: false,
                        title: 'Le jeu de Marin (en-fr) by DDomeIsWatching',
                        url: 'https://ddomeiswatching.itch.io/le-jeu-de-marin',
                      },
                      {
                        dateAdded: 1731786769000,
                        id: '196',
                        index: 17,
                        parentId: '64',
                        syncing: false,
                        title: 'Armies of Exigo: The Third Prophecy mod',
                        url: 'https://www.moddb.com/mods/armies-of-exigo-the-third-prophecy',
                      },
                    ],
                    dateAdded: 1736764109499,
                    dateGroupModified: 1737011128759,
                    id: '64',
                    index: 1,
                    parentId: '59',
                    syncing: false,
                    title: 'Games',
                  },
                  {
                    dateAdded: 1648669159000,
                    id: '83',
                    index: 2,
                    parentId: '59',
                    syncing: false,
                    title: 'Bloody Good Time - сетевые режимы, кооператив, мультиплеер',
                    url: 'https://coop-land.ru/allgames/shooter/2212-bloody-good-time.html',
                  },
                  {
                    dateAdded: 1731786769000,
                    id: '84',
                    index: 3,
                    parentId: '59',
                    syncing: false,
                    title: 'Armies of Exigo: The Third Prophecy mod - ModDB',
                    url: 'https://www.moddb.com/mods/armies-of-exigo-the-third-prophecy',
                  },
                ],
                dateAdded: 1736764109499,
                id: '59',
                index: 2,
                parentId: '33',
                syncing: false,
                title: 'Download',
              },
            ],
            dateAdded: 1736764109497,
            id: '33',
            index: 0,
            parentId: '1',
            syncing: false,
            title: 'Old but gold sdsadsasadsa asdasdas ddsd asd',
          },
          {
            children: [
              {
                dateAdded: 1599614423000,
                id: '124',
                index: 1,
                parentId: '93',
                syncing: false,
                title: 'https://cp.beget.com/',
                url: 'https://cp.beget.com/',
              },
              {
                children: [
                  {
                    dateAdded: 1637491993000,
                    id: '96',
                    index: 0,
                    parentId: '95',
                    syncing: false,
                    title: 'Download IntelliJ IDEA: The Capable & Ergonomic Java IDE by JetBrains',
                    url: 'https://www.jetbrains.com/idea/download/?utm_source=product&utm_medium=link&utm_campaign=IC&utm_content=2019.2#section=windows',
                  },
                  {
                    dateAdded: 1637491995000,
                    id: '99',
                    index: 3,
                    parentId: '95',
                    syncing: false,
                    title: 'Android: RxJava',
                    url: 'http://developer.alexanderklimov.ru/android/rx/',
                  },
                ],
                dateAdded: 1736764109502,
                id: '95',
                index: 3,
                parentId: '93',
                syncing: false,
                title: 'Java',
              },
              {
                children: [
                  {
                    dateAdded: 1614002722000,
                    id: '121',
                    index: 0,
                    parentId: '120',
                    syncing: false,
                    title: 'Kotlin docs—Kotlin',
                    url: 'https://kotlinlang.org/docs/home.html',
                  },
                  {
                    dateAdded: 1617230101000,
                    id: '122',
                    index: 1,
                    parentId: '120',
                    syncing: false,
                    title: 'Kotlin Koans: The Best Way To Learn Kotlin for Java Developers',
                    url: 'https://play.kotlinlang.org/koans/Introduction/Named%20arguments/Task.kt',
                  },
                ],
                dateAdded: 1736764109504,
                id: '120',
                index: 5,
                parentId: '93',
                syncing: false,
                title: 'Kotlin some really long title here',
              },
              {
                dateAdded: 1574103880000,
                id: '123',
                index: 6,
                parentId: '93',
                syncing: false,
                title: 'Archived Problems - Project Euler',
                url: 'https://projecteuler.net/archives',
              },
            ],
            dateAdded: 1736764109501,
            dateGroupModified: 1737728967697,
            id: '93',
            index: 5,
            parentId: '33',
            syncing: false,
            title: 'Прога',
          },
          {
            dateAdded: 1688470374000,
            id: '169',
            index: 0,
            parentId: '168',
            syncing: false,
            title: 'ATRIA-UI',
            url: 'https://github.com/Astartes-Mahno/atria-ui',
          },
        ],
        dateAdded: 1734427718234,
        dateGroupModified: 1737709379926,
        folderType: 'bookmarks-bar' as const,
        id: '1',
        index: 0,
        parentId: '0',
        syncing: false,
        title: 'Bookmarks bar',
      },
      {
        children: [
          {
            children: [
              {
                dateAdded: 1689683445000,
                id: '170',
                index: 1,
                parentId: '168',
                syncing: false,
                title: 'Kit',
                url: 'https://www.figma.com/file/RFKwEZfy6Ut311fGsd4bgf/ATRIA_UI-Kit?type=design&node-id=179446-171936&mode=design',
              },
              {
                dateAdded: 1691495428000,
                id: '171',
                index: 2,
                parentId: '168',
                syncing: false,
                title: 'Design',
                url: 'https://www.figma.com/file/0MOHUQAWZPUlHfjrKZWF7I/ATRIA-Admin-Panel?type=design&node-id=49-8186&t=5T5h4RyulpDFkixs-0',
              },
              {
                dateAdded: 1697362689000,
                id: '172',
                index: 3,
                parentId: '168',
                syncing: false,
                title: 'Atria: List of resources',
                url: 'https://docs.google.com/document/d/1_L3NACwdBbhzJ4BYIZVvFHBqsVJzKPy-whRiyU7V670/edit',
              },
              {
                dateAdded: 1699530081000,
                id: '173',
                index: 4,
                parentId: '168',
                syncing: false,
                title: 'A. - Asana',
                url: 'https://app.asana.com/0/1205859541981211/1205859563883108',
              },
              {
                dateAdded: 1700136789000,
                id: '174',
                index: 5,
                parentId: '168',
                syncing: false,
                title: 'ATRIA DEV',
                url: 'https://astartes.takserver.ru/',
              },
              {
                dateAdded: 1737011385830,
                id: '429',
                index: 6,
                parentId: '168',
                syncing: false,
                title: 'ATRIA server',
                url: 'https://github.com/Astartes-Mahno/astartes-go-server',
              },
              {
                dateAdded: 1737011438365,
                id: '430',
                index: 7,
                parentId: '168',
                syncing: false,
                title: 'ATRIA Admin',
                url: 'https://astartes.takserver.ru/admin/log-in',
              },
            ],
            dateAdded: 1736764109508,
            dateGroupModified: 1737011438365,
            id: '168',
            index: 5,
            parentId: '2',
            syncing: false,
            title: 'ATRIA',
          },
          {
            children: [
              {
                dateAdded: 1635291187000,
                id: '109',
                index: 3,
                parentId: '102',
                syncing: false,
                title: 'Главная | Панель управления хостингом',
                url: 'https://cp.beget.com/main',
              },
            ],
            dateAdded: 1736764109502,
            dateGroupModified: 1737400681775,
            id: '102',
            index: 4,
            parentId: '93',
            syncing: false,
            title: 'Frontend',
          },
        ],
        dateAdded: 1734427718234,
        dateGroupModified: 1737799788219,
        folderType: 'other' as const,
        id: '2',
        index: 1,
        parentId: '0',
        syncing: false,
        title: 'Other bookmarks',
      },
    ],
    dateAdded: 1743265022003,
    id: '0',
    syncing: false,
    title: '',
  },
];
