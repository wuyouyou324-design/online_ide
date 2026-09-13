import type { IDEProject, FSNode } from '../types/ide';

export const DEFAULT_INDEX_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Project</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="container">
    <h1>Hello, Online IDE!</h1>
    <p>Welcome to V1 Browser IDE.</p>
    <button id="btn">Click me</button>
  </div>
  <script src="script.js"></script>
</body>
</html>`;

export const DEFAULT_STYLE_CSS = `body {
  font-family: system-ui, -apple-system, sans-serif;
  background-color: #f4f4f9;
  color: #333;
  margin: 0;
  padding: 2rem;
}

.container {
  max-width: 600px;
  margin: 0 auto;
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

button {
  background-color: #0066cc;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

button:hover {
  background-color: #0052a3;
}`;

export const DEFAULT_SCRIPT_JS = `document.getElementById('btn')?.addEventListener('click', () => {
  alert('Hello from script.js!');
});`;

export function createDefaultProject(): IDEProject {
  const indexHtmlId = 'file_index_html';
  const styleCssId = 'file_style_css';
  const scriptJsId = 'file_script_js';

  const nodes: Record<string, FSNode> = {
    [indexHtmlId]: {
      id: indexHtmlId,
      name: 'index.html',
      type: 'file',
      parentId: null,
      content: DEFAULT_INDEX_HTML,
    },
    [styleCssId]: {
      id: styleCssId,
      name: 'style.css',
      type: 'file',
      parentId: null,
      content: DEFAULT_STYLE_CSS,
    },
    [scriptJsId]: {
      id: scriptJsId,
      name: 'script.js',
      type: 'file',
      parentId: null,
      content: DEFAULT_SCRIPT_JS,
    },
  };

  return {
    id: 'default-project',
    name: 'my-project',
    nodes,
    openTabIds: [indexHtmlId],
    activeTabId: indexHtmlId,
    expandedFolderIds: [],
  };
}
