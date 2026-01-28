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
import { Lock, X } from 'lucide-react';

// Lazy load components for the full-screen workspace
const FormBuilder = React.lazy(() => import('./components/FormBuilder'));


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
  const { currentUser, setCurrentUser, fullScreenView, setFullScreenView, isInKioskMode, setIsInKioskMode } = useAppContext();
  const { route } = useRouter();
  
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
      <Layout>
        <Suspense fallback={<div>Loading Page...</div>}>
          {renderRoute()}
        </Suspense>
      </Layout>
      <ModalManager />
    </>
  );
}

export default App;