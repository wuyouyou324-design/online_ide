import { ProjectState, INITIAL_PROJECT_STATE } from '../types/filesystem';

const STORAGE_KEY = 'online_ide_v1_project_state';

export interface StorageResult {
  success: boolean;
  error?: string;
}

/**
 * Saves project state to localStorage.
 */
export function saveProjectStateToStorage(state: ProjectState): StorageResult {
  try {
    const serialized = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, serialized);
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown localStorage write error';
    return { success: false, error: message };
  }
}

/**
 * Loads project state from localStorage. If no saved state exists or parsing fails, returns default initial state.
 */
export function loadProjectStateFromStorage(): { state: ProjectState; restored: boolean; error?: string } {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (!serialized) {
      return { state: INITIAL_PROJECT_STATE, restored: false };
    }

    const parsed = JSON.parse(serialized) as ProjectState;

    // Validate essential properties
    if (!parsed || typeof parsed !== 'object' || !parsed.files) {
      throw new Error('Invalid project structure in storage');
    }

    // Ensure openTabIds, activeTabId, files are valid
    const validOpenTabIds = (parsed.openTabIds || []).filter((id) => parsed.files[id] && parsed.files[id].type === 'file');
    let validActiveTabId = parsed.activeTabId;

    if (validActiveTabId && (!parsed.files[validActiveTabId] || parsed.files[validActiveTabId].type !== 'file')) {
      validActiveTabId = validOpenTabIds.length > 0 ? validOpenTabIds[0] : null;
    }

    const validatedState: ProjectState = {
      files: parsed.files,
      selectedFileId: parsed.selectedFileId && parsed.files[parsed.selectedFileId] ? parsed.selectedFileId : null,
      openTabIds: validOpenTabIds,
      activeTabId: validActiveTabId,
    };

    return { state: validatedState, restored: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to parse saved project';
    return { state: INITIAL_PROJECT_STATE, restored: false, error: message };
  }
}

/**
 * Clears project state from localStorage.
 */
export function clearProjectStorage(): StorageResult {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to clear storage';
    return { success: false, error: message };
  }
}
