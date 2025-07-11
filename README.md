# 📁 FolderTabber – Chrome Extension
This Chrome extension replaces the default New Tab page with a custom one that visually organizes your bookmarks by their folder structure. It offers a quick, contextual way to access your saved links—right where you'd expect them.

## 🚀 Features

- **📂 Bookmark Grouping**  
  Automatically organizes bookmarks into groups based on their folder hierarchy.

- **⚡ Quick Access**  
  Instantly access bookmarks from their respective folders directly on the New Tab page.

- **🧠 Contextual Opening**  
  When clicked, bookmarks open in a Chrome tab group named after their parent folder, preserving context.

## ✅ Requirements
* A Chromium-based browser
* Support for the chrome.tabGroups API

## 🔧 Installation

You have two options to install the extension:

### 1️⃣ Use Pre-built `.crx` File

- Download the latest `.crx` file from the [Releases](https://github.com/your-username/your-repo/releases) section.
- Open your browser's Extensions page: `chrome://extensions/`
- Drag and drop the downloaded `.crx` file into the Extensions page.
- Confirm the installation when prompted.

### 2️⃣ Build It Yourself

1. Clone or download this repository.
2. In the project folder, run:
```bash
npm install
npm run build
```
> Requires Node.js to be installed.

3. Open the Extensions page in your browser: chrome://extensions/
4. Enable Developer mode (toggle switch in the top right corner).
5. Click "Load unpacked" and select the build folder from the project directory.

>💡 Optionally, you can also pack the extension into a .crx file using Chrome's "Pack extension" feature on the Extensions page.