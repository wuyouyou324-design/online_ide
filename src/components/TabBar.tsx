import React from 'react';
import { X, FileCode } from 'lucide-react';
import { FileNode } from '../types/filesystem';
import { ProjectAction } from '../state/projectReducer';

interface TabBarProps {
  files: Record<string, FileNode>;
  openTabIds: string[];
  activeTabId: string | null;
  dispatch: React.Dispatch<ProjectAction>;
}

export const TabBar: React.FC<TabBarProps> = ({
  files,
  openTabIds,
  activeTabId,
  dispatch,
}) => {
  if (openTabIds.length === 0) {
    return (
      <div className="h-9 bg-gray-950 border-b border-gray-800 flex items-center px-4 text-xs text-gray-500 italic">
        No open tabs
      </div>
    );
  }

  return (
    <div className="h-9 bg-gray-950 border-b border-gray-800 flex items-center overflow-x-auto select-none no-scrollbar">
      {openTabIds.map((id) => {
        const file = files[id];
        if (!file) return null;

        const isActive = activeTabId === id;

        return (
          <div
            key={id}
            onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', id })}
            className={`group flex items-center space-x-2 px-3 py-1.5 border-r border-gray-800 text-xs cursor-pointer min-w-[120px] max-w-[200px] transition-colors ${
              isActive
                ? 'bg-gray-900 text-white border-t-2 border-t-blue-500 font-medium'
                : 'bg-gray-950 text-gray-400 hover:bg-gray-900/60 hover:text-gray-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="truncate flex-1">{file.name}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                dispatch({ type: 'CLOSE_TAB', id });
              }}
              className={`p-0.5 rounded hover:bg-gray-700 hover:text-white transition-opacity ${
                isActive ? 'opacity-100 text-gray-300' : 'opacity-0 group-hover:opacity-100 text-gray-500'
              }`}
              title="Close Tab"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
