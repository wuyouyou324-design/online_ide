import { describe, it, expect } from 'vitest';
import {
  getInitialProjectState,
  updateFileContent,
  renameItem,
  deleteItem,
} from '../filesystem';

describe('Editor and Project State Transitions', () => {
  it('editing a file updates content in the single source of truth and preserves across switches', () => {
    let state = getInitialProjectState();

    // Initial state has index.html, style.css, script.js
    expect(state.activeFilePath).toBe('/index.html');
    expect((state.items['/index.html'] as any).content).toContain('Hello, World!');

    // User edits /index.html
    const updatedHtml = '<h1>Updated Page</h1>';
    const updatedItems = updateFileContent(state.items, '/index.html', updatedHtml);
    state = {
      ...state,
      items: updatedItems,
      pendingSave: true,
    };

    expect((state.items['/index.html'] as any).content).toBe(updatedHtml);
    expect(state.pendingSave).toBe(true);

    // Switch to /style.css
    state = {
      ...state,
      activeFilePath: '/style.css',
      openFilePaths: state.openFilePaths.includes('/style.css')
        ? state.openFilePaths
        : [...state.openFilePaths, '/style.css'],
    };

    expect(state.activeFilePath).toBe('/style.css');
    // Content of index.html remains preserved
    expect((state.items['/index.html'] as any).content).toBe(updatedHtml);

    // Edit /style.css
    const updatedCss = 'body { background: black; }';
    state = {
      ...state,
      items: updateFileContent(state.items, '/style.css', updatedCss),
    };
    expect((state.items['/style.css'] as any).content).toBe(updatedCss);

    // Switch back to /index.html
    state = {
      ...state,
      activeFilePath: '/index.html',
    };
    expect((state.items['/index.html'] as any).content).toBe(updatedHtml);
    expect((state.items['/style.css'] as any).content).toBe(updatedCss);
  });

  it('opening tabs, selecting active tab, and closing tabs works as expected', () => {
    let state = getInitialProjectState();
    expect(state.openFilePaths).toEqual(['/index.html']);
    expect(state.activeFilePath).toBe('/index.html');

    // Open style.css tab
    state = {
      ...state,
      openFilePaths: [...state.openFilePaths, '/style.css'],
      activeFilePath: '/style.css',
    };
    expect(state.openFilePaths).toEqual(['/index.html', '/style.css']);
    expect(state.activeFilePath).toBe('/style.css');

    // Open script.js tab
    state = {
      ...state,
      openFilePaths: [...state.openFilePaths, '/script.js'],
      activeFilePath: '/script.js',
    };
    expect(state.openFilePaths).toEqual(['/index.html', '/style.css', '/script.js']);
    expect(state.activeFilePath).toBe('/script.js');

    // Close the active tab (/script.js) -> falls back to previous open tab
    const openAfterClose = state.openFilePaths.filter((p) => p !== '/script.js');
    state = {
      ...state,
      openFilePaths: openAfterClose,
      activeFilePath: openAfterClose[openAfterClose.length - 1] || null,
    };
    expect(state.openFilePaths).toEqual(['/index.html', '/style.css']);
    expect(state.activeFilePath).toBe('/style.css');

    // Close non-active tab (/index.html) -> active tab stays /style.css
    const openAfterCloseIndex = state.openFilePaths.filter((p) => p !== '/index.html');
    state = {
      ...state,
      openFilePaths: openAfterCloseIndex,
      activeFilePath: state.activeFilePath === '/index.html' ? openAfterCloseIndex[openAfterCloseIndex.length - 1] || null : state.activeFilePath,
    };
    expect(state.openFilePaths).toEqual(['/style.css']);
    expect(state.activeFilePath).toBe('/style.css');

    // Close last remaining tab
    const openEmpty = state.openFilePaths.filter((p) => p !== '/style.css');
    state = {
      ...state,
      openFilePaths: openEmpty,
      activeFilePath: null,
    };
    expect(state.openFilePaths).toEqual([]);
    expect(state.activeFilePath).toBeNull();
  });

  it('renaming or deleting an open file updates tabs and active tab appropriately', () => {
    let state = getInitialProjectState();
    // Open style.css as well
    state = {
      ...state,
      openFilePaths: ['/index.html', '/style.css'],
      activeFilePath: '/style.css',
    };

    // Rename /style.css to /theme.css
    const { items: renamedItems, pathMap } = renameItem(state.items, '/style.css', 'theme.css');
    state = {
      ...state,
      items: renamedItems,
      openFilePaths: state.openFilePaths.map((p) => pathMap[p] || p),
      activeFilePath: state.activeFilePath ? pathMap[state.activeFilePath] || state.activeFilePath : null,
    };

    expect(state.openFilePaths).toEqual(['/index.html', '/theme.css']);
    expect(state.activeFilePath).toBe('/theme.css');

    // Delete active file /theme.css
    const { items: deletedItems, deletedPaths } = deleteItem(state.items, '/theme.css');
    const remainingOpen = state.openFilePaths.filter((p) => !deletedPaths.includes(p));
    state = {
      ...state,
      items: deletedItems,
      openFilePaths: remainingOpen,
      activeFilePath: remainingOpen.length > 0 ? remainingOpen[remainingOpen.length - 1] : null,
    };

    expect(state.openFilePaths).toEqual(['/index.html']);
    expect(state.activeFilePath).toBe('/index.html');
  });
});
