export type NodeType = 'file' | 'folder';

export interface FSNode {
  id: string;
  name: string;
  type: NodeType;
  parentId: string | null;
  content?: string;
}

export interface IDEProject {
  id: string;
  name: string;
  nodes: Record<string, FSNode>;
  openTabIds: string[];
  activeTabId: string | null;
  expandedFolderIds: string[];
}

export type SaveStatus = 'saved' | 'unsaved' | 'saving' | 'error';

export interface IDEState {
  project: IDEProject;
  saveStatus: SaveStatus;
  saveError: string | null;
  errorMessage: string | null;
}
