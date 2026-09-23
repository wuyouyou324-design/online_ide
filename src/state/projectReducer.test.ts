import { describe, it, expect } from 'vitest';
import { projectReducer } from './projectReducer';
import { INITIAL_PROJECT_STATE } from '../types/filesystem';

describe('projectReducer', () => {
  it('should create a file in root', () => {
    const newState = projectReducer(INITIAL_PROJECT_STATE, {
      type: 'CREATE_FILE',
      parentId: null,
      name: 'test.js',
      content: 'console.log("test");',
    });

    const fileEntries = Object.values(newState.files);
    const created = fileEntries.find((f) => f.name === 'test.js');
    expect(created).toBeDefined();
    expect(created?.content).toBe('console.log("test");');
    expect(newState.activeTabId).toBe(created?.id);
    expect(newState.openTabIds).toContain(created?.id);
  });

  it('should throw an error when creating a file with duplicate name in same folder', () => {
    expect(() => {
      projectReducer(INITIAL_PROJECT_STATE, {
        type: 'CREATE_FILE',
        parentId: null,
        name: 'index.html',
      });
    }).toThrow('An item named "index.html" already exists in this folder.');
  });

  it('should create a folder and nested file inside it', () => {
    const stateWithFolder = projectReducer(INITIAL_PROJECT_STATE, {
      type: 'CREATE_FOLDER',
      parentId: null,
      name: 'src',
    });

    const folder = Object.values(stateWithFolder.files).find((f) => f.name === 'src');
    expect(folder).toBeDefined();

    const stateWithNestedFile = projectReducer(stateWithFolder, {
      type: 'CREATE_FILE',
      parentId: folder!.id,
      name: 'app.js',
    });

    const nestedFile = Object.values(stateWithNestedFile.files).find((f) => f.name === 'app.js');
    expect(nestedFile).toBeDefined();
    expect(nestedFile?.parentId).toBe(folder!.id);
  });

  it('should rename a file successfully', () => {
    const fileId = 'root-index-html';
    const newState = projectReducer(INITIAL_PROJECT_STATE, {
      type: 'RENAME_NODE',
      id: fileId,
      newName: 'home.html',
    });

    expect(newState.files[fileId].name).toBe('home.html');
  });

  it('should delete a file and update open tabs if active', () => {
    const fileId = 'root-index-html';
    const newState = projectReducer(INITIAL_PROJECT_STATE, {
      type: 'DELETE_NODE',
      id: fileId,
    });

    expect(newState.files[fileId]).toBeUndefined();
    expect(newState.openTabIds).not.toContain(fileId);
    expect(newState.activeTabId).not.toBe(fileId);
  });

  it('should recursively delete folder and its contained files', () => {
    let state = projectReducer(INITIAL_PROJECT_STATE, {
      type: 'CREATE_FOLDER',
      parentId: null,
      name: 'components',
    });
    const folderId = Object.values(state.files).find((f) => f.name === 'components')!.id;

    state = projectReducer(state, {
      type: 'CREATE_FILE',
      parentId: folderId,
      name: 'Button.jsx',
    });
    const fileId = Object.values(state.files).find((f) => f.name === 'Button.jsx')!.id;

    expect(state.files[fileId]).toBeDefined();

    const deletedState = projectReducer(state, {
      type: 'DELETE_NODE',
      id: folderId,
    });

    expect(deletedState.files[folderId]).toBeUndefined();
    expect(deletedState.files[fileId]).toBeUndefined();
    expect(deletedState.openTabIds).not.toContain(fileId);
  });

  it('should update file content in the authoritative state', () => {
    const fileId = 'root-index-html';
    const updatedContent = '<h1>Updated Title</h1>';

    const newState = projectReducer(INITIAL_PROJECT_STATE, {
      type: 'UPDATE_FILE_CONTENT',
      id: fileId,
      content: updatedContent,
    });

    expect(newState.files[fileId].content).toBe(updatedContent);
  });

  it('should open, switch, and close tabs correctly', () => {
    let state = INITIAL_PROJECT_STATE;

    // Close index.html tab
    state = projectReducer(state, { type: 'CLOSE_TAB', id: 'root-index-html' });
    expect(state.openTabIds).not.toContain('root-index-html');

    // Switch active tab
    state = projectReducer(state, { type: 'SET_ACTIVE_TAB', id: 'root-style-css' });
    expect(state.activeTabId).toBe('root-style-css');

    // Reopen index.html tab
    state = projectReducer(state, { type: 'OPEN_TAB', id: 'root-index-html' });
    expect(state.openTabIds).toContain('root-index-html');
    expect(state.activeTabId).toBe('root-index-html');
  });
});
