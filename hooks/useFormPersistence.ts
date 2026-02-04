
// FIX: Import `useRef` from 'react' to fix 'Cannot find name' error.
import { useState, useEffect, useCallback, useRef } from 'react';

export const useFormPersistence = <T extends {}>(key: string, initialValue: T, autoSaveInterval = 5000) => {
    const [value, setValue] = useState<T>(() => {
        try {
            const saved = localStorage.getItem(key);
            return saved ? JSON.parse(saved) : initialValue;
        } catch (error) {
            console.error('Failed to parse saved form data on initial load');
            return initialValue;
        }
    });
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const initialValueRef = useRef(JSON.stringify(initialValue));

    // Auto-save effect
    useEffect(() => {
        const handler = setTimeout(() => {
            // Only save if there are actual changes from the initial state or last saved state
            if (JSON.stringify(value) !== localStorage.getItem(key)) {
                setIsSaving(true);
                try {
                    localStorage.setItem(key, JSON.stringify(value));
                    setLastSaved(new Date());
                } catch (error) {
                    console.error("Could not save form to localStorage:", error);
                } finally {
                    setTimeout(() => setIsSaving(false), 300); // UI feedback delay
                }
            }
        }, autoSaveInterval);

        return () => clearTimeout(handler);
    }, [value, key, autoSaveInterval]);

    const clearSaved = useCallback(() => {
        try {
            localStorage.removeItem(key);
            setLastSaved(null);
        } catch (error) {
            console.error("Could not clear saved form from localStorage:", error);
        }
    }, [key]);

    return {
        value,
        setValue,
        lastSaved,
        isSaving,
        clearSaved
    };
};
