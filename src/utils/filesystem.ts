import { ProjectState, FSItem, FileNode, FolderNode, DEFAULT_STARTER_FILES } from '../types/ide';

export const STORAGE_KEY = 'online_ide_project_v1';

export function normalizePath(path: string): string {
  if (!path.startsWith('/')) {
    path = '/' + path;
  }
  // remove trailing slash unless it is root '/'
  if (path.length > 1 && path.endsWith('/')) {
    path = path.slice(0, -1);
  }
  return path;
}

export function getParentPath(path: string): string {
  const norm = normalizePath(path);
  if (norm === '/') return '/';
  const lastSlashIndex = norm.lastIndexOf('/');
  if (lastSlashIndex === 0) return '/';
  return norm.substring(0, lastSlashIndex);
}

export function getFileName(path: string): string {
  const norm = normalizePath(path);
  const lastSlashIndex = norm.lastIndexOf('/');
  return norm.substring(lastSlashIndex + 1);
}

export function getInitialProjectState(): ProjectState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object' && parsed.items) {
        return {
          items: parsed.items,
          activeFilePath: parsed.activeFilePath || '/index.html',
          openFilePaths: parsed.openFilePaths || ['/index.html'],
          pendingSave: false,
          lastSavedAt: parsed.lastSavedAt || Date.now(),
          error: null,
        };
      }
    }
  } catch (err) {
    console.error('Failed to load project from storage:', err);
  }

  // Default initial state
  return {
    items: { ...DEFAULT_STARTER_FILES },
    activeFilePath: '/index.html',
    openFilePaths: ['/index.html'],
    pendingSave: false,
    lastSavedAt: Date.now(),
    error: null,
  };
}

export function saveProjectStateToStorage(state: ProjectState): boolean {
  try {
    const dataToSave = {
      items: state.items,
      activeFilePath: state.activeFilePath,
      openFilePaths: state.openFilePaths,
      lastSavedAt: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    return true;
  } catch (err) {
    console.error('Failed to save project state to storage:', err);
    return false;
  }
}

// File System Logic helpers

export function createFile(
  items: Record<string, FSItem>,
  parentPath: string,
  fileName: string,
  content = ''
): { items: Record<string, FSItem>; newPath: string } {
  const trimmedName = fileName.trim();
  if (!trimmedName) {
    throw new Error('File name cannot be empty');
  }
  if (trimmedName.includes('/')) {
    throw new Error('File name cannot contain slashes');
  }

  const parent = parentPath === '/' ? '' : normalizePath(parentPath);
  const newPath = `${parent}/${trimmedName}`;

  if (items[newPath]) {
    throw new Error(`A file or folder named "${trimmedName}" already exists at this location`);
  }

  // Check parent exists if not root
  if (parentPath !== '/' && (!items[normalizePath(parentPath)] || items[normalizePath(parentPath)].type !== 'folder')) {
    throw new Error(`Parent folder "${parentPath}" does not exist`);
  }

  const newFile: FileNode = {
    path: newPath,
    name: trimmedName,
    type: 'file',
    content,
  };

  return {
    items: {
      ...items,
      [newPath]: newFile,
    },
    newPath,
  };
}

export function createFolder(
  items: Record<string, FSItem>,
  parentPath: string,
  folderName: string
): { items: Record<string, FSItem>; newPath: string } {
  const trimmedName = folderName.trim();
  if (!trimmedName) {
    throw new Error('Folder name cannot be empty');
  }
  if (trimmedName.includes('/')) {
    throw new Error('Folder name cannot contain slashes');
  }

  const parent = parentPath === '/' ? '' : normalizePath(parentPath);
  const newPath = `${parent}/${trimmedName}`;

  if (items[newPath]) {
    throw new Error(`A file or folder named "${trimmedName}" already exists at this location`);
  }

  if (parentPath !== '/' && (!items[normalizePath(parentPath)] || items[normalizePath(parentPath)].type !== 'folder')) {
    throw new Error(`Parent folder "${parentPath}" does not exist`);
  }

  const newFolder: FolderNode = {
    path: newPath,
    name: trimmedName,
    type: 'folder',
  };

  return {
    items: {
      ...items,
      [newPath]: newFolder,
    },
    newPath,
  };
}

export function updateFileContent(
  items: Record<string, FSItem>,
  filePath: string,
  content: string
): Record<string, FSItem> {
  const normPath = normalizePath(filePath);
  const existing = items[normPath];
  if (!existing || existing.type !== 'file') {
    throw new Error(`File "${filePath}" does not exist`);
  }

  return {
    ...items,
    [normPath]: {
      ...existing,
      content,
    },
  };
}

export function renameItem(
  items: Record<string, FSItem>,
  oldPath: string,
  newName: string
): { items: Record<string, FSItem>; newPath: string; pathMap: Record<string, string> } {
  const normOldPath = normalizePath(oldPath);
  const trimmedName = newName.trim();

  if (!trimmedName) {
    throw new Error('Name cannot be empty');
  }
  if (trimmedName.includes('/')) {
    throw new Error('Name cannot contain slashes');
  }

  const existing = items[normOldPath];
  if (!existing) {
    throw new Error(`Item "${oldPath}" does not exist`);
  }

  const parentPath = getParentPath(normOldPath);
  const parentPrefix = parentPath === '/' ? '' : parentPath;
  const newPath = `${parentPrefix}/${trimmedName}`;

  if (newPath === normOldPath) {
    return { items, newPath: normOldPath, pathMap: { [normOldPath]: normOldPath } };
  }

  if (items[newPath]) {
    throw new Error(`An item named "${trimmedName}" already exists at this location`);
  }

  const newItems = { ...items };
  const pathMap: Record<string, string> = {};

  if (existing.type === 'file') {
    delete newItems[normOldPath];
    newItems[newPath] = {
      ...existing,
      path: newPath,
      name: trimmedName,
    };
    pathMap[normOldPath] = newPath;
  } else {
    // Folder: rename folder and update all children prefix paths
    const oldPrefix = normOldPath + '/';
    delete newItems[normOldPath];
    newItems[newPath] = {
      ...existing,
      path: newPath,
      name: trimmedName,
    };
    pathMap[normOldPath] = newPath;

    Object.keys(items).forEach((itemPath) => {
      if (itemPath.startsWith(oldPrefix)) {
        const item = items[itemPath];
        const childRelative = itemPath.slice(oldPrefix.length);
        const childNewPath = `${newPath}/${childRelative}`;

        delete newItems[itemPath];
        newItems[childNewPath] = {
          ...item,
          path: childNewPath,
        };
        pathMap[itemPath] = childNewPath;
      }
    });
  }

  return { items: newItems, newPath, pathMap };
}

export function deleteItem(
  items: Record<string, FSItem>,
  targetPath: string
): { items: Record<string, FSItem>; deletedPaths: string[] } {
  const normPath = normalizePath(targetPath);
  const existing = items[normPath];
  if (!existing) {
    throw new Error(`Item "${targetPath}" does not exist`);
  }

  const newItems = { ...items };
  const deletedPaths: string[] = [normPath];

  delete newItems[normPath];

  if (existing.type === 'folder') {
    const prefix = normPath + '/';
    Object.keys(items).forEach((itemPath) => {
      if (itemPath.startsWith(prefix)) {
        delete newItems[itemPath];
        deletedPaths.push(itemPath);
      }
    });
  }

  return { items: newItems, deletedPaths };
}

export function isFolderNonEmpty(items: Record<string, FSItem>, folderPath: string): boolean {
  const normPath = normalizePath(folderPath);
  const prefix = normPath + '/';
  return Object.keys(items).some((p) => p.startsWith(prefix));
}
