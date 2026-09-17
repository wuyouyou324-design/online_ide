import React from 'react';
import Editor from '@monaco-editor/react';
import type { ProjectState } from '../types/filesystem';
import { getLanguageFromPath } from '../utils/filesystem';
import { TabBar } from './TabBar';

interface EditorAreaProps {
  projectState: ProjectState;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onContentChange: (fileId: string, newContent: string) => void;
}

export const EditorArea: React.FC<EditorAreaProps> = ({
  projectState,
  onSelectTab,
  onCloseTab,
  onContentChange,
}) => {
  const { nodes, activeTabId } = projectState;
  const activeFile = activeTabId ? nodes[activeTabId] : null;

  return (
    <div className="flex flex-col h-full w-full bg-gray-900 border-b border-gray-800 overflow-hidden">
      {/* Top Tab Bar */}
      <TabBar
        projectState={projectState}
        onSelectTab={onSelectTab}
        onCloseTab={onCloseTab}
      />

      {/* Monaco Editor Container */}
      <div className="flex-1 w-full h-full relative">
        {activeFile && activeFile.type === 'file' ? (
          <Editor
            key={activeFile.id}
            height="100%"
            path={activeFile.path}
            language={getLanguageFromPath(activeFile.name)}
            value={activeFile.content || ''}
            theme="vs-dark"
            onChange={(value) => {
              onContentChange(activeFile.id, value ?? '');
            }}
            options={{
              fontSize: 14,
              lineNumbers: 'on',
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              wordWrap: 'on',
              renderWhitespace: 'selection',
            }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 text-sm select-none">
            <p>Select a file from the explorer or create a new one to edit.</p>
          </div>
        )}
      </div>
    </div>
  );
};
