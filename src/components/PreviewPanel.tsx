import React, { useEffect, useState, useRef } from 'react';
import type { ProjectState } from '../types/filesystem';
import { buildPreviewDocument, revokeBlobUrls } from '../utils/preview';
import { Eye, RefreshCw, AlertCircle } from 'lucide-react';

interface PreviewPanelProps {
  projectState: ProjectState;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({ projectState }) => {
  const [srcDoc, setSrcDoc] = useState<string>('');
  const [previewError, setPreviewError] = useState<string | null>(null);
  const activeBlobUrlsRef = useRef<string[]>([]);

  const updatePreview = () => {
    // Revoke old blob URLs
    if (activeBlobUrlsRef.current.length > 0) {
      revokeBlobUrls(activeBlobUrlsRef.current);
      activeBlobUrlsRef.current = [];
    }

    const { html, blobUrls, error } = buildPreviewDocument(projectState);
    activeBlobUrlsRef.current = blobUrls;
    setSrcDoc(html);
    setPreviewError(error);
  };

  useEffect(() => {
    updatePreview();

    return () => {
      if (activeBlobUrlsRef.current.length > 0) {
        revokeBlobUrls(activeBlobUrlsRef.current);
      }
    };
  }, [projectState.nodes]);

  return (
    <div className="flex flex-col h-full w-full bg-gray-950 text-gray-200 overflow-hidden">
      {/* Header Panel Toolbar */}
      <div className="h-9 bg-gray-950 border-b border-gray-800 flex items-center justify-between px-3 select-none">
        <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
          <Eye className="w-3.5 h-3.5 text-blue-400" />
          <span>Preview (index.html)</span>
        </div>

        <div className="flex items-center space-x-2">
          {previewError && (
            <div className="flex items-center space-x-1 text-xs text-red-400 bg-red-950/50 px-2 py-0.5 rounded border border-red-800">
              <AlertCircle className="w-3 h-3" />
              <span className="truncate max-w-[200px]">{previewError}</span>
            </div>
          )}
          <button
            type="button"
            title="Refresh preview"
            onClick={updatePreview}
            className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Sandboxed Iframe Preview */}
      <div className="flex-1 w-full h-full bg-white relative">
        <iframe
          title="HTML Preview"
          srcDoc={srcDoc}
          sandbox="allow-scripts allow-modals allow-forms"
          className="w-full h-full border-none bg-white"
        />
      </div>
    </div>
  );
};
