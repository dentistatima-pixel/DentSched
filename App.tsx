
import React, { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react';
import { Layout } from './components/Layout';
import { LoginScreen } from './components/LoginScreen';
import ModalManager from './components/ModalManager';
import { KioskView } from './components/KioskView';
import { ProtectedRoute } from './components/ProtectedRoute';

import { useAppContext } from './contexts/AppContext';
import { useSettings } from './contexts/SettingsContext';
import { useRouter } from './contexts/RouterContext';
import { routes, RouteConfig } from './routes';
import { useLicenseValidation } from './hooks/useLicenseValidation';

import { DentalChartEntry, User, UserRole } from './types';
import { Lock, X, Key, ArrowLeft, User as UserIcon, Loader } from 'lucide-react';
// FIX: Import Dashboard component.
import { Dashboard } from './components/Dashboard';

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

    // FIX: Refactored login attempt logic into a single useEffect to resolve a dependency cycle.
    // The previous implementation with useCallback and a separate useEffect caused unnecessary re-renders.
    // This now only triggers when the PIN length is exactly 4.
    useEffect(() => {
        if (pin.length === 4) {
            if (!onUnlockAttempt(pin)) {
                setError('Invalid PIN');
                setPin('');
            }
            // If unlock is successful, the parent component handles the state change, and this component unmounts.
        }
    }, [pin, onUnlockAttempt, setError, setPin]);

    return (
        <div className="fixed inset-0 z-[999] bg-teal-900/95 backdrop-blur-2xl flex flex-col items-center justify-center p-8 animate-in fade-in duration-500">
            <div className="w-full max-w-sm text-white">
                <div className="text-center mb-10">
                    <div className="w-24 h-24 rounded-full border-4 border-teal-400 mx-auto mb-4 shadow-2xl bg-teal-800 flex items-center justify-center">
                        <UserIcon size={48} className="text-teal-300" />
                    </div>
                    <h2 className="text-2xl font-black">{user.name}</h2>
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

                <div className="grid grid-cols-3 gap-4 text-2xl font-bold">
                    {[1,2,3,4,5,6,7,8,9, 'back', 0].map(n => (
                         n === 'back' ? 
                         <button key={n} onClick={handleBackspace} className="h-20 bg-white/5 rounded-2xl hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center text-teal-200"><ArrowLeft size={28}/></button>
                         : <button key={n} onClick={() => handlePinChange(n.toString())} className="h-20 bg-white/5 rounded-2xl hover:bg-white/10 active:scale-95 transition-all text-teal-200">{n}</button>
                    ))}
                </div>
            </div>
        </div>
    );
};


export const App: React.FC = () => {
    const { 
      currentUser, setCurrentUser, logAction, fullScreenView, setFullScreenView, 
      isInKioskMode, setIsInKioskMode, isAuthorityLocked, setIsAuthorityLocked
    } = useAppContext();
    const { fieldSettings } = useSettings();
    const { route } = useRouter();

    const [isLocked, setIsLocked] = useState(false);
    const [showSessionWarning, setShowSessionWarning] = useState(false);
    const [warningCountdown, setWarningCountdown] = useState(60);
    
    const idleTimer = useRef<number | null>(null);
    const warningTimer = useRef<number | null>(null);

    // FIX: Corrected session timeout logic. Kiosk mode now has a shorter, more secure 5-minute timeout,
    // while the default staff session is extended to a more practical 15 minutes.
    const IDLE_TIMEOUT_MINUTES = isInKioskMode ? 5 : (fieldSettings?.sessionTimeoutMinutes || 15);
    const WARNING_SECONDS = 60;
    
    const handleLogin = (user: User) => {
        setCurrentUser(user);
        logAction('LOGIN', 'System', user.id, 'User logged in successfully.');
    };
    
    useLicenseValidation(currentUser?.id || null, setIsAuthorityLocked);

    const resetIdleTimer = useCallback(() => {
        if (idleTimer.current) clearTimeout(idleTimer.current);
        if (warningTimer.current) clearInterval(warningTimer.current);
        
        setShowSessionWarning(false);
        setWarningCountdown(WARNING_SECONDS);
        
        if (currentUser && !isLocked) {
            idleTimer.current = window.setTimeout(() => {
                setShowSessionWarning(true);
                warningTimer.current = window.setInterval(() => {
                    setWarningCountdown(prev => {
                        if (prev <= 1) {
                            clearInterval(warningTimer.current!);
                            setIsLocked(true);
                            setShowSessionWarning(false);
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);
            }, (IDLE_TIMEOUT_MINUTES * 60 - WARNING_SECONDS) * 1000);
        }
    }, [currentUser, isLocked, IDLE_TIMEOUT_MINUTES]);

    useEffect(() => {
        resetIdleTimer();
        const events: (keyof WindowEventMap)[] = ['mousedown', 'touchstart', 'keydown'];
        events.forEach(e => window.addEventListener(e, resetIdleTimer));
        return () => {
            if (idleTimer.current) clearTimeout(idleTimer.current);
            if (warningTimer.current) clearInterval(warningTimer.current);
            events.forEach(e => window.removeEventListener(e, resetIdleTimer));
        };
    }, [resetIdleTimer]);

    const handleUnlock = (pin: string) => {
        if (currentUser && currentUser.pin === pin) {
            setIsLocked(false);
            resetIdleTimer();
            logAction('SESSION_UNLOCK', 'System', currentUser.id, 'User unlocked session.');
            return true;
        }
        return false;
    };
    
    if (isInKioskMode) {
        return <KioskView onExitKiosk={() => setIsInKioskMode(false)} logAction={logAction} />;
    }

    if (!currentUser) {
        return <LoginScreen onLogin={handleLogin} />;
    }
    
    if (fullScreenView) {
        switch (fullScreenView.type) {
            case 'formBuilder':
                return (
                    <Suspense fallback={<div>Loading...</div>}>
                        <FormBuilder {...fullScreenView.props} />
                    </Suspense>
                );
            default:
                setFullScreenView(null);
                return null;
        }
    }

    const ActiveComponent = routes.find(r => r.path === route.path)?.component || Dashboard;
    const activeRouteConfig = routes.find(r => r.path === route.path);

    return (
        <>
            <Layout>
              {activeRouteConfig?.requiredRoles ? (
                  <ProtectedRoute requiredRoles={activeRouteConfig.requiredRoles}>
                      <ActiveComponent route={route} {...(activeRouteConfig.props || {})} />
                  </ProtectedRoute>
              ) : (
                  <ActiveComponent route={route} {...(activeRouteConfig?.props || {})} />
              )}
            </Layout>
            <ModalManager />

            {showSessionWarning && (
                <SessionWarningModal 
                    onStayActive={resetIdleTimer} 
                    onLogout={() => {
                        if (currentUser) {
                            logAction('LOGOUT', 'System', currentUser.id, 'User logged out due to inactivity.');
                        }
                        setCurrentUser(null);
                        setIsLocked(false);
                        setShowSessionWarning(false);
                    }}
                    countdown={warningCountdown}
                />
            )}
            {isLocked && <LockScreen onUnlockAttempt={handleUnlock} user={currentUser} />}
        </>
    );
};
