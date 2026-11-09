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

/** Generates HTML document for preview iframe using Blob URLs for local CSS/JS references when URL.createObjectURL is supported, with data URL fallback. */
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

  const createdBlobUrls: string[] = [];

  try {
    const doc = new DOMParser().parseFromString(entryFile.content, 'text/html');
    resolveLocalStylesheets(doc, items, normEntryPath, createdBlobUrls);
    resolveLocalScripts(doc, items, normEntryPath, createdBlobUrls);
    resolveLocalHtmlAssets(doc, items, normEntryPath, createdBlobUrls);

    const resultHtml = doc.doctype
      ? `<!DOCTYPE ${doc.doctype.name}>${doc.documentElement.outerHTML}`
      : doc.documentElement.outerHTML;

    return { html: resultHtml, blobUrls: createdBlobUrls };
  } catch (err: unknown) {
    return {
      html: entryFile.content,
      blobUrls: createdBlobUrls,
      error: err instanceof Error ? err.message : 'Failed to parse HTML for preview',
    };
  }
}

function createAssetUrl(content: string, mimeType: string, createdBlobUrls: string[]): string {
  if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function' && typeof Blob !== 'undefined') {
    try {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      createdBlobUrls.push(url);
      return url;
    } catch {
      // Fallback to data URL if Blob creation fails in non-browser env
    }
  }
  return encodeTextAsBase64DataUrl(content, mimeType);
}

function resolveLocalStylesheets(
  doc: Document,
  items: Record<string, FSItem>,
  entryPath: string,
  createdBlobUrls: string[]
): void {
  const links = Array.from(doc.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'));
  links.forEach((link) => {
    const href = link.getAttribute('href');
    if (!href || !isLocalReference(href)) return;
    const resolvedPath = resolveRelativePath(entryPath, href);
    const cssFile = getFile(items, resolvedPath);
    if (!cssFile) return;

    const resolvedCss = processCssContent(cssFile.content, resolvedPath, items, new Set(), createdBlobUrls);
    const blobUrl = createAssetUrl(resolvedCss, 'text/css', createdBlobUrls);
    link.setAttribute('href', blobUrl);
  });
}

function processCssContent(
  content: string,
  filePath: string,
  items: Record<string, FSItem>,
  stack: Set<string>,
  createdBlobUrls: string[]
): string {
  if (stack.has(filePath)) return '';
  const nextStack = new Set(stack).add(filePath);

  let result = content.replace(
    /@import\s+(?:url\(\s*)?(?:["']([^"']+)["']|([^\s)"']+))\s*\)?\s*([^;]*);/gi,
    (match, quotedUrl: string | undefined, bareUrl: string | undefined, media: string) => {
      const reference = quotedUrl || bareUrl;
      if (!reference || !isLocalReference(reference)) return match;
      const importedPath = resolveRelativePath(filePath, reference);
      const imported = getFile(items, importedPath);
      if (!imported) return match;
      const css = processCssContent(imported.content, importedPath, items, nextStack, createdBlobUrls);
      return media.trim() ? `@media ${media.trim()} {\n${css}\n}` : css;
    }
  );

  return result.replace(/url\(\s*(["']?)([^"')]+)\1\s*\)/gi, (match, _quote: string, reference: string) => {
    if (!isLocalReference(reference)) return match;
    const assetPath = resolveRelativePath(filePath, reference);
    const asset = getFile(items, assetPath);
    const assetUrl = asset && getAssetUrl(asset, assetPath, createdBlobUrls);
    return assetUrl ? `url("${assetUrl}")` : match;
  });
}

function resolveLocalScripts(
  doc: Document,
  items: Record<string, FSItem>,
  entryPath: string,
  createdBlobUrls: string[]
): void {
  const scripts = Array.from(doc.querySelectorAll<HTMLScriptElement>('script[src]'));
  scripts.forEach((script) => {
    const src = script.getAttribute('src');
    if (!src || !isLocalReference(src)) return;
    const resolvedPath = resolveRelativePath(entryPath, src);
    const jsFile = getFile(items, resolvedPath);
    if (!jsFile) return;
    const isModule = script.getAttribute('type') === 'module';

    const processedJs = rewriteJavaScriptReferences(
      jsFile.content,
      resolvedPath,
      items,
      isModule,
      new Set(),
      createdBlobUrls
    );
    const blobUrl = createAssetUrl(processedJs, 'text/javascript', createdBlobUrls);
    script.setAttribute('src', blobUrl);
  });
}

function rewriteJavaScriptReferences(
  content: string,
  filePath: string,
  items: Record<string, FSItem>,
  rewriteImports: boolean,
  stack: Set<string>,
  createdBlobUrls: string[]
): string {
  const replaceReference = (reference: string, asModule: boolean): string => {
    if (!isLocalReference(reference)) return reference;
    const assetPath = resolveRelativePath(filePath, reference);
    const asset = getFile(items, assetPath);
    if (!asset) return reference;
    if (asModule && isJavaScriptPath(assetPath)) {
      if (stack.has(assetPath)) return reference;
      const nested = rewriteJavaScriptReferences(
        asset.content,
        assetPath,
        items,
        true,
        new Set(stack).add(filePath),
        createdBlobUrls
      );
      return createAssetUrl(nested, 'text/javascript', createdBlobUrls);
    }
    return getAssetUrl(asset, assetPath, createdBlobUrls) || reference;
  };

  let result = content;
  if (rewriteImports) {
    result = result.replace(
      /(\b(?:from\s*|import\s*\(?\s*))(["'])([^"']+)\2/g,
      (_match, prefix: string, quote: string, reference: string) =>
        `${prefix}${quote}${replaceReference(reference, true)}${quote}`
    );
  }
  return result.replace(
    /(\bfetch\s*\(\s*)(["'])([^"']+)\2/g,
    (_match, prefix: string, quote: string, reference: string) =>
      `${prefix}${quote}${replaceReference(reference, false)}${quote}`
  );
}

function resolveLocalHtmlAssets(
  doc: Document,
  items: Record<string, FSItem>,
  entryPath: string,
  createdBlobUrls: string[]
): void {
  const elements = Array.from(doc.querySelectorAll<HTMLElement>('[src], [href]'));
  elements.forEach((element) => {
    if (
      element.tagName.toLowerCase() === 'script' ||
      (element.tagName.toLowerCase() === 'link' && element.getAttribute('rel')?.toLowerCase() === 'stylesheet')
    )
      return;
    const attribute = element.hasAttribute('src') ? 'src' : 'href';
    const reference = element.getAttribute(attribute);
    if (!reference || !isLocalReference(reference)) return;
    const assetPath = resolveRelativePath(entryPath, reference);
    const asset = getFile(items, assetPath);
    const assetUrl = asset && getAssetUrl(asset, assetPath, createdBlobUrls);
    if (assetUrl && (element.tagName.toLowerCase() === 'img' || isImagePath(assetPath))) {
      element.setAttribute(attribute, assetUrl);
    }
  });
}

function getAssetUrl(file: FileNode, filePath: string, createdBlobUrls: string[]): string | undefined {
  const mimeType = file.mimeType || getMimeType(filePath);
  if (file.encoding === 'base64') {
    return `data:${mimeType};base64,${file.content}`;
  }
  return createAssetUrl(file.content, mimeType, createdBlobUrls);
}

function getFile(items: Record<string, FSItem>, path: string): FileNode | undefined {
  const item = items[path];
  return item?.type === 'file' ? item : undefined;
}

function isLocalReference(value: string): boolean {
  return (
    !value.startsWith('http://') &&
    !value.startsWith('https://') &&
    !value.startsWith('//') &&
    !value.startsWith('data:') &&
    !value.startsWith('blob:') &&
    !value.startsWith('#') &&
    !value.startsWith('mailto:') &&
    !value.startsWith('javascript:')
  );
}

export function stripUrlSuffix(value: string): string {
  return value.split(/[?#]/, 1)[0];
}

function decodePath(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function encodeTextAsBase64DataUrl(content: string, mimeType: string): string {
  const bytes = new TextEncoder().encode(content);
  let binary = '';
  for (let index = 0; index < bytes.length; index += 0x8000)
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  return `data:${mimeType};base64,${btoa(binary)}`;
}

export function resolveRelativePath(baseFilePath: string, relativePath: string): string {
  const cleanPath = decodePath(stripUrlSuffix(relativePath));
  if (cleanPath.startsWith('/')) return normalizePath(cleanPath);
  const baseParts = normalizePath(baseFilePath).split('/').slice(0, -1);
  const resultParts = [...baseParts];
  cleanPath.split('/').forEach((part) => {
    if (part === '.' || part === '') return;
    if (part === '..') {
      if (resultParts.length > 0) resultParts.pop();
    } else resultParts.push(part);
  });
  return normalizePath(resultParts.join('/'));
}

function getExtension(filePath: string): string {
  return stripUrlSuffix(filePath).split('.').pop()?.toLowerCase() || '';
}
function isJavaScriptPath(path: string): boolean {
  return ['js', 'mjs', 'jsx', 'ts', 'tsx'].includes(getExtension(path));
}
function isImagePath(path: string): boolean {
  return ['svg', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'avif'].includes(getExtension(path));
}
function getMimeType(filePath: string): string {
  switch (getExtension(filePath)) {
    case 'svg':
      return 'image/svg+xml';
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    case 'avif':
      return 'image/avif';
    case 'woff':
      return 'font/woff';
    case 'woff2':
      return 'font/woff2';
    case 'ttf':
      return 'font/ttf';
    case 'json':
      return 'application/json';
    case 'js':
    case 'mjs':
      return 'text/javascript';
    case 'css':
      return 'text/css';
    default:
      return 'text/plain';
  }
}
