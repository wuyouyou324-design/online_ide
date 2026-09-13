import React, { useState } from 'react';
import {
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  FileJson,
  ChevronRight,
  ChevronDown,
  FilePlus,
  FolderPlus,
  Edit2,
  Trash2,
  Check,
  X,
} from 'lucide-react';
import type { FSNode, IDEProject, NodeType } from '../types/ide';

interface FileExplorerProps {
  project: IDEProject;
  onSelectFile: (fileId: string) => void;
  onCreateNode: (name: string, type: NodeType, parentId: string | null) => void;
  onRenameNode: (nodeId: string, newName: string) => void;
  onDeleteNode: (nodeId: string) => void;
  onToggleFolder: (folderId: string) => void;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  project,
  onSelectFile,
  onCreateNode,
  onRenameNode,
  onDeleteNode,
  onToggleFolder,
}) => {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [creatingType, setCreatingType] = useState<NodeType | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleStartCreate = (type: NodeType) => {
    setCreatingType(type);
    setNewItemName('');
  };

  const handleCancelCreate = () => {
    setCreatingType(null);
    setNewItemName('');
  };

  const handleSubmitCreate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!creatingType || !newItemName.trim()) return;
    onCreateNode(newItemName.trim(), creatingType, selectedFolderId);
    setCreatingType(null);
    setNewItemName('');
  };

  const handleStartRename = (node: FSNode, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingNodeId(node.id);
    setEditingName(node.name);
  };

  const handleSubmitRename = (nodeId: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (editingName.trim()) {
      onRenameNode(nodeId, editingName.trim());
    }
    setEditingNodeId(null);
    setEditingName('');
  };

  const handleDeleteWithConfirm = (node: FSNode, e: React.MouseEvent) => {
    e.stopPropagation();
    const isFolder = node.type === 'folder';
    const message = isFolder
      ? `Are you sure you want to delete folder "${node.name}" and all of its contents?`
      : `Are you sure you want to delete file "${node.name}"?`;

    if (window.confirm(message)) {
      onDeleteNode(node.id);
      if (selectedFolderId === node.id) {
        setSelectedFolderId(null);
      }
    }
  };

  const getFileIcon = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'html':
      case 'htm':
        return <FileCode size={16} className="file-icon html" />;
      case 'css':
        return <FileCode size={16} className="file-icon css" />;
      case 'js':
      case 'jsx':
      case 'ts':
      case 'tsx':
        return <FileCode size={16} className="file-icon js" />;
      case 'json':
        return <FileJson size={16} className="file-icon json" />;
      default:
        return <FileText size={16} className="file-icon default" />;
    }
  };

  const renderTree = (parentId: string | null = null, depth = 0) => {
    const children = Object.values(project.nodes)
      .filter((n) => n.parentId === parentId)
      .sort((a, b) => {
        if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
        return a.name.localeCompare(b.name);
      });

    return (
      <ul className="tree-list">
        {children.map((node) => {
          const isExpanded = project.expandedFolderIds.includes(node.id);
          const isSelectedFile = project.activeTabId === node.id;
          const isSelectedFolder = selectedFolderId === node.id;
          const isEditing = editingNodeId === node.id;

          return (
            <li key={node.id} className="tree-item-container">
              <div
                className={`tree-item ${node.type} ${isSelectedFile ? 'active-file' : ''} ${
                  isSelectedFolder ? 'selected-folder' : ''
                }`}
                style={{ paddingLeft: `${depth * 14 + 12}px` }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (node.type === 'folder') {
                    onToggleFolder(node.id);
                    setSelectedFolderId(node.id);
                  } else {
                    onSelectFile(node.id);
                  }
                }}
              >
                {node.type === 'folder' ? (
                  <span className="expand-toggle">
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </span>
                ) : (
                  <span className="expand-toggle-spacer" />
                )}

                <span className="node-icon">
                  {node.type === 'folder' ? (
                    isExpanded ? (
                      <FolderOpen size={16} className="folder-icon" />
                    ) : (
                      <Folder size={16} className="folder-icon" />
                    )
                  ) : (
                    getFileIcon(node.name)
                  )}
                </span>

                {isEditing ? (
                  <form
                    className="inline-rename-form"
                    onSubmit={(e) => handleSubmitRename(node.id, e)}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="text"
                      className="inline-input"
                      value={editingName}
                      autoFocus
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={() => handleSubmitRename(node.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') setEditingNodeId(null);
                      }}
                    />
                  </form>
                ) : (
                  <span className="node-name">{node.name}</span>
                )}

                {!isEditing && (
                  <div className="node-actions">
                    <button
                      className="icon-btn"
                      title="Rename"
                      onClick={(e) => handleStartRename(node, e)}
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      className="icon-btn danger"
                      title="Delete"
                      onClick={(e) => handleDeleteWithConfirm(node, e)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>

              {node.type === 'folder' && isExpanded && renderTree(node.id, depth + 1)}
            </li>
          );
        })}
      </ul>
    );
  };

  const selectedTargetName = selectedFolderId
    ? project.nodes[selectedFolderId]?.name
    : 'Root';

  return (
    <aside className="ide-file-explorer">
      <div className="explorer-header">
        <span className="explorer-title">Files</span>
        <div className="explorer-header-actions">
          <button
            className="icon-btn"
            title={`New file in ${selectedTargetName}`}
            onClick={() => handleStartCreate('file')}
          >
            <FilePlus size={16} />
          </button>
          <button
            className="icon-btn"
            title={`New folder in ${selectedTargetName}`}
            onClick={() => handleStartCreate('folder')}
          >
            <FolderPlus size={16} />
          </button>
        </div>
      </div>

      <div className="explorer-target-hint">
        Target: <span className="target-name">{selectedTargetName}</span>
        {selectedFolderId && (
          <button
            className="clear-target-btn"
            title="Deselect folder (create at root)"
            onClick={() => setSelectedFolderId(null)}
          >
            Clear
          </button>
        )}
      </div>

      {creatingType && (
        <form className="create-item-form" onSubmit={handleSubmitCreate}>
          <span className="create-type-label">New {creatingType}:</span>
          <div className="create-input-row">
            <input
              type="text"
              className="create-input"
              placeholder={`filename.${creatingType === 'file' ? 'js' : ''}`}
              value={newItemName}
              autoFocus
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') handleCancelCreate();
              }}
            />
            <button type="submit" className="icon-btn success" title="Confirm">
              <Check size={14} />
            </button>
            <button
              type="button"
              className="icon-btn danger"
              title="Cancel"
              onClick={handleCancelCreate}
            >
              <X size={14} />
            </button>
          </div>
        </form>
      )}

      <div className="explorer-tree">{renderTree(null, 0)}</div>
    </aside>
  );
};
