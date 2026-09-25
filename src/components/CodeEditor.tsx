import React from 'react';
import Editor from '@monaco-editor/react';
import { getLanguageForFile } from '../utils/preview';

interface CodeEditorProps {
  activeFilePath: string | null;
  content: string;
  onChangeContent: (newContent: string) => void;
  onSaveShortcut?: () => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  activeFilePath,
  content,
  onChangeContent,
  onSaveShortcut,
}) => {
  if (!activeFilePath) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gray-900 text-gray-500 text-xs">
        Select or create a file to start editing
      </div>
    );
  }

  const language = getLanguageForFile(activeFilePath);

  return (
    <div className="h-full w-full bg-gray-900">
      <Editor
        height="100%"
        path={activeFilePath}
        language={language}
        theme="vs-dark"
        value={content}
        onChange={(val) => onChangeContent(val || '')}
        onMount={(editor, monaco) => {
          if (onSaveShortcut) {
            editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
              onSaveShortcut();
            });
          }
        }}
        options={{
          fontSize: 13,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          lineNumbers: 'on',
          wordWrap: 'on',
        }}
      />
    </div>
  );
};
