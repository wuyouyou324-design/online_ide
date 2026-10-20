import { FSItem, FileNode } from '../types/ide';
import { normalizePath } from './filesystem';

export interface GeneratedPreview {
  html: string;
  blobUrls: string[];
  error?: string;
}

export function getLanguageForFile(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'html': case 'htm': return 'html';
    case 'css': return 'css';
    case 'js': case 'jsx': case 'mjs': return 'javascript';
    case 'ts': case 'tsx': return 'typescript';
    case 'json': return 'json';
    case 'md': return 'markdown';
    default: return 'plaintext';
  }
}

/** Creates a Blob URL for a file node or string content, registering it in blobUrls list for cleanup. */
export function createBlobUrl(
  content: BlobPart,
  mimeType: string,
  blobUrls: string[]
): string {
  if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    blobUrls.push(url);
    return url;
  }
  const fakeId = blobUrls.length + 1;
  const fallbackUrl = `blob:mock-url-${fakeId}`;
  blobUrls.push(fallbackUrl);
  return fallbackUrl;
}

export function createBlobUrlForFile(
  file: FileNode,
  filePath: string,
  blobUrls: string[]
): string {
  const mimeType = file.mimeType || getMimeType(filePath);
  if (file.encoding === 'base64') {
    try {
      const binary = atob(file.content);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return createBlobUrl(bytes, mimeType, blobUrls);
    } catch {
      return createBlobUrl(file.content, mimeType, blobUrls);
    }
  }
  return createBlobUrl(file.content, mimeType, blobUrls);
}

/** Generates an HTML document with Blob URLs for local CSS, JS, and image assets. */
export function generatePreviewHtml(
  items: Record<string, FSItem>,
  entryPath = '/index.html'
): GeneratedPreview {
  const blobUrls: string[] = [];
  const normEntryPath = normalizePath(entryPath);
  const entryFile = items[normEntryPath];
  if (!entryFile || entryFile.type !== 'file') {
    return {
      html: `<!DOCTYPE html><html><body><div style="font-family:sans-serif; padding:1rem; color:#ef4444;">Entry file "${entryPath}" not found. Create index.html to preview your project.</div></body></html>`,
      blobUrls,
      error: `Entry file "${entryPath}" not found`,
    };
  }

  try {
    const doc = new DOMParser().parseFromString(entryFile.content, 'text/html');
    resolveLocalStylesheets(doc, items, normEntryPath, blobUrls);
    resolveLocalScripts(doc, items, normEntryPath, blobUrls);
    resolveLocalHtmlAssets(doc, items, normEntryPath, blobUrls);
    const resultHtml = doc.doctype
      ? `<!DOCTYPE ${doc.doctype.name}>${doc.documentElement.outerHTML}`
      : doc.documentElement.outerHTML;
    return { html: resultHtml, blobUrls };
  } catch (err: unknown) {
    return {
      html: entryFile.content,
      blobUrls,
      error: err instanceof Error ? err.message : 'Failed to parse HTML for preview',
    };
  }
}

function resolveLocalStylesheets(
  doc: Document,
  items: Record<string, FSItem>,
  entryPath: string,
  blobUrls: string[]
): void {
  const links = Array.from(doc.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'));
  links.forEach((link) => {
    const href = link.getAttribute('href');
    if (!href || !isLocalReference(href)) return;
    const resolvedPath = resolveRelativePath(entryPath, href);
    const cssFile = getFile(items, resolvedPath);
    if (!cssFile) return;

    const processedCss = processCssContent(cssFile.content, resolvedPath, items, blobUrls, new Set());
    const cssBlobUrl = createBlobUrl(processedCss, 'text/css', blobUrls);
    link.setAttribute('href', cssBlobUrl);
  });
}

function processCssContent(
  content: string,
  filePath: string,
  items: Record<string, FSItem>,
  blobUrls: string[],
  stack: Set<string>
): string {
  if (stack.has(filePath)) return '';
  const nextStack = new Set(stack).add(filePath);

  // Process local @imports
  let result = content.replace(/@import\s+(?:url\(\s*)?(?:["']([^"']+)["']|([^\s)"']+))\s*\)?\s*([^;]*);/gi,
    (match, quotedUrl: string | undefined, bareUrl: string | undefined, media: string) => {
      const reference = quotedUrl || bareUrl;
      if (!reference || !isLocalReference(reference)) return match;
      const importedPath = resolveRelativePath(filePath, reference);
      const imported = getFile(items, importedPath);
      if (!imported) return match;
      const css = processCssContent(imported.content, importedPath, items, blobUrls, nextStack);
      return media.trim() ? `@media ${media.trim()} {\n${css}\n}` : css;
    });

  // Replace local CSS resources (images, fonts, etc.) with Blob URLs.
  return result.replace(/url\(\s*(["']?)([^"')]+)\1\s*\)/gi, (match, _quote: string, reference: string) => {
    if (!isLocalReference(reference)) return match;
    const assetPath = resolveRelativePath(filePath, reference);
    const asset = getFile(items, assetPath);
    if (!asset) return match;
    const blobUrl = createBlobUrlForFile(asset, assetPath, blobUrls);
    return `url("${blobUrl}")`;
  });
}

function resolveLocalScripts(
  doc: Document,
  items: Record<string, FSItem>,
  entryPath: string,
  blobUrls: string[]
): void {
  const scripts = Array.from(doc.querySelectorAll<HTMLScriptElement>('script[src]'));
  scripts.forEach((script) => {
    const src = script.getAttribute('src');
    if (!src || !isLocalReference(src)) return;
    const resolvedPath = resolveRelativePath(entryPath, src);
    const jsFile = getFile(items, resolvedPath);
    if (!jsFile) return;

    const isModule = script.getAttribute('type') === 'module';
    const processedJs = rewriteJavaScriptReferences(jsFile.content, resolvedPath, items, isModule, blobUrls, new Set());
    const jsBlobUrl = createBlobUrl(processedJs, 'text/javascript', blobUrls);
    script.setAttribute('src', jsBlobUrl);
  });
}

function rewriteJavaScriptReferences(
  content: string,
  filePath: string,
  items: Record<string, FSItem>,
  rewriteImports: boolean,
  blobUrls: string[],
  stack: Set<string>
): string {
  const replaceReference = (reference: string, asModule: boolean): string => {
    if (!isLocalReference(reference)) return reference;
    const assetPath = resolveRelativePath(filePath, reference);
    const asset = getFile(items, assetPath);
    if (!asset) return reference;
    if (asModule && isJavaScriptPath(assetPath)) {
      if (stack.has(assetPath)) return reference;
      const nested = rewriteJavaScriptReferences(asset.content, assetPath, items, true, blobUrls, new Set(stack).add(filePath));
      return createBlobUrl(nested, 'text/javascript', blobUrls);
    }
    return createBlobUrlForFile(asset, assetPath, blobUrls);
  };

  let result = content;
  if (rewriteImports) {
    result = result.replace(/(\b(?:from\s*|import\s*\(?\s*))(["'])([^"']+)\2/g,
      (_match, prefix: string, quote: string, reference: string) => `${prefix}${quote}${replaceReference(reference, true)}${quote}`);
  }
  return result.replace(/(\bfetch\s*\(\s*)(["'])([^"']+)\2/g,
    (_match, prefix: string, quote: string, reference: string) => `${prefix}${quote}${replaceReference(reference, false)}${quote}`);
}

function resolveLocalHtmlAssets(
  doc: Document,
  items: Record<string, FSItem>,
  entryPath: string,
  blobUrls: string[]
): void {
  const elements = Array.from(doc.querySelectorAll<HTMLElement>('[src], [href]'));
  elements.forEach((element) => {
    if (element.tagName.toLowerCase() === 'script' ||
        (element.tagName.toLowerCase() === 'link' && element.getAttribute('rel')?.toLowerCase() === 'stylesheet')) return;
    const attribute = element.hasAttribute('src') ? 'src' : 'href';
    const reference = element.getAttribute(attribute);
    if (!reference || !isLocalReference(reference)) return;
    const assetPath = resolveRelativePath(entryPath, reference);
    const asset = getFile(items, assetPath);
    if (asset && (element.tagName.toLowerCase() === 'img' || isImagePath(assetPath))) {
      const blobUrl = createBlobUrlForFile(asset, assetPath, blobUrls);
      element.setAttribute(attribute, blobUrl);
    }
  });
}

function getFile(items: Record<string, FSItem>, path: string): FileNode | undefined {
  const item = items[path];
  return item?.type === 'file' ? item : undefined;
}

function isLocalReference(value: string): boolean {
  return !value.startsWith('http://') && !value.startsWith('https://') && !value.startsWith('//') &&
    !value.startsWith('data:') && !value.startsWith('#') && !value.startsWith('mailto:') && !value.startsWith('javascript:');
}

export function stripUrlSuffix(value: string): string {
  return value.split(/[?#]/, 1)[0];
}

function decodePath(value: string): string {
  try { return decodeURIComponent(value); } catch { return value; }
}

export function resolveRelativePath(baseFilePath: string, relativePath: string): string {
  const cleanPath = decodePath(stripUrlSuffix(relativePath));
  if (cleanPath.startsWith('/')) return normalizePath(cleanPath);
  const baseParts = normalizePath(baseFilePath).split('/').slice(0, -1);
  const resultParts = [...baseParts];
  cleanPath.split('/').forEach((part) => {
    if (part === '.' || part === '') return;
    if (part === '..') { if (resultParts.length > 0) resultParts.pop(); } else resultParts.push(part);
  });
  return normalizePath(resultParts.join('/'));
}

function getExtension(filePath: string): string {
  return stripUrlSuffix(filePath).split('.').pop()?.toLowerCase() || '';
}
function isJavaScriptPath(path: string): boolean { return ['js', 'mjs', 'jsx', 'ts', 'tsx'].includes(getExtension(path)); }
function isImagePath(path: string): boolean { return ['svg', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'avif'].includes(getExtension(path)); }
function getMimeType(filePath: string): string {
  switch (getExtension(filePath)) {
    case 'svg': return 'image/svg+xml'; case 'png': return 'image/png'; case 'jpg': case 'jpeg': return 'image/jpeg';
    case 'gif': return 'image/gif'; case 'webp': return 'image/webp'; case 'avif': return 'image/avif'; case 'woff': return 'font/woff';
    case 'woff2': return 'font/woff2'; case 'ttf': return 'font/ttf'; case 'json': return 'application/json';
    case 'js': case 'mjs': return 'text/javascript'; case 'css': return 'text/css'; default: return 'text/plain';
  }
}
