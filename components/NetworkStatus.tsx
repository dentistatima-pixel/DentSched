import React, { useState, useEffect } from 'react';
import { CloudOff } from 'lucide-react';

export const NetworkStatus: React.FC = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    
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
    
    if (isOnline) return null;
    
    return (
        <div className="fixed top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg z-[999] flex items-center gap-2 animate-pulse">
            <CloudOff size={16} />
            <span className="text-sm font-bold">Working Offline</span>
        </div>
    );
};

export default NetworkStatus;