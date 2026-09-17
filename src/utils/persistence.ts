import type { ProjectState } from '../types/filesystem';
import { createStarterProject } from '../types/filesystem';

export const STORAGE_KEY = 'ONLINE_IDE_V1_PROJECT';

export interface PersistenceResult {
  success: boolean;
  state?: ProjectState;
  error?: string;
}

/**
 * Saves project state to localStorage.
 */
export const saveProjectToStorage = (state: ProjectState): PersistenceResult => {
  try {
    const dataToSave = {
      nodes: state.nodes,
      rootId: state.rootId,
      selectedId: state.selectedId,
      openTabs: state.openTabs,
      activeTabId: state.activeTabId,
      savedAt: new Date().toISOString(),
    };
    const json = JSON.stringify(dataToSave);
    localStorage.setItem(STORAGE_KEY, json);
    return { success: true };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to save project to local storage.';
    return { success: false, error: errorMessage };
  }
};

/**
 * Loads project state from localStorage. Returns default starter project if nothing stored.
 */
export const loadProjectFromStorage = (): PersistenceResult => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const defaultState = createStarterProject();
      return { success: true, state: defaultState };
    }

    const data = JSON.parse(raw);

    // Validate essential state properties
    if (!data || typeof data !== 'object' || !data.nodes || !data.rootId) {
      throw new Error('Corrupted or invalid project data in storage.');
    }

    const loadedState: ProjectState = {
      nodes: data.nodes,
      rootId: data.rootId,
      selectedId: data.selectedId || data.rootId,
      openTabs: Array.isArray(data.openTabs) ? data.openTabs : [],
      activeTabId: data.activeTabId || null,
      isPendingSave: false,
      error: null,
    };

    return { success: true, state: loadedState };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to load project state from storage.';
    return { success: false, error: errorMessage };
  }
};

/**
 * Clears stored project data.
 */
export const clearStoredProject = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear storage:', e);
  }
};
