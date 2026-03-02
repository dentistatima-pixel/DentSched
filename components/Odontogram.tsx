import React, { useState, useEffect, useMemo, useRef } from 'react';
import { DentalChartEntry, TreatmentStatus, User } from '../types';
import { MousePointer2, Hammer, Scissors, Ghost, Activity, Crown, Search, FileText, Clock, Baby, LockKeyhole } from 'lucide-react';

interface OdontogramProps {
  chart: DentalChartEntry[];
  readOnly?: boolean;
  onToothClick: (toothNumber: number) => void; 
  onChartUpdate?: (entry: DentalChartEntry) => void;
  currentUser: User;
}

type ToolType = 'cursor' | 'exam' | 'restoration' | 'extraction' | 'missing' | 'endo' | 'crown';

interface ToolDef {
    id: ToolType;
    label: string;
    icon: React.ElementType;
    procedure: string;
    status: TreatmentStatus;
    color: string;
}

const TOOLS: ToolDef[] = [
    { id: 'cursor', label: 'Select', icon: MousePointer2, procedure: '', status: 'Existing', color: 'text-slate-800' },
    { id: 'exam', label: 'Finding', icon: Search, procedure: 'Caries', status: 'Condition', color: 'text-lilac-600' },
    { id: 'restoration', label: 'Filling', icon: Hammer, procedure: 'Composite Restoration', status: 'Planned', color: 'text-teal-600' },
    { id: 'endo', label: 'Endo', icon: Activity, procedure: 'Root Canal Therapy', status: 'Planned', color: 'text-purple-600' },
    { id: 'crown', label: 'Crown', icon: Crown, procedure: 'Zirconia Crown', status: 'Planned', color: 'text-amber-600' },
    { id: 'extraction', label: 'Extract', icon: Scissors, procedure: 'Simple Extraction (Uncomplicated)', status: 'Planned', color: 'text-red-700' },
    { id: 'missing', label: 'Missing', icon: Ghost, procedure: 'Missing', status: 'Existing', color: 'text-slate-500' },
];

const GeometricTooth: React.FC<{
    number: number;
    entries?: DentalChartEntry[]; 
    onSurfaceClick: (tooth: number, surface: string) => void;
    onToothClick: (e: React.MouseEvent, tooth: number) => void;
    readOnly?: boolean;
    isSelected?: boolean;
    isDeciduous?: boolean;
    isPatientPerspective: boolean;
}> = React.memo(({ number, entries, onSurfaceClick, onToothClick, readOnly, isSelected, isDeciduous, isPatientPerspective }) => {
    const quadrant = Math.floor(number / 10);
    const isUpper = quadrant === 1 || quadrant === 2 || quadrant === 5 || quadrant === 6;
    const isPatientRight = quadrant === 1 || quadrant === 4 || quadrant === 5 || quadrant === 8; 
    
    const toothEntries = entries || [];

    const handleClick = (e: React.MouseEvent, surface: string) => {
        e.stopPropagation();
        if (readOnly) return;
        if (window.navigator.vibrate) {
            window.navigator.vibrate(10); // Haptic feedback
        }
        onSurfaceClick(number, surface);
    };

    const colorMap: Record<string, string> = {
        'Planned': '#d946ef', // Lilac 400
        'Completed': '#2dd4bf', // Teal 400
        'Existing': '#cbd5e1', // Slate 300
        'Condition': '#ef4444', // Red 500
        'None': '#ffffff'
    };

    const getPriorityColor = (relevantEntries: DentalChartEntry[]) => {
        if (relevantEntries.length === 0) return colorMap['None'];
        const hasCondition = relevantEntries.some(e => e.status === 'Condition');
        if (hasCondition) return colorMap['Condition'];
        const hasPlanned = relevantEntries.some(e => e.status === 'Planned');
        if (hasPlanned) return colorMap['Planned'];
        const hasCompleted = relevantEntries.some(e => e.status === 'Completed');
        if (hasCompleted) return colorMap['Completed'];
        return colorMap['Existing'];
    };

    const getFill = (surfaceKey: string) => {
        const coveringEntry = toothEntries.find(e => {
             const proc = e.procedure.toLowerCase();
             return proc.includes('crown') || proc.includes('pontic') || proc.includes('veneer');
        });
        if (coveringEntry) return colorMap[coveringEntry.status] || colorMap['Existing'];
        const relevant = toothEntries.filter(e => e.surfaces && e.surfaces.includes(surfaceKey));
        return getPriorityColor(relevant);
    };
    
    const cM = getFill('M');
    const cD = getFill('D');
    const cO = getFill('O'); 
    const cB = getFill('B'); 
    const cL = getFill('L'); 
    
    const rootEntries = toothEntries.filter(e => 
        e.procedure.toLowerCase().includes('root canal') || 
        e.surfaces?.includes('R')
    );
    const cRootFill = getPriorityColor(rootEntries);

    const extractionEntry = toothEntries.find(e => 
        e.procedure.toLowerCase().includes('extraction') || 
        e.procedure.toLowerCase().includes('missing')
    );
    const isMissingOrExtracted = !!extractionEntry;
    const extractionColor = extractionEntry ? (extractionEntry.status === 'Existing' ? '#94a3b8' : '#d946ef') : '#d946ef';

    const hasRootCanal = toothEntries.some(e => e.procedure.toLowerCase().includes('root canal'));

    let pTop, pBottom, pLeft, pRight, sTop, sBottom, sLeft, sRight;
    
    if (isUpper) { pTop = cB; sTop = 'B'; pBottom = cL; sBottom = 'L'; } 
    else { pTop = cL; sTop = 'L'; pBottom = cB; sBottom = 'B'; }

    if (isPatientRight) { pLeft = cD; sLeft = 'D'; pRight = cM; sRight = 'M'; } 
    else { pLeft = cM; sLeft = 'M'; pRight = cD; sRight = 'D'; }

    const strokeColor = isSelected ? "#0d9488" : "#e2e8f0"; 
    const strokeWidth = isSelected ? "3" : "1";

    const u_root = "M30 0 L70 0 L70 15 L30 15 Z";
    const u_top = "M0 15 L100 15 L70 38 L30 38 Z";
    const u_btm = "M0 100 L100 100 L70 77 L30 77 Z";
    const u_lft = "M0 15 L0 100 L30 77 L30 38 Z";
    const u_rgt = "M100 15 L100 100 L70 77 L70 38 Z";
    const u_ctr = "M30 38 L70 38 L70 77 L30 77 Z";
    const u_cross = "M0 15 L100 100 M100 15 L0 100";

    const l_root = "M30 85 L70 85 L70 100 L30 100 Z";
    const l_top = "M0 0 L100 0 L70 23 L30 23 Z";
    const l_btm = "M0 85 L100 85 L70 62 L30 62 Z";
    const l_lft = "M0 0 L0 85 L30 62 L30 23 Z";
    const l_rgt = "M100 0 L100 85 L70 62 L70 23 Z";
    const l_ctr = "M30 23 L70 23 L70 62 L30 62 Z";
    const l_cross = "M0 0 L100 85 M100 0 L0 85";

    return (
        <div 
            role="button"
            aria-label={`Tooth #${number}, ${toothEntries.length} clinical records`}
            className={`flex flex-col items-center justify-center relative transition-all duration-500 touch-manipulation select-none ${!readOnly ? "hover:scale-105 active:scale-95" : ""} ${isSelected ? 'z-10 scale-110' : ''}`}
            style={{ width: isDeciduous ? '48px' : '64px', height: isDeciduous ? '60px' : '80px', minWidth: isDeciduous ? '48px' : '64px' }}
            onClick={(e) => !readOnly && onToothClick(e, number)}
        >
            <span className={`font-black font-mono absolute transition-all duration-500 ${isUpper ? '-top-3' : '-bottom-3'} ${isSelected ? 'text-teal-700 bg-teal-50 px-3 py-1 rounded-full shadow-lg border border-teal-100 scale-110 z-20' : 'text-slate-400'} text-sm ${isPatientPerspective ? 'scale-x-[-1]' : ''}`} aria-hidden="true">
                {number}
            </span>
            <div className={`w-full h-full relative transition-all duration-500 ${isSelected ? 'drop-shadow-[0_0_15px_rgba(20,184,166,0.3)]' : ''}`}>
                <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                    {isUpper ? (
                        <>
                            <g onClick={(e) => handleClick(e, 'R')} role="button" aria-label={`Tooth ${number} Root segment`}>
                                <path d={u_root} fill={cRootFill} stroke={strokeColor} strokeWidth={strokeWidth} className="transition-colors duration-300" />
                                {hasRootCanal && <line x1="50" y1="0" x2="50" y2="15" stroke="white" strokeWidth="2" />}
                            </g>
                            <path d={u_top} fill={pTop} stroke={strokeColor} strokeWidth={strokeWidth} onClick={(e) => handleClick(e, sTop)} role="button" className="transition-colors duration-300" />
                            <path d={u_rgt} fill={pRight} stroke={strokeColor} strokeWidth={strokeWidth} onClick={(e) => handleClick(e, sRight)} role="button" className="transition-colors duration-300" />
                            <path d={u_btm} fill={pBottom} stroke={strokeColor} strokeWidth={strokeWidth} onClick={(e) => handleClick(e, sBottom)} role="button" className="transition-colors duration-300" />
                            <path d={u_lft} fill={pLeft} stroke={strokeColor} strokeWidth={strokeWidth} onClick={(e) => handleClick(e, sLeft)} role="button" className="transition-colors duration-300" />
                            <path d={u_ctr} fill={cO} stroke={strokeColor} strokeWidth={strokeWidth} onClick={(e) => handleClick(e, 'O')} role="button" className="transition-colors duration-300" />
                            {isMissingOrExtracted && <path d={u_cross} stroke={extractionColor} strokeWidth="6" opacity="0.8" className="animate-in fade-in" />}
                        </>
                    ) : (
                        <>
                            <g onClick={(e) => handleClick(e, 'R')} role="button" aria-label={`Tooth ${number} Root segment`}>
                                <path d={l_root} fill={cRootFill} stroke={strokeColor} strokeWidth={strokeWidth} className="transition-colors duration-300" />
                                {hasRootCanal && <line x1="50" y1="85" x2="50" y2="100" stroke="white" strokeWidth="2" />}
                            </g>
                            <path d={l_top} fill={pTop} stroke={strokeColor} strokeWidth={strokeWidth} onClick={(e) => handleClick(e, sTop)} role="button" className="transition-colors duration-300" />
                            <path d={l_rgt} fill={pRight} stroke={strokeColor} strokeWidth={strokeWidth} onClick={(e) => handleClick(e, sRight)} role="button" className="transition-colors duration-300" />
                            <path d={l_btm} fill={pBottom} stroke={strokeColor} strokeWidth={strokeWidth} onClick={(e) => handleClick(e, sBottom)} role="button" className="transition-colors duration-300" />
                            <path d={l_lft} fill={pLeft} stroke={strokeColor} strokeWidth={strokeWidth} onClick={(e) => handleClick(e, sLeft)} role="button" className="transition-colors duration-300" />
                            <path d={l_ctr} fill={cO} stroke={strokeColor} strokeWidth={strokeWidth} onClick={(e) => handleClick(e, 'O')} role="button" className="transition-colors duration-300" />
                            {isMissingOrExtracted && <path d={l_cross} stroke={extractionColor} strokeWidth="6" opacity="0.8" className="animate-in fade-in" />}
                        </>
                    )}
                </svg>
            </div>
        </div>
    )
}, (prev, next) => {
    return prev.number === next.number &&
           prev.isSelected === next.isSelected &&
           prev.readOnly === next.readOnly &&
           prev.isDeciduous === next.isDeciduous &&
           prev.isPatientPerspective === next.isPatientPerspective &&
           JSON.stringify(prev.entries) === JSON.stringify(next.entries);
});

const OdontogramComponent: React.FC<OdontogramProps> = ({ chart, readOnly, onToothClick, onChartUpdate, currentUser }) => {
  const [activeToolId, setActiveToolId] = useState<ToolType>('cursor');
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null); 
  const [showBaseline, setShowBaseline] = useState(false); 
  const [dentitionMode, setDentitionMode] = useState<'Permanent' | 'Mixed'>('Permanent');
  
  const [contextMenu, setContextMenu] = useState<{ tooth: number; x: number; y: number } | null>(null);
  const [scale, setScale] = useState(1);
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;
    
    let animationFrameId: number;
    
    const observer = new ResizeObserver((entries) => {
      // Debounce with requestAnimationFrame to prevent "ResizeObserver loop limit exceeded"
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      
      animationFrameId = requestAnimationFrame(() => {
        for (let entry of entries) {
          const width = entry.contentRect.width;
          // Base width for full arch is roughly 1100px
          const newScale = Math.min(1, (width - 32) / 1100);
          setScale(newScale);
        }
      });
    });
    
    observer.observe(chartRef.current);
    return () => {
      observer.disconnect();
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const activeTool = TOOLS.find(t => t.id === activeToolId) || TOOLS[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
        if (contextMenu && chartRef.current && !chartRef.current.contains(e.target as Node)) {
            setContextMenu(null);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [contextMenu]);

  const filteredChart = useMemo(() => {
      if (!showBaseline) return chart;
      return chart.filter(e => e.isBaseline || e.status === 'Existing');
  }, [chart, showBaseline]);

  const q1 = [18, 17, 16, 15, 14, 13, 12, 11];
  const q2 = [21, 22, 23, 24, 25, 26, 27, 28];
  const q4 = [48, 47, 46, 45, 44, 43, 42, 41];
  const q3 = [31, 32, 33, 34, 35, 36, 37, 38];

  const dq5 = [55, 54, 53, 52, 51];
  const dq6 = [61, 62, 63, 64, 65];
  const dq8 = [85, 84, 83, 82, 81];
  const dq7 = [71, 72, 73, 74, 75];

  const getToothData = (number: number) => filteredChart.filter(e => e.toothNumber === number);

  const handleToothClick = (e: React.MouseEvent, tooth: number) => {
    e.stopPropagation();
    if (activeToolId !== 'cursor') {
        return;
    }
    setSelectedTooth(tooth);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const chartRect = chartRef.current?.getBoundingClientRect();
    if (chartRect) {
        setContextMenu({
            tooth,
            x: rect.left - chartRect.left + rect.width / 2,
            y: rect.top - chartRect.top + rect.height,
        });
    }
  };

  const handleSurfaceClick = (tooth: number, surface: string) => {
      if (activeToolId === 'cursor') {
          setSelectedTooth(selectedTooth === tooth ? null : tooth);
          return;
      }
      
      if (onChartUpdate && currentUser) {
          const newEntry: DentalChartEntry = {
              id: `dc_${Date.now()}`,
              toothNumber: tooth,
              procedure: activeTool.procedure,
              status: activeTool.status,
              surfaces: ['extraction', 'missing', 'crown', 'endo'].includes(activeToolId) ? undefined : surface,
              date: new Date().toISOString().split('T')[0],
              price: 0,
              author: currentUser.name,
              authorId: currentUser.id,
              authorRole: currentUser.role,
              authorPrc: currentUser.prcLicense,
          };
          onChartUpdate(newEntry);
      }
  };

  return (
    <div className="flex flex-col gap-6 relative h-full">
        <div className="flex justify-between items-center bg-white/80 backdrop-blur-xl p-3 rounded-[2rem] gap-4 border border-teal-50 shadow-[0_8px_30px_rgba(0,0,0,0.04)] sticky top-0 z-50">
             {!readOnly && (
                <div className="flex gap-2.5 overflow-x-auto no-scrollbar px-1 py-1" role="toolbar" aria-label="Clinical charting palette">
                    {TOOLS.map(tool => (
                        <button 
                            key={tool.id} 
                            onClick={() => { setActiveToolId(tool.id); setSelectedTooth(null); setContextMenu(null); }} 
                            className={`flex flex-col items-center justify-center p-2.5 rounded-2xl min-w-[72px] transition-all duration-500 border-2 ${activeToolId === tool.id ? 'bg-teal-900 border-teal-900 text-white shadow-2xl shadow-teal-900/40 -translate-y-1.5' : 'bg-slate-50 border-transparent text-slate-400 hover:bg-white hover:border-teal-100 hover:text-slate-700'}`}
                            aria-pressed={activeToolId === tool.id}
                            aria-label={`Charting tool: ${tool.label}`}
                        >
                            <tool.icon size={22} className={activeToolId === tool.id ? 'text-teal-400' : 'transition-colors'} />
                            <span className="text-xs font-black uppercase tracking-widest mt-2 leading-none">{tool.label}</span>
                        </button>
                    ))}
                </div>
             )}
             
             <div className="flex gap-3 ml-auto items-center">
                 <div className="bg-slate-50 rounded-2xl p-1.5 border-2 border-slate-100 flex shadow-inner gap-1" role="group" aria-label="Arch dentition mode">
                    <button onClick={() => setDentitionMode('Permanent')} className={`px-5 py-2 rounded-xl text-xs font-black transition-all duration-300 ${dentitionMode === 'Permanent' ? 'bg-white text-teal-800 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>ADULT</button>
                    <button onClick={() => setDentitionMode('Mixed')} className={`px-5 py-2 rounded-xl text-xs font-black transition-all duration-300 flex items-center gap-2 ${dentitionMode === 'Mixed' ? 'bg-white text-lilac-800 shadow-xl' : 'text-slate-400 hover:text-lilac-600'}`}><Baby size={12}/> MIXED</button>
                 </div>
                 
                 <button 
                    onClick={() => setShowBaseline(!showBaseline)}
                    className={`flex items-center gap-3 px-5 py-3 rounded-2xl text-xs font-black tracking-[0.2em] transition-all duration-500 border-2 shadow-sm ${showBaseline ? 'bg-amber-50 border-amber-300 text-amber-900 ring-4 ring-amber-500/5' : 'bg-white border-slate-100 text-slate-500'}`}
                 >
                     <Clock size={14}/> {showBaseline ? 'BASELINE' : 'ACTIVE'}
                 </button>
             </div>
        </div>

        <div 
          ref={chartRef}
          className="bg-white rounded-[4rem] border-4 border-white overflow-hidden shadow-[inset_0_2px_15px_rgba(0,0,0,0.02),0_10px_40px_rgba(0,0,0,0.03)] relative min-h-[600px] flex flex-col justify-center items-center transition-all duration-700 group/canvas"
          role="img"
          aria-label="Clinical Odontogram"
        >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#f0fdfa_0%,#ffffff_100%)] opacity-40 pointer-events-none" />

            {readOnly && (
                <div className="absolute inset-0 z-[60] bg-slate-900/10 backdrop-blur-md flex items-center justify-center p-12 text-center animate-in fade-in duration-700">
                    <div className="bg-white p-12 rounded-[4rem] shadow-2xl border-4 border-red-50 max-w-sm flex flex-col items-center justify-center animate-in zoom-in-95">
                        <div className="w-24 h-24 bg-red-50 text-red-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-red-600/10 animate-pulse">
                            <LockKeyhole size={48} />
                        </div>
                        <h4 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-4 leading-none">Security Lock</h4>
                        <p className="text-sm text-slate-500 font-bold leading-relaxed uppercase tracking-widest">
                            Clinical data processing restricted by statutory governance (PDA).
                        </p>
                    </div>
                </div>
            )}

            <div className="w-full overflow-hidden flex justify-center px-4">
                <div 
                  style={{ 
                    transform: `scale(${scale})`, 
                    transformOrigin: 'top center',
                    marginBottom: `-${(1 - scale) * 400}px` // Compensate for scale height
                  }}
                  className="flex flex-col gap-8 items-center py-16 transition-all duration-500"
                >
                    {/* UPPER ARCH */}
                    <div className="flex flex-col items-center gap-2">
                        <div className="flex justify-center items-end">
                            {q1.map(t => <GeometricTooth key={t} number={t} entries={getToothData(t)} readOnly={readOnly} onSurfaceClick={handleSurfaceClick} onToothClick={handleToothClick} isSelected={selectedTooth === t} isDeciduous={false} isPatientPerspective={false} />)}
                            <div className="w-px h-16 bg-slate-200 mx-1" />
                            {q2.map(t => <GeometricTooth key={t} number={t} entries={getToothData(t)} readOnly={readOnly} onSurfaceClick={handleSurfaceClick} onToothClick={handleToothClick} isSelected={selectedTooth === t} isDeciduous={false} isPatientPerspective={false} />)}
                        </div>
                        {dentitionMode === 'Mixed' && (
                            <div className="flex justify-center items-start mt-2">
                                {dq5.map(t => <GeometricTooth key={t} number={t} entries={getToothData(t)} readOnly={readOnly} onSurfaceClick={handleSurfaceClick} onToothClick={handleToothClick} isSelected={selectedTooth === t} isDeciduous={true} isPatientPerspective={false} />)}
                                <div className="w-px h-8 bg-slate-200 mx-1" />
                                {dq6.map(t => <GeometricTooth key={t} number={t} entries={getToothData(t)} readOnly={readOnly} onSurfaceClick={handleSurfaceClick} onToothClick={handleToothClick} isSelected={selectedTooth === t} isDeciduous={true} isPatientPerspective={false} />)}
                            </div>
                        )}
                    </div>

                    {/* LOWER ARCH */}
                    <div className="flex flex-col items-center gap-2">
                        {dentitionMode === 'Mixed' && (
                            <div className="flex justify-center items-end mb-2">
                                {dq8.map(t => <GeometricTooth key={t} number={t} entries={getToothData(t)} readOnly={readOnly} onSurfaceClick={handleSurfaceClick} onToothClick={handleToothClick} isSelected={selectedTooth === t} isDeciduous={true} isPatientPerspective={false} />)}
                                <div className="w-px h-8 bg-slate-200 mx-1" />
                                {dq7.map(t => <GeometricTooth key={t} number={t} entries={getToothData(t)} readOnly={readOnly} onSurfaceClick={handleSurfaceClick} onToothClick={handleToothClick} isSelected={selectedTooth === t} isDeciduous={true} isPatientPerspective={false} />)}
                            </div>
                        )}
                        <div className="flex justify-center items-start">
                            {q4.map(t => <GeometricTooth key={t} number={t} entries={getToothData(t)} readOnly={readOnly} onSurfaceClick={handleSurfaceClick} onToothClick={handleToothClick} isSelected={selectedTooth === t} isDeciduous={false} isPatientPerspective={false} />)}
                            <div className="w-px h-16 bg-slate-200 mx-1" />
                            {q3.map(t => <GeometricTooth key={t} number={t} entries={getToothData(t)} readOnly={readOnly} onSurfaceClick={handleSurfaceClick} onToothClick={handleToothClick} isSelected={selectedTooth === t} isDeciduous={false} isPatientPerspective={false} />)}
                        </div>
                    </div>
                </div>
            </div>

            {contextMenu && (
                <div 
                  className={`absolute z-[70] bg-white/80 backdrop-blur-2xl rounded-2xl shadow-[0_40px_100px_rgba(0,0,0,0.18)] border border-slate-200 animate-in fade-in zoom-in-95 duration-300 overflow-hidden`}
                  style={{ top: contextMenu.y, left: contextMenu.x, transform: 'translateX(-50%)' }}
                  role="menu"
                >
                    <button onClick={() => { onToothClick(contextMenu.tooth); setContextMenu(null); }} className={`flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-teal-50 w-full text-left`}><FileText size={16}/> View Details</button>
                </div>
            )}
        </div>
    </div>
  );
};

export const Odontogram = React.memo(OdontogramComponent);