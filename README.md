# Online IDE V1 — Stable Foundation

A browser-based online IDE designed with stability, clarity, and predictable state as core principles.

## Features

- **File Explorer**:
  - Full tree view of project files and directories.
  - Create, rename, and delete files.
  - Create, rename, and delete nested folders.
  - Confirmation prompt for deleting non-empty folders, followed by recursive deletion of child assets.
  - Default starter project (`index.html`, `style.css`, `script.js`) generated on initial clean state launch.
- **Code Editor (Monaco)**:
  - Powered by Monaco Editor (`@monaco-editor/react`).
  - Line numbers, syntax highlighting (HTML, CSS, JavaScript, TypeScript, JSON, Markdown).
  - Multiple open tabs, active tab tracking, and close tab support.
  - Authoritative synchronization with project state.
- **Single Source of Truth State Management**:
  - Centralized project state (`items`, `activeFilePath`, `openFilePaths`, `pendingSave`, `lastSavedAt`, `error`).
  - No conflicting duplicated copies of file content.
  - Unsaved change indicator reflects pending persistence to browser storage.
- **Local Persistence**:
  - Uses browser `localStorage` for local persistence.
  - Auto-save debounced at 1000ms.
  - Manual save trigger via `Ctrl+S` / `Cmd+S` and toolbar button.
  - Informative user-facing error banners on storage quota failures or invalid file operations.
  - Reset project functionality restoring initial starter template.
- **Sandboxed HTML Preview**:
  - Live sandboxed `iframe` rendering `index.html`.
  - Automatic resolution of local stylesheet links (`style.css`), scripts (`script.js`), imports, and assets.
  - Modular preview generator with error reporting.

## Tech Stack

- **Framework**: React 19, TypeScript
- **Bundler & Dev Server**: Vite 6
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`)
- **Editor**: Monaco Editor (`@monaco-editor/react`)
- **Icons**: Lucide React
- **Testing**: Vitest (jsdom) and Playwright (Chromium E2E)

## Architecture Overview

```text
src/
├── types/
│   └── ide.ts            # Project state, file node, and folder node types
├── utils/
│   ├── filesystem.ts     # Pure filesystem operations (CRUD, paths, persistence)
│   └── preview.ts        # Modular preview compiler & local asset resolver
├── components/
│   ├── Toolbar.tsx       # Save status, Ctrl+S, project reset, error toasts
│   ├── FileExplorer.tsx  # Hierarchy tree, modals for create/rename/delete
│   ├── TabsBar.tsx       # Open file tabs and tab close triggers
│   ├── CodeEditor.tsx    # Monaco editor integration and key bindings
│   └── PreviewPanel.tsx  # Sandboxed iframe preview panel
├── App.tsx               # Root component orchestrating single source of truth state
├── main.tsx              # Application entry point
└── index.css             # Tailwind CSS imports
```

## Available Scripts

- **Start Dev Server**:
  ```bash
  npm run dev
  ```
- **Run Unit & Integration Tests (Vitest)**:
  ```bash
  npm run test
  ```
- **Run End-to-End Tests (Playwright)**:
  ```bash
  npm run test:e2e
  ```
- **Production Build**:
  ```bash
  npm run build
  ```
- **Preview Production Build**:
  ```bash
  npm run preview
  ```
