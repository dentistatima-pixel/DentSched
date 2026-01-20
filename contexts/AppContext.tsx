import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { User, SystemStatus, AuditLogEntry } from '../types';
import { STAFF, MOCK_AUDIT_LOG, generateUid } from '../constants';
import { useToast } from '../components/ToastSystem';
import CryptoJS from 'crypto-js';

interface AppContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  originalUser: User | null;
  handleStartImpersonating: (userToImpersonate: User) => void;
  handleStopImpersonating: () => void;
  systemStatus: SystemStatus;
  setSystemStatus: (status: SystemStatus) => void;
  isOnline: boolean;
  auditLog: AuditLogEntry[];
  logAction: (action: AuditLogEntry['action'], entity: AuditLogEntry['entity'], entityId: string, details: string) => void;
  isAuditLogVerified: boolean | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const toast = useToast();
    const [currentUser, setCurrentUser] = useState<User>(STAFF[0]);
    const [originalUser, setOriginalUser] = useState<User | null>(null);
    const [systemStatus, setSystemStatus] = useState<SystemStatus>(SystemStatus.OPERATIONAL);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [auditLog, setAuditLog] = useState<AuditLogEntry[]>(MOCK_AUDIT_LOG);
    const [isAuditLogVerified, setIsAuditLogVerified] = useState<boolean | null>(null);

    const logAction = useCallback((action: AuditLogEntry['action'], entity: AuditLogEntry['entity'], entityId: string, details: string) => {
      setAuditLog(prevLog => {
          const lastLog = prevLog[prevLog.length - 1];
          const previousHash = lastLog ? lastLog.hash : '0'.repeat(64);
          const timestamp = new Date().toISOString();
          const payload = `${timestamp}|${currentUser.id}|${action}|${entityId}|${previousHash}`;
          const hash = CryptoJS.SHA256(payload).toString();

          const newLogEntry: AuditLogEntry = {
              id: generateUid('al'), timestamp, userId: currentUser.id, userName: currentUser.name,
              action, entity, entityId, details, hash, previousHash,
              impersonatingUser: originalUser ? { id: originalUser.id, name: originalUser.name } : undefined
          };
          return [...prevLog, newLogEntry];
      });
    }, [currentUser, originalUser]);

    const handleStartImpersonating = (userToImpersonate: User) => {
        if (currentUser.id === userToImpersonate.id) return;
        logAction('SECURITY_ALERT', 'System', userToImpersonate.id, `Impersonation started by ${currentUser.name} for user ${userToImpersonate.name}.`);
        setOriginalUser(currentUser);
        setCurrentUser(userToImpersonate);
        toast.warning(`Now impersonating ${userToImpersonate.name}.`);
    };

    const handleStopImpersonating = () => {
        if (originalUser) {
            logAction('SECURITY_ALERT', 'System', currentUser.id, `Impersonation stopped. Reverted to ${originalUser.name}.`);
            setCurrentUser(originalUser);
            setOriginalUser(null);
            toast.info("Impersonation stopped.");
        }
    };

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
          window.removeEventListener('online', handleOnline);
          window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const value: AppContextType = {
        currentUser,
        setCurrentUser,
        originalUser,
        handleStartImpersonating,
        handleStopImpersonating,
        systemStatus,
        setSystemStatus,
        isOnline,
        auditLog,
        logAction,
        isAuditLogVerified,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};
