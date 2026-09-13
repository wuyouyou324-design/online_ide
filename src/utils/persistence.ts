import type { IDEProject } from '../types/ide';

const STORAGE_KEY = 'online_ide_v1_project';

export function loadProjectFromStorage(): IDEProject | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && parsed.nodes) {
      return parsed as IDEProject;
    }
    return null;
  } catch (err) {
    console.error('Failed to load project from storage:', err);
    throw new Error('Failed to load saved project from local storage.');
  }
}

export function saveProjectToStorage(project: IDEProject): void {
  try {
    const json = JSON.stringify(project);
    localStorage.setItem(STORAGE_KEY, json);
  } catch (err) {
    console.error('Failed to save project to storage:', err);
    throw new Error('Failed to save project to local storage. Storage quota may be exceeded.');
  }
}

export function clearProjectStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear project storage:', err);
  }
}
