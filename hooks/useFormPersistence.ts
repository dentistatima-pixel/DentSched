
import { useState, useEffect, useRef, useCallback, Dispatch, SetStateAction } from 'react';
import { useToast } from '../components/ToastSystem';
import { useModal } from '../contexts/ModalContext';

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
  const { showModal } = useModal();
  const saveTimeoutRef = useRef<number | null>(null);
  const initialDataRef = useRef<string>(JSON.stringify(data));
  const hasLoadedDraft = useRef(false);

  // 1. Restore from sessionStorage on initial load, respecting initialData
  useEffect(() => {
    if (isReadOnly || hasLoadedDraft.current) return;
    hasLoadedDraft.current = true;

    // If initialData is provided (i.e., we are editing an existing record),
    // do not attempt to restore a draft from sessionStorage.
    if (initialData) {
        return;
    }

    const savedDataString = sessionStorage.getItem(formId);
    if (savedDataString) {
      const savedData = JSON.parse(savedDataString);
      const isDifferent = JSON.stringify(savedData) !== initialDataRef.current;
      
      if (isDifferent) {
        showModal('confirm', {
            title: 'Restore Draft',
            message: "We found an unsaved draft from a previous session. Would you like to restore it?",
            confirmText: 'Restore',
            isDestructive: false,
            onConfirm: () => {
                setStatus('restoring');
                setData(savedData);
                toast.info("Draft restored successfully.");
                setStatus('saved');
            },
            onCancel: () => {
                // If user declines, clear the saved draft
                sessionStorage.removeItem(formId);
            }
        });
      }
    }
  }, [formId, setData, isReadOnly, toast, initialData, showModal]);

  // 2. Debounced save to sessionStorage on data change
  useEffect(() => {
    if (isReadOnly || status === 'restoring') return;
    
    const isInitial = JSON.stringify(data) === initialDataRef.current;
    if (!isInitial && status !== 'unsaved') {
        setStatus('unsaved');
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = window.setTimeout(() => {
      if (!isInitial) {
        setStatus('saving');
        sessionStorage.setItem(formId, JSON.stringify(data));
        setTimeout(() => setStatus('saved'), 500);
      }
    }, 2000); // 2-second debounce

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [data, formId, isReadOnly]);

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
    sessionStorage.removeItem(formId);
    setStatus('saved');
    toast.success("Form submitted and draft cleared.");
  }, [formId, toast]);

  return { formStatus: status, clearSavedDraft };
};
