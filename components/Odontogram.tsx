
import React, { useState } from 'react';
import { DentalChartEntry, TreatmentStatus } from '../types';

interface OdontogramProps {
  chart: DentalChartEntry[];
  readOnly?: boolean;
  onToothClick?: (toothNumber: number) => void;
}

const Odontogram: React.FC<OdontogramProps> = ({ chart, readOnly, onToothClick }) => {
  const [dentitionType, setDentitionType] = useState<'Adult' | 'Child'>('Adult');

  // FDI World Dental Federation notation
  const adultTeeth = {
    upperRight: [18, 17, 16, 15, 14, 13, 12, 11],
    upperLeft: [21, 22, 23, 24, 25, 26, 27, 28],
    lowerRight: [48, 47, 46, 45, 44, 43, 42, 41],
    lowerLeft: [31, 32, 33, 34, 35, 36, 37, 38]
  };

  const childTeeth = {
    upperRight: [55, 54, 53, 52, 51],
    upperLeft: [61, 62, 63, 64, 65],
    lowerRight: [85, 84, 83, 82, 81],
    lowerLeft: [71, 72, 73, 74, 75]
  };

  const getToothEntries = (number: number): DentalChartEntry[] => {
    return chart.filter(e => e.toothNumber === number);
  };

  const ToothBox: React.FC<{number: number}> = ({ number }) => {
    const entries = getToothEntries(number);
    
    const isMissing = entries.some(e => 
        (e.procedure === 'Missing' || e.procedure === 'Extraction') && 
        (e.status === 'Completed' || e.status === 'Existing')
    );

    const hasPlanned = entries.some(e => e.status === 'Planned');
    const hasCompleted = entries.some(e => e.status === 'Completed' && e.procedure !== 'Extraction' && e.procedure !== 'Missing');
    const hasExisting = entries.some(e => e.status === 'Existing' && e.procedure !== 'Extraction' && e.procedure !== 'Missing');

    // Box Style Logic based on status
    let bgClass = "bg-white";
    let borderClass = "border-slate-300";
    let textClass = "text-slate-700";
    let statusIndicator = null;

    if (isMissing) {
        bgClass = "bg-slate-100";
        textClass = "text-slate-300 decoration-slate-400 line-through";
        borderClass = "border-slate-200 border-dashed";
    } else if (hasPlanned) {
        bgClass = "bg-red-50";
        borderClass = "border-red-400";
        textClass = "text-red-700 font-bold";
        statusIndicator = <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></div>;
    } else if (hasCompleted) {
        bgClass = "bg-green-50";
        borderClass = "border-green-400";
        textClass = "text-green-700 font-bold";
        statusIndicator = <div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full"></div>;
    } else if (hasExisting) {
        bgClass = "bg-blue-50";
        borderClass = "border-blue-400";
        textClass = "text-blue-700 font-bold";
        statusIndicator = <div className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full"></div>;
    }

    return (
      <div 
        onClick={() => !readOnly && onToothClick && onToothClick(number)}
        className={`
            relative w-10 h-14 md:w-12 md:h-16 flex items-center justify-center rounded-lg border-2 transition-all 
            ${bgClass} ${borderClass} ${textClass}
            ${readOnly ? 'cursor-default' : 'cursor-pointer hover:shadow-md hover:-translate-y-0.5'}
        `}
      >
        <span className="text-sm md:text-lg select-none">{number}</span>
        {statusIndicator}
      </div>
    );
  };

  const currentTeeth = dentitionType === 'Adult' ? adultTeeth : childTeeth;

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
            {dentitionType === 'Adult' ? 'Permanent Dentition' : 'Primary Dentition'}
        </h3>
        
        {/* Segmented Control */}
        <div className="flex bg-slate-100 p-1 rounded-xl">
            <button 
                onClick={() => setDentitionType('Adult')}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                    dentitionType === 'Adult' 
                    ? 'bg-white text-teal-700 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
            >
                Adult
            </button>
            <button 
                onClick={() => setDentitionType('Child')}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                    dentitionType === 'Child' 
                    ? 'bg-white text-teal-700 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
            >
                Child
            </button>
        </div>
      </div>

      <div className="overflow-x-auto pb-4">
        <div className="min-w-max flex flex-col items-center gap-10">
            
            {/* UPPER ARCH */}
            <div className="flex flex-col items-center gap-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Maxillary (Upper)</div>
                <div className="flex gap-4 md:gap-8">
                    {/* Quadrant Right */}
                    <div className="flex gap-2">
                        {currentTeeth.upperRight.map(t => <ToothBox key={t} number={t} />)}
                    </div>
                    {/* Midline Divider */}
                    <div className="w-px bg-slate-200 h-16 md:h-20"></div>
                    {/* Quadrant Left */}
                    <div className="flex gap-2">
                        {currentTeeth.upperLeft.map(t => <ToothBox key={t} number={t} />)}
                    </div>
                </div>
            </div>

            {/* LOWER ARCH */}
            <div className="flex flex-col items-center gap-2">
                <div className="flex gap-4 md:gap-8">
                    {/* Quadrant Right */}
                    <div className="flex gap-2">
                        {currentTeeth.lowerRight.map(t => <ToothBox key={t} number={t} />)}
                    </div>
                    {/* Midline Divider */}
                    <div className="w-px bg-slate-200 h-16 md:h-20"></div>
                    {/* Quadrant Left */}
                    <div className="flex gap-2">
                        {currentTeeth.lowerLeft.map(t => <ToothBox key={t} number={t} />)}
                    </div>
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Mandibular (Lower)</div>
            </div>

        </div>
      </div>
      
      {/* Legend Footer */}
      <div className="mt-8 flex flex-wrap justify-center gap-6 border-t border-slate-100 pt-6">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
              <div className="w-3 h-3 rounded-full bg-slate-200"></div> Healthy
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div> Existing
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
              <div className="w-3 h-3 rounded-full bg-green-500"></div> Completed
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
              <div className="w-3 h-3 rounded-full bg-red-500"></div> Planned
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
               <span className="text-slate-400 line-through decoration-slate-400">18</span> Missing
          </div>
      </div>

    </div>
  );
};

export default Odontogram;
