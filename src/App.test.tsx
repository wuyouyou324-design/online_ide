import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import App from './App';

// Mock Monaco Editor for React testing environment
vi.mock('@monaco-editor/react', () => ({
  default: ({ value, onChange, language, theme }: any) => (
    <div data-testid="monaco-editor-container" data-language={language} data-theme={theme}>
      <textarea
        data-testid="monaco-textarea"
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
      />
    </div>
  ),
}));

describe('Minimal Python Editor', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the application header and file name', () => {
    render(<App />);
    expect(screen.getByText('Python Editor')).toBeInTheDocument();
    expect(screen.getByText('main.py')).toBeInTheDocument();
  });

  it('renders the Monaco/editor container', () => {
    render(<App />);
    const editorContainer = screen.getByTestId('monaco-editor-container');
    expect(editorContainer).toBeInTheDocument();
    expect(editorContainer).toHaveAttribute('data-language', 'python');
    expect(editorContainer).toHaveAttribute('data-theme', 'vs-dark');
  });

  it('presents initial Python code', () => {
    render(<App />);
    const textarea = screen.getByTestId('monaco-textarea') as HTMLTextAreaElement;
    expect(textarea.value).toBe('print("Hello, world!")');
  });

  it('updates application state when editing code', () => {
    render(<App />);
    const textarea = screen.getByTestId('monaco-textarea');
    fireEvent.change(textarea, { target: { value: 'print("Updated code")' } });
    expect(textarea).toHaveValue('print("Updated code")');
  });

  it('saves code to localStorage and shows status changes', async () => {
    render(<App />);
    const textarea = screen.getByTestId('monaco-textarea');

    expect(screen.getByTestId('save-status')).toHaveTextContent('Saved');

    fireEvent.change(textarea, { target: { value: 'x = 42\nprint(x)' } });
    expect(screen.getByTestId('save-status')).toHaveTextContent('Saving...');

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(screen.getByTestId('save-status')).toHaveTextContent('Saved');
    expect(localStorage.getItem('python_editor_code')).toBe('x = 42\nprint(x)');
  });

  it('restores code from localStorage on load', () => {
    localStorage.setItem('python_editor_code', 'def foo():\n    return "bar"');
    render(<App />);
    const textarea = screen.getByTestId('monaco-textarea') as HTMLTextAreaElement;
    expect(textarea.value).toBe('def foo():\n    return "bar"');
  });

  it('displays error status if saving to localStorage fails', () => {
    render(<App />);
    const textarea = screen.getByTestId('monaco-textarea');

    vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
      throw new Error('QuotaExceededError');
    });

    fireEvent.change(textarea, { target: { value: 'failing code' } });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(screen.getByTestId('save-status')).toHaveTextContent('Save failed');
  });
});
