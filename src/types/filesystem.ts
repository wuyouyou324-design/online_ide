export type FileType = 'file' | 'folder';

export interface FileNode {
  id: string;
  name: string;
  type: FileType;
  parentId: string | null; // null if in root directory
  content?: string; // only present if type === 'file'
}

export interface ProjectState {
  files: Record<string, FileNode>;
  selectedFileId: string | null;
  openTabIds: string[];
  activeTabId: string | null;
}

export interface DefaultStarterProject {
  files: Record<string, FileNode>;
  selectedFileId: string;
  openTabIds: string[];
  activeTabId: string;
}

export const DEFAULT_STARTER_FILES: Record<string, FileNode> = {
  'root-index-html': {
    id: 'root-index-html',
    name: 'index.html',
    type: 'file',
    parentId: null,
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Project</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <h1>Hello, Online IDE!</h1>
  <p>Edit index.html, style.css, or script.js to see updates in the preview.</p>
  <script src="script.js"></script>
</body>
</html>`,
  },
  'root-style-css': {
    id: 'root-style-css',
    name: 'style.css',
    type: 'file',
    parentId: null,
    content: `body {
  font-family: sans-serif;
  padding: 2rem;
  background-color: #f0f4f8;
  color: #1a202c;
}

h1 {
  color: #2b6cb0;
}`,
  },
  'root-script-js': {
    id: 'root-script-js',
    name: 'script.js',
    type: 'file',
    parentId: null,
    content: `console.log("Hello from script.js!");
`,
  },
};

export const INITIAL_PROJECT_STATE: ProjectState = {
  files: DEFAULT_STARTER_FILES,
  selectedFileId: 'root-index-html',
  openTabIds: ['root-index-html', 'root-style-css', 'root-script-js'],
  activeTabId: 'root-index-html',
};
