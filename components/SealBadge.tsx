
import React from 'react';
import { ShieldCheck, Lock } from 'lucide-react';
import { useModal } from '../contexts/ModalContext';
import { SealData } from './SealInspector';

interface SealBadgeProps {
    data: SealData;
    variant?: 'teal' | 'lilac' | 'slate';
    showLabel?: boolean;
}

export const SealBadge: React.FC<SealBadgeProps> = ({ data, variant = 'teal', showLabel = true }) => {
    const { showModal } = useModal();

    const colors = {
        teal: 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100',
        lilac: 'bg-lilac-50 text-lilac-700 border-lilac-200 hover:bg-lilac-100',
        slate: 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200',
    }[variant];

    return (
        <button
            onClick={(e) => {
                e.stopPropagation();
                showModal('sealInspector', { data });
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border shadow-sm transition-all active:scale-95 group ${colors}`}
            title="Verified Digital Seal"
        >
            <ShieldCheck size={12} className="group-hover:scale-110 transition-transform" />
            {showLabel && <span className="text-[10px] font-black uppercase tracking-widest">Sealed</span>}
        </button>
    );
};
