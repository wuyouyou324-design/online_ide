import React from 'react';
import { Save, RefreshCw, Check, AlertCircle } from 'lucide-react';

interface ToolbarProps {
  hasPendingSave: boolean;
  saveStatus: 'saved' | 'saving' | 'error';
  saveError: string | null;
  onSaveNow: () => void;
  onResetProject: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  hasPendingSave,
  saveStatus,
  saveError,
  onSaveNow,
  onResetProject,
}) => {
  const handleResetConfirm = () => {
    if (window.confirm('Reset project to default starter template? All unsaved/saved custom files will be restored to initial state.')) {
      onResetProject();
    }
  };

  return (
    <div className="h-12 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4 text-sm text-gray-200 select-none">
      <div className="flex items-center space-x-3">
        <span className="font-bold text-blue-400 tracking-wide text-base">Online IDE</span>
        <span className="text-xs px-2 py-0.5 bg-gray-700 rounded text-gray-400">V1</span>
      </div>

      <div className="flex items-center space-x-4">
        {/* Persistence Status Indicator */}
        <div className="flex items-center space-x-2 text-xs">
          {saveStatus === 'saving' && (
            <span className="flex items-center text-yellow-400">
              <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" />
              Saving...
            </span>
          )}
          {saveStatus === 'saved' && hasPendingSave && (
            <span className="flex items-center text-yellow-400">
              <span className="w-2 h-2 rounded-full bg-yellow-400 mr-1.5 animate-pulse" />
              Unsaved changes
            </span>
          )}
          {saveStatus === 'saved' && !hasPendingSave && (
            <span className="flex items-center text-green-400">
              <Check className="w-3.5 h-3.5 mr-1" />
              Saved
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="flex items-center text-red-400" title={saveError || 'Save failed'}>
              <AlertCircle className="w-3.5 h-3.5 mr-1" />
              Save Error
            </span>
          )}
        </div>

        <button
          onClick={onSaveNow}
          className="flex items-center space-x-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium text-xs transition-colors focus:outline-none"
          title="Save Project (Ctrl+S / Cmd+S)"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save</span>
        </button>

        <button
          onClick={handleResetConfirm}
          className="flex items-center space-x-1 px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-xs transition-colors focus:outline-none"
          title="Reset to starter project"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>
    </div>
  );
};
