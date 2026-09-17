import { describe, it, expect } from 'vitest';
import { createStarterProject } from '../types/filesystem';
import {
  createNode,
  renameNode,
  deleteNode,
  updateFileContent,
  selectNode,
  closeTab,
  getLanguageFromPath,
} from '../utils/filesystem';

describe('Filesystem State Operations', () => {
  it('initializes default starter project correctly', () => {
    const project = createStarterProject();
    expect(project.rootId).toBe('my-project');
    expect(Object.keys(project.nodes)).toHaveLength(4);
    expect(project.nodes['my-project/index.html']).toBeDefined();
    expect(project.nodes['my-project/style.css']).toBeDefined();
    expect(project.nodes['my-project/script.js']).toBeDefined();
    expect(project.openTabs).toHaveLength(3);
    expect(project.activeTabId).toBe('my-project/index.html');
  });

  it('creates a new file in root directory', () => {
    let state = createStarterProject();
    state = createNode(state, 'my-project', 'app.tsx', 'file', 'console.log("hello");');

    expect(state.nodes['my-project/app.tsx']).toBeDefined();
    expect(state.nodes['my-project/app.tsx'].content).toBe('console.log("hello");');
    expect(state.nodes['my-project'].children).toContain('my-project/app.tsx');
    expect(state.openTabs).toContain('my-project/app.tsx');
    expect(state.activeTabId).toBe('my-project/app.tsx');
    expect(state.isPendingSave).toBe(true);
  });

  it('creates a nested folder and file inside it', () => {
    let state = createStarterProject();
    state = createNode(state, 'my-project', 'src', 'directory');
    expect(state.nodes['my-project/src']).toBeDefined();
    expect(state.nodes['my-project/src'].type).toBe('directory');

    state = createNode(state, 'my-project/src', 'util.js', 'file', 'export const x = 1;');
    expect(state.nodes['my-project/src/util.js']).toBeDefined();
    expect(state.nodes['my-project/src/util.js'].parentId).toBe('my-project/src');
    expect(state.nodes['my-project/src'].children).toContain('my-project/src/util.js');
  });

  it('prevents creating duplicate file names in same folder', () => {
    let state = createStarterProject();
    state = createNode(state, 'my-project', 'index.html', 'file');
    expect(state.error).toContain('already exists');
  });

  it('renames a file', () => {
    let state = createStarterProject();
    state = renameNode(state, 'my-project/style.css', 'styles.css');

    expect(state.nodes['my-project/style.css']).toBeUndefined();
    expect(state.nodes['my-project/styles.css']).toBeDefined();
    expect(state.nodes['my-project'].children).toContain('my-project/styles.css');
    expect(state.nodes['my-project'].children).not.toContain('my-project/style.css');
    expect(state.openTabs).toContain('my-project/styles.css');
  });

  it('renames a directory and updates all child paths recursively', () => {
    let state = createStarterProject();
    state = createNode(state, 'my-project', 'components', 'directory');
    state = createNode(state, 'my-project/components', 'Header.tsx', 'file', '// Header');

    state = renameNode(state, 'my-project/components', 'ui');

    expect(state.nodes['my-project/components']).toBeUndefined();
    expect(state.nodes['my-project/components/Header.tsx']).toBeUndefined();

    expect(state.nodes['my-project/ui']).toBeDefined();
    expect(state.nodes['my-project/ui/Header.tsx']).toBeDefined();
    expect(state.nodes['my-project/ui/Header.tsx'].content).toBe('// Header');
    expect(state.openTabs).toContain('my-project/ui/Header.tsx');
  });

  it('deletes a file', () => {
    let state = createStarterProject();
    state = deleteNode(state, 'my-project/script.js');

    expect(state.nodes['my-project/script.js']).toBeUndefined();
    expect(state.nodes['my-project'].children).not.toContain('my-project/script.js');
    expect(state.openTabs).not.toContain('my-project/script.js');
  });

  it('deletes a non-empty folder recursively', () => {
    let state = createStarterProject();
    state = createNode(state, 'my-project', 'utils', 'directory');
    state = createNode(state, 'my-project/utils', 'math.js', 'file', 'export const add = (a,b) => a+b;');

    expect(state.openTabs).toContain('my-project/utils/math.js');

    state = deleteNode(state, 'my-project/utils');

    expect(state.nodes['my-project/utils']).toBeUndefined();
    expect(state.nodes['my-project/utils/math.js']).toBeUndefined();
    expect(state.openTabs).not.toContain('my-project/utils/math.js');
  });

  it('updates file content directly in state', () => {
    let state = createStarterProject();
    const newContent = 'h1 { color: red; }';
    state = updateFileContent(state, 'my-project/style.css', newContent);

    expect(state.nodes['my-project/style.css'].content).toBe(newContent);
    expect(state.isPendingSave).toBe(true);
  });

  it('selects file and opens tab', () => {
    let state = createStarterProject();
    state = closeTab(state, 'my-project/script.js');
    expect(state.openTabs).not.toContain('my-project/script.js');

    state = selectNode(state, 'my-project/script.js');
    expect(state.openTabs).toContain('my-project/script.js');
    expect(state.activeTabId).toBe('my-project/script.js');
  });

  it('detects correct Monaco language mode', () => {
    expect(getLanguageFromPath('index.html')).toBe('html');
    expect(getLanguageFromPath('style.css')).toBe('css');
    expect(getLanguageFromPath('script.js')).toBe('javascript');
    expect(getLanguageFromPath('app.tsx')).toBe('typescript');
    expect(getLanguageFromPath('data.json')).toBe('json');
    expect(getLanguageFromPath('README.md')).toBe('plaintext');
  });
});
