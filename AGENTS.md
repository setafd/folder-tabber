# FolderTabber

FolderTabber is a Manifest V3 new-tab extension for Chromium and Firefox desktop. It combines a browser bookmarks workspace with custom pages from user-configured providers.

## CodeGraph

If `.codegraph/` exists at the repository root, use `codegraph_explore` before searching or reading code. Use `codegraph explore "<symbols or question>"` if the MCP tool is unavailable. Skip CodeGraph when the index directory is absent.

## Development and verification

- Use Node.js 24 and the pnpm version pinned in `package.json`. Install with `pnpm install --frozen-lockfile`.
- `pnpm dev` starts the Vite preview with a mock browser adapter. `pnpm build` produces the Chromium extension in `build/`. `pnpm build:firefox` produces the Firefox extension in `build-firefox/`.
- Run `pnpm lint`, `pnpm test`, and `pnpm knip` for code changes. Build both browser variants when changing shared runtime code, manifests, or build configuration. The native Git pre-commit hook runs lint and tests.
- Use React Testing Library helpers for React tests, including its `act` wrapper when explicitly flushing updates.
- Put local build logs, screenshots, and other verification output in the ignored `artifacts/` directory.

## Architecture

- Keep feature code in `src/bookmarks/`, `src/navigation/`, and `src/providers/`. Compose them in `src/app/` and keep browser APIs behind `src/platform/`.
- Preserve the platform adapters' bookmark move index semantics. Check reordering, cross-folder moves, and nested folders when changing drag and drop or masonry layout.
- Custom Pages providers return validated JSON and page-scoped CSS. Keep the mock provider in its separate repository. Preserve the extension CSP and hold saved tokens separately from configuration and snapshots, bound to the complete normalized provider address.
- Keep source code free of comments. Use clear names and put longer usage notes in the README.