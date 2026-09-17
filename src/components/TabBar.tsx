import React from 'react';
import type { ProjectState } from '../types/filesystem';
import { X, FileCode, FileText } from 'lucide-react';

interface TabBarProps {
  projectState: ProjectState;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
}

export const TabBar: React.FC<TabBarProps> = ({
  projectState,
  onSelectTab,
  onCloseTab,
}) => {
  const { nodes, openTabs, activeTabId } = projectState;

  if (openTabs.length === 0) {
    return (
      <div className="h-10 bg-gray-950 border-b border-gray-800 flex items-center px-4 text-xs text-gray-500 italic select-none">
        No files open
      </div>
    );
  }

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'html':
      case 'css':
      case 'js':
      case 'ts':
      case 'json':
        return <FileCode className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-gray-400 shrink-0" />;
    }
  };

  return (
    <div className="h-10 bg-gray-950 border-b border-gray-800 flex items-center overflow-x-auto select-none no-scrollbar">
      {openTabs.map((tabId) => {
        const fileNode = nodes[tabId];
        if (!fileNode) return null;

        const isActive = tabId === activeTabId;

        return (
          <div
            key={tabId}
            data-testid={`tab-${fileNode.name}`}
            onClick={() => onSelectTab(tabId)}
            className={`group flex items-center space-x-2 px-3.5 h-full text-xs cursor-pointer border-r border-gray-800 transition-colors shrink-0 max-w-[200px] ${
              isActive
                ? 'bg-gray-900 text-blue-400 font-medium border-t-2 border-t-blue-500'
                : 'bg-gray-950 text-gray-400 hover:bg-gray-900 hover:text-gray-200'
            }`}
          >
            {getFileIcon(fileNode.name)}
            <span className="truncate">{fileNode.name}</span>

            {/* Tab Close Button */}
            <button
              type="button"
              title="Close tab"
              onClick={(e) => {
                e.stopPropagation();
                onCloseTab(tabId);
              }}
              className="p-0.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
