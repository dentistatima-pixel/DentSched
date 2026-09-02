
import { useState, useEffect } from 'react';

export const useSearchPersistence = (key: string, initialValue: string = '') => {
  const [searchTerm, setSearchTerm] = useState(() => {
    const saved = sessionStorage.getItem(`search_${key}`);
    return saved !== null ? saved : initialValue;
  });

  useEffect(() => {
    sessionStorage.setItem(`search_${key}`, searchTerm);
  }, [key, searchTerm]);

  const clearSearch = () => {
    setSearchTerm('');
    sessionStorage.removeItem(`search_${key}`);
  };

  return [searchTerm, setSearchTerm, clearSearch] as const;
};
