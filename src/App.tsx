import { useState, useEffect, useCallback, useRef } from 'react';
import { ProjectState, DEFAULT_STARTER_FILES } from './types/ide';
import {
  getInitialProjectState,
  saveProjectStateToStorage,
  createFile,
  createFolder,
  updateFileContent,
  renameItem,
  deleteItem,
  STORAGE_KEY,
} from './utils/filesystem';
import { Toolbar } from './components/Toolbar';
import { FileExplorer } from './components/FileExplorer';
import { TabsBar } from './components/TabsBar';
import { CodeEditor } from './components/CodeEditor';
import { PreviewPanel } from './components/PreviewPanel';

export default function App() {
  const [projectState, setProjectState] = useState<ProjectState>(getInitialProjectState);

  const pendingSaveRef = useRef(projectState.pendingSave);
  pendingSaveRef.current = projectState.pendingSave;

  const projectStateRef = useRef(projectState);
  projectStateRef.current = projectState;

  // Save to localStorage
  const handleSave = useCallback(() => {
    const success = saveProjectStateToStorage(projectStateRef.current);
    if (success) {
      setProjectState((prev) => ({
        ...prev,
        pendingSave: false,
        lastSavedAt: Date.now(),
        error: null,
      }));
    } else {
      setProjectState((prev) => ({
        ...prev,
        error: 'Failed to save project to browser LocalStorage. Storage quota may be exceeded.',
      }));
    }
  }, []);

  // Debounced auto-save effect
  useEffect(() => {
    if (!projectState.pendingSave) return;

    const timer = setTimeout(() => {
      handleSave();
    }, 1000);

    return () => clearTimeout(timer);
  }, [projectState.pendingSave, projectState.items, handleSave]);

  // Global Ctrl+S key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  const handleSelectFile = (path: string) => {
    setProjectState((prev) => {
      const openFilePaths = prev.openFilePaths.includes(path)
        ? prev.openFilePaths
        : [...prev.openFilePaths, path];
      return {
        ...prev,
        activeFilePath: path,
        openFilePaths,
      };
    });
  };

  const handleCloseTab = (path: string) => {
    setProjectState((prev) => {
      const openFilePaths = prev.openFilePaths.filter((p) => p !== path);
      let activeFilePath = prev.activeFilePath;

      if (activeFilePath === path) {
        activeFilePath = openFilePaths.length > 0 ? openFilePaths[openFilePaths.length - 1] : null;
      }

      return {
        ...prev,
        openFilePaths,
        activeFilePath,
      };
    });
  };

  const handleCreateFile = (parentPath: string, fileName: string): boolean => {
    try {
      const { items, newPath } = createFile(projectState.items, parentPath, fileName);
      setProjectState((prev) => ({
        ...prev,
        items,
        activeFilePath: newPath,
        openFilePaths: prev.openFilePaths.includes(newPath)
          ? prev.openFilePaths
          : [...prev.openFilePaths, newPath],
        pendingSave: true,
        error: null,
      }));
      return true;
    } catch (err: any) {
      setProjectState((prev) => ({
        ...prev,
        error: err.message || 'Failed to create file',
      }));
      return false;
    }
  };

  const handleCreateFolder = (parentPath: string, folderName: string): boolean => {
    try {
      const { items } = createFolder(projectState.items, parentPath, folderName);
      setProjectState((prev) => ({
        ...prev,
        items,
        pendingSave: true,
        error: null,
      }));
      return true;
    } catch (err: any) {
      setProjectState((prev) => ({
        ...prev,
        error: err.message || 'Failed to create folder',
      }));
      return false;
    }
  };

  const handleChangeContent = (newContent: string) => {
    if (!projectState.activeFilePath) return;

    try {
      const items = updateFileContent(
        projectState.items,
        projectState.activeFilePath,
        newContent
      );
      setProjectState((prev) => ({
        ...prev,
        items,
        pendingSave: true,
        error: null,
      }));
    } catch (err: any) {
      setProjectState((prev) => ({
        ...prev,
        error: err.message || 'Failed to update file content',
      }));
    }
  };

  const handleRenameItem = (oldPath: string, newName: string): boolean => {
    try {
      const { items, pathMap } = renameItem(projectState.items, oldPath, newName);

      // Update open tabs and active file path if affected
      const openFilePaths = projectState.openFilePaths.map((p) => pathMap[p] || p);
      const activeFilePath = projectState.activeFilePath
        ? pathMap[projectState.activeFilePath] || projectState.activeFilePath
        : null;

      setProjectState((prev) => ({
        ...prev,
        items,
        openFilePaths,
        activeFilePath,
        pendingSave: true,
        error: null,
      }));
      return true;
    } catch (err: any) {
      setProjectState((prev) => ({
        ...prev,
        error: err.message || 'Failed to rename item',
      }));
      return false;
    }
  };

  const handleDeleteItem = (targetPath: string) => {
    try {
      const { items, deletedPaths } = deleteItem(projectState.items, targetPath);

      const openFilePaths = projectState.openFilePaths.filter((p) => !deletedPaths.includes(p));
      let activeFilePath = projectState.activeFilePath;
      if (activeFilePath && deletedPaths.includes(activeFilePath)) {
        activeFilePath = openFilePaths.length > 0 ? openFilePaths[openFilePaths.length - 1] : null;
      }

      setProjectState((prev) => ({
        ...prev,
        items,
        openFilePaths,
        activeFilePath,
        pendingSave: true,
        error: null,
      }));
    } catch (err: any) {
      setProjectState((prev) => ({
        ...prev,
        error: err.message || 'Failed to delete item',
      }));
    }
  };

  const handleResetProject = () => {
    localStorage.removeItem(STORAGE_KEY);
    setProjectState({
      items: { ...DEFAULT_STARTER_FILES },
      activeFilePath: '/index.html',
      openFilePaths: ['/index.html'],
      pendingSave: false,
      lastSavedAt: Date.now(),
      error: null,
    });
  };

  const activeContent =
    projectState.activeFilePath && projectState.items[projectState.activeFilePath]?.type === 'file'
      ? (projectState.items[projectState.activeFilePath] as any).content
      : '';

  return (
    <div className="flex h-screen w-screen flex-col bg-gray-900 text-gray-100 font-sans overflow-hidden">
      <Toolbar
        pendingSave={projectState.pendingSave}
        lastSavedAt={projectState.lastSavedAt}
        onSave={handleSave}
        onReset={handleResetProject}
        error={projectState.error}
        onClearError={() => setProjectState((prev) => ({ ...prev, error: null }))}
      />

      <div className="flex flex-1 overflow-hidden">
        <FileExplorer
          items={projectState.items}
          activeFilePath={projectState.activeFilePath}
          onSelectFile={handleSelectFile}
          onCreateFile={handleCreateFile}
          onCreateFolder={handleCreateFolder}
          onRenameItem={handleRenameItem}
          onDeleteItem={handleDeleteItem}
        />

        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Top Half: Code Editor with Tabs */}
          <div className="flex flex-1 flex-col overflow-hidden">
            <TabsBar
              openFilePaths={projectState.openFilePaths}
              activeFilePath={projectState.activeFilePath}
              onSelectTab={handleSelectFile}
              onCloseTab={handleCloseTab}
            />
            <div className="flex-1 overflow-hidden">
              <CodeEditor
                activeFilePath={projectState.activeFilePath}
                content={activeContent}
                onChangeContent={handleChangeContent}
                onSaveShortcut={handleSave}
              />
            </div>
          </div>

          {/* Bottom Half: Preview Panel */}
          <div className="h-64 border-t border-gray-800">
            <PreviewPanel items={projectState.items} entryPath="/index.html" />
          </div>
        </div>
      </div>
    </div>
  );
}
