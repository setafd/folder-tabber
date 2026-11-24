# FolderTabber: layout and bookmark moves

The extension reads Chromium bookmarks into one tree snapshot. Sidebar folders,
current-folder cards and breadcrumbs are derived together. Direct links on the
bookmarks bar are accessible by opening the bar itself. Only the selected folder
is persisted; bookmark data is read from Chrome on startup. Older saved selections
are migrated automatically.

## Drag and drop

- Use the dotted handle to drag a bookmark or card; nested folders are dragged by their folder icon.
- The centre of a folder header moves an item inside it. Its top/bottom edges
  insert before/after; grid-card headers also support left/right edges.
- Blue outlines mean nesting; blue lines mean insertion. Dropping on blank canvas
  or pressing Escape cancels. Dropping over the source or its descendants cancels.
- Folder breadcrumbs and sidebar root headings accept items inside them.
- Chrome move indices use the raw mixed list of folders and links, before source
  removal. The operation waits for the write, then refreshes the tree. Errors are
  visible; a failed refresh requires reloading bookmarks before another move.
- Request generations prevent old responses from reverting a newer tree. Incoming
  snapshots are resolved against the current selection. Bookmark events are
  coalesced; own moves perform their refresh explicitly.

## Adaptive masonry

Cards use one or two adjacent columns. The layout checks both sizes for large
folders, scoring resulting height and space wasted under a spanning card. It
preserves input order and runs in `O(cards × columns)` with a maximum span of two.
A small top-position penalty prefers lower free positions when scores otherwise
tie. A wide candidate needs a narrow height of at least 400 px and a height saving
of at least 25%; constants can be tuned in `GridContent.masonry.ts`.

Wide folders split their visible children into two contiguous lists based on the
collapsed structure.
Nested folder blocks stay whole; reading and Tab order follow the original list.
Expanding a nested folder preserves the column split and card columns/spans; only
heights and vertical offsets below it change. Packing decisions use collapsed
heights, so an expanded branch does not trigger a width change. Nested folders start
collapsed and can be expanded or opened as the current folder. Cards initially
show up to 24 direct children; **Show all** reveals the rest.

Rows have a shared fixed height of 36 px, headers 44 px, and titles remain on one
line with full text in tooltips. The packing algorithm can calculate both variants
from visible rows without offscreen duplicate DOM or iterative layout probes.
CSS dimensions and estimates share constants from `shared/config/grid.ts`.
Keep these dimensions in sync when changing card styles.

The toolbar combines breadcrumbs and creation buttons without a duplicate folder
heading.
The grid stays mounted through loading/empty states. ResizeObserver attaches to
the actual container. During dragging/moving the layout stays fixed. On narrow
windows all cards fit the content area and the sidebar becomes a drawer.
The drawer stays open after selecting a folder so double-click rename remains
available; close it with the toggle, backdrop or Escape. Inline rename starts
with the current saved title and discards cancelled drafts on the next open.

## Validation

```sh
npm test
npm run build
npm run lint
npm run steiger
```

Tests cover Chrome insertion semantics, pointer release geometry, cycles, stale
requests, write failures, move/refresh ordering and mixed-size packing without
overlap. Browser checks must also use the unpacked **production** build and real
Chrome bookmark APIs in an isolated test profile; dev mocks alone are insufficient.

Local reports, screenshots and browser scripts belong in ignored `artifacts/`.
The obsolete implementation plans were moved there during the 2026-11-24 cleanup.

## Release builds

The `Build CRX` GitHub Actions workflow runs when a `v*.*.*` tag is pushed.
It uses Node.js 24 and the pnpm version declared in `package.json`, installs from
the frozen lockfile, builds `build/`, and packs the extension with Chrome.
The CRX and ZIP are saved as workflow artifacts and attached to a GitHub Release
with generated release notes.

Add the existing extension's PEM private key as the repository Actions secret
`CRX_PRIVATE_KEY` to keep the same extension ID between releases. Without the
secret, the workflow generates a new key for each run, matching the reference
workflow. The key is kept outside the packaged directory and removed after packing.

Before releasing, set the same version in `package.json` and
`public/manifest.json`, commit it, and push a matching tag, for example:

```sh
git tag v2.0.0
git push origin v2.0.0
```

The release contains `folder-tabber-2.0.0.crx` and `folder-tabber-2.0.0.zip`.
