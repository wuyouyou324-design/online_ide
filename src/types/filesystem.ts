export type FileNodeType = 'file' | 'directory';

export interface FileNode {
  id: string; // Unique path, e.g. "my-project/index.html" or "my-project/src/app.js"
  name: string; // e.g. "index.html"
  type: FileNodeType;
  path: string; // Same as id or normalized relative path
  parentId: string | null; // e.g. "my-project" or null if root
  content?: string; // Present if type === 'file'
  children?: string[]; // Child IDs if type === 'directory'
}

export interface ProjectState {
  // Map of file/folder ID -> FileNode
  nodes: Record<string, FileNode>;
  // Root node ID
  rootId: string;
  // Currently selected file or folder in explorer
  selectedId: string | null;
  // Currently open tabs (array of file IDs)
  openTabs: string[];
  // Currently active file tab ID
  activeTabId: string | null;
  // Status indicator: true if there are pending unsaved changes to browser storage
  isPendingSave: boolean;
  // User-facing error message, if any
  error: string | null;
}

export const STARTER_INDEX_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Online IDE V1</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div id="app">
    <h1>Hello, Online IDE!</h1>
    <p>Edit index.html, style.css, or script.js to see changes instantly.</p>
  </div>
  <script src="script.js"></script>
</body>
</html>`;

export const STARTER_STYLE_CSS = `body {
  font-family: system-ui, -apple-system, sans-serif;
  background-color: #f4f4f9;
  color: #333;
  margin: 0;
  padding: 2rem;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}

#app {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  text-align: center;
}

h1 {
  color: #2563eb;
  margin-top: 0;
}`;

export const STARTER_SCRIPT_JS = `console.log("Welcome to Online IDE V1!");
document.addEventListener("DOMContentLoaded", () => {
  const h1 = document.querySelector("h1");
  if (h1) {
    h1.addEventListener("click", () => {
      alert("Header clicked!");
    });
  }
});`;

export const createStarterProject = (): ProjectState => {
  const rootId = 'my-project';
  const nodes: Record<string, FileNode> = {
    [rootId]: {
      id: rootId,
      name: 'my-project',
      type: 'directory',
      path: rootId,
      parentId: null,
      children: [`${rootId}/index.html`, `${rootId}/style.css`, `${rootId}/script.js`],
    },
    [`${rootId}/index.html`]: {
      id: `${rootId}/index.html`,
      name: 'index.html',
      type: 'file',
      path: `${rootId}/index.html`,
      parentId: rootId,
      content: STARTER_INDEX_HTML,
    },
    [`${rootId}/style.css`]: {
      id: `${rootId}/style.css`,
      name: 'style.css',
      type: 'file',
      path: `${rootId}/style.css`,
      parentId: rootId,
      content: STARTER_STYLE_CSS,
    },
    [`${rootId}/script.js`]: {
      id: `${rootId}/script.js`,
      name: 'script.js',
      type: 'file',
      path: `${rootId}/script.js`,
      parentId: rootId,
      content: STARTER_SCRIPT_JS,
    },
  };

  return {
    nodes,
    rootId,
    selectedId: `${rootId}/index.html`,
    openTabs: [`${rootId}/index.html`, `${rootId}/style.css`, `${rootId}/script.js`],
    activeTabId: `${rootId}/index.html`,
    isPendingSave: false,
    error: null,
  };
};
