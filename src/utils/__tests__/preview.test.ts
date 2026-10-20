import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  generatePreviewHtml,
  resolveRelativePath,
  getLanguageForFile,
} from '../preview';
import { DEFAULT_STARTER_FILES, FSItem } from '../../types/ide';

describe('Preview Utility Engine', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    if (typeof URL.createObjectURL !== 'function') {
      let count = 0;
      URL.createObjectURL = vi.fn((_blob: Blob) => `blob:http://localhost/mock-${++count}`);
    }
    if (typeof URL.revokeObjectURL !== 'function') {
      URL.revokeObjectURL = vi.fn();
    }
  });

  describe('resolveRelativePath', () => {
    it('resolves relative paths correctly', () => {
      expect(resolveRelativePath('/index.html', 'style.css')).toBe('/style.css');
      expect(resolveRelativePath('/index.html', './style.css')).toBe('/style.css');
      expect(resolveRelativePath('/src/pages/index.html', '../style.css')).toBe('/src/style.css');
      expect(resolveRelativePath('/src/pages/index.html', '/style.css')).toBe('/style.css');
    });
  });

  describe('getLanguageForFile', () => {
    it('detects monaco editor languages correctly', () => {
      expect(getLanguageForFile('index.html')).toBe('html');
      expect(getLanguageForFile('style.css')).toBe('css');
      expect(getLanguageForFile('script.js')).toBe('javascript');
      expect(getLanguageForFile('app.tsx')).toBe('typescript');
      expect(getLanguageForFile('data.json')).toBe('json');
      expect(getLanguageForFile('unknown.xyz')).toBe('plaintext');
    });
  });

  describe('generatePreviewHtml', () => {
    it('resolves local CSS and JavaScript as Blob URLs', () => {
      const preview = generatePreviewHtml(DEFAULT_STARTER_FILES, '/index.html');
      expect(preview.error).toBeUndefined();
      expect(preview.blobUrls.length).toBeGreaterThanOrEqual(2);
      expect(preview.html).toContain('href="blob:');
      expect(preview.html).toContain('src="blob:');
      expect(preview.html).not.toContain('href="style.css"');
      expect(preview.html).not.toContain('src="script.js"');
    });

    it('returns error HTML if entry point index.html does not exist', () => {
      const emptyItems: Record<string, FSItem> = {};
      const preview = generatePreviewHtml(emptyItems, '/index.html');
      expect(preview.error).toBe('Entry file "/index.html" not found');
      expect(preview.html).toContain('Entry file "/index.html" not found');
      expect(preview.blobUrls).toEqual([]);
    });

    it('resolves CSS imports and local url resources to Blob URLs', () => {
      const items: Record<string, FSItem> = {
        '/index.html': { path: '/index.html', name: 'index.html', type: 'file', content: '<link rel="stylesheet" href="css/main.css">' },
        '/css/main.css': { path: '/css/main.css', name: 'main.css', type: 'file', content: '@import "theme.css"; .hero { background: url("../images/hero.svg"); }' },
        '/css/theme.css': { path: '/css/theme.css', name: 'theme.css', type: 'file', content: ':root { --color: red; }' },
        '/images/hero.svg': { path: '/images/hero.svg', name: 'hero.svg', type: 'file', content: '<svg xmlns="http://www.w3.org/2000/svg" />' },
      };
      const preview = generatePreviewHtml(items);
      expect(preview.html).toContain('href="blob:');
      expect(preview.blobUrls.length).toBeGreaterThanOrEqual(2);
      expect(preview.html).not.toContain('@import');
    });

    it('rewrites module imports and fetch paths to Blob URLs', () => {
      const items: Record<string, FSItem> = {
        '/index.html': { path: '/index.html', name: 'index.html', type: 'file', content: '<script type="module" src="js/main.js"></script>' },
        '/js/main.js': { path: '/js/main.js', name: 'main.js', type: 'file', content: 'import { value } from "./util.js"; fetch("../data.json"); console.log(value);' },
        '/js/util.js': { path: '/js/util.js', name: 'util.js', type: 'file', content: 'export const value = 1;' },
        '/data.json': { path: '/data.json', name: 'data.json', type: 'file', content: '{"ok":true}' },
      };
      const preview = generatePreviewHtml(items);
      expect(preview.html).toContain('src="blob:');
      expect(preview.blobUrls.length).toBeGreaterThanOrEqual(3);
      expect(preview.html).not.toContain('src="js/main.js"');
    });

    it('matches query/hash and URL-encoded local references', () => {
      const items: Record<string, FSItem> = {
        '/index.html': { path: '/index.html', name: 'index.html', type: 'file', content: '<link rel="stylesheet" href="my%20style.css?v=2"><img src="icon.svg#mark">' },
        '/my style.css': { path: '/my style.css', name: 'my style.css', type: 'file', content: 'body { color: red; }' },
        '/icon.svg': { path: '/icon.svg', name: 'icon.svg', type: 'file', content: '<svg />' },
      };
      const preview = generatePreviewHtml(items);
      expect(preview.html).toContain('href="blob:');
      expect(preview.html).toContain('src="blob:');
      expect(preview.blobUrls.length).toBeGreaterThanOrEqual(2);
    });

    it('supports base64-encoded binary image files', () => {
      const items: Record<string, FSItem> = {
        '/index.html': { path: '/index.html', name: 'index.html', type: 'file', content: '<img src="photo.png">' },
        '/photo.png': { path: '/photo.png', name: 'photo.png', type: 'file', content: 'iVBORw0KGgo=', encoding: 'base64', mimeType: 'image/png' },
      };
      const preview = generatePreviewHtml(items);
      expect(preview.html).toContain('src="blob:');
      expect(preview.blobUrls.length).toBe(1);
    });
  });
});
