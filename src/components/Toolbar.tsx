import React from 'react';
import { Save, Check, RefreshCw, AlertCircle } from 'lucide-react';

interface ToolbarProps {
  pendingSave: boolean;
  lastSavedAt: number | null;
  onSave: () => void;
  onReset: () => void;
  error: string | null;
  onClearError: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  pendingSave,
  lastSavedAt,
  onSave,
  onReset,
  error,
  onClearError,
}) => {
  const formattedTime = lastSavedAt ? new Date(lastSavedAt).toLocaleTimeString() : 'Never';

  return (
    <header className="flex h-12 w-full items-center justify-between border-b border-gray-800 bg-gray-950 px-4 select-none">
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold tracking-wider text-blue-400 uppercase">
          Browser IDE V1
        </span>
        <span className="text-xs text-gray-500">|</span>
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          {pendingSave ? (
            <span className="flex items-center gap-1 text-amber-400 font-medium">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              Unsaved changes
            </span>
          ) : (
            <span className="flex items-center gap-1 text-emerald-400">
              <Check className="h-3.5 w-3.5" />
              Saved ({formattedTime})
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onSave}
          title="Save changes to LocalStorage (Ctrl+S)"
          className="flex items-center gap-1.5 rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50"
        >
          <Save className="h-3.5 w-3.5" />
          Save
        </button>

        <button
          onClick={() => {
            if (window.confirm('Reset project to initial starter template? All current changes will be erased.')) {
              onReset();
            }
          }}
          title="Reset project state"
          className="flex items-center gap-1.5 rounded border border-gray-700 bg-gray-900 px-3 py-1.5 text-xs font-medium text-gray-300 transition hover:bg-gray-800 hover:text-white"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Reset Project
        </button>
      </div>

      {error && (
        <div className="absolute top-14 right-4 z-50 flex items-center gap-2 rounded-lg border border-red-800 bg-red-950 p-3 text-xs text-red-200 shadow-xl max-w-md animate-fade-in">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
          <span className="flex-1">{error}</span>
          <button
            onClick={onClearError}
            className="rounded p-1 hover:bg-red-900 text-red-300"
            title="Dismiss error"
          >
            ✕
          </button>
        </div>
      )}
    </header>
  );
};
