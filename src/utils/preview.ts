import { FSItem } from '../types/ide';
import { normalizePath } from './filesystem';

export interface GeneratedPreview {
  html: string;
  blobUrls: string[];
  error?: string;
}

/**
 * Gets language mode for Monaco editor based on file extension
 */
export function getLanguageForFile(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'html':
    case 'htm':
      return 'html';
    case 'css':
      return 'css';
    case 'js':
    case 'jsx':
    case 'mjs':
      return 'javascript';
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'json':
      return 'json';
    case 'md':
      return 'markdown';
    default:
      return 'plaintext';
  }
}

/**
 * Resolves HTML entry point (e.g. /index.html) and creates Blob URLs for CSS and JS files
 * referenced by relative paths in the HTML document.
 */
export function generatePreviewHtml(
  items: Record<string, FSItem>,
  entryPath = '/index.html'
): GeneratedPreview {
  const normEntryPath = normalizePath(entryPath);
  const entryFile = items[normEntryPath];

  if (!entryFile || entryFile.type !== 'file') {
    return {
      html: `<!DOCTYPE html><html><body><div style="font-family:sans-serif; padding:1rem; color:#ef4444;">Entry file "${entryPath}" not found. Create index.html to preview your project.</div></body></html>`,
      blobUrls: [],
      error: `Entry file "${entryPath}" not found`,
    };
  }

  let htmlContent = entryFile.content;
  const createdBlobUrls: string[] = [];

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');

    // 1. Process <link rel="stylesheet" href="...">
    const links = Array.from(doc.querySelectorAll('link[rel="stylesheet"]'));
    links.forEach((link) => {
      const href = link.getAttribute('href');
      if (href && !href.startsWith('http://') && !href.startsWith('https://') && !href.startsWith('//') && !href.startsWith('data:')) {
        const resolvedPath = resolveRelativePath(normEntryPath, href);
        const cssFile = items[resolvedPath];
        if (cssFile && cssFile.type === 'file') {
          const blob = new Blob([cssFile.content], { type: 'text/css' });
          const blobUrl = URL.createObjectURL(blob);
          createdBlobUrls.push(blobUrl);
          link.setAttribute('href', blobUrl);
        }
      }
    });

    // 2. Process <script src="...">
    const scripts = Array.from(doc.querySelectorAll('script[src]'));
    scripts.forEach((script) => {
      const src = script.getAttribute('src');
      if (src && !src.startsWith('http://') && !src.startsWith('https://') && !src.startsWith('//') && !src.startsWith('data:')) {
        const resolvedPath = resolveRelativePath(normEntryPath, src);
        const jsFile = items[resolvedPath];
        if (jsFile && jsFile.type === 'file') {
          const blob = new Blob([jsFile.content], { type: 'text/javascript' });
          const blobUrl = URL.createObjectURL(blob);
          createdBlobUrls.push(blobUrl);
          script.setAttribute('src', blobUrl);
        }
      }
    });

    // 3. Process <img src="...">
    const images = Array.from(doc.querySelectorAll('img[src]'));
    images.forEach((img) => {
      const src = img.getAttribute('src');
      if (src && !src.startsWith('http://') && !src.startsWith('https://') && !src.startsWith('//') && !src.startsWith('data:')) {
        const resolvedPath = resolveRelativePath(normEntryPath, src);
        const imgFile = items[resolvedPath];
        if (imgFile && imgFile.type === 'file') {
          const mimeType = getMimeType(resolvedPath);
          const blob = new Blob([imgFile.content], { type: mimeType });
          const blobUrl = URL.createObjectURL(blob);
          createdBlobUrls.push(blobUrl);
          img.setAttribute('src', blobUrl);
        }
      }
    });

    const resultHtml = doc.doctype
      ? `<!DOCTYPE ${doc.doctype.name}>` + doc.documentElement.outerHTML
      : doc.documentElement.outerHTML;

    return {
      html: resultHtml,
      blobUrls: createdBlobUrls,
    };
  } catch (err: any) {
    return {
      html: htmlContent,
      blobUrls: createdBlobUrls,
      error: err?.message || 'Failed to parse HTML for preview',
    };
  }
}

/**
 * Resolves a relative path against a base file path
 */
export function resolveRelativePath(baseFilePath: string, relativePath: string): string {
  if (relativePath.startsWith('/')) {
    return normalizePath(relativePath);
  }

  const baseParts = baseFilePath.split('/').slice(0, -1); // remove filename
  const relParts = relativePath.split('/');

  const resultParts = [...baseParts];

  for (const part of relParts) {
    if (part === '.' || part === '') continue;
    if (part === '..') {
      if (resultParts.length > 0) {
        resultParts.pop();
      }
    } else {
      resultParts.push(part);
    }
  }

  return normalizePath(resultParts.join('/'));
}

function getMimeType(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'svg':
      return 'image/svg+xml';
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    default:
      return 'text/plain';
  }
}
