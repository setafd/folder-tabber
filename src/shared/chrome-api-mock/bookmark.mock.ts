import { delay } from '@shared/lib/delay';

type BTreeNode = chrome.bookmarks.BookmarkTreeNode;

type FindResult = {
  node: BTreeNode;
  parent: BTreeNode | null;
  index: number;
};

function findNode(
  nodes: BTreeNode[],
  predicate: (node: BTreeNode) => boolean,
  parent: BTreeNode | null = null,
): FindResult | null {
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];

    if (predicate(node)) {
      return { node, parent, index: i };
    }

    if (node.children) {
      const found = findNode(node.children, predicate, node);
      if (found) return found;
    }
  }

  return null;
}

async function resolveWithCallback<T>(
  value: T,
  callback?: (value: T) => void,
): Promise<T | void> {
  await delay();
  if (callback) {
    callback(value);
    return;
  }
  return value;
}


type MockBookmarks = {
  getTree(
    callback?: (result: BTreeNode[]) => void,
  ): Promise<BTreeNode[] | void>;

  getSubTree(
    id: string,
    callback?: (result: BTreeNode[]) => void,
  ): Promise<BTreeNode[] | void>;

  create(
    details: chrome.bookmarks.CreateDetails,
    callback?: (result: BTreeNode) => void,
  ): Promise<BTreeNode | void>;

  update(
    id: string,
    changes: chrome.bookmarks.UpdateChanges,
    callback?: (result: BTreeNode) => void,
  ): Promise<BTreeNode | void>;

  move(
    id: string,
    destination: chrome.bookmarks.MoveDestination,
    callback?: (result: BTreeNode) => void,
  ): Promise<BTreeNode | void>;

  remove(id: string, callback?: () => void): Promise<void>;
  removeTree(id: string, callback?: () => void): Promise<void>;
};

export const mockBookmarks: MockBookmarks = {
  async getTree(callback) {
    return resolveWithCallback(mockData, callback);
  },

  async getSubTree(id, callback) {
    const found = findNode(mockData, (n) => n.id === id);
    if (!found) throw new Error(`Node ${id} not found`);
    return resolveWithCallback([found.node], callback);
  },

  async create(details, callback) {
    const parentResult = findNode(mockData, (n) => n.id === details.parentId);
    if (!parentResult || !parentResult.node.children) {
      throw new Error(`Parent ${details.parentId} not found`);
    }

    const node: BTreeNode = {
      id: crypto.randomUUID(),
      parentId: details.parentId,
      title: details.title ?? '',
      url: details.url,
      index: details.index ?? parentResult.node.children.length,
      dateAdded: Date.now(),
      syncing: false,
    };

    parentResult.node.children.splice(node.index!, 0, node);
    return resolveWithCallback(node, callback);
  },

  async update(id, changes, callback) {
    const found = findNode(mockData, (n) => n.id === id);
    if (!found) throw new Error(`Node ${id} not found`);

    Object.assign(found.node, changes);
    return resolveWithCallback(found.node, callback);
  },

  async move(id, destination, callback) {
    const source = findNode(mockData, (n) => n.id === id);
    if (!source || !source.parent?.children) {
      throw new Error(`Node ${id} not found`);
    }

    // remove from old parent
    source.parent.children.splice(source.index, 1);

    const targetParentId = destination.parentId ?? source.parent.id;
    const targetParentResult = findNode(mockData, (n) => n.id === targetParentId);

    if (!targetParentResult || !targetParentResult.node.children) {
      throw new Error(`Target parent ${targetParentId} not found`);
    }

    const newIndex =
      destination.index ?? targetParentResult.node.children.length;

    source.node.parentId = targetParentId;
    source.node.index = newIndex;

    targetParentResult.node.children.splice(newIndex, 0, source.node);

    return resolveWithCallback(source.node, callback);
  },

  async remove(id, callback) {
    const found = findNode(mockData, (n) => n.id === id);
    if (!found || !found.parent?.children) {
      throw new Error(`Node ${id} not found`);
    }

    found.parent.children.splice(found.index, 1);
    await delay();
    callback?.();
  },

  async removeTree(id, callback) {
    // для bookmarks removeTree == remove
    return this.remove(id, callback);
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
                        title: 'Google',
                        url: 'https://www.google.com/',
                      },
                    ],
                    dateAdded: 1736764109499,
                    id: '60',
                    index: 0,
                    parentId: '59',
                    syncing: false,
                    title: 'Group 1',
                  },
                  {
                    children: [
                      {
                        dateAdded: 1731786769000,
                        id: '196',
                        index: 17,
                        parentId: '64',
                        syncing: false,
                        title: 'Google 2',
                        url: 'https://www.google.com/',
                      },
                    ],
                    dateAdded: 1736764109499,
                    dateGroupModified: 1737011128759,
                    id: '64',
                    index: 1,
                    parentId: '59',
                    syncing: false,
                    title: 'Group 2',
                  },
                  {
                    dateAdded: 1648669159000,
                    id: '83',
                    index: 2,
                    parentId: '59',
                    syncing: false,
                    title: 'Google 3',
                    url: 'https://www.google.com/',
                  },
                  {
                    dateAdded: 1731786769000,
                    id: '84',
                    index: 3,
                    parentId: '59',
                    syncing: false,
                    title: 'Google 4',
                    url: 'https://www.google.com/',
                  },
                ],
                dateAdded: 1736764109499,
                id: '59',
                index: 2,
                parentId: '33',
                syncing: false,
                title: 'Group 3',
              },
            ],
            dateAdded: 1736764109497,
            id: '33',
            index: 0,
            parentId: '1',
            syncing: false,
            title: 'Group 4',
          },
          {
            children: [
              {
                dateAdded: 1599614423000,
                id: '124',
                index: 1,
                parentId: '93',
                syncing: false,
                title: 'Google 5',
                url: 'https://www.google.com/',
              },
              {
                children: [
                  {
                    dateAdded: 1637491993000,
                    id: '96',
                    index: 0,
                    parentId: '95',
                    syncing: false,
                    title: 'Google 6',
                    url: 'https://www.google.com/',
                  },
                  {
                    dateAdded: 1637491995000,
                    id: '99',
                    index: 3,
                    parentId: '95',
                    syncing: false,
                    title: 'Google 7',
                    url: 'https://www.google.com/',
                  },
                ],
                dateAdded: 1736764109502,
                id: '95',
                index: 3,
                parentId: '93',
                syncing: false,
                title: 'Group 5',
              },
              {
                children: [
                  {
                    dateAdded: 1614002722000,
                    id: '121',
                    index: 0,
                    parentId: '120',
                    syncing: false,
                    title: 'Google 8',
                    url: 'https://www.google.com/',
                  },
                  {
                    dateAdded: 1617230101000,
                    id: '122',
                    index: 1,
                    parentId: '120',
                    syncing: false,
                    title: 'Google 9',
                    url: 'https://www.google.com/',
                  },
                ],
                dateAdded: 1736764109504,
                id: '120',
                index: 5,
                parentId: '93',
                syncing: false,
                title: 'Group 6',
              },
              {
                dateAdded: 1574103880000,
                id: '123',
                index: 6,
                parentId: '93',
                syncing: false,
                title: 'Google 10',
                url: 'https://www.google.com/',
              },
            ],
            dateAdded: 1736764109501,
            dateGroupModified: 1737728967697,
            id: '93',
            index: 5,
            parentId: '33',
            syncing: false,
            title: 'Group 7',
          },
          {
            dateAdded: 1688470374000,
            id: '169',
            index: 0,
            parentId: '168',
            syncing: false,
            title: 'Google 11',
            url: 'https://www.google.com/',
          },
          {
            dateAdded: 1688470374000,
            id: '312312',
            index: 0,
            parentId: '168',
            syncing: false,
            title: 'Google 11',
            url: 'https://www.google.com/',
          },
          {
            dateAdded: 1688470374000,
            id: '32131231',
            index: 0,
            parentId: '168',
            syncing: false,
            title: 'Google 11',
            url: 'https://www.google.com/',
          },
          {
            dateAdded: 1688470374000,
            id: '3123123',
            index: 0,
            parentId: '168',
            syncing: false,
            title: 'Google 11',
            url: 'https://www.google.com/',
          },
          {
            dateAdded: 1688470374000,
            id: 'ascascas',
            index: 0,
            parentId: '168',
            syncing: false,
            title: 'Google 11',
            url: 'https://www.google.com/',
          },
          {
            dateAdded: 1688470374000,
            id: 'hgasfas',
            index: 0,
            parentId: '168',
            syncing: false,
            title: 'Google 11',
            url: 'https://www.google.com/',
          },
          {
            dateAdded: 1688470374000,
            id: 'dhasfsa',
            index: 0,
            parentId: '168',
            syncing: false,
            title: 'Google 11',
            url: 'https://www.google.com/',
          },
          {
            dateAdded: 1688470374000,
            id: 'hgsasf',
            index: 0,
            parentId: '168',
            syncing: false,
            title: 'Google 11',
            url: 'https://www.google.com/',
          },
          {
            dateAdded: 1688470374000,
            id: 'dasdads',
            index: 0,
            parentId: '168',
            syncing: false,
            title: 'Google 11',
            url: 'https://www.google.com/',
          },
          {
            dateAdded: 1688470374000,
            id: 'dasdas',
            index: 0,
            parentId: '168',
            syncing: false,
            title: 'Google 11',
            url: 'https://www.google.com/',
          },
          {
            dateAdded: 1688470374000,
            id: (Math.random() * 113512).toString(),
            index: 0,
            parentId: '168',
            syncing: false,
            title: 'Google 11',
            url: 'https://www.google.com/',
          },
          {
            dateAdded: 1688470374000,
            id: (Math.random() * 113512).toString(),
            index: 0,
            parentId: '168',
            syncing: false,
            title: 'Google 11',
            url: 'https://www.google.com/',
          },
          {
            dateAdded: 1688470374000,
            id: (Math.random() * 113512).toString(),
            index: 0,
            parentId: '168',
            syncing: false,
            title: 'Google 11',
            url: 'https://www.google.com/',
          },
          {
            dateAdded: 1688470374000,
            id: (Math.random() * 113512).toString(),
            index: 0,
            parentId: '168',
            syncing: false,
            title: 'Google 11',
            url: 'https://www.google.com/',
          },
          {
            dateAdded: 1688470374000,
            id: (Math.random() * 113512).toString(),
            index: 0,
            parentId: '168',
            syncing: false,
            title: 'Google 11',
            url: 'https://www.google.com/',
          },
          {
            dateAdded: 1688470374000,
            id: (Math.random() * 113512).toString(),
            index: 0,
            parentId: '168',
            syncing: false,
            title: 'Google 11',
            url: 'https://www.google.com/',
          },
          {
            dateAdded: 1688470374000,
            id: (Math.random() * 113512).toString(),
            index: 0,
            parentId: '168',
            syncing: false,
            title: 'Google 11',
            url: 'https://www.google.com/',
          },
          {
            dateAdded: 1688470374000,
            id: (Math.random() * 113512).toString(),
            index: 0,
            parentId: '168',
            syncing: false,
            title: 'Google 11',
            url: 'https://www.google.com/',
          },
          {
            dateAdded: 1688470374000,
            id: (Math.random() * 113512).toString(),
            index: 0,
            parentId: '168',
            syncing: false,
            title: 'some loooooong looooooong Google 11',
            url: 'https://www.google.com/',
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
                title: 'Google 12',
                url: 'https://www.google.com/',
              },
              {
                dateAdded: 1691495428000,
                id: '171',
                index: 2,
                parentId: '168',
                syncing: false,
                title: 'Google 13',
                url: 'https://www.google.com/',
              },
              {
                dateAdded: 1697362689000,
                id: '172',
                index: 3,
                parentId: '168',
                syncing: false,
                title: 'Google 14',
                url: 'https://www.google.com/',
              },
              {
                dateAdded: 1699530081000,
                id: '173',
                index: 4,
                parentId: '168',
                syncing: false,
                title: 'Google 15',
                url: 'https://www.google.com/',
              },
              {
                dateAdded: 1700136789000,
                id: '174',
                index: 5,
                parentId: '168',
                syncing: false,
                title: 'Google 16',
                url: 'https://www.google.com/',
              },
              {
                dateAdded: 1737011385830,
                id: '429',
                index: 6,
                parentId: '168',
                syncing: false,
                title: 'Google 17',
                url: 'https://www.google.com/',
              },
              {
                dateAdded: 1737011438365,
                id: '430',
                index: 7,
                parentId: '168',
                syncing: false,
                title: 'Google 18',
                url: 'https://www.google.com/',
              },
            ],
            dateAdded: 1736764109508,
            dateGroupModified: 1737011438365,
            id: '168',
            index: 5,
            parentId: '2',
            syncing: false,
            title: 'Group 8',
          },
          {
            children: [
              {
                dateAdded: 1635291187000,
                id: '109',
                index: 3,
                parentId: '102',
                syncing: false,
                title: 'Google 19',
                url: 'https://www.google.com/',
              },
            ],
            dateAdded: 1736764109502,
            dateGroupModified: 1737400681775,
            id: '102',
            index: 4,
            parentId: '93',
            syncing: false,
            title: 'Group 9',
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
