import React, { useState } from 'react';
import {
  FilePlus,
  FolderPlus,
  Folder,
  FolderOpen,
  FileCode,
  ChevronRight,
  ChevronDown,
  Edit2,
  Trash2,
  Check,
  X,
} from 'lucide-react';
import { FileNode } from '../types/filesystem';
import { ProjectAction } from '../state/projectReducer';

interface FileExplorerProps {
  files: Record<string, FileNode>;
  selectedFileId: string | null;
  dispatch: React.Dispatch<ProjectAction>;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  selectedFileId,
  dispatch,
}) => {
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(
    new Set()
  );
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');
  const [creatingType, setCreatingType] = useState<'file' | 'folder' | null>(
    null
  );
  const [creatingParentId, setCreatingParentId] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const toggleFolder = (folderId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setExpandedFolderIds((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const handleStartCreate = (
    type: 'file' | 'folder',
    targetFolderId?: string | null
  ) => {
    let parentId: string | null = null;
    if (targetFolderId !== undefined) {
      parentId = targetFolderId;
    } else if (selectedFileId && files[selectedFileId]) {
      const selectedNode = files[selectedFileId];
      parentId =
        selectedNode.type === 'folder'
          ? selectedNode.id
          : selectedNode.parentId;
    }

    if (parentId) {
      setExpandedFolderIds((prev) => new Set(prev).add(parentId!));
    }

    setCreatingType(type);
    setCreatingParentId(parentId);
    setNewItemName('');
    setErrorMessage(null);
  };

  const handleConfirmCreate = () => {
    if (!creatingType || !newItemName.trim()) return;

    try {
      if (creatingType === 'file') {
        dispatch({
          type: 'CREATE_FILE',
          parentId: creatingParentId,
          name: newItemName.trim(),
        });
      } else {
        dispatch({
          type: 'CREATE_FOLDER',
          parentId: creatingParentId,
          name: newItemName.trim(),
        });
      }
      setCreatingType(null);
      setNewItemName('');
      setErrorMessage(null);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error creating item');
    }
  };

  const handleCancelCreate = () => {
    setCreatingType(null);
    setNewItemName('');
    setErrorMessage(null);
  };

  const handleStartRename = (node: FileNode, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingNodeId(node.id);
    setEditingName(node.name);
    setErrorMessage(null);
  };

  const handleConfirmRename = () => {
    if (!editingNodeId || !editingName.trim()) return;

    try {
      dispatch({
        type: 'RENAME_NODE',
        id: editingNodeId,
        newName: editingName.trim(),
      });
      setEditingNodeId(null);
      setEditingName('');
      setErrorMessage(null);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error renaming item');
    }
  };

  const handleCancelRename = () => {
    setEditingNodeId(null);
    setEditingName('');
    setErrorMessage(null);
  };

  const handleDelete = (node: FileNode, e: React.MouseEvent) => {
    e.stopPropagation();
    if (node.type === 'folder') {
      const hasChildren = Object.values(files).some(
        (f) => f.parentId === node.id
      );
      if (hasChildren) {
        const confirmed = window.confirm(
          `Folder "${node.name}" is not empty. Are you sure you want to delete it and all its contents?`
        );
        if (!confirmed) return;
      }
    } else {
      const confirmed = window.confirm(
        `Are you sure you want to delete "${node.name}"?`
      );
      if (!confirmed) return;
    }

    try {
      dispatch({ type: 'DELETE_NODE', id: node.id });
      setErrorMessage(null);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error deleting item');
    }
  };

  // Helper function to render a node (file or folder) and recursively its children
  const renderTree = (parentId: string | null = null, depth = 0) => {
    const childNodes = Object.values(files)
      .filter((node) => node.parentId === parentId)
      .sort((a, b) => {
        // Folders first, then files alphabetically
        if (a.type !== b.type) {
          return a.type === 'folder' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });

    return (
      <div className="flex flex-col">
        {/* Render create inline input if creating at this folder level */}
        {creatingType && creatingParentId === parentId && (
          <div
            className="flex items-center space-x-1 py-1 px-2 my-0.5 rounded bg-gray-800 border border-blue-500 text-xs"
            style={{ paddingLeft: `${depth * 12 + 12}px` }}
          >
            {creatingType === 'folder' ? (
              <Folder className="w-4 h-4 text-yellow-400 shrink-0" />
            ) : (
              <FileCode className="w-4 h-4 text-blue-400 shrink-0" />
            )}
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirmCreate();
                if (e.key === 'Escape') handleCancelCreate();
              }}
              placeholder={`New ${creatingType}...`}
              autoFocus
              className="bg-gray-900 text-white px-1 py-0.5 rounded outline-none border border-gray-600 text-xs w-full"
            />
            <button
              onClick={handleConfirmCreate}
              className="text-green-400 hover:text-green-300 p-0.5"
              title="Confirm"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleCancelCreate}
              className="text-red-400 hover:text-red-300 p-0.5"
              title="Cancel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {childNodes.map((node) => {
          const isSelected = selectedFileId === node.id;
          const isFolder = node.type === 'folder';
          const isExpanded = expandedFolderIds.has(node.id);
          const isEditing = editingNodeId === node.id;

          return (
            <div key={node.id} className="flex flex-col">
              <div
                onClick={() => {
                  if (isFolder) {
                    toggleFolder(node.id);
                  }
                  dispatch({ type: 'SELECT_FILE', id: node.id });
                }}
                style={{ paddingLeft: `${depth * 12 + 8}px` }}
                className={`group flex items-center justify-between py-1 px-2 cursor-pointer text-xs rounded select-none transition-colors ${
                  isSelected
                    ? 'bg-blue-600 text-white font-medium'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <div className="flex items-center space-x-1.5 truncate">
                  {isFolder ? (
                    <>
                      <button
                        onClick={(e) => toggleFolder(node.id, e)}
                        className="p-0.5 text-gray-400 hover:text-white"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" />
                        )}
                      </button>
                      {isExpanded ? (
                        <FolderOpen className="w-4 h-4 text-yellow-400 shrink-0" />
                      ) : (
                        <Folder className="w-4 h-4 text-yellow-400 shrink-0" />
                      )}
                    </>
                  ) : (
                    <>
                      <span className="w-3.5 h-3.5" />
                      <FileCode className="w-4 h-4 text-blue-400 shrink-0" />
                    </>
                  )}

                  {isEditing ? (
                    <div
                      className="flex items-center space-x-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleConfirmRename();
                          if (e.key === 'Escape') handleCancelRename();
                        }}
                        autoFocus
                        className="bg-gray-900 text-white px-1 py-0.5 rounded outline-none border border-blue-500 text-xs w-28"
                      />
                      <button
                        onClick={handleConfirmRename}
                        className="text-green-400 hover:text-green-300 p-0.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={handleCancelRename}
                        className="text-red-400 hover:text-red-300 p-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <span className="truncate">{node.name}</span>
                  )}
                </div>

                {!isEditing && (
                  <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1 shrink-0 ml-1">
                    {isFolder && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartCreate('file', node.id);
                          }}
                          className="p-1 text-gray-400 hover:text-white"
                          title="New File in Folder"
                        >
                          <FilePlus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartCreate('folder', node.id);
                          }}
                          className="p-1 text-gray-400 hover:text-white"
                          title="New Subfolder"
                        >
                          <FolderPlus className="w-3 h-3" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={(e) => handleStartRename(node, e)}
                      className="p-1 text-gray-400 hover:text-white"
                      title="Rename"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(node, e)}
                      className="p-1 text-gray-400 hover:text-red-400"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* Render folder children if expanded */}
              {isFolder && isExpanded && renderTree(node.id, depth + 1)}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col h-full select-none shrink-0">
      {/* Explorer Header */}
      <div className="h-9 px-3 bg-gray-800/50 border-b border-gray-800 flex items-center justify-between text-xs font-semibold text-gray-400 uppercase tracking-wider">
        <span>Files</span>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => handleStartCreate('file')}
            className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
            title="New File (Root)"
          >
            <FilePlus className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleStartCreate('folder')}
            className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
            title="New Folder (Root)"
          >
            <FolderPlus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-2 bg-red-900/50 border-b border-red-700 text-red-200 text-xs flex items-center justify-between">
          <span>{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="ml-1 text-red-300 hover:text-white"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Tree Content */}
      <div className="flex-1 overflow-y-auto p-1">
        {renderTree(null, 0)}
      </div>
    </div>
  );
};
