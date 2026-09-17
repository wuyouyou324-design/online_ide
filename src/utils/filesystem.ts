import type { FileNode, ProjectState } from '../types/filesystem';

/**
 * Validates a file/folder name.
 */
export const isValidName = (name: string): boolean => {
  if (!name || name.trim() === '') return false;
  // Disallow slashes, backslashes, colon, etc.
  if (/[\\/:*?"<>|]/.test(name)) return false;
  return true;
};

/**
 * Determines file language for Monaco Editor based on extension.
 */
export const getLanguageFromPath = (path: string): string => {
  const ext = path.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'html':
    case 'htm':
      return 'html';
    case 'css':
      return 'css';
    case 'js':
    case 'jsx':
      return 'javascript';
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'json':
      return 'json';
    default:
      return 'plaintext';
  }
};

/**
 * Creates a new file or directory under the target parent directory.
 */
export const createNode = (
  state: ProjectState,
  parentDirectoryId: string,
  name: string,
  type: 'file' | 'directory',
  initialContent: string = ''
): ProjectState => {
  const trimmedName = name.trim();

  if (!isValidName(trimmedName)) {
    return { ...state, error: `Invalid name "${name}". Names cannot contain slashes or special characters.` };
  }

  const parentNode = state.nodes[parentDirectoryId];
  if (!parentNode) {
    return { ...state, error: `Parent folder does not exist.` };
  }

  // If selected target parent is a file, use its parent directory instead
  let targetFolder = parentNode;
  if (targetFolder.type === 'file') {
    if (!targetFolder.parentId || !state.nodes[targetFolder.parentId]) {
      return { ...state, error: `Invalid target directory.` };
    }
    targetFolder = state.nodes[targetFolder.parentId];
  }

  const newId = `${targetFolder.id}/${trimmedName}`;

  if (state.nodes[newId]) {
    return { ...state, error: `A file or folder named "${trimmedName}" already exists in this folder.` };
  }

  const newNode: FileNode = {
    id: newId,
    name: trimmedName,
    type,
    path: newId,
    parentId: targetFolder.id,
    ...(type === 'file' ? { content: initialContent } : { children: [] }),
  };

  const updatedTargetFolder: FileNode = {
    ...targetFolder,
    children: [...(targetFolder.children || []), newId],
  };

  const updatedNodes = {
    ...state.nodes,
    [targetFolder.id]: updatedTargetFolder,
    [newId]: newNode,
  };

  // If a file was created, automatically open it as active tab
  let openTabs = state.openTabs;
  let activeTabId = state.activeTabId;

  if (type === 'file') {
    if (!openTabs.includes(newId)) {
      openTabs = [...openTabs, newId];
    }
    activeTabId = newId;
  }

  return {
    ...state,
    nodes: updatedNodes,
    selectedId: newId,
    openTabs,
    activeTabId,
    isPendingSave: true,
    error: null,
  };
};

/**
 * Renames a file or directory, recursively updating all child IDs/paths if renaming a directory.
 */
export const renameNode = (
  state: ProjectState,
  nodeId: string,
  newName: string
): ProjectState => {
  const trimmedName = newName.trim();

  if (nodeId === state.rootId) {
    return { ...state, error: 'Cannot rename root project directory.' };
  }

  if (!isValidName(trimmedName)) {
    return { ...state, error: `Invalid name "${newName}".` };
  }

  const targetNode = state.nodes[nodeId];
  if (!targetNode) {
    return { ...state, error: 'File or folder to rename was not found.' };
  }

  if (targetNode.name === trimmedName) {
    return state; // No change
  }

  const parentFolder = targetNode.parentId ? state.nodes[targetNode.parentId] : null;
  if (!parentFolder) {
    return { ...state, error: 'Parent folder not found.' };
  }

  const newId = `${parentFolder.id}/${trimmedName}`;
  if (state.nodes[newId]) {
    return { ...state, error: `A file or folder named "${trimmedName}" already exists in this folder.` };
  }

  // Build mapping from old IDs -> new IDs for recursive rename
  const idMapping: Record<string, string> = {};

  const mapSubtree = (oldSubtreeId: string, newSubtreeId: string) => {
    idMapping[oldSubtreeId] = newSubtreeId;
    const node = state.nodes[oldSubtreeId];
    if (node && node.type === 'directory' && node.children) {
      node.children.forEach(childId => {
        const childName = state.nodes[childId]?.name || childId.split('/').pop()!;
        mapSubtree(childId, `${newSubtreeId}/${childName}`);
      });
    }
  };

  mapSubtree(nodeId, newId);

  // Construct new nodes map
  const updatedNodes: Record<string, FileNode> = {};

  Object.keys(state.nodes).forEach(key => {
    if (idMapping[key]) {
      const oldNode = state.nodes[key];
      const mappedId = idMapping[key];
      const mappedParentId = oldNode.parentId && idMapping[oldNode.parentId] ? idMapping[oldNode.parentId] : oldNode.parentId;

      const mappedChildren = oldNode.children
        ? oldNode.children.map(childId => idMapping[childId] || childId)
        : undefined;

      updatedNodes[mappedId] = {
        ...oldNode,
        id: mappedId,
        name: key === nodeId ? trimmedName : oldNode.name,
        path: mappedId,
        parentId: mappedParentId,
        ...(mappedChildren ? { children: mappedChildren } : {}),
      };
    } else {
      updatedNodes[key] = state.nodes[key];
    }
  });

  // Update parent children list
  const updatedParentChildren = (parentFolder.children || []).map(childId =>
    childId === nodeId ? newId : childId
  );
  updatedNodes[parentFolder.id] = {
    ...parentFolder,
    children: updatedParentChildren,
  };

  // Update openTabs, activeTabId, selectedId
  const updatedOpenTabs = state.openTabs.map(tabId => idMapping[tabId] || tabId);
  const updatedActiveTabId = state.activeTabId && idMapping[state.activeTabId] ? idMapping[state.activeTabId] : state.activeTabId;
  const updatedSelectedId = state.selectedId && idMapping[state.selectedId] ? idMapping[state.selectedId] : state.selectedId;

  return {
    ...state,
    nodes: updatedNodes,
    openTabs: updatedOpenTabs,
    activeTabId: updatedActiveTabId,
    selectedId: updatedSelectedId,
    isPendingSave: true,
    error: null,
  };
};

/**
 * Deletes a file or directory recursively.
 */
export const deleteNode = (
  state: ProjectState,
  nodeId: string
): ProjectState => {
  if (nodeId === state.rootId) {
    return { ...state, error: 'Cannot delete root project directory.' };
  }

  const targetNode = state.nodes[nodeId];
  if (!targetNode) {
    return { ...state, error: 'File or folder to delete was not found.' };
  }

  // Collect all child IDs to delete
  const idsToDelete = new Set<string>();

  const collectSubtree = (id: string) => {
    idsToDelete.add(id);
    const node = state.nodes[id];
    if (node && node.type === 'directory' && node.children) {
      node.children.forEach(collectSubtree);
    }
  };

  collectSubtree(nodeId);

  // Remove from parent's children list
  const updatedNodes: Record<string, FileNode> = {};
  Object.keys(state.nodes).forEach(key => {
    if (!idsToDelete.has(key)) {
      if (key === targetNode.parentId) {
        const parentNode = state.nodes[key];
        updatedNodes[key] = {
          ...parentNode,
          children: (parentNode.children || []).filter(childId => childId !== nodeId),
        };
      } else {
        updatedNodes[key] = state.nodes[key];
      }
    }
  });

  // Filter open tabs
  const updatedOpenTabs = state.openTabs.filter(tabId => !idsToDelete.has(tabId));

  // If active tab was deleted, select another open tab or null
  let updatedActiveTabId = state.activeTabId;
  if (state.activeTabId && idsToDelete.has(state.activeTabId)) {
    updatedActiveTabId = updatedOpenTabs.length > 0 ? updatedOpenTabs[updatedOpenTabs.length - 1] : null;
  }

  // If selectedId was deleted, set to parent folder or root
  let updatedSelectedId = state.selectedId;
  if (state.selectedId && idsToDelete.has(state.selectedId)) {
    updatedSelectedId = targetNode.parentId;
  }

  return {
    ...state,
    nodes: updatedNodes,
    openTabs: updatedOpenTabs,
    activeTabId: updatedActiveTabId,
    selectedId: updatedSelectedId,
    isPendingSave: true,
    error: null,
  };
};

/**
 * Updates the contents of a single file in the authoritative project state.
 */
export const updateFileContent = (
  state: ProjectState,
  fileId: string,
  newContent: string
): ProjectState => {
  const targetNode = state.nodes[fileId];
  if (!targetNode || targetNode.type !== 'file') {
    return { ...state, error: 'File not found.' };
  }

  if (targetNode.content === newContent) {
    return state;
  }

  const updatedNode: FileNode = {
    ...targetNode,
    content: newContent,
  };

  return {
    ...state,
    nodes: {
      ...state.nodes,
      [fileId]: updatedNode,
    },
    isPendingSave: true,
    error: null,
  };
};

/**
 * Selects a node in the file explorer. If it's a file, opens it in tabs.
 */
export const selectNode = (
  state: ProjectState,
  nodeId: string
): ProjectState => {
  const node = state.nodes[nodeId];
  if (!node) {
    return state;
  }

  if (node.type === 'file') {
    const openTabs = state.openTabs.includes(nodeId)
      ? state.openTabs
      : [...state.openTabs, nodeId];

    return {
      ...state,
      selectedId: nodeId,
      openTabs,
      activeTabId: nodeId,
    };
  }

  return {
    ...state,
    selectedId: nodeId,
  };
};

/**
 * Closes an open tab.
 */
export const closeTab = (
  state: ProjectState,
  tabId: string
): ProjectState => {
  const openTabs = state.openTabs.filter(id => id !== tabId);
  let activeTabId = state.activeTabId;

  if (activeTabId === tabId) {
    const index = state.openTabs.indexOf(tabId);
    if (openTabs.length > 0) {
      // Pick next or previous tab
      activeTabId = openTabs[Math.min(index, openTabs.length - 1)];
    } else {
      activeTabId = null;
    }
  }

  return {
    ...state,
    openTabs,
    activeTabId,
  };
};
