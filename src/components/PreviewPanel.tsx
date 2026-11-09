import React, { useMemo, useEffect, useRef } from 'react';
import { FSItem } from '../types/ide';
import { generatePreviewHtml } from '../utils/preview';
import { Play } from 'lucide-react';

interface PreviewPanelProps {
  items: Record<string, FSItem>;
  entryPath?: string;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({
  items,
  entryPath = '/index.html',
}) => {
  const preview = useMemo(
    () => generatePreviewHtml(items, entryPath),
    [items, entryPath]
  );

  const prevBlobUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    // Revoke previous blob URLs when a new preview is generated
    const oldUrls = prevBlobUrlsRef.current;
    if (typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
      oldUrls.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch {
          // Ignore revocation errors
        }
      });
    }
    prevBlobUrlsRef.current = preview.blobUrls;
  }, [preview.blobUrls]);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
        prevBlobUrlsRef.current.forEach((url) => {
          try {
            URL.revokeObjectURL(url);
          } catch {
            // Ignore revocation errors
          }
        });
      }
    };
  }, []);

  return (
    <div className="flex h-full w-full flex-col border-t border-gray-800 bg-gray-950">
      <div className="flex h-8 w-full items-center justify-between border-b border-gray-800 bg-gray-950 px-3 select-none">
        <div className="flex items-center gap-2">
          <Play className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-xs font-semibold text-gray-300">HTML Preview</span>
          <span className="rounded bg-gray-800 px-1.5 py-0.5 text-[10px] text-gray-400">
            {entryPath}
          </span>
        </div>
      </div>

      <div className="relative flex-1 w-full bg-white">
        <iframe
          title="HTML Preview"
          srcDoc={preview.html}
          sandbox="allow-scripts allow-modals"
          className="h-full w-full border-none"
        />
      </div>
    </div>
  );
};
