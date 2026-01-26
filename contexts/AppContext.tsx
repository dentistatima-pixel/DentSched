import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect, useMemo } from 'react';
import { User, SystemStatus, AuditLogEntry, GovernanceTrack } from '../types';
import { STAFF, MOCK_AUDIT_LOG, generateUid } from '../constants';
import { useToast } from '../components/ToastSystem';
import CryptoJS from 'crypto-js';

type Theme = 'light' | 'dark';

interface FullScreenView {
  type: 'formBuilder';
  props: any;
}

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  originalUser: User | null;
  handleStartImpersonating: (userToImpersonate: User) => void;
  handleStopImpersonating: () => void;
  logout: () => void;
  systemStatus: SystemStatus;
  setSystemStatus: (status: SystemStatus) => void;
  isOnline: boolean;
  auditLog: AuditLogEntry[];
  logAction: (action: AuditLogEntry['action'], entity: AuditLogEntry['entity'], entityId: string, details: string) => void;
  isAuditLogVerified: boolean | null;
  governanceTrack: GovernanceTrack;
  setGovernanceTrack: (track: GovernanceTrack) => void;
  currentBranch: string;
  setCurrentBranch: (branch: string) => void;
  isReadOnly: boolean;
  isAuthorityLocked: boolean;
  theme: Theme;
  toggleTheme: () => void;
  fullScreenView: FullScreenView | null;
  setFullScreenView: (view: FullScreenView | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const toast = useToast();
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [originalUser, setOriginalUser] = useState<User | null>(null);
    const [systemStatus, setSystemStatus] = useState<SystemStatus>(SystemStatus.OPERATIONAL);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [auditLog, setAuditLog] = useState<AuditLogEntry[]>(MOCK_AUDIT_LOG);
    const [isAuditLogVerified, setIsAuditLogVerified] = useState<boolean | null>(null);
    const [governanceTrack, setGovernanceTrack] = useState<GovernanceTrack>('OPERATIONAL');
    const [currentBranch, setCurrentBranch] = useState<string>('');
    const [theme, setTheme] = useState<Theme>('light');
    const [fullScreenView, setFullScreenView] = useState<FullScreenView | null>(null);

    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    }, [theme]);


    useEffect(() => {
        if (currentUser) {
            setCurrentBranch(currentUser.defaultBranch);
        }
    }, [currentUser]);

    const isAuthorityLocked = useMemo(() => {
      if (!currentUser) return false;
      const isPrcExpired = currentUser.prcExpiry ? new Date(currentUser.prcExpiry) < new Date() : false;
      const isMalpracticeExpired = currentUser.malpracticeExpiry ? new Date(currentUser.malpracticeExpiry) < new Date() : false;
      return isPrcExpired || isMalpracticeExpired;
    }, [currentUser]);

    const isReadOnly = useMemo(() => currentUser?.status === 'Inactive' || isAuthorityLocked, [currentUser, isAuthorityLocked]);

    const logAction = useCallback((action: AuditLogEntry['action'], entity: AuditLogEntry['entity'], entityId: string, details: string) => {
      if (!currentUser) return; // Don't log actions if no user is logged in
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
        if (!currentUser || currentUser.id === userToImpersonate.id) return;
        logAction('SECURITY_ALERT', 'System', userToImpersonate.id, `Impersonation started by ${currentUser.name} for user ${userToImpersonate.name}.`);
        setOriginalUser(currentUser);
        setCurrentUser(userToImpersonate);
        toast.warning(`Now impersonating ${userToImpersonate.name}.`);
    };

    const handleStopImpersonating = () => {
        if (originalUser) {
            logAction('SECURITY_ALERT', 'System', currentUser!.id, `Impersonation stopped. Reverted to ${originalUser.name}.`);
            setCurrentUser(originalUser);
            setOriginalUser(null);
            toast.info("Impersonation stopped.");
        }
    };
    
    const logout = () => {
        if (currentUser) {
            logAction('LOGOUT', 'System', currentUser.id, 'User logged out.');
        }
        setCurrentUser(null);
        setOriginalUser(null);
        toast.info("You have been logged out.");
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
        logout,
        systemStatus,
        setSystemStatus,
        isOnline,
        auditLog,
        logAction,
        isAuditLogVerified,
        governanceTrack,
        setGovernanceTrack,
        currentBranch,
        setCurrentBranch,
        isReadOnly,
        isAuthorityLocked,
        theme,
        toggleTheme,
        fullScreenView,
        setFullScreenView,
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