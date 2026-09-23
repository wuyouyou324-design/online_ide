import React, { useMemo } from 'react';
import { FileNode } from '../types/filesystem';
import { getNodePath } from '../state/projectReducer';

interface PreviewProps {
  files: Record<string, FileNode>;
}

/**
 * Creates a Blob URL for a file node based on its MIME type.
 */
function createBlobUrl(content: string, type: string): string {
  const blob = new Blob([content], { type });
  return URL.createObjectURL(blob);
}

/**
 * Resolves relative asset references (CSS, JS) in `index.html` with generated Blob URLs.
 */
export function buildPreviewHtml(files: Record<string, FileNode>): string {
  // Find entry point index.html
  const indexNode = Object.values(files).find(
    (f) => f.type === 'file' && f.name.toLowerCase() === 'index.html'
  );

  if (!indexNode || indexNode.content === undefined) {
    return `<!DOCTYPE html>
<html>
  <head>
    <style>
      body { font-family: sans-serif; padding: 2rem; color: #a0aec0; background: #1a202c; text-align: center; }
    </style>
  </head>
  <body>
    <h3>No index.html found</h3>
    <p>Create an <code>index.html</code> file in your project to view the HTML preview.</p>
  </body>
</html>`;
  }

  let html = indexNode.content;
  const createdUrls: string[] = [];

  try {
    // Map relative file paths to file nodes
    const pathToFileMap: Record<string, FileNode> = {};
    for (const node of Object.values(files)) {
      if (node.type === 'file') {
        const fullPath = getNodePath(files, node.id);
        pathToFileMap[fullPath] = node;
        // Also map top-level filename for flat references
        if (node.parentId === null) {
          pathToFileMap[node.name] = node;
        }
      }
    }

    // Replace <link rel="stylesheet" href="..."> tags with Blob URLs
    html = html.replace(
      /<link\s+[^>]*href=["']([^"']+)["'][^>]*>/gi,
      (match, href) => {
        const cleanHref = href.startsWith('./') ? href.slice(2) : href;
        const targetFile = pathToFileMap[cleanHref];
        if (targetFile && targetFile.content) {
          const blobUrl = createBlobUrl(targetFile.content, 'text/css');
          createdUrls.push(blobUrl);
          return match.replace(href, blobUrl);
        }
        return match;
      }
    );

    // Replace <script src="..."> tags with Blob URLs
    html = html.replace(
      /<script\s+[^>]*src=["']([^"']+)["'][^>]*\s*><\/script>/gi,
      (match, src) => {
        const cleanSrc = src.startsWith('./') ? src.slice(2) : src;
        const targetFile = pathToFileMap[cleanSrc];
        if (targetFile && targetFile.content) {
          const blobUrl = createBlobUrl(targetFile.content, 'text/javascript');
          createdUrls.push(blobUrl);
          return match.replace(src, blobUrl);
        }
        return match;
      }
    );

    return html;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown preview error';
    return `<!DOCTYPE html>
<html>
  <head>
    <style>body { font-family: sans-serif; padding: 2rem; color: #f56565; background: #1a202c; }</style>
  </head>
  <body>
    <h3>Preview Error</h3>
    <pre>${errorMsg}</pre>
  </body>
</html>`;
  }
}

export const Preview: React.FC<PreviewProps> = ({ files }) => {
  const previewHtml = useMemo(() => buildPreviewHtml(files), [files]);

  return (
    <div className="h-full w-full bg-white flex flex-col">
      <div className="h-7 bg-gray-800 border-b border-gray-700 px-3 flex items-center justify-between text-xs text-gray-400 select-none">
        <span className="font-semibold uppercase tracking-wider">Preview (index.html)</span>
      </div>
      <iframe
        title="HTML Preview"
        srcDoc={previewHtml}
        sandbox="allow-scripts"
        className="w-full flex-1 border-none bg-white"
      />
    </div>
  );
};
