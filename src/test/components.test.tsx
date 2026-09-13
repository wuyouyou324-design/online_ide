import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Toolbar } from '../components/Toolbar';
import { FileExplorer } from '../components/FileExplorer';
import { ErrorBanner } from '../components/ErrorBanner';
import { createDefaultProject } from '../utils/defaultProject';

describe('ErrorBanner Component', () => {
  it('renders nothing when message is null', () => {
    const { container } = render(<ErrorBanner message={null} onDismiss={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders error message and dismisses on click', () => {
    const onDismiss = vi.fn();
    render(<ErrorBanner message="Test error message" onDismiss={onDismiss} />);
    expect(screen.getByText('Test error message')).toBeTruthy();

    const dismissBtn = screen.getByRole('button', { name: /dismiss error/i });
    fireEvent.click(dismissBtn);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});

describe('Toolbar Component', () => {
  it('renders project name and save status', () => {
    render(
      <Toolbar
        projectName="my-project"
        saveStatus="saved"
        saveError={null}
        onSave={() => {}}
        onResetDefaultProject={() => {}}
      />
    );
    expect(screen.getByText('my-project')).toBeTruthy();
    expect(screen.getByText('Saved')).toBeTruthy();
  });

  it('triggers onSave when save button clicked', () => {
    const onSave = vi.fn();
    render(
      <Toolbar
        projectName="my-project"
        saveStatus="unsaved"
        saveError={null}
        onSave={onSave}
        onResetDefaultProject={() => {}}
      />
    );
    const saveBtn = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveBtn);
    expect(onSave).toHaveBeenCalledTimes(1);
  });
});

describe('FileExplorer Component', () => {
  const project = createDefaultProject();

  it('renders default files in explorer tree', () => {
    render(
      <FileExplorer
        project={project}
        onSelectFile={() => {}}
        onCreateNode={() => {}}
        onRenameNode={() => {}}
        onDeleteNode={() => {}}
        onToggleFolder={() => {}}
      />
    );

    expect(screen.getByText('index.html')).toBeTruthy();
    expect(screen.getByText('style.css')).toBeTruthy();
    expect(screen.getByText('script.js')).toBeTruthy();
  });

  it('triggers onSelectFile when clicking a file', () => {
    const onSelectFile = vi.fn();
    render(
      <FileExplorer
        project={project}
        onSelectFile={onSelectFile}
        onCreateNode={() => {}}
        onRenameNode={() => {}}
        onDeleteNode={() => {}}
        onToggleFolder={() => {}}
      />
    );

    fireEvent.click(screen.getByText('style.css'));
    expect(onSelectFile).toHaveBeenCalledWith('file_style_css');
  });
});
