import React from 'react';
import { Save, CheckCircle, AlertTriangle, RefreshCw, Code2 } from 'lucide-react';
import type { SaveStatus } from '../types/ide';

interface ToolbarProps {
  projectName: string;
  saveStatus: SaveStatus;
  saveError: string | null;
  onSave: () => void;
  onResetDefaultProject: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  projectName,
  saveStatus,
  saveError,
  onSave,
  onResetDefaultProject,
}) => {
  return (
    <header className="ide-toolbar">
      <div className="ide-toolbar-left">
        <Code2 className="ide-logo-icon" size={22} />
        <h1 className="ide-title">{projectName}</h1>
      </div>

      <div className="ide-toolbar-right">
        <div className="ide-status-indicator" title={saveError || undefined}>
          {saveStatus === 'saved' && (
            <span className="status-badge saved">
              <CheckCircle size={14} /> Saved
            </span>
          )}
          {saveStatus === 'unsaved' && (
            <span className="status-badge unsaved">
              <span className="dot" /> Unsaved changes
            </span>
          )}
          {saveStatus === 'saving' && (
            <span className="status-badge saving">
              <RefreshCw size={14} className="spin" /> Saving...
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="status-badge error" title={saveError || 'Save failed'}>
              <AlertTriangle size={14} /> Save Error
            </span>
          )}
        </div>

        <button
          className="ide-btn ide-btn-primary"
          onClick={onSave}
          title="Save changes (Ctrl+S / Cmd+S)"
        >
          <Save size={16} /> Save
        </button>

        <button
          className="ide-btn ide-btn-secondary"
          onClick={() => {
            if (window.confirm('Reset project to default starter template? All local changes will be lost.')) {
              onResetDefaultProject();
            }
          }}
          title="Reset to starter files"
        >
          <RefreshCw size={15} /> Reset Project
        </button>
      </div>
    </header>
  );
};
