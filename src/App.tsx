import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Toolbar } from './components/Toolbar';
import { FileExplorer } from './components/FileExplorer';
import { TabBar } from './components/TabBar';
import { CodeEditor } from './components/CodeEditor';
import { Preview } from './components/Preview';
import { ErrorBanner } from './components/ErrorBanner';
import type { IDEProject, SaveStatus, NodeType } from './types/ide';
import { createDefaultProject } from './utils/defaultProject';
import {
  createFileOrFolder,
  renameFileOrFolder,
  deleteFileOrFolder,
  updateFileContent,
  openTab,
  closeTab,
  toggleFolderExpanded,
} from './utils/fsUtils';
import { loadProjectFromStorage, saveProjectToStorage } from './utils/persistence';
import './App.css';

export const App: React.FC = () => {
  const [project, setProject] = useState<IDEProject>(() => {
    try {
      const stored = loadProjectFromStorage();
      if (stored) return stored;
    } catch (err) {
      console.error('Error loading stored project:', err);
    }
    return createDefaultProject();
  });

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialMount = useRef(true);

  const performSave = useCallback((projectToSave: IDEProject) => {
    setSaveStatus('saving');
    try {
      saveProjectToStorage(projectToSave);
      setSaveStatus('saved');
      setSaveError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Save failed';
      setSaveStatus('error');
      setSaveError(msg);
      setErrorMessage(msg);
    }
  }, []);

  // Debounced auto-save effect
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    setSaveStatus('unsaved');
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      performSave(project);
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [project, performSave]);

  const handleManualSave = () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    performSave(project);
  };

  const handleResetDefault = () => {
    const defaultProj = createDefaultProject();
    setProject(defaultProj);
    performSave(defaultProj);
  };

  const handleSelectFile = (fileId: string) => {
    setProject((prev) => openTab(prev, fileId));
  };

  const handleCreateNode = (name: string, type: NodeType, parentId: string | null) => {
    const { project: updated, error } = createFileOrFolder(project, name, type, parentId);
    if (error) {
      setErrorMessage(error);
    } else {
      setProject(updated);
    }
  };

  const handleRenameNode = (nodeId: string, newName: string) => {
    const { project: updated, error } = renameFileOrFolder(project, nodeId, newName);
    if (error) {
      setErrorMessage(error);
    } else {
      setProject(updated);
    }
  };

  const handleDeleteNode = (nodeId: string) => {
    const { project: updated, error } = deleteFileOrFolder(project, nodeId);
    if (error) {
      setErrorMessage(error);
    } else {
      setProject(updated);
    }
  };

  const handleToggleFolder = (folderId: string) => {
    setProject((prev) => toggleFolderExpanded(prev, folderId));
  };

  const handleChangeFileContent = (content: string) => {
    if (!project.activeTabId) return;
    setProject((prev) => updateFileContent(prev, prev.activeTabId!, content));
  };

  const handleCloseTab = (fileId: string) => {
    setProject((prev) => closeTab(prev, fileId));
  };

  const activeFile = project.activeTabId ? project.nodes[project.activeTabId] || null : null;

  return (
    <div className="ide-app-container">
      <ErrorBanner message={errorMessage} onDismiss={() => setErrorMessage(null)} />

      <Toolbar
        projectName={project.name}
        saveStatus={saveStatus}
        saveError={saveError}
        onSave={handleManualSave}
        onResetDefaultProject={handleResetDefault}
      />

      <div className="ide-main-body">
        <FileExplorer
          project={project}
          onSelectFile={handleSelectFile}
          onCreateNode={handleCreateNode}
          onRenameNode={handleRenameNode}
          onDeleteNode={handleDeleteNode}
          onToggleFolder={handleToggleFolder}
        />

        <div className="ide-editor-wrapper">
          <TabBar
            project={project}
            saveStatus={saveStatus}
            onSelectTab={handleSelectFile}
            onCloseTab={handleCloseTab}
          />

          <CodeEditor
            activeFile={activeFile}
            onChangeContent={handleChangeFileContent}
            onSave={handleManualSave}
          />

          <Preview project={project} />
        </div>
      </div>
    </div>
  );
};

export default App;
