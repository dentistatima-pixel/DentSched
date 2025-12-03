
import React, { useState } from 'react';
import { DentalChartEntry, TreatmentStatus } from '../types';

interface OdontogramProps {
  chart: DentalChartEntry[];
  readOnly?: boolean;
  onToothClick?: (toothNumber: number) => void;
}

// Extracted Tooth Component
const Tooth: React.FC<{number: number; status?: TreatmentStatus; readOnly?: boolean; onClick?: (n: number) => void}> = ({ number, status, readOnly, onClick }) => {
    
    const getStatusColor = (s?: TreatmentStatus) => {
        switch (s) {
        case 'Planned': return '#ef4444'; // Red
        case 'Completed': return '#10b981'; // Green
        case 'Existing': return '#3b82f6'; // Blue
        default: return '#f1f5f9'; // Slate-100 (Healthy/Default)
        }
    };

    const color = getStatusColor(status);

    return (
      <div 
        onClick={() => !readOnly && onClick && onClick(number)}
        className={`flex flex-col items-center gap-1 cursor-pointer transition-transform hover:scale-110 ${readOnly ? 'cursor-default' : ''}`}
      >
        <span className="text-[10px] text-slate-400 font-mono font-bold">{number}</span>
        <svg width="28" height="28" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
           {/* Tooth Body */}
           <path 
             d="M20 30 C20 10, 80 10, 80 30 C80 50, 70 80, 60 90 L 50 95 L 40 90 C 30 80, 20 50, 20 30 Z" 
             fill={color} 
             stroke="#94a3b8" 
             strokeWidth="3"
           />
           {/* Visual details */}
           <path d="M35 30 L 35 70" stroke="rgba(0,0,0,0.1)" strokeWidth="2" />
           <path d="M65 30 L 65 70" stroke="rgba(0,0,0,0.1)" strokeWidth="2" />
           <path d="M20 30 L 80 30" stroke="rgba(0,0,0,0.1)" strokeWidth="2" />
        </svg>
      </div>
    );
};

const Odontogram: React.FC<OdontogramProps> = ({ chart, readOnly, onToothClick }) => {
  const q1 = [18, 17, 16, 15, 14, 13, 12, 11];
  const q2 = [21, 22, 23, 24, 25, 26, 27, 28];
  const q4 = [48, 47, 46, 45, 44, 43, 42, 41];
  const q3 = [31, 32, 33, 34, 35, 36, 37, 38];

  const getToothStatus = (number: number): TreatmentStatus | undefined => {
    const entry = chart.find(e => e.toothNumber === number);
    return entry?.status;
  };

  return (
    <div className="bg-white p-2 md:p-6 rounded-xl border border-slate-200 overflow-x-auto">
      <div className="min-w-[600px] flex flex-col gap-8 items-center">
        
        {/* Upper Arch */}
        <div className="flex flex-col items-center w-full">
            <div className="text-xs font-bold text-slate-400 mb-2 tracking-widest">UPPER ARCH</div>
            <div className="flex gap-4 pb-4 border-b border-dashed border-slate-200">
                {/* Q1 Right */}
                <div className="flex gap-1.5 px-2 border-r border-slate-200 pr-4">
                    {q1.map(t => <Tooth key={t} number={t} status={getToothStatus(t)} readOnly={readOnly} onClick={onToothClick} />)}
                </div>
                {/* Q2 Left */}
                <div className="flex gap-1.5 px-2 pl-4">
                    {q2.map(t => <Tooth key={t} number={t} status={getToothStatus(t)} readOnly={readOnly} onClick={onToothClick} />)}
                </div>
            </div>
        </div>
        
        {/* Lower Arch */}
        <div className="flex flex-col items-center w-full">
            <div className="flex gap-4 pt-2">
                {/* Q4 Right */}
                <div className="flex gap-1.5 px-2 border-r border-slate-200 pr-4">
                    {q4.map(t => <Tooth key={t} number={t} status={getToothStatus(t)} readOnly={readOnly} onClick={onToothClick} />)}
                </div>
                {/* Q3 Left */}
                <div className="flex gap-1.5 px-2 pl-4">
                    {q3.map(t => <Tooth key={t} number={t} status={getToothStatus(t)} readOnly={readOnly} onClick={onToothClick} />)}
                </div>
            </div>
            <div className="text-xs font-bold text-slate-400 mt-2 tracking-widest">LOWER ARCH</div>
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-6 mt-4 text-xs font-bold text-slate-600 bg-slate-50 p-2 rounded-lg">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-slate-100 border border-slate-300"></div> Healthy</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-red-500"></div> Planned</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-green-500"></div> Completed</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-blue-500"></div> Existing</div>
        </div>
      </div>
    </div>
  );
};

export default Odontogram;
