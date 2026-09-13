import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TabBar } from '../components/TabBar';
import { createDefaultProject } from '../utils/defaultProject';

describe('TabBar Component', () => {
  const project = createDefaultProject();

  it('renders open tabs', () => {
    render(
      <TabBar
        project={project}
        saveStatus="saved"
        onSelectTab={() => {}}
        onCloseTab={() => {}}
      />
    );

    expect(screen.getByText('index.html')).toBeTruthy();
  });

  it('calls onCloseTab when close button clicked', () => {
    const onCloseTab = vi.fn();
    render(
      <TabBar
        project={project}
        saveStatus="saved"
        onSelectTab={() => {}}
        onCloseTab={onCloseTab}
      />
    );

    const closeBtn = screen.getByRole('button', { name: /close tab/i });
    fireEvent.click(closeBtn);
    expect(onCloseTab).toHaveBeenCalledWith('file_index_html');
  });
});
