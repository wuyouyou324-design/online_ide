import { FileNode, ProjectState } from '../types/filesystem';

// Helper to check if a file name is valid and unique within a directory
export function isValidFileName(
  files: Record<string, FileNode>,
  parentId: string | null,
  name: string,
  excludeId?: string
): { valid: boolean; error?: string } {
  const trimmed = name.trim();
  if (!trimmed) {
    return { valid: false, error: 'File or folder name cannot be empty.' };
  }
  if (trimmed.includes('/') || trimmed.includes('\\')) {
    return { valid: false, error: 'Name cannot contain slashes.' };
  }

  const siblings = Object.values(files).filter(
    (node) => node.parentId === parentId && node.id !== excludeId
  );

  const duplicate = siblings.some((node) => node.name === trimmed);
  if (duplicate) {
    return { valid: false, error: `An item named "${trimmed}" already exists in this folder.` };
  }

  return { valid: true };
}

// Generate unique ID
export function generateId(): string {
  return 'node_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
}

// Get full path for a file/folder node
export function getNodePath(files: Record<string, FileNode>, nodeId: string): string {
  const node = files[nodeId];
  if (!node) return '';
  const parts: string[] = [node.name];
  let currentParentId = node.parentId;

  while (currentParentId) {
    const parent = files[currentParentId];
    if (parent) {
      parts.unshift(parent.name);
      currentParentId = parent.parentId;
    } else {
      break;
    }
  }

  return parts.join('/');
}

// Get all descendant IDs for a folder
export function getDescendantIds(files: Record<string, FileNode>, folderId: string): string[] {
  const descendants: string[] = [];
  const queue = [folderId];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const children = Object.values(files).filter((node) => node.parentId === currentId);
    for (const child of children) {
      descendants.push(child.id);
      if (child.type === 'folder') {
        queue.push(child.id);
      }
    }
  }

  return descendants;
}

// Actions for project reducer
export type ProjectAction =
  | { type: 'SET_PROJECT'; state: ProjectState }
  | { type: 'CREATE_FILE'; parentId: string | null; name: string; content?: string }
  | { type: 'CREATE_FOLDER'; parentId: string | null; name: string }
  | { type: 'RENAME_NODE'; id: string; newName: string }
  | { type: 'DELETE_NODE'; id: string }
  | { type: 'SELECT_FILE'; id: string }
  | { type: 'UPDATE_FILE_CONTENT'; id: string; content: string }
  | { type: 'OPEN_TAB'; id: string }
  | { type: 'CLOSE_TAB'; id: string }
  | { type: 'SET_ACTIVE_TAB'; id: string };

export function projectReducer(state: ProjectState, action: ProjectAction): ProjectState {
  switch (action.type) {
    case 'SET_PROJECT': {
      return action.state;
    }

    case 'CREATE_FILE': {
      const validation = isValidFileName(state.files, action.parentId, action.name);
      if (!validation.valid) {
        throw new Error(validation.error);
      }
      const newId = generateId();
      const newFile: FileNode = {
        id: newId,
        name: action.name.trim(),
        type: 'file',
        parentId: action.parentId,
        content: action.content ?? '',
      };

      const nextFiles = { ...state.files, [newId]: newFile };
      const nextOpenTabIds = state.openTabIds.includes(newId)
        ? state.openTabIds
        : [...state.openTabIds, newId];

      return {
        ...state,
        files: nextFiles,
        selectedFileId: newId,
        openTabIds: nextOpenTabIds,
        activeTabId: newId,
      };
    }

    case 'CREATE_FOLDER': {
      const validation = isValidFileName(state.files, action.parentId, action.name);
      if (!validation.valid) {
        throw new Error(validation.error);
      }
      const newId = generateId();
      const newFolder: FileNode = {
        id: newId,
        name: action.name.trim(),
        type: 'folder',
        parentId: action.parentId,
      };

      return {
        ...state,
        files: { ...state.files, [newId]: newFolder },
        selectedFileId: newId,
      };
    }

    case 'RENAME_NODE': {
      const targetNode = state.files[action.id];
      if (!targetNode) return state;

      const validation = isValidFileName(
        state.files,
        targetNode.parentId,
        action.newName,
        action.id
      );
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      return {
        ...state,
        files: {
          ...state.files,
          [action.id]: {
            ...targetNode,
            name: action.newName.trim(),
          },
        },
      };
    }

    case 'DELETE_NODE': {
      const targetNode = state.files[action.id];
      if (!targetNode) return state;

      const idsToDelete = [action.id];
      if (targetNode.type === 'folder') {
        idsToDelete.push(...getDescendantIds(state.files, action.id));
      }

      const nextFiles = { ...state.files };
      for (const id of idsToDelete) {
        delete nextFiles[id];
      }

      const nextOpenTabIds = state.openTabIds.filter((id) => !idsToDelete.includes(id));
      let nextActiveTabId = state.activeTabId;
      if (state.activeTabId && idsToDelete.includes(state.activeTabId)) {
        nextActiveTabId = nextOpenTabIds.length > 0 ? nextOpenTabIds[nextOpenTabIds.length - 1] : null;
      }

      let nextSelectedFileId = state.selectedFileId;
      if (state.selectedFileId && idsToDelete.includes(state.selectedFileId)) {
        nextSelectedFileId = nextActiveTabId;
      }

      return {
        ...state,
        files: nextFiles,
        selectedFileId: nextSelectedFileId,
        openTabIds: nextOpenTabIds,
        activeTabId: nextActiveTabId,
      };
    }

    case 'SELECT_FILE': {
      const targetNode = state.files[action.id];
      if (!targetNode) return state;

      if (targetNode.type === 'file') {
        const nextOpenTabIds = state.openTabIds.includes(action.id)
          ? state.openTabIds
          : [...state.openTabIds, action.id];

        return {
          ...state,
          selectedFileId: action.id,
          openTabIds: nextOpenTabIds,
          activeTabId: action.id,
        };
      } else {
        return {
          ...state,
          selectedFileId: action.id,
        };
      }
    }

    case 'UPDATE_FILE_CONTENT': {
      const targetNode = state.files[action.id];
      if (!targetNode || targetNode.type !== 'file') return state;

      return {
        ...state,
        files: {
          ...state.files,
          [action.id]: {
            ...targetNode,
            content: action.content,
          },
        },
      };
    }

    case 'OPEN_TAB': {
      const targetNode = state.files[action.id];
      if (!targetNode || targetNode.type !== 'file') return state;

      const nextOpenTabIds = state.openTabIds.includes(action.id)
        ? state.openTabIds
        : [...state.openTabIds, action.id];

      return {
        ...state,
        openTabIds: nextOpenTabIds,
        activeTabId: action.id,
        selectedFileId: action.id,
      };
    }

    case 'CLOSE_TAB': {
      const nextOpenTabIds = state.openTabIds.filter((id) => id !== action.id);
      let nextActiveTabId = state.activeTabId;

      if (state.activeTabId === action.id) {
        if (nextOpenTabIds.length > 0) {
          const closedIndex = state.openTabIds.indexOf(action.id);
          const newIndex = Math.max(0, closedIndex - 1);
          nextActiveTabId = nextOpenTabIds[newIndex];
        } else {
          nextActiveTabId = null;
        }
      }

      return {
        ...state,
        openTabIds: nextOpenTabIds,
        activeTabId: nextActiveTabId,
        selectedFileId: nextActiveTabId ?? (state.selectedFileId === action.id ? null : state.selectedFileId),
      };
    }

    case 'SET_ACTIVE_TAB': {
      if (!state.openTabIds.includes(action.id)) return state;
      return {
        ...state,
        activeTabId: action.id,
        selectedFileId: action.id,
      };
    }

    default:
      return state;
  }
}
