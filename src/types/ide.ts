export type NodeType = 'file' | 'folder';

export interface FileNode {
  path: string; // Unique path e.g. "/index.html" or "/src/style.css"
  name: string; // e.g. "index.html"
  type: 'file';
  content: string;
}

export interface FolderNode {
  path: string; // Unique path e.g. "/src"
  name: string; // e.g. "src"
  type: 'folder';
}

export type FSItem = FileNode | FolderNode;

export interface ProjectState {
  items: Record<string, FSItem>;
  activeFilePath: string | null;
  openFilePaths: string[];
  pendingSave: boolean;
  lastSavedAt: number | null;
  error: string | null;
}

export const DEFAULT_STARTER_FILES: Record<string, FSItem> = {
  '/index.html': {
    path: '/index.html',
    name: 'index.html',
    type: 'file',
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <h1>Hello, World!</h1>
  <p>Welcome to Online IDE V1</p>
  <script src="script.js"></script>
</body>
</html>`,
  },
  '/style.css': {
    path: '/style.css',
    name: 'style.css',
    type: 'file',
    content: `body {
  font-family: system-ui, -apple-system, sans-serif;
  margin: 2rem;
  background-color: #f8fafc;
  color: #0f172a;
}

h1 {
  color: #2563eb;
}`,
  },
  '/script.js': {
    path: '/script.js',
    name: 'script.js',
    type: 'file',
    content: `console.log("Online IDE V1 Preview Loaded!");`,
  },
};
