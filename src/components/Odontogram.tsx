
import React from 'react';
import { DentalChartEntry, TreatmentStatus } from '../types';

interface OdontogramProps {
  chart: DentalChartEntry[];
  readOnly?: boolean;
  onToothClick?: (toothNumber: number) => void;
}

const GeometricTooth: React.FC<{
    number: number;
    data?: DentalChartEntry;
    onClick?: (n: number) => void;
    readOnly?: boolean;
}> = ({ number, data, onClick, readOnly }) => {
    // 1. Determine Quadrant and Orientation
    const quadrant = Math.floor(number / 10);
    const isUpper = quadrant === 1 || quadrant === 2;
    const isPatientRight = quadrant === 1 || quadrant === 4; 
    
    // --- COLOR LOGIC ---
    const colorMap: Record<string, string> = {
        'Planned': '#ef4444',   // Red-500
        'Completed': '#10b981', // Emerald-500
        'Existing': '#3b82f6',  // Blue-500
        'Condition': '#f59e0b', // Amber-500
        'None': '#f8fafc'       // Slate-50
    };

    const getFill = (surfaceKey: string) => {
        if (!data) return colorMap['None'];
        
        const proc = data.procedure.toLowerCase();
        if (proc.includes('extraction') || proc.includes('missing') || proc.includes('denture') || proc.includes('crown')) {
             return colorMap[data.status] || colorMap['None'];
        }
        
        if (!data.surfaces) {
             return colorMap[data.status] || colorMap['None'];
        }
        
        if (data.surfaces.includes(surfaceKey)) {
            return colorMap[data.status] || colorMap['None'];
        }
        return colorMap['None'];
    };
    
    // --- SURFACE MAPPING ---
    const cM = getFill('M');
    const cD = getFill('D');
    const cO = getFill('O'); 
    const cB = getFill('B'); 
    const cL = getFill('L'); 
    
    const isRootProc = data?.procedure.toLowerCase().includes('root canal') || data?.procedure.toLowerCase().includes('extraction');
    const cRoot = isRootProc ? (colorMap[data?.status || ''] || colorMap['None']) : colorMap['None'];

    let pTop, pBottom, pLeft, pRight;
    
    if (isUpper) {
        pTop = cB;
        pBottom = cL;
    } else {
        pTop = cL;
        pBottom = cB;
    }

    if (isPatientRight) {
        pLeft = cD;
        pRight = cM;
    } else {
        pLeft = cM;
        pRight = cD;
    }

    const strokeColor = "#64748b"; // slate-500
    const strokeWidth = "2";
    const hoverClass = !readOnly ? "hover:scale-105 active:scale-95" : "";
    const activeClass = data ? "drop-shadow-md" : "";

    return (
        <div 
            onClick={() => !readOnly && onClick && onClick(number)}
            className={`flex flex-col items-center justify-center relative transition-transform touch-manipulation ${hoverClass} ${activeClass}`}
            style={{ width: '64px', height: '80px', minWidth: '64px' }} 
        >
            <span className={`text-[11px] font-bold font-mono absolute ${isUpper ? '-top-1' : '-bottom-1'} text-slate-500 select-none`}>
                {number}
            </span>

            <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                {isUpper ? (
                    <path d="M35 5 L65 5 L65 20 L35 20 Z" fill={cRoot} stroke={strokeColor} strokeWidth={strokeWidth} />
                ) : (
                    <path d="M35 80 L65 80 L65 95 L35 95 Z" fill={cRoot} stroke={strokeColor} strokeWidth={strokeWidth} />
                )}

                <path d="M20 20 L80 20 L70 30 L30 30 Z" fill={pTop} stroke={strokeColor} strokeWidth={strokeWidth} />
                <path d="M80 20 L80 80 L70 70 L70 30 Z" fill={pRight} stroke={strokeColor} strokeWidth={strokeWidth} />
                <path d="M80 80 L20 80 L30 70 L70 70 Z" fill={pBottom} stroke={strokeColor} strokeWidth={strokeWidth} />
                <path d="M20 80 L20 20 L30 30 L30 70 Z" fill={pLeft} stroke={strokeColor} strokeWidth={strokeWidth} />
                <path d="M30 30 L70 30 L70 70 L30 70 Z" fill={cO} stroke={strokeColor} strokeWidth={strokeWidth} />
                
                {(data?.procedure.toLowerCase().includes('missing') || data?.procedure.toLowerCase().includes('extraction')) && (
                     <path d="M20 20 L80 80 M80 20 L20 80" stroke={data.status === 'Existing' ? '#3b82f6' : '#ef4444'} strokeWidth="4" opacity="0.8" />
                )}
            </svg>
        </div>
    )
}

const Odontogram: React.FC<OdontogramProps> = ({ chart, readOnly, onToothClick }) => {
  const q1 = [18, 17, 16, 15, 14, 13, 12, 11];
  const q2 = [21, 22, 23, 24, 25, 26, 27, 28];
  const q4 = [48, 47, 46, 45, 44, 43, 42, 41];
  const q3 = [31, 32, 33, 34, 35, 36, 37, 38];

  const getToothData = (number: number) => chart.find(e => e.toothNumber === number);

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 overflow-x-auto shadow-inner bg-slate-50/50">
      <div className="min-w-[700px] flex flex-col gap-6 items-center py-4">
        
        <div className="flex flex-col items-center w-full">
            <div className="flex gap-8 pb-4 border-b-2 border-slate-200 w-full justify-center">
                <div className="flex gap-1">
                    {q1.map(t => <GeometricTooth key={t} number={t} data={getToothData(t)} readOnly={readOnly} onClick={onToothClick} />)}
                </div>
                <div className="w-0.5 bg-slate-300 h-20 self-end"></div>
                <div className="flex gap-1">
                    {q2.map(t => <GeometricTooth key={t} number={t} data={getToothData(t)} readOnly={readOnly} onClick={onToothClick} />)}
                </div>
            </div>
            <div className="text-[10px] font-bold text-slate-400 mt-2 tracking-widest uppercase">Upper Arch</div>
        </div>
        
        <div className="flex flex-col items-center w-full">
             <div className="text-[10px] font-bold text-slate-400 mb-2 tracking-widest uppercase">Lower Arch</div>
            <div className="flex gap-8 pt-2 border-t-2 border-slate-200 w-full justify-center">
                <div className="flex gap-1">
                    {q4.map(t => <GeometricTooth key={t} number={t} data={getToothData(t)} readOnly={readOnly} onClick={onToothClick} />)}
                </div>
                 <div className="w-0.5 bg-slate-300 h-20 self-start"></div>
                <div className="flex gap-1">
                    {q3.map(t => <GeometricTooth key={t} number={t} data={getToothData(t)} readOnly={readOnly} onClick={onToothClick} />)}
                </div>
            </div>
        </div>

        <div className="flex flex-wrap justify-center gap-4 mt-6 text-xs font-bold text-slate-600 bg-white border border-slate-200 p-3 rounded-xl shadow-sm w-full max-w-2xl">
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-slate-50 border border-slate-300"></div> Healthy</div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-red-500"></div> Planned</div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-green-500"></div> Completed</div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-blue-500"></div> Existing</div>
            <div className="flex items-center gap-2 ml-4 text-slate-400 font-normal">
                <span>(Click surfaces: M=Mesial, D=Distal, O=Occlusal, B=Buccal, L=Lingual)</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Odontogram;
