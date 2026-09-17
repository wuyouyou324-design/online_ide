import type { ProjectState } from '../types/filesystem';

/**
 * Resolves project files and returns processed HTML string where local CSS and JS references
 * (e.g. href="style.css" or src="script.js") are replaced with Blob URLs created from project state.
 */
export const buildPreviewDocument = (projectState: ProjectState): {
  html: string;
  blobUrls: string[];
  error: string | null;
} => {
  const { nodes, rootId } = projectState;
  const indexHtmlId = `${rootId}/index.html`;
  const indexNode = nodes[indexHtmlId];

  if (!indexNode || indexNode.type !== 'file' || typeof indexNode.content !== 'string') {
    return {
      html: '<html><body><div style="font-family:sans-serif;padding:2rem;color:#ef4444;"><h3>Preview Error</h3><p>index.html not found in root directory.</p></div></body></html>',
      blobUrls: [],
      error: 'index.html not found in root directory.',
    };
  }

  let htmlContent = indexNode.content;
  const createdBlobUrls: string[] = [];

  try {
    // Helper to find file node in project by relative or absolute path
    const findFileNode = (relativePath: string) => {
      // Normalize path (strip leading slashes or dots)
      const cleanPath = relativePath.replace(/^(\.\/|\/)/, '');
      const possibleId = `${rootId}/${cleanPath}`;
      if (nodes[possibleId] && nodes[possibleId].type === 'file') {
        return nodes[possibleId];
      }
      // Also search by filename directly if relative path matches
      return Object.values(nodes).find(
        (n) => n.type === 'file' && (n.name === cleanPath || n.id.endsWith(`/${cleanPath}`))
      );
    };

    // Replace linked stylesheets: <link rel="stylesheet" href="...">
    htmlContent = htmlContent.replace(
      /<link\s+[^>]*href=["']([^"']+)["'][^>]*>/gi,
      (match, href) => {
        // Skip external HTTP/HTTPS URLs
        if (/^https?:\/\//i.test(href) || href.startsWith('//')) {
          return match;
        }

        const cssNode = findFileNode(href);
        if (cssNode && typeof cssNode.content === 'string') {
          const blob = new Blob([cssNode.content], { type: 'text/css' });
          const blobUrl = URL.createObjectURL(blob);
          createdBlobUrls.push(blobUrl);
          return `<link rel="stylesheet" href="${blobUrl}">`;
        }

        return match;
      }
    );

    // Replace script tags: <script src="..."></script>
    htmlContent = htmlContent.replace(
      /<script\s+[^>]*src=["']([^"']+)["'][^>]*\s*>\s*<\/script>/gi,
      (match, src) => {
        // Skip external HTTP/HTTPS URLs
        if (/^https?:\/\//i.test(src) || src.startsWith('//')) {
          return match;
        }

        const jsNode = findFileNode(src);
        if (jsNode && typeof jsNode.content === 'string') {
          const blob = new Blob([jsNode.content], { type: 'text/javascript' });
          const blobUrl = URL.createObjectURL(blob);
          createdBlobUrls.push(blobUrl);
          return `<script src="${blobUrl}"></script>`;
        }

        return match;
      }
    );

    return {
      html: htmlContent,
      blobUrls: createdBlobUrls,
      error: null,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to build preview document.';
    return {
      html: `<html><body><div style="font-family:sans-serif;padding:2rem;color:#ef4444;"><h3>Preview Render Error</h3><p>${errorMsg}</p></div></body></html>`,
      blobUrls: createdBlobUrls,
      error: errorMsg,
    };
  }
};

/**
 * Revokes an array of created Blob URLs to avoid memory leaks.
 */
export const revokeBlobUrls = (urls: string[]): void => {
  urls.forEach((url) => {
    try {
      URL.revokeObjectURL(url);
    } catch {
      // Ignore
    }
  });
};
