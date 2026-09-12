import { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';

const STORAGE_KEY = 'python_editor_code';
const INITIAL_CODE = 'print("Hello, world!")';

export default function App() {
  const [code, setCode] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved !== null ? saved : INITIAL_CODE;
    } catch {
      return INITIAL_CODE;
    }
  });

  const [saveStatus, setSaveStatus] = useState<'Saved' | 'Saving...' | 'Save failed'>('Saved');
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    setSaveStatus('Saving...');
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, code);
        setSaveStatus('Saved');
      } catch {
        setSaveStatus('Save failed');
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [code]);

  const handleEditorChange = (value: string | undefined) => {
    setCode(value ?? '');
  };

  return (
    <div className="editor-container">
      <header className="editor-header">
        <h1 className="title">Python Editor</h1>
        <span className="filename">main.py</span>
      </header>

      <main className="editor-body">
        <Editor
          height="100%"
          defaultLanguage="python"
          language="python"
          theme="vs-dark"
          value={code}
          onChange={handleEditorChange}
          options={{
            fontSize: 14,
            lineNumbers: 'on',
            minimap: { enabled: false },
            automaticLayout: true,
            scrollBeyondLastLine: false,
          }}
        />
      </main>

      <footer className={`editor-footer ${saveStatus === 'Save failed' ? 'error' : ''}`}>
        <span data-testid="save-status">{saveStatus}</span>
      </footer>
    </div>
  );
}
