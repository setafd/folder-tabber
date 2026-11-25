# FolderTabber

A browser extension for Chromium and Firefox that replaces the New Tab page with
a folder-based view of your existing bookmarks. Built with React, TypeScript and Vite, using Manifest V3.

![FolderTabber with sidebar navigation, nested folders and adaptive bookmark cards](.github/assets/folder-tabber.png)

An example workspace with demonstration bookmarks.

## Features

- Browse bookmark folders through the sidebar and breadcrumbs.
- View nested folders in an adaptive masonry layout. Large cards can span two
  columns; expanding a nested folder keeps cards in their existing columns.
- Create, rename, edit and delete folders and bookmarks.
- Move and reorder items with drag and drop across the grid, sidebar and breadcrumbs.
- Open bookmarks in tab groups named after the currently selected folder.
- Use a collapsible sidebar on narrow windows.
- Connect your own HTTP providers to add custom pages with tables, forms, metrics, actions and page-specific CSS.

Changes are written directly to the browser's bookmarks. The selected folder is
saved in the browser's local extension storage; bookmark data is loaded from the
browser when the extension starts.

## Install a release

Releases include CRX and ZIP builds for Chromium, plus a Mozilla-signed XPI for Firefox
140+ on desktop. The steps below describe Chromium installation.

1. Download `folder-tabber-<version>.zip` from [Releases](https://github.com/setafd/folder-tabber/releases)
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
The pre-commit hook runs ESLint and the test suite and blocks the commit if either fails.

### Firefox

Download `folder-tabber-firefox-<version>.xpi` from Releases, then open
`about:addons` and use **Install Add-on From File** in the settings menu.

To build and try the extension locally:

```sh
pnpm build:firefox
```

The Firefox build is written to `build-firefox/`, separately from the Chromium
build in `build/`. It uses a Firefox-specific manifest and supports tab groups.

To try it locally, open `about:debugging#/runtime/this-firefox`, choose
**Load Temporary Add-on**, and select `build-firefox/manifest.json`. Open a new tab
and accept the new-tab override if Firefox prompts you. Temporary add-ons are
removed when Firefox restarts. Permanent installation in Firefox Release requires
[Mozilla signing](https://extensionworkshop.com/documentation/publish/signing-and-distribution-overview/).

Firefox uses site icons available from open tabs, with a bundled globe icon for
other bookmarks. Chromium uses its built-in favicon service.

## Custom pages

Open **Custom pages** using the plus button in the sidebar, enter your provider address and optional access token, and check the connection. Select the pages to add and save the source. No sources or pages are connected by default.

Providers run separately from the extension. They supply JSON descriptions and data, not executable browser code. Changes to provider handlers, content, component layouts and CSS do not require rebuilding FolderTabber. Adding a new component type requires updating the extension.

Use HTTPS for remote providers. HTTP is supported on loopback for local development. Site access is requested when you connect a source. Firefox also asks for the source's declared data permissions. Tokens are stored locally, separately from source settings and snapshots; browser extension storage is not a password vault. Bookmarks are not transmitted to providers.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/v1/manifest` | `protocolVersion: 1`, `name`, `dataTypes`, and `pages: [{ id, title }]` |
| GET | `/v1/pages/:id` | `id`, `title`, `content`, optional `css` and `refreshAfterSeconds` (10–3600) |
| POST | `/v1/pages/:id/actions` | `{ requestId, action, input }` |

The address can include a path prefix; all endpoints are relative to it. Redirects are rejected and credentials are sent only to the configured source. Responses must use `application/json` and fit within 1 MB. Requests time out after 15 seconds.

Every component has a stable page-unique `id` and a `type`. Supported types are `stack`, `grid`, `text`, `metric`, `status`, `link`, `list`, `table`, `button`, and `form`. Tables use `columns: [{ field, title }]` and `rows: [{ id, values, actions? }]`. Actions use `{ id, label, input, confirm? }`. Forms use `mode: "query"` or `mode: "action"`, a `submitLabel`, and fields with `name`, `label`, `type`, optional `value`, `required`, and `options`. Supported field types are `text`, `textarea`, `select`, and `checkbox`; options use `{ label, value }`. Action forms also require an `action`. Query forms send field values as URL query parameters.

An action returns `{ status: "success", message, refresh: true }` or `{ status: "error", message, fieldErrors: { fieldName: "Error" } }`. Providers should recognize duplicate request IDs. Failed requests that may have modified data are not automatically retried.

`dataTypes` declares the optional Firefox data permissions required by the source, for example `["authenticationInfo", "websiteContent"]`. Declare the categories your provider actually uses. Tokens always require `authenticationInfo`. Supported category names follow Firefox's data collection taxonomy; the extension checks consent before making requests.

Page styles are isolated in Shadow DOM. Theme variables include `--accent-color`, `--page-background`, `--text-color`, `--control-radius`, and `--page-gap`. Public classes use `.ft-*`, including `.ft-table`, `.ft-table__row`, `.ft-metric`, `.ft-button`, `.ft-form`, and `.ft-input`. Target individual components with `[data-component-id="component-id"]`. Local CSS overrides in source settings are applied last. CSS cannot load external resources.

Visible pages refresh at the provider's interval and can be refreshed manually. The last successful representation is cached locally. If the provider is unavailable, the saved copy is displayed with its timestamp and actions disabled.

The standalone mock provider lives in a separate repository, `folder-tabber-mock-provider`. It provides Infrastructure and My tasks pages, mutable demo data, field errors and failure scenarios. Start it with `pnpm start`, then manually connect `http://127.0.0.1:4318/` with the test token `demo-token`.
