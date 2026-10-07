import React from 'react';
import { X, FileCode } from 'lucide-react';
import { getFileName } from '../utils/filesystem';

interface TabsBarProps {
  openFilePaths: string[];
  activeFilePath: string | null;
  onSelectTab: (path: string) => void;
  onCloseTab: (path: string) => void;
}

export const TabsBar: React.FC<TabsBarProps> = ({
  openFilePaths,
  activeFilePath,
  onSelectTab,
  onCloseTab,
}) => {
  if (openFilePaths.length === 0) {
    return (
      <div className="flex h-9 w-full items-center border-b border-gray-800 bg-gray-950 px-4 text-xs text-gray-500 select-none">
        No open tabs
      </div>
    );
  }

  return (
    <div className="flex h-9 w-full items-center border-b border-gray-800 bg-gray-950 overflow-x-auto select-none no-scrollbar">
      {openFilePaths.map((filePath) => {
        const isActive = filePath === activeFilePath;
        const fileName = getFileName(filePath);

        return (
          <div
            key={filePath}
            onClick={() => onSelectTab(filePath)}
            className={`group flex h-full items-center gap-2 border-r border-gray-800 px-3 text-xs cursor-pointer transition ${
              isActive
                ? 'bg-gray-900 font-medium text-white border-t-2 border-t-blue-500'
                : 'bg-gray-950 text-gray-400 hover:bg-gray-900/50 hover:text-gray-200'
            }`}
          >
            <FileCode className="h-3.5 w-3.5 shrink-0 text-blue-400" />
            <span className="truncate max-w-[140px]" title={filePath}>
              {fileName}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCloseTab(filePath);
              }}
              className="rounded p-0.5 text-gray-500 opacity-80 group-hover:opacity-100 hover:bg-gray-800 hover:text-white"
              title="Close tab"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
