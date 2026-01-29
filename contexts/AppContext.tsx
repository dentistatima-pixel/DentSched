
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect, useMemo } from 'react';
import { User, SystemStatus, AuditLogEntry, GovernanceTrack, SyncIntent } from '../types';
import { STAFF, MOCK_AUDIT_LOG, generateUid } from '../constants';
import { useToast } from '../components/ToastSystem';
import CryptoJS from 'crypto-js';
import { db } from '../services/db';
import { DataService } from '../services/dataService';
import { getTrustedTime } from '../services/timeService';


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
  logAction: (action: AuditLogEntry['action'], entity: AuditLogEntry['entity'], entityId: string, details: string) => Promise<void>;
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
  isInKioskMode: boolean;
  setIsInKioskMode: (isKiosk: boolean) => void;
  syncQueueCount: number;
  isSyncing: boolean;
  enqueueAction: (action: SyncIntent['action'], payload: any) => Promise<void>;
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
    const [isInKioskMode, setIsInKioskMode] = useState(false);
    
    const [syncQueueCount, setSyncQueueCount] = useState(0);
    const [isSyncing, setIsSyncing] = useState(false);

    const refreshQueueCount = useCallback(async () => {
        const queue = await db.getAll<SyncIntent>('actionQueue');
        setSyncQueueCount(queue.length);
    }, []);

    useEffect(() => {
        refreshQueueCount();
    }, [refreshQueueCount]);

    const enqueueAction = useCallback(async (action: SyncIntent['action'], payload: any) => {
        const intent: SyncIntent = {
            id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            action,
            payload,
            timestamp: new Date().toISOString()
        };
        await db.set('actionQueue', intent);
        await refreshQueueCount();
    }, [refreshQueueCount]);
    
    const processSyncQueue = useCallback(async () => {
        if (isSyncing || !isOnline) return;

        const queue = await db.getAll<SyncIntent>('actionQueue');
        if (queue.length === 0) {
            return;
        }

        setIsSyncing(true);
        toast.info(`Syncing ${queue.length} offline change(s)...`);

        let successCount = 0;
        for (const intent of queue) {
            try {
                let success = false;
                switch (intent.action) {
                    case 'UPDATE_PATIENT':
                    case 'REGISTER_PATIENT':
                        await DataService.savePatient(intent.payload);
                        success = true;
                        break;
                    case 'UPDATE_APPOINTMENT':
                    case 'CREATE_APPOINTMENT':
                    case 'UPDATE_STATUS':
                        await DataService.saveAppointment(intent.payload);
                        success = true;
                        break;
                }

                if (success) {
                    await db.del('actionQueue', intent.id);
                    successCount++;
                }
            } catch (error) {
                console.error("Sync error for action:", intent, error);
                toast.error(`Failed to sync: ${intent.action}. Retrying later.`);
                break; // Stop on the first error to maintain order
            }
        }

        await refreshQueueCount();
        setIsSyncing(false);
        
        if (successCount > 0 && successCount === queue.length) {
            toast.success("All offline changes have been synced successfully.");
            setTimeout(() => window.location.reload(), 1500);
        } else if (successCount > 0) {
            toast.warning(`${successCount} changes synced, but some failed. They will be retried on next connection.`);
            setTimeout(() => window.location.reload(), 1500);
        }

    }, [isSyncing, isOnline, toast, refreshQueueCount]);


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

        const isExpiredWithGrace = (expiryDate?: string): boolean => {
            if (!expiryDate) return false;
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            return new Date(expiryDate) < sevenDaysAgo;
        };

        const isPrcLocked = isExpiredWithGrace(currentUser.prcExpiry);
        const isMalpracticeLocked = isExpiredWithGrace(currentUser.malpracticeExpiry);
      
        return isPrcLocked || isMalpracticeLocked;
    }, [currentUser]);

    const isReadOnly = useMemo(() => currentUser?.status === 'Inactive' || isAuthorityLocked, [currentUser, isAuthorityLocked]);

    const logAction = useCallback(async (action: AuditLogEntry['action'], entity: AuditLogEntry['entity'], entityId: string, details: string) => {
      if (!currentUser) return; // Don't log actions if no user is logged in
      
      const { timestamp, isVerified } = await getTrustedTime();
      
      setAuditLog(prevLog => {
          const lastLog = prevLog[prevLog.length - 1];
          const previousHash = lastLog ? lastLog.hash : 'GENESIS';
          
          const dataToHash = JSON.stringify({
            timestamp,
            userId: currentUser.id,
            action,
            entity,
            entityId,
            details,
            previousHash
          });
          const hash = CryptoJS.SHA256(dataToHash).toString();

          const newLogEntry: AuditLogEntry = {
              id: generateUid('al'),
              timestamp,
              isVerifiedTimestamp: isVerified,
              userId: currentUser.id,
              userName: currentUser.name,
              action,
              entity,
              entityId,
              details,
              hash,
              previousHash,
              impersonatingUser: originalUser ? { id: originalUser.id, name: originalUser.name } : undefined,
          };
          return [...prevLog, newLogEntry];
      });
    }, [currentUser, originalUser]);
    
    useEffect(() => {
        const verifyAuditLogIntegrity = (log: AuditLogEntry[]): boolean => {
            for (let i = 1; i < log.length; i++) {
                const current = log[i];
                const previous = log[i - 1];
                
                if (current.previousHash !== previous.hash) {
                    console.error('AUDIT LOG TAMPERED! Hash chain mismatch at entry:', current);
                    toast.error(`CRITICAL: Audit log integrity compromised at record #${current.id}.`, { duration: 15000 });
                    return false;
                }
            }
            return true;
        };
    
        if (auditLog.length > 0) {
            const isVerified = verifyAuditLogIntegrity(auditLog);
            setIsAuditLogVerified(isVerified);
            if (isVerified) {
                console.log("Audit log chain integrity verified successfully.");
            }
        }
    }, [auditLog, toast]);

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
        const handleOnline = () => {
            setIsOnline(true);
            processSyncQueue();
        };
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
          window.removeEventListener('online', handleOnline);
          window.removeEventListener('offline', handleOffline);
        };
    }, [processSyncQueue]);

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
        isInKioskMode,
        setIsInKioskMode,
        syncQueueCount,
        isSyncing,
        enqueueAction,
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
