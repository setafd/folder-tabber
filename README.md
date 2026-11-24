# FolderTabber

A Chromium extension that replaces the New Tab page with a folder-based view of
your existing bookmarks. Built with React, TypeScript and Vite, using Manifest V3.

## Features

- Browse bookmark folders through the sidebar and breadcrumbs.
- View nested folders in an adaptive masonry layout. Large cards can span two
  columns; expanding a nested folder keeps cards in their existing columns.
- Create, rename, edit and delete folders and bookmarks.
- Move and reorder items with drag and drop across the grid, sidebar and breadcrumbs.
- Open bookmarks in tab groups named after the currently selected folder.
- Use a collapsible sidebar on narrow windows.

Changes are written directly to the browser's bookmarks. The selected folder is
saved in `chrome.storage.local`; bookmark data is loaded from Chrome when the
extension starts.

## Install a release

Requires a Chromium-based browser with the `bookmarks`, `tabGroups` and other
extension APIs declared in [the manifest](public/manifest.json).

1. Download the ZIP from [Releases](https://github.com/setafd/folder-tabber/releases)
   and extract it to a folder you will keep on disk.
2. Open `chrome://extensions/` and enable **Developer mode**.
3. Choose **Load unpacked** and select the extracted folder containing `manifest.json`.
4. Open a new tab.

Releases also include a signed CRX for browsers and environments that support
[local CRX installation](https://developer.chrome.com/docs/extensions/how-to/distribute/install-extensions).

## Build from source

Use Node.js 24, matching CI, and pnpm 12.23.0, as pinned in `package.json`.
See the [pnpm installation guide](https://pnpm.io/installation) if pnpm is not installed.

```sh
git clone https://github.com/setafd/folder-tabber.git
cd folder-tabber
pnpm install --frozen-lockfile
pnpm build
```

Load the generated `build/` directory through **Load unpacked** on
`chrome://extensions/`. After rebuilding, reload the extension on that page and
open a new tab to use the updated build.

Installing dependencies runs `prepare`, which configures Git to use `.githooks/`.
The pre-commit hook runs ESLint and Steiger and blocks the commit if either fails.
