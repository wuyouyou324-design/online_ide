import React from 'react';
import type { ProjectState } from '../types/filesystem';
import { Save, RotateCcw, Check, CircleAlert, Code2 } from 'lucide-react';

interface ToolbarProps {
  projectState: ProjectState;
  onSave: () => void;
  onResetProject: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  projectState,
  onSave,
  onResetProject,
}) => {
  return (
    <header className="h-12 bg-gray-950 border-b border-gray-800 flex items-center justify-between px-4 text-white">
      {/* Brand & Project Title */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 text-blue-500 font-bold text-base">
          <Code2 className="w-5 h-5" />
          <span>Online IDE V1</span>
        </div>
        <span className="text-gray-600">|</span>
        <span className="text-xs font-mono text-gray-400 bg-gray-900 px-2 py-1 rounded border border-gray-800">
          {projectState.rootId}
        </span>
      </div>

      {/* Persistence State & Action Buttons */}
      <div className="flex items-center space-x-4 text-xs">
        {/* Persistence Status */}
        <div className="flex items-center space-x-1.5">
          {projectState.isPendingSave ? (
            <span className="inline-flex items-center text-amber-400 space-x-1 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
              <CircleAlert className="w-3.5 h-3.5 animate-pulse" />
              <span>Unsaved changes</span>
            </span>
          ) : (
            <span className="inline-flex items-center text-emerald-400 space-x-1 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20">
              <Check className="w-3.5 h-3.5" />
              <span>Saved</span>
            </span>
          )}
        </div>

        {/* Save Button */}
        <button
          type="button"
          onClick={onSave}
          title="Save project (Ctrl+S)"
          className="flex items-center space-x-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium transition-colors cursor-pointer"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save</span>
        </button>

        {/* Reset Project Button */}
        <button
          type="button"
          onClick={() => {
            if (window.confirm('Reset project to default starter template? All changes will be cleared.')) {
              onResetProject();
            }
          }}
          title="Reset to default starter project"
          className="flex items-center space-x-1 px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded font-medium transition-colors border border-gray-700 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>
    </header>
  );
};
