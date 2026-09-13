import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ErrorBannerProps {
  message: string | null;
  onDismiss: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({ message, onDismiss }) => {
  if (!message) return null;

  return (
    <div className="ide-error-banner" role="alert">
      <div className="ide-error-content">
        <AlertCircle size={18} className="ide-error-icon" />
        <span>{message}</span>
      </div>
      <button className="ide-error-dismiss" onClick={onDismiss} aria-label="Dismiss error">
        <X size={16} />
      </button>
    </div>
  );
};
