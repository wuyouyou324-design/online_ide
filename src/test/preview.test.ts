import { describe, it, expect } from 'vitest';
import { generatePreviewHtml } from '../components/Preview';
import { createDefaultProject } from '../utils/defaultProject';

describe('Preview HTML Generator', () => {
  it('generates HTML with Blob URLs for style.css and script.js', () => {
    const project = createDefaultProject();
    const { html, createdUrls } = generatePreviewHtml(project);

    expect(html).toContain('blob:');
    expect(createdUrls.length).toBeGreaterThanOrEqual(2);
  });

  it('returns fallback HTML when index.html is missing', () => {
    const emptyProject = {
      id: 'empty',
      name: 'empty',
      nodes: {},
      openTabIds: [],
      activeTabId: null,
      expandedFolderIds: [],
    };
    const { html } = generatePreviewHtml(emptyProject);
    expect(html).toContain('No index.html found at project root');
  });
});
