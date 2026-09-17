import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createStarterProject } from '../types/filesystem';
import {
  saveProjectToStorage,
  loadProjectFromStorage,
  clearStoredProject,
  STORAGE_KEY,
} from '../utils/persistence';

describe('Persistence Module', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('loads starter project when localStorage is empty', () => {
    const result = loadProjectFromStorage();
    expect(result.success).toBe(true);
    expect(result.state).toBeDefined();
    expect(result.state?.rootId).toBe('my-project');
  });

  it('saves project state to localStorage and restores it correctly', () => {
    const starter = createStarterProject();
    starter.nodes['my-project/index.html'].content = '<h1>Updated Content</h1>';

    const saveResult = saveProjectToStorage(starter);
    expect(saveResult.success).toBe(true);

    const loadResult = loadProjectFromStorage();
    expect(loadResult.success).toBe(true);
    expect(loadResult.state?.nodes['my-project/index.html'].content).toBe('<h1>Updated Content</h1>');
  });

  it('handles quota exceeded or storage error gracefully', () => {
    const starter = createStarterProject();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
      throw new Error('QuotaExceededError');
    });

    const result = saveProjectToStorage(starter);
    expect(result.success).toBe(false);
    expect(result.error).toContain('QuotaExceededError');
  });

  it('handles corrupted JSON in localStorage cleanly', () => {
    localStorage.setItem(STORAGE_KEY, 'invalid-json{{{');

    const result = loadProjectFromStorage();
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('clears stored project', () => {
    const starter = createStarterProject();
    saveProjectToStorage(starter);
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();

    clearStoredProject();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
