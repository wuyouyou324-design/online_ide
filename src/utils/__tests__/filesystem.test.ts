import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  normalizePath,
  getParentPath,
  getFileName,
  getInitialProjectState,
  saveProjectStateToStorage,
  createFile,
  createFolder,
  updateFileContent,
  renameItem,
  deleteItem,
  isFolderNonEmpty,
} from '../filesystem';
import { ProjectState, DEFAULT_STARTER_FILES } from '../../types/ide';

describe('FileSystem and Project State Utilities', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Path helpers', () => {
    it('normalizes paths correctly', () => {
      expect(normalizePath('index.html')).toBe('/index.html');
      expect(normalizePath('/src/app.ts/')).toBe('/src/app.ts');
      expect(normalizePath('/')).toBe('/');
    });

    it('gets parent path correctly', () => {
      expect(getParentPath('/index.html')).toBe('/');
      expect(getParentPath('/src/utils/math.ts')).toBe('/src/utils');
      expect(getParentPath('/src')).toBe('/');
    });

    it('gets file name correctly', () => {
      expect(getFileName('/index.html')).toBe('index.html');
      expect(getFileName('/src/utils/math.ts')).toBe('math.ts');
    });
  });

  describe('Persistence', () => {
    it('returns default project state if localStorage is empty', () => {
      const state = getInitialProjectState();
      expect(state.items['/index.html']).toBeDefined();
      expect(state.items['/style.css']).toBeDefined();
      expect(state.items['/script.js']).toBeDefined();
      expect(state.activeFilePath).toBe('/index.html');
      expect(state.openFilePaths).toEqual(['/index.html']);
    });

    it('saves state and restores it from localStorage', () => {
      const initialState = getInitialProjectState();
      const { items } = createFile(initialState.items, '/', 'test.js', 'console.log("hi");');
      const newState: ProjectState = {
        ...initialState,
        items,
        activeFilePath: '/test.js',
        openFilePaths: ['/index.html', '/test.js'],
      };

      const saveSuccess = saveProjectStateToStorage(newState);
      expect(saveSuccess).toBe(true);

      const restored = getInitialProjectState();
      expect(restored.items['/test.js']).toBeDefined();
      expect(restored.items['/test.js'].type).toBe('file');
      expect((restored.items['/test.js'] as any).content).toBe('console.log("hi");');
      expect(restored.activeFilePath).toBe('/test.js');
      expect(restored.openFilePaths).toEqual(['/index.html', '/test.js']);
    });

    it('handles localStorage errors gracefully', () => {
      const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceeded');
      });

      const state = getInitialProjectState();
      const success = saveProjectStateToStorage(state);
      expect(success).toBe(false);

      spy.mockRestore();
    });
  });

  describe('File & Folder Operations', () => {
    it('creates file correctly', () => {
      const { items, newPath } = createFile(DEFAULT_STARTER_FILES, '/', 'app.js', 'const x = 1;');
      expect(newPath).toBe('/app.js');
      expect(items['/app.js']).toEqual({
        path: '/app.js',
        name: 'app.js',
        type: 'file',
        content: 'const x = 1;',
      });
    });

    it('throws error when creating file with duplicate name or invalid name', () => {
      expect(() => createFile(DEFAULT_STARTER_FILES, '/', 'index.html')).toThrow(/already exists/);
      expect(() => createFile(DEFAULT_STARTER_FILES, '/', '   ')).toThrow(/empty/);
      expect(() => createFile(DEFAULT_STARTER_FILES, '/', 'foo/bar.js')).toThrow(/slashes/);
    });

    it('creates folder and nested file correctly', () => {
      const res1 = createFolder(DEFAULT_STARTER_FILES, '/', 'src');
      expect(res1.newPath).toBe('/src');

      const res2 = createFile(res1.items, '/src', 'main.ts', 'export const a = 1;');
      expect(res2.newPath).toBe('/src/main.ts');
      expect(res2.items['/src/main.ts']).toBeDefined();
    });

    it('throws error when creating folder with invalid name or duplicate', () => {
      expect(() => createFolder(DEFAULT_STARTER_FILES, '/', '   ')).toThrow(/empty/);
      expect(() => createFolder(DEFAULT_STARTER_FILES, '/', 'a/b')).toThrow(/slashes/);
      const res1 = createFolder(DEFAULT_STARTER_FILES, '/', 'src');
      expect(() => createFolder(res1.items, '/', 'src')).toThrow(/already exists/);
      expect(() => createFile(DEFAULT_STARTER_FILES, '/nonexistent', 'test.js')).toThrow(/does not exist/);
      expect(() => createFolder(DEFAULT_STARTER_FILES, '/nonexistent', 'sub')).toThrow(/does not exist/);
    });

    it('updates file content', () => {
      const updatedItems = updateFileContent(DEFAULT_STARTER_FILES, '/index.html', '<h1>Updated</h1>');
      expect((updatedItems['/index.html'] as any).content).toBe('<h1>Updated</h1>');
      expect(() => updateFileContent(DEFAULT_STARTER_FILES, '/missing.txt', 'test')).toThrow(/does not exist/);
    });

    it('throws error when renaming invalid item', () => {
      expect(() => renameItem(DEFAULT_STARTER_FILES, '/index.html', '   ')).toThrow(/empty/);
      expect(() => renameItem(DEFAULT_STARTER_FILES, '/index.html', 'a/b')).toThrow(/slashes/);
      expect(() => renameItem(DEFAULT_STARTER_FILES, '/missing.txt', 'new.txt')).toThrow(/does not exist/);
      expect(() => renameItem(DEFAULT_STARTER_FILES, '/index.html', 'style.css')).toThrow(/already exists/);
    });

    it('throws error when deleting non-existent item', () => {
      expect(() => deleteItem(DEFAULT_STARTER_FILES, '/nonexistent.txt')).toThrow(/does not exist/);
    });

    it('renames file correctly', () => {
      const { items, newPath, pathMap } = renameItem(DEFAULT_STARTER_FILES, '/index.html', 'main.html');
      expect(newPath).toBe('/main.html');
      expect(items['/index.html']).toBeUndefined();
      expect(items['/main.html']).toBeDefined();
      expect(pathMap['/index.html']).toBe('/main.html');
    });

    it('renames folder and updates nested children paths', () => {
      let items = DEFAULT_STARTER_FILES;
      items = createFolder(items, '/', 'components').items;
      items = createFile(items, '/components', 'Header.js', '// header').items;
      items = createFolder(items, '/components', 'sub').items;
      items = createFile(items, '/components/sub', 'Sub.js', '// sub').items;

      const { items: renamedItems, newPath, pathMap } = renameItem(items, '/components', 'widgets');
      expect(newPath).toBe('/widgets');
      expect(renamedItems['/components']).toBeUndefined();
      expect(renamedItems['/components/Header.js']).toBeUndefined();
      expect(renamedItems['/widgets']).toBeDefined();
      expect(renamedItems['/widgets/Header.js']).toBeDefined();
      expect(renamedItems['/widgets/sub/Sub.js']).toBeDefined();
      expect(pathMap['/components/Header.js']).toBe('/widgets/Header.js');
    });

    it('deletes file correctly', () => {
      const { items, deletedPaths } = deleteItem(DEFAULT_STARTER_FILES, '/script.js');
      expect(items['/script.js']).toBeUndefined();
      expect(deletedPaths).toEqual(['/script.js']);
    });

    it('deletes folder and all nested children recursively', () => {
      let items = DEFAULT_STARTER_FILES;
      items = createFolder(items, '/', 'src').items;
      items = createFile(items, '/src', 'a.js').items;
      items = createFolder(items, '/src', 'sub').items;
      items = createFile(items, '/src/sub', 'b.js').items;

      expect(isFolderNonEmpty(items, '/src')).toBe(true);

      const { items: afterDelete, deletedPaths } = deleteItem(items, '/src');
      expect(afterDelete['/src']).toBeUndefined();
      expect(afterDelete['/src/a.js']).toBeUndefined();
      expect(afterDelete['/src/sub/b.js']).toBeUndefined();
      expect(deletedPaths).toContain('/src');
      expect(deletedPaths).toContain('/src/a.js');
      expect(deletedPaths).toContain('/src/sub/b.js');
    });
  });
});
