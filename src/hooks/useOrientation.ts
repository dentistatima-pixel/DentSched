import { useState, useEffect } from 'react';

export const useOrientation = () => {
    const getOrientation = () => window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
    
    const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(getOrientation());
    
    useEffect(() => {
        const handleResize = () => {
            setOrientation(getOrientation());
        };
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    
    return orientation;
};