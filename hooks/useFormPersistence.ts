
import { useState, useEffect, useRef, useCallback, Dispatch, SetStateAction } from 'react';
import { useToast } from '../components/ToastSystem';

type FormStatus = 'unsaved' | 'saving' | 'saved' | 'restoring';

export const useFormPersistence = <T extends object>(
  formId: string,
  data: T,
  setData: Dispatch<SetStateAction<T>>,
  isReadOnly: boolean = false,
  initialData?: T | null
) => {
  const [status, setStatus] = useState<FormStatus>('saved');
  const toast = useToast();
  const saveTimeoutRef = useRef<number | null>(null);
  const initialDataRef = useRef<string>(JSON.stringify(data));
  const hasLoadedDraft = useRef(false);

  // 1. Restore from localStorage on initial load, respecting initialData
  useEffect(() => {
    if (isReadOnly || hasLoadedDraft.current) return;
    hasLoadedDraft.current = true;

    // If initialData is provided (i.e., we are editing an existing record),
    // do not attempt to restore a draft from localStorage.
    if (initialData) {
        return;
    }

    const savedDataString = localStorage.getItem(formId);
    if (savedDataString) {
      const savedData = JSON.parse(savedDataString);
      const isDifferent = JSON.stringify(savedData) !== initialDataRef.current;
      
      if (isDifferent && window.confirm("We found an unsaved draft from a previous session. Would you like to restore it?")) {
        setStatus('restoring');
        setData(savedData);
        toast.info("Draft restored successfully.");
        setStatus('saved');
      } else {
        // If user declines, clear the saved draft
        localStorage.removeItem(formId);
      }
    }
  }, [formId, setData, isReadOnly, toast, initialData]);

  // 2. Debounced save to localStorage on data change
  useEffect(() => {
    if (isReadOnly || status === 'restoring') return;
    
    const isInitial = JSON.stringify(data) === initialDataRef.current;
    if (!isInitial) {
        setStatus('unsaved');
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = window.setTimeout(() => {
      if (!isInitial) {
        setStatus('saving');
        localStorage.setItem(formId, JSON.stringify(data));
        setTimeout(() => setStatus('saved'), 500);
      }
    }, 2000); // 2-second debounce

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [data, formId, isReadOnly, status]);

  // 3. Warn on leaving the page with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (status === 'unsaved' || status === 'saving') {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [status]);

  // Public method to clear the saved draft, e.g., on successful submission
  const clearSavedDraft = useCallback(() => {
    localStorage.removeItem(formId);
    setStatus('saved');
    toast.success("Form submitted and draft cleared.");
  }, [formId, toast]);

  return { formStatus: status, clearSavedDraft };
};
