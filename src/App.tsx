import { useCallback } from 'react';
import { useProjectState } from './state/useProjectState';
import { Toolbar } from './components/Toolbar';
import { FileExplorer } from './components/FileExplorer';
import { TabBar } from './components/TabBar';
import { CodeEditor } from './components/CodeEditor';
import { Preview } from './components/Preview';

export default function App() {
  const {
    state,
    dispatch,
    hasPendingSave,
    saveStatus,
    saveError,
    saveNow,
    resetProject,
  } = useProjectState();

  const handleContentChange = useCallback(
    (fileId: string, content: string) => {
      dispatch({ type: 'UPDATE_FILE_CONTENT', id: fileId, content });
    },
    [dispatch]
  );

  const activeFile = state.activeTabId ? state.files[state.activeTabId] ?? null : null;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-gray-950 text-gray-100 font-sans">
      {/* Top Toolbar */}
      <Toolbar
        hasPendingSave={hasPendingSave}
        saveStatus={saveStatus}
        saveError={saveError}
        onSaveNow={saveNow}
        onResetProject={resetProject}
      />

      {/* Main IDE Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: File Explorer */}
        <FileExplorer
          files={state.files}
          selectedFileId={state.selectedFileId}
          dispatch={dispatch}
        />

        {/* Right Side: Split into Editor (Top) & Preview (Bottom) */}
        <div className="flex-1 flex flex-col min-w-0 h-full">
          {/* Upper Half: Editor with TabBar */}
          <div className="h-3/5 flex flex-col min-h-0 border-b border-gray-800">
            <TabBar
              files={state.files}
              openTabIds={state.openTabIds}
              activeTabId={state.activeTabId}
              dispatch={dispatch}
            />
            <CodeEditor
              activeFile={activeFile}
              onContentChange={handleContentChange}
            />
          </div>

          {/* Lower Half: HTML Preview */}
          <div className="h-2/5 min-h-0 bg-white">
            <Preview files={state.files} />
          </div>
        </div>
      </div>
    </div>
  );
}
