
import React, { useEffect } from 'react';
import { useModal } from '../contexts/ModalContext';
import { useNavigate } from '../contexts/RouterContext';
import { useAppointments } from '../contexts/AppointmentContext';
import { useAppContext } from '../contexts/AppContext';


interface Shortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: () => void;
  description: string;
}

export const useKeyboardShortcuts = (shortcuts: Shortcut[]) => {
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const match = shortcuts.find(s => {
        const keyMatch = e.key.toLowerCase() === s.key.toLowerCase();
        const ctrlMatch = s.ctrlKey === undefined || s.ctrlKey === (e.ctrlKey || e.metaKey); // Treat Cmd as Ctrl
        const metaMatch = s.metaKey === undefined || s.metaKey === e.metaKey;
        const shiftMatch = s.shiftKey === undefined || s.shiftKey === e.shiftKey;
        const altMatch = s.altKey === undefined || s.altKey === e.altKey;
        return keyMatch && ctrlMatch && metaMatch && shiftMatch && altMatch;
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
  const { openModal, closeModal } = useModal();
  const { handleSaveAppointment } = useAppointments();
  const { currentBranch } = useAppContext();

  useKeyboardShortcuts([
    { key: 'p', altKey: true, action: () => openModal('patientRegistration', { currentBranch }), description: 'New Patient Registration' },
    { key: 'n', altKey: true, action: () => openModal('appointment', { onSave: handleSaveAppointment, currentBranch }), description: 'New Appointment' },
    { key: 'k', metaKey: true, action: () => openModal('globalSearch'), description: 'Open Command Bar' },
    { key: '/', metaKey: true, action: () => openModal('shortcutHelp'), description: 'Show Shortcut Help' },
    { key: 'Escape', action: () => closeModal(), description: 'Close active modal' },
  ]);

  return null; // This component just listens for shortcuts
};
