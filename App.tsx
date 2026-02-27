import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { Layout } from './components/Layout';
import { LoginScreen } from './components/LoginScreen';
import ModalManager from './components/ModalManager';
import { KioskView } from './components/KioskView';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';

import { useAppContext } from './contexts/AppContext';
import { useSettings } from './contexts/SettingsContext';
import { useRouter } from './contexts/RouterContext';
import { routes } from './routes';
import { useLicenseValidation } from './hooks/useLicenseValidation';

import { User } from './types';
import { X, ArrowLeft, User as UserIcon, Loader } from 'lucide-react';

// Lazy load components for the full-screen workspace
const FormBuilder = React.lazy(() => import('./components/FormBuilder'));


const SessionWarningModal: React.FC<{ onStayActive: () => void; onLogout: () => void; countdown: number }> = ({ onStayActive, onLogout, countdown }) => {
    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[998] flex flex-col items-center justify-center text-white p-8 animate-in fade-in duration-500">
            <div className="text-center bg-white/10 p-12 rounded-3xl border border-white/20">
                <h2 className="text-3xl font-black uppercase tracking-widest">Session Expiring</h2>
                <p className="text-amber-300 font-bold mt-2">Your session will lock due to inactivity in</p>
                <div className="text-8xl font-black my-8">{Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}</div>
                <div className="flex gap-4">
                    <button onClick={onLogout} className="px-8 py-4 bg-red-600/80 rounded-2xl font-bold uppercase text-xs tracking-widest">Logout</button>
                    <button onClick={onStayActive} className="px-12 py-4 bg-teal-500 rounded-2xl font-black uppercase text-xs tracking-widest">Stay Active</button>
                </div>
            </div>
        </div>
    );
};

const LockScreen: React.FC<{ onUnlockAttempt: (pin: string) => boolean; user: User }> = ({ onUnlockAttempt, user }) => {
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(''), 1500);
            return () => clearTimeout(timer);
        }
    }, [error]);
    
    const handlePinChange = (value: string) => {
        if (error) setError('');
        if (pin.length < 4) {
            setPin(pin + value);
        }
    };
    
    const handleBackspace = () => {
        setError('');
        setPin(pin.slice(0, -1));
    };

    const handleLoginAttempt = useCallback(() => {
        const success = onUnlockAttempt(pin);
        if (!success) {
            setError('Invalid PIN');
            setTimeout(() => setPin(''), 500);
        }
    }, [pin, onUnlockAttempt]);

    useEffect(() => {
        if (pin.length === 4) {
            handleLoginAttempt();
        }
    }, [pin, handleLoginAttempt]);


    return (
        <div className="fixed inset-0 bg-teal-950/90 backdrop-blur-xl z-[999] grid place-items-center text-white p-8 animate-in fade-in duration-500">
            <div className="w-full max-w-sm">
                <div className="text-center mb-10">
                    <div className="w-24 h-24 rounded-full border-4 border-teal-400 mx-auto mb-4 shadow-2xl bg-teal-800 flex items-center justify-center">
                        <UserIcon size={48} className="text-teal-300" />
                    </div>
                    <h2 className="text-2xl font-black text-white">{user.name}</h2>
                    <p className="text-teal-300 font-bold">{user.role}</p>
                </div>

                <div className="relative mb-6">
                    <div className={`flex justify-center gap-4 ${error ? 'animate-in shake' : ''}`}>
                        {[0,1,2,3].map(i => (
                            <div key={i} className={`w-12 h-16 rounded-lg flex items-center justify-center text-4xl font-bold text-white ${error ? 'bg-red-200/50 border-2 border-red-500' : 'bg-white/20'}`}>
                                {pin[i] ? <span className="inline-block animate-pop-in">•</span> : ''}
                            </div>
                        ))}
                    </div>
                    {error && <p className="text-center text-red-400 font-bold mt-3 text-sm">{error}</p>}
                </div>

                <div className="grid grid-cols-3 gap-4 text-white text-2xl font-bold">
                    {[1,2,3,4,5,6,7,8,9].map(n => (
                        <button key={n} onClick={() => handlePinChange(n.toString())} className="h-20 bg-white/5 rounded-2xl hover:bg-white/10 active:scale-95 transition-all">{n}</button>
                    ))}
                    <div/>
                    <button onClick={() => handlePinChange('0')} className="h-20 bg-white/5 rounded-2xl hover:bg-white/10 active:scale-95 transition-all">0</button>
                    <button onClick={handleBackspace} className="h-20 bg-white/5 rounded-2xl hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center">
                        <ArrowLeft size={28}/>
                    </button>
                </div>
            </div>
        </div>
    );
};


export const App: React.FC = () => {
  const { currentUser, setCurrentUser, fullScreenView, setFullScreenView, isInKioskMode, setIsInKioskMode, logout, setIsAuthorityLocked } = useAppContext();
  const { fieldSettings, isLoading: areSettingsLoading } = useSettings();
  const { route } = useRouter();
  
  const [isSessionLocked, setIsSessionLocked] = useState(false);
  const [isLockWarningVisible, setIsLockWarningVisible] = useState(false);
  const [warningCountdown, setWarningCountdown] = useState(60);

  const idleTimerRef = useRef<number | null>(null);
  const warningTimerRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);

  const { isPrcExpired, isMalpracticeExpired } = useLicenseValidation(currentUser?.id || null);

  useEffect(() => {
      setIsAuthorityLocked(isPrcExpired || isMalpracticeExpired);
  }, [isPrcExpired, isMalpracticeExpired, setIsAuthorityLocked]);
  
  const WARNING_BEFORE_LOCK_MINUTES = 1;
  const IDLE_TIMEOUT_MINUTES = isInKioskMode ? 15 : (fieldSettings?.sessionTimeoutMinutes || 10);
  
  const lockSession = useCallback(() => {
    setIsSessionLocked(true);
    setIsLockWarningVisible(false);
    if(countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
  }, []);

  const showWarning = useCallback(() => {
    setIsLockWarningVisible(true);
    setWarningCountdown(WARNING_BEFORE_LOCK_MINUTES * 60);
    countdownIntervalRef.current = window.setInterval(() => {
        setWarningCountdown(prev => {
            if (prev <= 1) {
                clearInterval(countdownIntervalRef.current as number);
            }
            return prev - 1;
        });
    }, 1000);
  }, []);
  
  const resetIdleTimer = useCallback(() => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (isSessionLocked) return;

    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    
    setIsLockWarningVisible(false);

    const warningTimeoutMs = (IDLE_TIMEOUT_MINUTES - WARNING_BEFORE_LOCK_MINUTES) * 60 * 1000;
    const lockTimeoutMs = IDLE_TIMEOUT_MINUTES * 60 * 1000;
    
    if (warningTimeoutMs > 0) {
      warningTimerRef.current = window.setTimeout(showWarning, warningTimeoutMs);
    }
    idleTimerRef.current = window.setTimeout(lockSession, lockTimeoutMs);
  }, [IDLE_TIMEOUT_MINUTES, showWarning, lockSession, isSessionLocked]);

  useEffect(() => {
    const activityEvents: (keyof WindowEventMap)[] = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    activityEvents.forEach(event => window.addEventListener(event, resetIdleTimer));
    
    resetIdleTimer();

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      activityEvents.forEach(event => window.removeEventListener(event, resetIdleTimer));
    };
  }, [resetIdleTimer]);

  const handleUnlockAttempt = (pin: string): boolean => {
      if (currentUser && currentUser.pin === pin) {
          setIsSessionLocked(false);
          resetIdleTimer();
          return true;
      }
      return false;
  };
  
  const renderFullScreenContent = () => {
    if (!fullScreenView) return null;

    const { type, props } = fullScreenView;
    let Component;
    switch(type) {
        case 'formBuilder': Component = FormBuilder; break;
        default: return null;
    }

    return (
        <Suspense fallback={<div className="p-8">Loading Workspace...</div>}>
            <Component {...props} />
        </Suspense>
    );
  };
  
  if (areSettingsLoading) {
      return (
          <div className="fixed inset-0 bg-teal-900 flex flex-col items-center justify-center text-white gap-4">
              <Loader size={48} className="animate-spin text-teal-400" />
              <p className="text-lg font-bold">Loading Practice Settings...</p>
          </div>
      );
  }

  if (fullScreenView) {
    let title = 'Clinical Workspace';
    if (fullScreenView.type === 'formBuilder') title = 'Registration Form Design Studio';


    return (
        <div className="fixed inset-0 bg-slate-50 z-[999] flex flex-col animate-in fade-in">
            <header className="p-4 bg-white border-b flex justify-between items-center shrink-0 shadow-sm">
                <h3 className="font-bold text-lg text-slate-700">{title}</h3>
                <button onClick={() => setFullScreenView(null)} className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-200">
                    <X size={16}/> Close Workspace
                </button>
            </header>
            <div className="flex-1 overflow-y-auto">
                {renderFullScreenContent()}
            </div>
        </div>
    );
  }
  
  if (!currentUser) {
      return <LoginScreen onLogin={setCurrentUser} />;
  }
  
  const renderRoute = () => {
    const activeRoute = routes.find(r => r.path === route.path) || routes.find(r => r.path === 'dashboard')!;
    
    const { component: Component, requiredRoles, props } = activeRoute;

    const routeContent = <Component route={route} {...props} />;

    if (requiredRoles) {
      return <ProtectedRoute requiredRoles={requiredRoles}>{routeContent}</ProtectedRoute>;
    }
    
    return routeContent;
  };

  if (isInKioskMode) return <KioskView onExitKiosk={() => setIsInKioskMode(false)} />;

  return (
    <>
      {isSessionLocked && currentUser && <LockScreen onUnlockAttempt={handleUnlockAttempt} user={currentUser} />}
      {isLockWarningVisible && <SessionWarningModal onStayActive={resetIdleTimer} onLogout={logout} countdown={warningCountdown} />}
      <Layout>
        <Suspense fallback={<div>Loading Page...</div>}>
          <ErrorBoundary>
            {renderRoute()}
          </ErrorBoundary>
        </Suspense>
      </Layout>
      <ModalManager />
    </>
  );
}