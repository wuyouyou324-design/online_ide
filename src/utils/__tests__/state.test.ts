import { describe, it, expect } from 'vitest';
import {
  createFile,
  updateFileContent,
  getInitialProjectState,
} from '../filesystem';
import { ProjectState } from '../../types/ide';

describe('Editor and Project State Transitions', () => {
  it('editing a file changes its contents in the authoritative project state', () => {
    const initialState = getInitialProjectState();
    const updatedItems = updateFileContent(
      initialState.items,
      '/index.html',
      '<!DOCTYPE html><html><body><h1>Updated Content</h1></body></html>'
    );

    const nextState: ProjectState = {
      ...initialState,
      items: updatedItems,
      pendingSave: true,
    };

    expect((nextState.items['/index.html'] as any).content).toContain('Updated Content');
    expect(nextState.pendingSave).toBe(true);
  });

  it('switching files preserves contents across tabs without data loss', () => {
    let state = getInitialProjectState();

    // Create a second file
    const { items: itemsWithApp } = createFile(
      state.items,
      '/',
      'app.js',
      'console.log("first version");'
    );
    state = {
      ...state,
      items: itemsWithApp,
      openFilePaths: ['/index.html', '/app.js'],
      activeFilePath: '/app.js',
    };

    // Update app.js
    state = {
      ...state,
      items: updateFileContent(state.items, '/app.js', 'console.log("second version");'),
    };

    // Switch back to /index.html
    state = {
      ...state,
      activeFilePath: '/index.html',
    };

    // Update index.html
    state = {
      ...state,
      items: updateFileContent(state.items, '/index.html', '<div>Home</div>'),
    };

    // Switch back to /app.js
    state = {
      ...state,
      activeFilePath: '/app.js',
    };

    // Both files must retain their respective edits
    expect((state.items['/app.js'] as any).content).toBe('console.log("second version");');
    expect((state.items['/index.html'] as any).content).toBe('<div>Home</div>');
  });

  it('opening tabs, closing inactive tab, and closing active tab with fallback works', () => {
    const initialState = getInitialProjectState();
    const { items } = createFile(initialState.items, '/', 'app.js', '// app');

    let state: ProjectState = {
      ...initialState,
      items,
    };

    // Open tab for app.js
    const targetFile = '/app.js';
    const openFilePaths = state.openFilePaths.includes(targetFile)
      ? state.openFilePaths
      : [...state.openFilePaths, targetFile];
    state = {
      ...state,
      activeFilePath: targetFile,
      openFilePaths,
    };

    expect(state.openFilePaths).toEqual(['/index.html', '/app.js']);
    expect(state.activeFilePath).toBe('/app.js');

    // Close inactive tab /index.html
    let updatedTabs = state.openFilePaths.filter((p) => p !== '/index.html');
    let active = state.activeFilePath;
    if (active === '/index.html') {
      active = updatedTabs.length > 0 ? updatedTabs[updatedTabs.length - 1] : null;
    }
    state = {
      ...state,
      openFilePaths: updatedTabs,
      activeFilePath: active,
    };

    expect(state.openFilePaths).toEqual(['/app.js']);
    expect(state.activeFilePath).toBe('/app.js');

    // Close active tab /app.js
    updatedTabs = state.openFilePaths.filter((p) => p !== '/app.js');
    active = state.activeFilePath;
    if (active === '/app.js') {
      active = updatedTabs.length > 0 ? updatedTabs[updatedTabs.length - 1] : null;
    }
    state = {
      ...state,
      openFilePaths: updatedTabs,
      activeFilePath: active,
    };

    expect(state.openFilePaths).toEqual([]);
    expect(state.activeFilePath).toBeNull();
  });
});
