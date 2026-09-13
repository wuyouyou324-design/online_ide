import React from 'react';
import { X, FileCode, FileText, FileJson } from 'lucide-react';
import type { FSNode, IDEProject } from '../types/ide';

interface TabBarProps {
  project: IDEProject;
  saveStatus: string;
  onSelectTab: (fileId: string) => void;
  onCloseTab: (fileId: string) => void;
}

export const TabBar: React.FC<TabBarProps> = ({
  project,
  saveStatus,
  onSelectTab,
  onCloseTab,
}) => {
  if (project.openTabIds.length === 0) {
    return <div className="ide-tab-bar empty" />;
  }

  const getFileIcon = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'html':
      case 'htm':
        return <FileCode size={14} className="file-icon html" />;
      case 'css':
        return <FileCode size={14} className="file-icon css" />;
      case 'js':
      case 'jsx':
      case 'ts':
      case 'tsx':
        return <FileCode size={14} className="file-icon js" />;
      case 'json':
        return <FileJson size={14} className="file-icon json" />;
      default:
        return <FileText size={14} className="file-icon default" />;
    }
  };

  return (
    <div className="ide-tab-bar">
      <div className="tab-scroll-container">
        {project.openTabIds.map((tabId) => {
          const file = project.nodes[tabId] as FSNode | undefined;
          if (!file) return null;

          const isActive = project.activeTabId === tabId;
          const isUnsaved = saveStatus === 'unsaved' && isActive;

          return (
            <div
              key={tabId}
              className={`ide-tab ${isActive ? 'active' : ''}`}
              onClick={() => onSelectTab(tabId)}
              title={file.name}
            >
              <span className="tab-icon">{getFileIcon(file.name)}</span>
              <span className="tab-title">{file.name}</span>

              {isUnsaved && <span className="tab-unsaved-dot" title="Unsaved changes" />}

              <button
                className="tab-close-btn"
                title="Close Tab"
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(tabId);
                }}
              >
                <X size={13} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
