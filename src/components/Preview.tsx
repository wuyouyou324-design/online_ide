import React, { useEffect, useRef, useState } from 'react';
import { Play, RefreshCw } from 'lucide-react';
import type { IDEProject } from '../types/ide';

interface PreviewProps {
  project: IDEProject;
}

export function generatePreviewHtml(project: IDEProject): { html: string; createdUrls: string[] } {
  const createdUrls: string[] = [];
  const indexNode = Object.values(project.nodes).find(
    (n) => n.parentId === null && n.name.toLowerCase() === 'index.html' && n.type === 'file'
  );

  if (!indexNode || !indexNode.content) {
    return {
      html: `<!DOCTYPE html><html><body style="font-family: sans-serif; padding: 20px; color: #888;">No index.html found at project root.</body></html>`,
      createdUrls,
    };
  }

  let htmlContent = indexNode.content;

  // Replace relative CSS links
  htmlContent = htmlContent.replace(
    /<link\s+[^>]*href=["']([^"']+)["'][^>]*>/gi,
    (match, href) => {
      if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//')) {
        return match;
      }
      const fileNode = Object.values(project.nodes).find(
        (n) => n.name === href && n.type === 'file'
      );
      if (fileNode && fileNode.content !== undefined) {
        const blob = new Blob([fileNode.content], { type: 'text/css' });
        const blobUrl = URL.createObjectURL(blob);
        createdUrls.push(blobUrl);
        return match.replace(href, blobUrl);
      }
      return match;
    }
  );

  // Replace relative JS script tags
  htmlContent = htmlContent.replace(
    /<script\s+[^>]*src=["']([^"']+)["'][^>]*>\s*<\/script>/gi,
    (match, src) => {
      if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('//')) {
        return match;
      }
      const fileNode = Object.values(project.nodes).find(
        (n) => n.name === src && n.type === 'file'
      );
      if (fileNode && fileNode.content !== undefined) {
        const blob = new Blob([fileNode.content], { type: 'text/javascript' });
        const blobUrl = URL.createObjectURL(blob);
        createdUrls.push(blobUrl);
        return match.replace(src, blobUrl);
      }
      return match;
    }
  );

  return { html: htmlContent, createdUrls };
}

export const Preview: React.FC<PreviewProps> = ({ project }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const activeBlobUrlsRef = useRef<string[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const cleanupBlobUrls = () => {
    activeBlobUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    activeBlobUrlsRef.current = [];
  };

  const updatePreview = () => {
    cleanupBlobUrls();

    const { html, createdUrls } = generatePreviewHtml(project);
    activeBlobUrlsRef.current = createdUrls;

    if (iframeRef.current) {
      const doc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(html);
        doc.close();
      }
    }
  };

  useEffect(() => {
    updatePreview();
    return () => {
      cleanupBlobUrls();
    };
  }, [project, refreshKey]);

  const handleManualRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="ide-preview-panel">
      <div className="preview-toolbar">
        <div className="preview-title">
          <Play size={14} className="preview-icon" />
          <span>HTML Preview</span>
        </div>
        <div className="preview-actions">
          <button className="icon-btn" title="Refresh Preview" onClick={handleManualRefresh}>
            <RefreshCw size={14} />
          </button>
        </div>
      </div>
      <div className="preview-frame-container">
        <iframe
          ref={iframeRef}
          title="HTML Preview"
          sandbox="allow-scripts allow-modals allow-same-origin"
          className="preview-iframe"
        />
      </div>
    </div>
  );
};
