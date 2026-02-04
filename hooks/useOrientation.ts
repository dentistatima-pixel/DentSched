import { useState, useEffect } from 'react';

export const useOrientation = () => {
    const getOrientation = () => window.matchMedia("(orientation: landscape)").matches ? 'landscape' : 'portrait';

    const [orientation, setOrientation] = useState(getOrientation());

    useEffect(() => {
        const mediaQuery = window.matchMedia("(orientation: landscape)");
        const handleOrientationChange = () => setOrientation(getOrientation());

        mediaQuery.addEventListener('change', handleOrientationChange);

        return () => {
            mediaQuery.removeEventListener('change', handleOrientationChange);
        };
    }, []);

    return { isLandscape: orientation === 'landscape', isPortrait: orientation === 'portrait' };
};
