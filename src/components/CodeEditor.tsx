import React from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import type { FSNode } from '../types/ide';

interface CodeEditorProps {
  activeFile: FSNode | null;
  onChangeContent: (content: string) => void;
  onSave: () => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  activeFile,
  onChangeContent,
  onSave,
}) => {
  const getLanguage = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'html':
      case 'htm':
        return 'html';
      case 'css':
        return 'css';
      case 'js':
      case 'jsx':
        return 'javascript';
      case 'ts':
      case 'tsx':
        return 'typescript';
      case 'json':
        return 'json';
      case 'md':
        return 'markdown';
      default:
        return 'plaintext';
    }
  };

  const handleEditorMount: OnMount = (editor, monaco) => {
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      onSave();
    });
  };

  if (!activeFile) {
    return (
      <div className="ide-editor-empty">
        <p>No file selected</p>
        <p className="subtext">Select or create a file from the explorer to begin editing.</p>
      </div>
    );
  }

  return (
    <div className="ide-editor-container">
      <Editor
        height="100%"
        language={getLanguage(activeFile.name)}
        value={activeFile.content || ''}
        theme="vs-dark"
        onChange={(value) => onChangeContent(value || '')}
        onMount={handleEditorMount}
        options={{
          fontSize: 14,
          lineNumbers: 'on',
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: 'on',
        }}
      />
    </div>
  );
};
