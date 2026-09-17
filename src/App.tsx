import { useState, useEffect, useCallback, useRef } from 'react';
import type { ProjectState } from './types/filesystem';
import { createStarterProject } from './types/filesystem';
import {
  createNode,
  renameNode,
  deleteNode,
  selectNode,
  closeTab,
  updateFileContent,
} from './utils/filesystem';
import {
  saveProjectToStorage,
  loadProjectFromStorage,
  clearStoredProject,
} from './utils/persistence';
import { Toolbar } from './components/Toolbar';
import { FileExplorer } from './components/FileExplorer';
import { EditorArea } from './components/EditorArea';
import { PreviewPanel } from './components/PreviewPanel';

export function App() {
  const [projectState, setProjectState] = useState<ProjectState>(() => {
    const loaded = loadProjectFromStorage();
    if (loaded.success && loaded.state) {
      return loaded.state;
    }
    return createStarterProject();
  });

  const [toastError, setToastError] = useState<string | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Surface project state error if any
  useEffect(() => {
    if (projectState.error) {
      setToastError(projectState.error);
    }
  }, [projectState.error]);

  // Debounced auto-save
  useEffect(() => {
    if (projectState.isPendingSave) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        const res = saveProjectToStorage(projectState);
        if (res.success) {
          setProjectState(prev => ({ ...prev, isPendingSave: false }));
        } else if (res.error) {
          setToastError(res.error);
        }
      }, 1000);
    }
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [projectState]);

  // Force Save handler (Ctrl+S or Save Button)
  const handleSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    const res = saveProjectToStorage(projectState);
    if (res.success) {
      setProjectState(prev => ({ ...prev, isPendingSave: false }));
    } else if (res.error) {
      setToastError(res.error);
    }
  }, [projectState]);

  // Global Ctrl+S shortcut listener
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

  const handleResetProject = () => {
    clearStoredProject();
    const fresh = createStarterProject();
    setProjectState(fresh);
    saveProjectToStorage(fresh);
  };

  const handleSelectNode = (nodeId: string) => {
    setProjectState(prev => selectNode(prev, nodeId));
  };

  const handleCreateNode = (parentId: string, name: string, type: 'file' | 'directory') => {
    setProjectState(prev => createNode(prev, parentId, name, type));
  };

  const handleRenameNode = (id: string, newName: string) => {
    setProjectState(prev => renameNode(prev, id, newName));
  };

  const handleDeleteNode = (id: string) => {
    setProjectState(prev => deleteNode(prev, id));
  };

  const handleSelectTab = (tabId: string) => {
    setProjectState(prev => selectNode(prev, tabId));
  };

  const handleCloseTab = (tabId: string) => {
    setProjectState(prev => closeTab(prev, tabId));
  };

  const handleContentChange = (fileId: string, newContent: string) => {
    setProjectState(prev => updateFileContent(prev, fileId, newContent));
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-gray-950 text-white overflow-hidden font-sans">
      {/* Top Navigation / Toolbar */}
      <Toolbar
        projectState={projectState}
        onSave={handleSave}
        onResetProject={handleResetProject}
      />

      {/* Main IDE Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left File Explorer Panel */}
        <div className="w-64 h-full shrink-0">
          <FileExplorer
            projectState={projectState}
            onSelectNode={handleSelectNode}
            onCreateNode={handleCreateNode}
            onRenameNode={handleRenameNode}
            onDeleteNode={handleDeleteNode}
          />
        </div>

        {/* Center Main Editor & Bottom Preview Container */}
        <div className="flex flex-col flex-1 h-full min-w-0 bg-gray-900">
          {/* Editor Container Area */}
          <div className="flex-1 h-1/2 min-h-0">
            <EditorArea
              projectState={projectState}
              onSelectTab={handleSelectTab}
              onCloseTab={handleCloseTab}
              onContentChange={handleContentChange}
            />
          </div>

          {/* Preview Container Area */}
          <div className="h-72 border-t border-gray-800">
            <PreviewPanel projectState={projectState} />
          </div>
        </div>
      </div>

      {/* Error Toast Banner */}
      {toastError && (
        <div className="fixed bottom-4 right-4 bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded-lg shadow-xl flex items-center space-x-3 z-50">
          <span className="text-sm font-medium">{toastError}</span>
          <button
            type="button"
            onClick={() => setToastError(null)}
            className="text-red-300 hover:text-white font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
