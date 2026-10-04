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
    it('inlines local CSS and JavaScript without creating Blob URLs', () => {
      const preview = generatePreviewHtml(DEFAULT_STARTER_FILES, '/index.html');
      expect(preview.error).toBeUndefined();
      expect(preview.html).toContain('<style>');
      expect(preview.html).toContain('color: #2563eb;');
      expect(preview.html).toContain('<script>');
      expect(preview.html).toContain('Online IDE V1 Preview Loaded!');
      expect(preview.html).not.toContain('href="style.css"');
      expect(preview.html).not.toContain('src="script.js"');
      expect(preview.html).not.toContain('blob:');
    });

    it('returns error HTML if entry point index.html does not exist', () => {
      const emptyItems: Record<string, FSItem> = {};
      const preview = generatePreviewHtml(emptyItems, '/index.html');
      expect(preview.error).toBe('Entry file "/index.html" not found');
      expect(preview.html).toContain('Entry file "/index.html" not found');
    });
  });
});
