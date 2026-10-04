import { FSItem } from '../types/ide';
import { normalizePath } from './filesystem';

export interface GeneratedPreview {
  html: string;
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
 * Generates a self-contained HTML document for the preview iframe.
 * Local CSS and JavaScript are inlined so the sandbox does not need to load
 * Blob URLs created by the parent document.
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
      error: `Entry file "${entryPath}" not found`,
    };
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(entryFile.content, 'text/html');

    inlineLocalStylesheets(doc, items, normEntryPath);
    inlineLocalScripts(doc, items, normEntryPath);
    inlineLocalSvgImages(doc, items, normEntryPath);

    const resultHtml = doc.doctype
      ? `<!DOCTYPE ${doc.doctype.name}>${doc.documentElement.outerHTML}`
      : doc.documentElement.outerHTML;

    return { html: resultHtml };
  } catch (err: unknown) {
    return {
      html: entryFile.content,
      error: err instanceof Error
        ? err.message
        : 'Failed to parse HTML for preview',
    };
  }
}

function inlineLocalStylesheets(
  doc: Document,
  items: Record<string, FSItem>,
  entryPath: string
): void {
  const links = Array.from(
    doc.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')
  );

  links.forEach((link) => {
    const href = link.getAttribute('href');
    if (!href || !isLocalReference(href)) return;

    const resolvedPath = resolveRelativePath(entryPath, href);
    const cssFile = items[resolvedPath];
    if (!cssFile || cssFile.type !== 'file') return;

    const style = doc.createElement('style');
    for (const attribute of Array.from(link.attributes)) {
      if (attribute.name !== 'href' && attribute.name !== 'rel') {
        style.setAttribute(attribute.name, attribute.value);
      }
    }
    style.textContent = escapeStyleContent(cssFile.content);
    link.replaceWith(style);
  });
}

function inlineLocalScripts(
  doc: Document,
  items: Record<string, FSItem>,
  entryPath: string
): void {
  const scripts = Array.from(
    doc.querySelectorAll<HTMLScriptElement>('script[src]')
  );

  scripts.forEach((script) => {
    const src = script.getAttribute('src');
    if (!src || !isLocalReference(src)) return;

    const resolvedPath = resolveRelativePath(entryPath, src);
    const jsFile = items[resolvedPath];
    if (!jsFile || jsFile.type !== 'file') return;

    script.removeAttribute('src');
    script.textContent = escapeScriptContent(jsFile.content);
  });
}

function inlineLocalSvgImages(
  doc: Document,
  items: Record<string, FSItem>,
  entryPath: string
): void {
  const images = Array.from(
    doc.querySelectorAll<HTMLImageElement>('img[src]')
  );

  images.forEach((img) => {
    const src = img.getAttribute('src');
    if (!src || !isLocalReference(src)) return;

    const resolvedPath = resolveRelativePath(entryPath, src);
    const imgFile = items[resolvedPath];
    if (!imgFile || imgFile.type !== 'file') return;

    if (getMimeType(resolvedPath) === 'image/svg+xml') {
      img.setAttribute(
        'src',
        encodeTextAsBase64DataUrl(imgFile.content, 'image/svg+xml')
      );
    }
  });
}

function isLocalReference(value: string): boolean {
  return (
    !value.startsWith('http://') &&
    !value.startsWith('https://') &&
    !value.startsWith('//') &&
    !value.startsWith('data:') &&
    !value.startsWith('#')
  );
}

/** Prevent user content from prematurely closing the inline script element. */
function escapeScriptContent(content: string): string {
  return content.replace(/<\/script/gi, '<\\/script');
}

/** Prevent user content from prematurely closing the inline style element. */
function escapeStyleContent(content: string): string {
  return content.replace(/<\/style/gi, '<\\/style');
}

function encodeTextAsBase64DataUrl(content: string, mimeType: string): string {
  const bytes = new TextEncoder().encode(content);
  let binary = '';
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return `data:${mimeType};base64,${btoa(binary)}`;
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
      if (resultParts.length > 0) resultParts.pop();
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
