import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadProjectStateFromStorage, saveProjectStateToStorage, clearProjectStorage } from '../services/storage';
import { INITIAL_PROJECT_STATE, ProjectState } from '../types/filesystem';

describe('Storage Service', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should return initial state when storage is empty', () => {
    const result = loadProjectStateFromStorage();
    expect(result.restored).toBe(false);
    expect(result.state).toEqual(INITIAL_PROJECT_STATE);
  });

  it('should save and load project state successfully', () => {
    const modifiedState: ProjectState = {
      ...INITIAL_PROJECT_STATE,
      files: {
        ...INITIAL_PROJECT_STATE.files,
        'root-index-html': {
          ...INITIAL_PROJECT_STATE.files['root-index-html'],
          content: '<h1>Saved content</h1>',
        },
      },
    };

    const saveResult = saveProjectStateToStorage(modifiedState);
    expect(saveResult.success).toBe(true);

    const loadResult = loadProjectStateFromStorage();
    expect(loadResult.restored).toBe(true);
    expect(loadResult.state.files['root-index-html'].content).toBe('<h1>Saved content</h1>');
  });

  it('should handle corrupted JSON gracefully and return initial state', () => {
    localStorage.setItem('online_ide_v1_project_state', '{ invalid json');

    const loadResult = loadProjectStateFromStorage();
    expect(loadResult.restored).toBe(false);
    expect(loadResult.error).toBeDefined();
    expect(loadResult.state).toEqual(INITIAL_PROJECT_STATE);
  });

  it('should handle quota exceeded or storage error on save', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    const saveResult = saveProjectStateToStorage(INITIAL_PROJECT_STATE);
    expect(saveResult.success).toBe(false);
    expect(saveResult.error).toBe('QuotaExceededError');

    setItemSpy.mockRestore();
  });

  it('should clear project storage', () => {
    saveProjectStateToStorage(INITIAL_PROJECT_STATE);
    expect(localStorage.getItem('online_ide_v1_project_state')).not.toBeNull();

    clearProjectStorage();
    expect(localStorage.getItem('online_ide_v1_project_state')).toBeNull();
  });
});
