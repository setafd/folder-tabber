# React Chrome Extension Template

This is a template for creating a Chrome extension using React and [Vite](https://vitejs.dev/) with TypeScript.

## Some Features
1. Keep a small cache of recently opened folders if you want "back/forward" fast
2. Optimistic updates when creating/deleting bookmarks

## Main concepts
![Alt text](scheme.png)

## Getting Started

## 📂 Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`.
2. Enable "Developer mode" using the toggle switch in the top right corner.
3. Click "Load unpacked" and select the `build` directory.

Your React app should now be loaded as a Chrome extension!

## 🗂️ Project Structure

- `public/`: Contains static files and the `manifest.json`.
- `src/`: Contains the React app source code.
- `vite.config.ts`: Vite configuration file.
- `tsconfig.json`: TypeScript configuration file.
- `package.json`: Contains the project dependencies and scripts.

## License

This project is licensed under the MIT License.