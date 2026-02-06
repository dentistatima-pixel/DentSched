
import React from 'react';
import { Smartphone } from 'lucide-react';
import { useOrientation } from '../hooks/useOrientation';

export const OrientationWarning: React.FC = () => {
    const { isPortrait } = useOrientation();
    const [isHoverable, setIsHoverable] = React.useState(false);

    React.useEffect(() => {
        const mediaQuery = window.matchMedia('(hover: hover)');
        setIsHoverable(mediaQuery.matches);

        const handleChange = (e: MediaQueryListEvent) => setIsHoverable(e.matches);
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    // Only show the blocking overlay on non-hoverable (touch) devices when in portrait mode.
    if (!isPortrait || isHoverable) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-lg z-[9999] flex flex-col items-center justify-center text-white p-8 animate-in fade-in duration-500">
            <div className="text-center">
                <div className="relative w-32 h-64 border-8 border-slate-600 rounded-3xl mx-auto mb-8 flex items-center justify-center">
                    <Smartphone size={80} className="text-slate-400" />
                    <div className="absolute inset-0 flex items-center justify-center animate-spin-slow">
                        <div className="w-24 h-48 border-4 border-dashed border-teal-500 rounded-2xl"></div>
                    </div>
                </div>
                <h2 className="text-3xl font-black uppercase tracking-widest">Rotate Device</h2>
                <p className="text-teal-300 font-bold mt-2 max-w-sm mx-auto">
                    This application is designed for a landscape experience. Please rotate your tablet for optimal usability.
                </p>
            </div>
            <style>{`
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 10s linear infinite;
                }
            `}</style>
        </div>
    );
};