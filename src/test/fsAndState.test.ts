import { describe, it, expect, beforeEach } from 'vitest';
import { createDefaultProject } from '../utils/defaultProject';
import {
  createFileOrFolder,
  renameFileOrFolder,
  deleteFileOrFolder,
  updateFileContent,
  openTab,
  closeTab,
  getFullPath,
} from '../utils/fsUtils';
import { loadProjectFromStorage, saveProjectToStorage, clearProjectStorage } from '../utils/persistence';

describe('FileSystem Logic', () => {
  let project = createDefaultProject();

  beforeEach(() => {
    project = createDefaultProject();
    clearProjectStorage();
  });

  it('creates default project correctly', () => {
    expect(Object.keys(project.nodes)).toHaveLength(3);
    expect(project.nodes['file_index_html']).toBeDefined();
    expect(project.nodes['file_style_css']).toBeDefined();
    expect(project.nodes['file_script_js']).toBeDefined();
    expect(project.openTabIds).toEqual(['file_index_html']);
    expect(project.activeTabId).toBe('file_index_html');
  });

  it('creates a new file', () => {
    const { project: updated, error } = createFileOrFolder(project, 'app.ts', 'file', null, 'console.log()');
    expect(error).toBeNull();
    const created = Object.values(updated.nodes).find((n) => n.name === 'app.ts');
    expect(created).toBeDefined();
    expect(created?.content).toBe('console.log()');
    expect(updated.openTabIds).toContain(created?.id);
    expect(updated.activeTabId).toBe(created?.id);
  });

  it('creates a folder and nested file', () => {
    const { project: p1, error: e1 } = createFileOrFolder(project, 'src', 'folder', null);
    expect(e1).toBeNull();
    const srcFolder = Object.values(p1.nodes).find((n) => n.name === 'src');
    expect(srcFolder).toBeDefined();

    const { project: p2, error: e2 } = createFileOrFolder(p1, 'utils.js', 'file', srcFolder!.id, 'export const x = 1;');
    expect(e2).toBeNull();
    const utilsFile = Object.values(p2.nodes).find((n) => n.name === 'utils.js');
    expect(utilsFile).toBeDefined();
    expect(utilsFile?.parentId).toBe(srcFolder!.id);
    expect(getFullPath(utilsFile!.id, p2.nodes)).toBe('src/utils.js');
  });

  it('prevents duplicate file/folder names in the same folder', () => {
    const { error } = createFileOrFolder(project, 'index.html', 'file', null);
    expect(error).toContain('already exists');
  });

  it('renames a file', () => {
    const { project: updated, error } = renameFileOrFolder(project, 'file_index_html', 'main.html');
    expect(error).toBeNull();
    expect(updated.nodes['file_index_html'].name).toBe('main.html');
  });

  it('deletes a file and updates open tabs', () => {
    const { project: updated, error } = deleteFileOrFolder(project, 'file_index_html');
    expect(error).toBeNull();
    expect(updated.nodes['file_index_html']).toBeUndefined();
    expect(updated.openTabIds).not.toContain('file_index_html');
  });

  it('recursively deletes a non-empty folder', () => {
    const { project: p1 } = createFileOrFolder(project, 'components', 'folder', null);
    const compFolder = Object.values(p1.nodes).find((n) => n.name === 'components')!;
    const { project: p2 } = createFileOrFolder(p1, 'Header.js', 'file', compFolder.id, '// header');
    const headerFile = Object.values(p2.nodes).find((n) => n.name === 'Header.js')!;

    const { project: p3, error } = deleteFileOrFolder(p2, compFolder.id);
    expect(error).toBeNull();
    expect(p3.nodes[compFolder.id]).toBeUndefined();
    expect(p3.nodes[headerFile.id]).toBeUndefined();
  });
});

describe('Project State & Tab Logic', () => {
  let project = createDefaultProject();

  beforeEach(() => {
    project = createDefaultProject();
  });

  it('updates file content correctly', () => {
    const updated = updateFileContent(project, 'file_index_html', '<h1>Updated</h1>');
    expect(updated.nodes['file_index_html'].content).toBe('<h1>Updated</h1>');
    expect(project.nodes['file_index_html'].content).not.toBe('<h1>Updated</h1>');
  });

  it('opens and switches active tab', () => {
    const p1 = openTab(project, 'file_style_css');
    expect(p1.openTabIds).toContain('file_style_css');
    expect(p1.activeTabId).toBe('file_style_css');
  });

  it('closes active tab and selects remaining tab', () => {
    const p1 = openTab(project, 'file_style_css');
    const p2 = closeTab(p1, 'file_style_css');
    expect(p2.openTabIds).not.toContain('file_style_css');
    expect(p2.activeTabId).toBe('file_index_html');
  });
});

describe('Persistence Logic', () => {
  let project = createDefaultProject();

  beforeEach(() => {
    project = createDefaultProject();
    clearProjectStorage();
  });

  it('saves and loads project to/from localStorage', () => {
    const modified = updateFileContent(project, 'file_index_html', '<h1>Saved Content</h1>');
    saveProjectToStorage(modified);

    const loaded = loadProjectFromStorage();
    expect(loaded).not.toBeNull();
    expect(loaded?.nodes['file_index_html'].content).toBe('<h1>Saved Content</h1>');
  });
});
