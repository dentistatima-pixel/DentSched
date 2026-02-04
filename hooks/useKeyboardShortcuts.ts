import React, { useEffect } from 'react';
import { useModal } from '../contexts/ModalContext';
import { useNavigate } from '../contexts/RouterContext';


interface Shortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  action: () => void;
  description: string;
}

export const useKeyboardShortcuts = (shortcuts: Shortcut[]) => {
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const match = shortcuts.find(s => {
        const keyMatch = e.key.toLowerCase() === s.key.toLowerCase();
        const ctrlMatch = s.ctrlKey === undefined || s.ctrlKey === e.ctrlKey;
        const metaMatch = s.metaKey === undefined || s.metaKey === e.metaKey;
        const shiftMatch = s.shiftKey === undefined || s.shiftKey === e.shiftKey;
        return keyMatch && ctrlMatch && shiftMatch && metaMatch;
      });

      if (match) {
        e.preventDefault();
        match.action();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [shortcuts]);
};

// Global shortcuts component
export const GlobalShortcuts: React.FC = () => {
  const navigate = useNavigate();
  const { showModal, hideModal } = useModal();

  useKeyboardShortcuts([
    { key: 'n', ctrlKey: true, metaKey: true, action: () => showModal('patientRegistration', {}), description: 'New Patient' },
    { key: 'f', ctrlKey: true, metaKey: true, action: () => showModal('globalSearch'), description: 'Find Patient' },
    { key: 'Escape', action: () => hideModal(), description: 'Close Modal' },
  ]);

  return null; // This component just listens for shortcuts
};