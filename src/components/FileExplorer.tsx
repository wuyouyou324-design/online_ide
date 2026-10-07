import React, { useEffect, useState } from 'react';
import {
  Folder,
  FolderOpen,
  FileCode,
  FilePlus,
  FolderPlus,
  Edit2,
  Trash2,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { FSItem } from '../types/ide';

interface FileExplorerProps {
  items: Record<string, FSItem>;
  activeFilePath: string | null;
  onSelectFile: (path: string) => void;
  onCreateFile: (parentPath: string, fileName: string) => boolean;
  onCreateFolder: (parentPath: string, folderName: string) => boolean;
  onRenameItem: (oldPath: string, newName: string) => boolean;
  onDeleteItem: (targetPath: string) => void;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  items,
  activeFilePath,
  onSelectFile,
  onCreateFile,
  onCreateFolder,
  onRenameItem,
  onDeleteItem,
}) => {
  const [selectedFolderForAction, setSelectedFolderForAction] = useState<string>('/');
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({ '/': true });
  const [modalState, setModalState] = useState<{
    type: 'create-file' | 'create-folder' | 'rename' | 'delete-confirm';
    targetPath?: string;
    parentPath?: string;
    initialValue?: string;
  } | null>(null);
  const [inputValue, setInputValue] = useState('');

  // Keep the toolbar's target folder valid after a folder is renamed or deleted.
  useEffect(() => {
    if (selectedFolderForAction !== '/' && items[selectedFolderForAction]?.type !== 'folder') {
      setSelectedFolderForAction('/');
    }
  }, [items, selectedFolderForAction]);

  const toggleFolder = (folderPath: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderPath]: !prev[folderPath],
    }));
  };

  const handleOpenCreateFileModal = (parentPath: string) => {
    setModalState({ type: 'create-file', parentPath });
    setInputValue('');
  };

  const handleOpenCreateFolderModal = (parentPath: string) => {
    setModalState({ type: 'create-folder', parentPath });
    setInputValue('');
  };

  const handleOpenRenameModal = (path: string, currentName: string) => {
    setModalState({ type: 'rename', targetPath: path, initialValue: currentName });
    setInputValue(currentName);
  };

  const handleOpenDeleteModal = (path: string) => {
    const item = items[path];
    if (!item) return;

    if (item.type === 'folder') {
      const prefix = path + '/';
      const hasChildren = Object.keys(items).some((p) => p.startsWith(prefix));
      if (hasChildren) {
        setModalState({ type: 'delete-confirm', targetPath: path });
        return;
      }
    }

    onDeleteItem(path);
  };

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalState) return;

    try {
      let succeeded = false;
      if (modalState.type === 'create-file' && modalState.parentPath) {
        succeeded = onCreateFile(modalState.parentPath, inputValue);
      } else if (modalState.type === 'create-folder' && modalState.parentPath) {
        succeeded = onCreateFolder(modalState.parentPath, inputValue);
        if (succeeded) {
          setExpandedFolders((prev) => ({ ...prev, [modalState.parentPath!]: true }));
        }
      } else if (modalState.type === 'rename' && modalState.targetPath) {
        succeeded = onRenameItem(modalState.targetPath, inputValue);
      } else if (modalState.type === 'delete-confirm' && modalState.targetPath) {
        onDeleteItem(modalState.targetPath);
        succeeded = true;
      }
      if (succeeded) {
        setModalState(null);
      }
    } catch (err) {
      // Handled at top level state error handler
    }
  };

  // Build tree hierarchy
  const getChildren = (parentPath: string): FSItem[] => {
    const prefix = parentPath === '/' ? '/' : parentPath + '/';
    return Object.values(items)
      .filter((item) => {
        if (parentPath === '/') {
          return item.path.startsWith('/') && item.path.slice(1).indexOf('/') === -1;
        }
        if (!item.path.startsWith(prefix)) return false;
        const relative = item.path.slice(prefix.length);
        return relative.indexOf('/') === -1;
      })
      .sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'folder' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
  };

  const renderTreeItem = (item: FSItem, depth = 0) => {
    const isFolder = item.type === 'folder';
    const isExpanded = !!expandedFolders[item.path];
    const isSelected = activeFilePath === item.path;
    const isFolderSelected = selectedFolderForAction === item.path;

    return (
      <div key={item.path} className="flex flex-col text-xs">
        <div
          onClick={() => {
            if (isFolder) {
              toggleFolder(item.path);
              setSelectedFolderForAction(item.path);
            } else {
              onSelectFile(item.path);
            }
          }}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          className={`group flex items-center justify-between py-1 pr-2 cursor-pointer rounded select-none ${
            isSelected
              ? 'bg-blue-900/60 text-blue-200 font-medium'
              : isFolderSelected
              ? 'bg-gray-800 text-gray-200'
              : 'hover:bg-gray-800/60 text-gray-400 hover:text-gray-200'
          }`}
        >
          <div className="flex items-center gap-1.5 min-w-0 truncate">
            {isFolder ? (
              <>
                {isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                )}
                {isExpanded ? (
                  <FolderOpen className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                ) : (
                  <Folder className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                )}
              </>
            ) : (
              <>
                <span className="w-3.5" />
                <FileCode className="h-3.5 w-3.5 shrink-0 text-blue-400" />
              </>
            )}
            <span className="truncate">{item.name}</span>
          </div>

          <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            {isFolder && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenCreateFileModal(item.path);
                  }}
                  title={`Create file inside ${item.name}`}
                  aria-label={`Create file inside ${item.name}`}
                  className="p-0.5 hover:text-white rounded"
                >
                  <FilePlus className="h-3 w-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenCreateFolderModal(item.path);
                  }}
                  title={`Create folder inside ${item.name}`}
                  aria-label={`Create folder inside ${item.name}`}
                  className="p-0.5 hover:text-white rounded"
                >
                  <FolderPlus className="h-3 w-3" />
                </button>
              </>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleOpenRenameModal(item.path, item.name);
              }}
              title={`Rename ${item.name}`}
              aria-label={`Rename ${item.name}`}
              className="p-0.5 hover:text-white rounded"
            >
              <Edit2 className="h-3 w-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleOpenDeleteModal(item.path);
              }}
              title={`Delete ${item.name}`}
              aria-label={`Delete ${item.name}`}
              className="p-0.5 hover:text-red-400 rounded"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>

        {isFolder && isExpanded && (
          <div className="flex flex-col">
            {getChildren(item.path).map((child) => renderTreeItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const rootChildren = getChildren('/');

  return (
    <div className="flex h-full w-64 flex-col border-r border-gray-800 bg-gray-950 text-gray-300 select-none shrink-0">
      <div className="flex items-center justify-between border-b border-gray-800 px-3 py-2">
        <span className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
          Explorer
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleOpenCreateFileModal(selectedFolderForAction)}
            title={`New file in ${selectedFolderForAction}`}
            aria-label={`New file in ${selectedFolderForAction}`}
            className="rounded p-1 text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            <FilePlus className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleOpenCreateFolderModal(selectedFolderForAction)}
            title={`New folder in ${selectedFolderForAction}`}
            aria-label={`New folder in ${selectedFolderForAction}`}
            className="rounded p-1 text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            <FolderPlus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {rootChildren.length === 0 ? (
          <div className="p-4 text-center text-xs text-gray-500">Project is empty</div>
        ) : (
          rootChildren.map((item) => renderTreeItem(item, 0))
        )}
      </div>

      {modalState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-lg border border-gray-800 bg-gray-900 p-4 shadow-xl text-gray-100">
            {modalState.type === 'delete-confirm' ? (
              <div>
                <h3 className="text-sm font-semibold text-red-400">Confirm Folder Deletion</h3>
                <p className="mt-2 text-xs text-gray-300">
                  Folder <code className="text-amber-300">{modalState.targetPath}</code> is not empty.
                  Are you sure you want to delete this folder and all contained items recursively?
                </p>
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setModalState(null)}
                    className="rounded bg-gray-800 px-3 py-1.5 text-xs font-medium hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleModalSubmit}
                    className="rounded bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500"
                  >
                    Delete Folder
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleModalSubmit}>
                <h3 className="text-sm font-semibold">
                  {modalState.type === 'create-file' && `New File in ${modalState.parentPath}`}
                  {modalState.type === 'create-folder' && `New Folder in ${modalState.parentPath}`}
                  {modalState.type === 'rename' && `Rename ${modalState.targetPath}`}
                </h3>
                <input
                  type="text"
                  autoFocus
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={
                    modalState.type === 'create-folder' ? 'folder-name' : 'filename.ext'
                  }
                  className="mt-3 w-full rounded border border-gray-700 bg-gray-950 px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                />
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setModalState(null)}
                    className="rounded bg-gray-800 px-3 py-1.5 text-xs font-medium hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500"
                  >
                    Confirm
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
