
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

interface Route {
    path: string;
    param: string | null;
    query: URLSearchParams;
}

interface RouterContextType {
    route: Route;
    navigate: (path: string, options?: { replace?: boolean }) => void;
}

const RouterContext = createContext<RouterContextType | undefined>(undefined);

export const Router: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [route, setRoute] = useState<Route>({ path: 'dashboard', param: null, query: new URLSearchParams() });

    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash.replace(/^#\/?/, '') || 'dashboard';
            const [hashPath, queryString] = hash.split('?');
            const [path, param] = hashPath.split('/');
            const query = new URLSearchParams(queryString || '');
            
            setRoute({ path, param: param || null, query });
        };

        window.addEventListener('hashchange', handleHashChange, false);
        handleHashChange(); // Initial load

        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    const navigate = useCallback((path: string, options?: { replace?: boolean }) => {
        const newHash = `#/${path}`;
        if (options?.replace) {
            window.location.replace(newHash);
        } else {
            window.location.hash = newHash;
        }
    }, []);

    return (
        <RouterContext.Provider value={{ route, navigate }}>
            {children}
        </RouterContext.Provider>
    );
};

export const useRouter = () => {
    const context = useContext(RouterContext);
    if (!context) {
        throw new Error('useRouter must be used within a Router');
    }
    return context;
};

export const useNavigate = () => {
    const context = useContext(RouterContext);
    if (!context) {
        throw new Error('useNavigate must be used within a Router');
    }
    return context.navigate;
};
