import { describe, it, expect, beforeEach, vi } from 'vitest';
import { buildPreviewHtml } from './Preview';
import { FileNode } from '../types/filesystem';

describe('Preview Component Logic', () => {
  beforeEach(() => {
    // Mock URL.createObjectURL and URL.revokeObjectURL for jsdom environment
    globalThis.URL.createObjectURL = vi.fn((blob: Blob) => `blob:http://localhost/${blob.size}`);
    globalThis.URL.revokeObjectURL = vi.fn();
  });

  it('should return default warning html when index.html is missing', () => {
    const files: Record<string, FileNode> = {};
    const html = buildPreviewHtml(files);
    expect(html).toContain('No index.html found');
  });

  it('should resolve relative style.css and script.js using Blob URLs', () => {
    const files: Record<string, FileNode> = {
      'root-index': {
        id: 'root-index',
        name: 'index.html',
        type: 'file',
        parentId: null,
        content: `<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <h1>Test Title</h1>
  <script src="script.js"></script>
</body>
</html>`,
      },
      'root-css': {
        id: 'root-css',
        name: 'style.css',
        type: 'file',
        parentId: null,
        content: 'h1 { color: red; }',
      },
      'root-js': {
        id: 'root-js',
        name: 'script.js',
        type: 'file',
        parentId: null,
        content: 'console.log("hello");',
      },
    };

    const previewHtml = buildPreviewHtml(files);
    expect(previewHtml).not.toContain('href="style.css"');
    expect(previewHtml).not.toContain('src="script.js"');
    expect(previewHtml).toContain('href="blob:http://localhost/');
    expect(previewHtml).toContain('src="blob:http://localhost/');
  });
});
