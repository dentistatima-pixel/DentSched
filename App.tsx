
import React, { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react';
import Layout from './components/Layout';
import LoginScreen from './components/LoginScreen';
import ModalManager from './components/ModalManager';
import KioskView from './components/KioskView';
import ProtectedRoute from './components/ProtectedRoute';

import { useAppContext } from './contexts/AppContext';
import { useRouter } from './contexts/RouterContext';
import { routes, RouteConfig } from './routes';

import { DentalChartEntry, UserRole } from './types';
import { Lock } from 'lucide-react';


const LockScreen = ({ onUnlock }: { onUnlock: () => void }) => {
    return (
        <div className="fixed inset-0 bg-teal-950/90 backdrop-blur-xl z-[999] flex flex-col items-center justify-center text-white p-8 animate-in fade-in duration-500 cursor-pointer" onClick={onUnlock}>
            <div className="text-center">
                <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-8 border-2 border-white/20 shadow-xl"><Lock size={40} /></div>
                <h2 className="text-3xl font-black uppercase tracking-widest">Session Locked</h2>
                <p className="text-teal-300 font-bold mt-2 animate-pulse">Click anywhere to unlock</p>
            </div>
        </div>
    );
};

function App() {
  const { currentUser, setCurrentUser } = useAppContext();
  const { route } = useRouter();
  
  const [isInKioskMode, setIsInKioskMode] = useState(false);
  const [isSessionLocked, setIsSessionLocked] = useState(false);
  
  const idleTimerRef = useRef<any>(null);
  const IDLE_TIMEOUT_MS = 15 * 60 * 1000; 

  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => setIsSessionLocked(true), IDLE_TIMEOUT_MS);
  }, [IDLE_TIMEOUT_MS]);

  useEffect(() => {
    window.addEventListener('mousemove', resetIdleTimer);
    window.addEventListener('keydown', resetIdleTimer);
    resetIdleTimer();
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      window.removeEventListener('mousemove', resetIdleTimer);
      window.removeEventListener('keydown', resetIdleTimer);
    };
  }, [resetIdleTimer]);
  
  if (!currentUser) {
      return <LoginScreen onLogin={setCurrentUser} />;
  }
  
  const renderRoute = () => {
    const activeRoute = routes.find(r => r.path === route.path) || routes.find(r => r.path === 'dashboard')!;
    
    const { component: Component, layout: LayoutComponent, requiredRoles, props } = activeRoute;

    const routeContent = LayoutComponent 
      ? <LayoutComponent route={route} {...props} /> 
      : <Component route={route} {...props} />;

    if (requiredRoles) {
      return <ProtectedRoute requiredRoles={requiredRoles}>{routeContent}</ProtectedRoute>;
    }
    
    return routeContent;
  };

  if (isInKioskMode) return <KioskView onExitKiosk={() => setIsInKioskMode(false)} />;

  return (
    <>
      {isSessionLocked && <LockScreen onUnlock={() => setIsSessionLocked(false)} />}
      <Layout onEnterKioskMode={() => setIsInKioskMode(true)}>
        <Suspense fallback={<div>Loading Page...</div>}>
          {renderRoute()}
        </Suspense>
      </Layout>
      <ModalManager />
    </>
  );
}

export default App;
