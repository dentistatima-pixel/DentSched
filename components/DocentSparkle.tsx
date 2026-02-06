
import React, { useState } from 'react';
import { Sparkles, Loader } from 'lucide-react';
import { useDocent } from '../contexts/DocentContext';
import { getDocentExplanation } from '../services/geminiService';
import { useAppContext } from '../contexts/AppContext';
import ReactMarkdown from 'react-markdown';

interface DocentSparkleProps {
    elementId: string;
    context: string;
}

const DocentSparkle: React.FC<DocentSparkleProps> = ({ elementId, context }) => {
    const { isDocentEnabled } = useDocent();
    const { currentUser } = useAppContext();
    const [explanation, setExplanation] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showPopover, setShowPopover] = useState(false);

    if (!isDocentEnabled) return null;

    const handleMouseEnter = async () => {
        setShowPopover(true);
        if (!explanation && !isLoading && currentUser) {
            setIsLoading(true);
            try {
                const expl = await getDocentExplanation(elementId, context, currentUser.role);
                setExplanation(expl);
            } catch {
                setExplanation('Could not load explanation.');
            } finally {
                setIsLoading(false);
            }
        }
    };

    return (
        <div 
            className="relative inline-flex items-center justify-center"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={() => setShowPopover(false)}
        >
            <Sparkles size={14} className="text-teal-500 dark:text-teal-400 cursor-help" />
            {showPopover && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 bg-slate-800 text-white p-4 rounded-xl shadow-2xl z-50 animate-in fade-in zoom-in-95">
                    {isLoading ? (
                        <div className="flex items-center gap-2"><Loader size={16} className="animate-spin"/> <span>Loading...</span></div>
                    ) : (
                        <ReactMarkdown className="prose prose-sm prose-invert max-w-none">{explanation || ''}</ReactMarkdown>
                    )}
                </div>
            )}
        </div>
    );
};

export default DocentSparkle;