import React, { useState } from 'react';
import type { ProjectState } from '../types/filesystem';
import {
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  ChevronRight,
  ChevronDown,
  FilePlus,
  FolderPlus,
  Edit2,
  Trash2,
} from 'lucide-react';

interface FileExplorerProps {
  projectState: ProjectState;
  onSelectNode: (id: string) => void;
  onCreateNode: (parentId: string, name: string, type: 'file' | 'directory') => void;
  onRenameNode: (id: string, newName: string) => void;
  onDeleteNode: (id: string) => void;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  projectState,
  onSelectNode,
  onCreateNode,
  onRenameNode,
  onDeleteNode,
}) => {
  const { nodes, rootId, selectedId } = projectState;
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    [rootId]: true,
  });

  // State for inline creation/renaming modal or form
  const [modalState, setModalState] = useState<{
    type: 'create-file' | 'create-folder' | 'rename' | 'confirm-delete' | null;
    targetId: string | null;
    inputValue: string;
  }>({
    type: null,
    targetId: null,
    inputValue: '',
  });

  const toggleFolder = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'html':
      case 'css':
      case 'js':
      case 'ts':
      case 'json':
        return <FileCode className="w-4 h-4 text-blue-400 shrink-0" />;
      default:
        return <FileText className="w-4 h-4 text-gray-400 shrink-0" />;
    }
  };

  const handleOpenCreateModal = (targetId: string, type: 'create-file' | 'create-folder') => {
    setModalState({
      type,
      targetId,
      inputValue: '',
    });
  };

  const handleOpenRenameModal = (targetId: string) => {
    const node = nodes[targetId];
    if (!node) return;
    setModalState({
      type: 'rename',
      targetId,
      inputValue: node.name,
    });
  };

  const handleOpenDeleteModal = (targetId: string) => {
    const node = nodes[targetId];
    if (!node) return;
    setModalState({
      type: 'confirm-delete',
      targetId,
      inputValue: '',
    });
  };

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { type, targetId, inputValue } = modalState;
    if (!targetId) return;

    if (type === 'create-file' || type === 'create-folder') {
      if (inputValue.trim()) {
        onCreateNode(targetId, inputValue.trim(), type === 'create-file' ? 'file' : 'directory');
        setExpandedFolders(prev => ({ ...prev, [targetId]: true }));
      }
    } else if (type === 'rename') {
      if (inputValue.trim()) {
        onRenameNode(targetId, inputValue.trim());
      }
    } else if (type === 'confirm-delete') {
      onDeleteNode(targetId);
    }

    setModalState({ type: null, targetId: null, inputValue: '' });
  };

  const renderTree = (nodeId: string, depth: number = 0) => {
    const node = nodes[nodeId];
    if (!node) return null;

    const isSelected = selectedId === nodeId;
    const isFolder = node.type === 'directory';
    const isExpanded = expandedFolders[nodeId] ?? false;

    return (
      <div key={nodeId} className="select-none">
        <div
          data-testid={`file-node-${node.name}`}
          onClick={() => {
            onSelectNode(nodeId);
            if (isFolder) {
              setExpandedFolders(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
            }
          }}
          className={`group flex items-center justify-between px-2 py-1 text-sm rounded cursor-pointer transition-colors ${
            isSelected ? 'bg-blue-600/30 text-blue-200' : 'hover:bg-gray-800 text-gray-300'
          }`}
          style={{ paddingLeft: `${Math.max(depth * 12 + 8, 8)}px` }}
        >
          <div className="flex items-center space-x-1.5 overflow-hidden text-ellipsis whitespace-nowrap">
            {isFolder ? (
              <>
                <button
                  type="button"
                  onClick={(e) => toggleFolder(nodeId, e)}
                  className="p-0.5 text-gray-400 hover:text-white"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                </button>
                {isExpanded ? (
                  <FolderOpen className="w-4 h-4 text-amber-400 shrink-0" />
                ) : (
                  <Folder className="w-4 h-4 text-amber-400 shrink-0" />
                )}
              </>
            ) : (
              <>
                <span className="w-3.5 h-3.5 inline-block shrink-0" />
                {getFileIcon(node.name)}
              </>
            )}
            <span className="truncate">{node.name}</span>
          </div>

          {/* Context Action Buttons */}
          <div className="hidden group-hover:flex items-center space-x-1 pl-2 bg-gray-900/80 rounded">
            {isFolder && (
              <>
                <button
                  type="button"
                  title="New File"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenCreateModal(nodeId, 'create-file');
                  }}
                  className="p-1 hover:text-blue-400 text-gray-400"
                >
                  <FilePlus className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  title="New Folder"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenCreateModal(nodeId, 'create-folder');
                  }}
                  className="p-1 hover:text-amber-400 text-gray-400"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                </button>
              </>
            )}
            {nodeId !== rootId && (
              <>
                <button
                  type="button"
                  title="Rename"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenRenameModal(nodeId);
                  }}
                  className="p-1 hover:text-yellow-400 text-gray-400"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  title="Delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenDeleteModal(nodeId);
                  }}
                  className="p-1 hover:text-red-400 text-gray-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Children rendering */}
        {isFolder && isExpanded && node.children && node.children.length > 0 && (
          <div>{node.children.map(childId => renderTree(childId, depth + 1))}</div>
        )}
      </div>
    );
  };

  const targetNodeForModal = modalState.targetId ? nodes[modalState.targetId] : null;

  return (
    <div className="flex flex-col h-full bg-gray-900 border-r border-gray-800 text-gray-200">
      {/* Header Toolbar */}
      <div className="flex items-center justify-between p-3 border-b border-gray-800">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Explorer
        </span>
        <div className="flex items-center space-x-1">
          <button
            type="button"
            title="New File in Root"
            onClick={() => handleOpenCreateModal(rootId, 'create-file')}
            className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded"
          >
            <FilePlus className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="New Folder in Root"
            onClick={() => handleOpenCreateModal(rootId, 'create-folder')}
            className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded"
          >
            <FolderPlus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* File Tree List */}
      <div className="flex-1 overflow-y-auto p-2">{renderTree(rootId)}</div>

      {/* Action Dialog / Modal */}
      {modalState.type && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleModalSubmit}
            className="bg-gray-900 border border-gray-800 rounded-lg p-5 w-full max-w-sm shadow-xl"
          >
            <h3 className="text-base font-semibold text-white mb-3">
              {modalState.type === 'create-file' && `Create File in ${targetNodeForModal?.name}`}
              {modalState.type === 'create-folder' && `Create Folder in ${targetNodeForModal?.name}`}
              {modalState.type === 'rename' && `Rename ${targetNodeForModal?.name}`}
              {modalState.type === 'confirm-delete' && `Delete ${targetNodeForModal?.name}?`}
            </h3>

            {modalState.type === 'confirm-delete' ? (
              <p className="text-sm text-gray-300 mb-4">
                {targetNodeForModal?.type === 'directory'
                  ? 'Are you sure you want to delete this folder and all of its contents? This action cannot be undone.'
                  : 'Are you sure you want to delete this file?'}
              </p>
            ) : (
              <input
                type="text"
                autoFocus
                value={modalState.inputValue}
                onChange={(e) => setModalState(prev => ({ ...prev, inputValue: e.target.value }))}
                placeholder={
                  modalState.type === 'create-file'
                    ? 'e.g., style.css'
                    : modalState.type === 'create-folder'
                    ? 'e.g., components'
                    : 'New name'
                }
                className="w-full bg-gray-950 border border-gray-700 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500 mb-4"
              />
            )}

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setModalState({ type: null, targetId: null, inputValue: '' })}
                className="px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-white rounded hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-3 py-1.5 text-xs font-medium text-white rounded ${
                  modalState.type === 'confirm-delete'
                    ? 'bg-red-600 hover:bg-red-500'
                    : 'bg-blue-600 hover:bg-blue-500'
                }`}
              >
                {modalState.type === 'confirm-delete' ? 'Delete' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
