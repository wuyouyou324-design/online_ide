import React, { useMemo, useEffect, useRef } from 'react';
import { FSItem } from '../types/ide';
import { generatePreviewHtml } from '../utils/preview';
import { Play } from 'lucide-react';

interface PreviewPanelProps {
  items: Record<string, FSItem>;
  entryPath?: string;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({ items, entryPath = '/index.html' }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const preview = useMemo(() => {
    return generatePreviewHtml(items, entryPath);
  }, [items, entryPath]);

  // Clean up Blob URLs when preview updates or unmounts
  useEffect(() => {
    return () => {
      preview.blobUrls.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch (e) {
          // ignore
        }
      });
    };
  }, [preview]);

  return (
    <div className="flex h-full w-full flex-col border-t border-gray-800 bg-gray-950">
      <div className="flex h-8 w-full items-center justify-between border-b border-gray-800 bg-gray-950 px-3 select-none">
        <div className="flex items-center gap-2">
          <Play className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-xs font-semibold text-gray-300">HTML Preview</span>
          <span className="text-[10px] rounded bg-gray-800 px-1.5 py-0.5 text-gray-400">
            {entryPath}
          </span>
        </div>
      </div>

      <div className="flex-1 w-full bg-white relative">
        <iframe
          ref={iframeRef}
          title="HTML Preview"
          srcDoc={preview.html}
          sandbox="allow-scripts allow-modals"
          className="h-full w-full border-none"
        />
      </div>
    </div>
  );
};
