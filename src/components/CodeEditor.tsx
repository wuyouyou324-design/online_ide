import React from 'react';
import Editor, { OnChange } from '@monaco-editor/react';
import { FileNode } from '../types/filesystem';

interface CodeEditorProps {
  activeFile: FileNode | null;
  onContentChange: (fileId: string, newContent: string) => void;
}

/**
 * Maps file extension or name to Monaco editor language.
 */
export function getLanguageForFileName(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'html':
    case 'htm':
      return 'html';
    case 'css':
      return 'css';
    case 'js':
    case 'jsx':
    case 'mjs':
      return 'javascript';
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'json':
      return 'json';
    default:
      return 'plaintext';
  }
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  activeFile,
  onContentChange,
}) => {
  if (!activeFile) {
    return (
      <div className="flex-1 bg-gray-900 flex items-center justify-center text-gray-500 text-sm select-none">
        Select or open a file from the explorer
      </div>
    );
  }

  const language = getLanguageForFileName(activeFile.name);

  const handleEditorChange: OnChange = (value) => {
    onContentChange(activeFile.id, value ?? '');
  };

  return (
    <div className="flex-1 w-full h-full relative bg-gray-900">
      <Editor
        height="100%"
        theme="vs-dark"
        language={language}
        value={activeFile.content ?? ''}
        onChange={handleEditorChange}
        options={{
          minimap: { enabled: false },
          fontSize: 13,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: 'on',
          padding: { top: 8, bottom: 8 },
        }}
      />
    </div>
  );
};
