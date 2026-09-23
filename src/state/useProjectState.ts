import { useEffect, useRef, useState, useCallback, useReducer } from 'react';
import { ProjectState, INITIAL_PROJECT_STATE } from '../types/filesystem';
import { projectReducer, ProjectAction } from './projectReducer';
import { loadProjectStateFromStorage, saveProjectStateToStorage } from '../services/storage';

export interface UseProjectReturn {
  state: ProjectState;
  dispatch: React.Dispatch<ProjectAction>;
  hasPendingSave: boolean;
  saveStatus: 'saved' | 'saving' | 'error';
  saveError: string | null;
  saveNow: () => void;
  resetProject: () => void;
}

const DEBOUNCE_DELAY_MS = 500;

export function useProjectState(): UseProjectReturn {
  // Initialize state from localStorage or initial state
  const [state, dispatch] = useReducer(
    projectReducer,
    INITIAL_PROJECT_STATE,
    () => loadProjectStateFromStorage().state
  );

  const [hasPendingSave, setHasPendingSave] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [saveError, setSaveError] = useState<string | null>(null);

  const isInitialMount = useRef(true);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const executeSave = useCallback((stateToSave: ProjectState) => {
    setSaveStatus('saving');
    const result = saveProjectStateToStorage(stateToSave);
    if (result.success) {
      setHasPendingSave(false);
      setSaveStatus('saved');
      setSaveError(null);
    } else {
      setSaveStatus('error');
      setSaveError(result.error || 'Failed to save project');
    }
  }, []);

  const saveNow = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    executeSave(state);
  }, [executeSave, state]);

  const resetProject = useCallback(() => {
    dispatch({ type: 'SET_PROJECT', state: INITIAL_PROJECT_STATE });
    executeSave(INITIAL_PROJECT_STATE);
  }, [executeSave]);

  // Handle state change auto-save with debounce
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    setHasPendingSave(true);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      executeSave(state);
    }, DEBOUNCE_DELAY_MS);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [state, executeSave]);

  // Handle Ctrl+S / Cmd+S shortcut for immediate save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveNow();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [saveNow]);

  return {
    state,
    dispatch,
    hasPendingSave,
    saveStatus,
    saveError,
    saveNow,
    resetProject,
  };
}
