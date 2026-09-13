import type { FSNode, IDEProject, NodeType } from '../types/ide';

export function getFullPath(nodeId: string, nodes: Record<string, FSNode>): string {
  const node = nodes[nodeId];
  if (!node) return '';
  const parts: string[] = [node.name];
  let curr = node;
  while (curr.parentId && nodes[curr.parentId]) {
    curr = nodes[curr.parentId];
    parts.unshift(curr.name);
  }
  return parts.join('/');
}

export function validateNodeName(name: string): string | null {
  if (!name || name.trim() === '') {
    return 'Name cannot be empty';
  }
  if (name.includes('/') || name.includes('\\')) {
    return 'Name cannot contain slashes';
  }
  return null;
}

export function isDuplicateName(
  name: string,
  parentId: string | null,
  currentNodeId: string | null,
  nodes: Record<string, FSNode>
): boolean {
  return Object.values(nodes).some(
    (node) =>
      node.parentId === parentId &&
      node.id !== currentNodeId &&
      node.name.toLowerCase() === name.toLowerCase()
  );
}

export function getDescendantIds(nodeId: string, nodes: Record<string, FSNode>): string[] {
  const descendants: string[] = [];
  const queue = [nodeId];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const children = Object.values(nodes).filter((n) => n.parentId === currentId);
    for (const child of children) {
      descendants.push(child.id);
      if (child.type === 'folder') {
        queue.push(child.id);
      }
    }
  }

  return descendants;
}

export function createFileOrFolder(
  project: IDEProject,
  name: string,
  type: NodeType,
  parentId: string | null,
  initialContent: string = ''
): { project: IDEProject; error: string | null } {
  const nameError = validateNodeName(name);
  if (nameError) return { project, error: nameError };

  if (parentId && (!project.nodes[parentId] || project.nodes[parentId].type !== 'folder')) {
    return { project, error: 'Target parent folder does not exist' };
  }

  if (isDuplicateName(name, parentId, null, project.nodes)) {
    return { project, error: `A ${type} with the name "${name}" already exists in this folder.` };
  }

  const id = `node_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const newNode: FSNode = {
    id,
    name,
    type,
    parentId,
    content: type === 'file' ? initialContent : undefined,
  };

  const updatedNodes = {
    ...project.nodes,
    [id]: newNode,
  };

  const newExpandedFolderIds =
    type === 'folder'
      ? [...project.expandedFolderIds, id]
      : parentId && !project.expandedFolderIds.includes(parentId)
      ? [...project.expandedFolderIds, parentId]
      : project.expandedFolderIds;

  const newOpenTabIds = type === 'file' ? [...project.openTabIds, id] : project.openTabIds;
  const newActiveTabId = type === 'file' ? id : project.activeTabId;

  return {
    project: {
      ...project,
      nodes: updatedNodes,
      expandedFolderIds: newExpandedFolderIds,
      openTabIds: newOpenTabIds,
      activeTabId: newActiveTabId,
    },
    error: null,
  };
}

export function renameFileOrFolder(
  project: IDEProject,
  nodeId: string,
  newName: string
): { project: IDEProject; error: string | null } {
  const node = project.nodes[nodeId];
  if (!node) {
    return { project, error: 'Item not found' };
  }

  const nameError = validateNodeName(newName);
  if (nameError) return { project, error: nameError };

  if (isDuplicateName(newName, node.parentId, nodeId, project.nodes)) {
    return { project, error: `An item with name "${newName}" already exists in this directory.` };
  }

  const updatedNode = { ...node, name: newName };
  return {
    project: {
      ...project,
      nodes: {
        ...project.nodes,
        [nodeId]: updatedNode,
      },
    },
    error: null,
  };
}

export function deleteFileOrFolder(
  project: IDEProject,
  nodeId: string
): { project: IDEProject; error: string | null } {
  const node = project.nodes[nodeId];
  if (!node) {
    return { project, error: 'Item not found' };
  }

  const idsToRemove = [nodeId, ...getDescendantIds(nodeId, project.nodes)];
  const updatedNodes = { ...project.nodes };
  for (const id of idsToRemove) {
    delete updatedNodes[id];
  }

  const newOpenTabIds = project.openTabIds.filter((id) => !idsToRemove.includes(id));
  let newActiveTabId = project.activeTabId;

  if (project.activeTabId && idsToRemove.includes(project.activeTabId)) {
    newActiveTabId = newOpenTabIds.length > 0 ? newOpenTabIds[newOpenTabIds.length - 1] : null;
  }

  const newExpandedFolderIds = project.expandedFolderIds.filter((id) => !idsToRemove.includes(id));

  return {
    project: {
      ...project,
      nodes: updatedNodes,
      openTabIds: newOpenTabIds,
      activeTabId: newActiveTabId,
      expandedFolderIds: newExpandedFolderIds,
    },
    error: null,
  };
}

export function updateFileContent(
  project: IDEProject,
  fileId: string,
  content: string
): IDEProject {
  const node = project.nodes[fileId];
  if (!node || node.type !== 'file') return project;

  return {
    ...project,
    nodes: {
      ...project.nodes,
      [fileId]: {
        ...node,
        content,
      },
    },
  };
}

export function openTab(project: IDEProject, fileId: string): IDEProject {
  const node = project.nodes[fileId];
  if (!node || node.type !== 'file') return project;

  const openTabIds = project.openTabIds.includes(fileId)
    ? project.openTabIds
    : [...project.openTabIds, fileId];

  return {
    ...project,
    openTabIds,
    activeTabId: fileId,
  };
}

export function closeTab(project: IDEProject, fileId: string): IDEProject {
  const newOpenTabIds = project.openTabIds.filter((id) => id !== fileId);
  let newActiveTabId = project.activeTabId;

  if (project.activeTabId === fileId) {
    const closedIndex = project.openTabIds.indexOf(fileId);
    if (newOpenTabIds.length > 0) {
      const nextIndex = Math.min(closedIndex, newOpenTabIds.length - 1);
      newActiveTabId = newOpenTabIds[nextIndex];
    } else {
      newActiveTabId = null;
    }
  }

  return {
    ...project,
    openTabIds: newOpenTabIds,
    activeTabId: newActiveTabId,
  };
}

export function toggleFolderExpanded(project: IDEProject, folderId: string): IDEProject {
  const isExpanded = project.expandedFolderIds.includes(folderId);
  const expandedFolderIds = isExpanded
    ? project.expandedFolderIds.filter((id) => id !== folderId)
    : [...project.expandedFolderIds, folderId];

  return {
    ...project,
    expandedFolderIds,
  };
}
