import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createStarterProject } from '../types/filesystem';
import { buildPreviewDocument, revokeBlobUrls } from '../utils/preview';

describe('Preview Builder Module', () => {
  beforeEach(() => {
    // Mock Blob and URL.createObjectURL/revokeObjectURL for Vitest jsdom
    globalThis.URL.createObjectURL = vi.fn((blob: Blob) => `blob:http://localhost/${blob.type}`);
    globalThis.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('builds preview document from starter project resolving style.css and script.js blob URLs', () => {
    const starter = createStarterProject();
    const result = buildPreviewDocument(starter);

    expect(result.error).toBeNull();
    expect(result.blobUrls).toHaveLength(2);
    expect(result.html).toContain('blob:http://localhost/text/css');
    expect(result.html).toContain('blob:http://localhost/text/javascript');
  });

  it('handles missing index.html gracefully', () => {
    const starter = createStarterProject();
    delete starter.nodes['my-project/index.html'];

    const result = buildPreviewDocument(starter);
    expect(result.error).toContain('index.html not found');
    expect(result.html).toContain('Preview Error');
  });

  it('revokes blob URLs correctly', () => {
    const urls = ['blob:http://localhost/1', 'blob:http://localhost/2'];
    revokeBlobUrls(urls);

    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2);
  });
});
