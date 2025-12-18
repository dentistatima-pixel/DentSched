
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { DentalChartEntry, TreatmentStatus } from '../types';
import { MousePointer2, Hammer, Scissors, Ghost, Activity, Crown, Search, Check, X, ZoomIn, FileText, ArrowRight, MoreHorizontal, CheckCircle, Clock } from 'lucide-react';

interface OdontogramProps {
  chart: DentalChartEntry[];
  readOnly?: boolean;
  onToothClick: (toothNumber: number) => void; 
  onChartUpdate?: (entry: DentalChartEntry) => void;
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
    { id: 'cursor', label: 'Select', icon: MousePointer2, procedure: '', status: 'Existing', color: 'text-slate-600' },
    { id: 'exam', label: 'Condition', icon: Search, procedure: 'Caries', status: 'Planned', color: 'text-red-500' },
    { id: 'restoration', label: 'Filling', icon: Hammer, procedure: 'Composite Restoration', status: 'Completed', color: 'text-blue-500' },
    { id: 'endo', label: 'Endo', icon: Activity, procedure: 'Root Canal', status: 'Planned', color: 'text-purple-500' },
    { id: 'crown', label: 'Crown', icon: Crown, procedure: 'Crown', status: 'Planned', color: 'text-amber-500' },
    { id: 'extraction', label: 'Extract', icon: Scissors, procedure: 'Extraction', status: 'Planned', color: 'text-red-600' },
    { id: 'missing', label: 'Missing', icon: Ghost, procedure: 'Missing', status: 'Existing', color: 'text-slate-400' },
];

const GeometricTooth: React.FC<{
    number: number;
    entries?: DentalChartEntry[]; 
    onSurfaceClick: (tooth: number, surface: string) => void;
    onLongPress: (tooth: number) => void;
    readOnly?: boolean;
    isZoomed?: boolean;
    isSelected?: boolean;
}> = ({ number, entries, onSurfaceClick, onLongPress, readOnly, isZoomed, isSelected }) => {
    const quadrant = Math.floor(number / 10);
    const isUpper = quadrant === 1 || quadrant === 2;
    const isPatientRight = quadrant === 1 || quadrant === 4; 
    
    const toothEntries = entries || [];

    const timerRef = useRef<any>(null);
    const isLongPress = useRef(false);

    const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
        if (readOnly) return;
        isLongPress.current = false;
        timerRef.current = setTimeout(() => {
            isLongPress.current = true;
            onLongPress(number);
        }, 500);
    };

    const handleEnd = (e: React.MouseEvent | React.TouchEvent) => {
        if (readOnly) return;
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    };

    const handleClick = (e: React.MouseEvent, surface: string) => {
        e.stopPropagation();
        if (readOnly) return;
        if (isLongPress.current) return; 
        onSurfaceClick(number, surface);
    };

    const colorMap: Record<string, string> = {
        'Planned': '#ef4444',
        'Completed': '#10b981',
        'Existing': '#3b82f6',
        'Condition': '#f59e0b',
        'None': '#f8fafc'
    };

    const getPriorityColor = (relevantEntries: DentalChartEntry[]) => {
        if (relevantEntries.length === 0) return colorMap['None'];
        const hasPlanned = relevantEntries.some(e => e.status === 'Planned');
        if (hasPlanned) return colorMap['Planned'];
        const hasCompleted = relevantEntries.some(e => e.status === 'Completed');
        if (hasCompleted) return colorMap['Completed'];
        const hasCondition = relevantEntries.some(e => e.status === 'Condition');
        if (hasCondition) return colorMap['Condition'];
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
    const extractionColor = extractionEntry ? (extractionEntry.status === 'Existing' ? '#3b82f6' : '#ef4444') : '#ef4444';

    const hasRootCanal = toothEntries.some(e => e.procedure.toLowerCase().includes('root canal'));

    let pTop, pBottom, pLeft, pRight, sTop, sBottom, sLeft, sRight;
    
    if (isUpper) { pTop = cB; sTop = 'B'; pBottom = cL; sBottom = 'L'; } 
    else { pTop = cL; sTop = 'L'; pBottom = cB; sBottom = 'B'; }

    if (isPatientRight) { pLeft = cD; sLeft = 'D'; pRight = cM; sRight = 'M'; } 
    else { pLeft = cM; sLeft = 'M'; pRight = cD; sRight = 'D'; }

    const strokeColor = isSelected ? "#0d9488" : "#94a3b8"; 
    const strokeWidth = isSelected ? "3" : (isZoomed ? "1" : "1.5");

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
            className={`flex flex-col items-center justify-center relative transition-transform touch-manipulation select-none ${!readOnly && !isZoomed ? "hover:scale-105 active:scale-95" : ""} ${isSelected ? 'z-10 scale-110' : ''}`}
            style={{ width: isZoomed ? '240px' : '64px', height: isZoomed ? '300px' : '80px', minWidth: isZoomed ? '240px' : '64px' }} 
            onMouseDown={handleStart} onMouseUp={handleEnd} onMouseLeave={handleEnd} onTouchStart={handleStart} onTouchEnd={handleEnd}
        >
            <span className={`font-bold font-mono absolute ${isUpper ? '-top-1' : '-bottom-1'} transition-colors ${isSelected ? 'text-teal-600 bg-teal-50 px-1 rounded' : 'text-slate-500'} ${isZoomed ? 'text-xl' : 'text-[11px]'}`}>
                {number}
            </span>
            <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                {isUpper ? (
                    <>
                        <g onClick={(e) => handleClick(e, 'R')}>
                            <path d={u_root} fill={cRootFill} stroke={strokeColor} strokeWidth={strokeWidth} />
                            {hasRootCanal && <line x1="50" y1="0" x2="50" y2="15" stroke="white" strokeWidth="2" />}
                        </g>
                        <path d={u_top} fill={pTop} stroke={strokeColor} strokeWidth={strokeWidth} onClick={(e) => handleClick(e, sTop)} />
                        <path d={u_rgt} fill={pRight} stroke={strokeColor} strokeWidth={strokeWidth} onClick={(e) => handleClick(e, sRight)} />
                        <path d={u_btm} fill={pBottom} stroke={strokeColor} strokeWidth={strokeWidth} onClick={(e) => handleClick(e, sBottom)} />
                        <path d={u_lft} fill={pLeft} stroke={strokeColor} strokeWidth={strokeWidth} onClick={(e) => handleClick(e, sLeft)} />
                        <path d={u_ctr} fill={cO} stroke={strokeColor} strokeWidth={strokeWidth} onClick={(e) => handleClick(e, 'O')} />
                        {isMissingOrExtracted && <path d={u_cross} stroke={extractionColor} strokeWidth="4" opacity="0.8" />}
                    </>
                ) : (
                    <>
                        <g onClick={(e) => handleClick(e, 'R')}>
                            <path d={l_root} fill={cRootFill} stroke={strokeColor} strokeWidth={strokeWidth} />
                            {hasRootCanal && <line x1="50" y1="85" x2="50" y2="100" stroke="white" strokeWidth="2" />}
                        </g>
                        <path d={l_top} fill={pTop} stroke={strokeColor} strokeWidth={strokeWidth} onClick={(e) => handleClick(e, sTop)} />
                        <path d={l_rgt} fill={pRight} stroke={strokeColor} strokeWidth={strokeWidth} onClick={(e) => handleClick(e, sRight)} />
                        <path d={l_btm} fill={pBottom} stroke={strokeColor} strokeWidth={strokeWidth} onClick={(e) => handleClick(e, sBottom)} />
                        <path d={l_lft} fill={pLeft} stroke={strokeColor} strokeWidth={strokeWidth} onClick={(e) => handleClick(e, sLeft)} />
                        <path d={l_ctr} fill={cO} stroke={strokeColor} strokeWidth={strokeWidth} onClick={(e) => handleClick(e, 'O')} />
                        {isMissingOrExtracted && <path d={l_cross} stroke={extractionColor} strokeWidth="4" opacity="0.8" />}
                    </>
                )}
            </svg>
        </div>
    )
}

const Odontogram: React.FC<OdontogramProps> = ({ chart, readOnly, onToothClick, onChartUpdate }) => {
  const [activeToolId, setActiveToolId] = useState<ToolType>('cursor');
  const [zoomedTooth, setZoomedTooth] = useState<number | null>(null);
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null); 
  const [showBaseline, setShowBaseline] = useState(false); // NEW: Time-travel
  const [stagedSurfaces, setStagedSurfaces] = useState<string[]>([]);

  const activeTool = TOOLS.find(t => t.id === activeToolId) || TOOLS[0];

  // Filtering for Time-Travel logic
  const filteredChart = useMemo(() => {
      if (!showBaseline) return chart;
      return chart.filter(e => e.isBaseline || e.status === 'Existing');
  }, [chart, showBaseline]);

  const q1 = [18, 17, 16, 15, 14, 13, 12, 11];
  const q2 = [21, 22, 23, 24, 25, 26, 27, 28];
  const q4 = [48, 47, 46, 45, 44, 43, 42, 41];
  const q3 = [31, 32, 33, 34, 35, 36, 37, 38];

  const getToothData = (number: number) => filteredChart.filter(e => e.toothNumber === number);

  useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
          if (selectedTooth && !(e.target as HTMLElement).closest('.tooth-popover') && !(e.target as HTMLElement).closest('.tooth-component')) {
              setSelectedTooth(null);
          }
      };
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
  }, [selectedTooth]);

  const handleSurfaceClick = (tooth: number, surface: string) => {
      if (activeToolId === 'cursor') {
          setSelectedTooth(selectedTooth === tooth ? null : tooth);
          return;
      }
      
      if (onChartUpdate) {
          const newEntry: DentalChartEntry = {
              id: `dc_${Date.now()}`,
              toothNumber: tooth,
              procedure: activeTool.procedure,
              status: activeTool.status,
              surfaces: ['extraction', 'missing', 'crown', 'endo'].includes(activeToolId) ? undefined : surface,
              date: new Date().toISOString().split('T')[0],
              price: 0
          };
          onChartUpdate(newEntry);
      }
  };

  const handleLongPress = (tooth: number) => { setZoomedTooth(tooth); setSelectedTooth(null); setStagedSurfaces([]); };
  const handleZoomClick = (tooth: number, surface: string) => { setStagedSurfaces(prev => prev.includes(surface) ? prev.filter(s => s !== surface) : [...prev, surface]); };

  const handleZoomSave = () => {
      if (zoomedTooth && onChartUpdate && stagedSurfaces.length > 0) {
          const order = ['M', 'O', 'D', 'B', 'L', 'R'];
          const sorted = stagedSurfaces.sort((a,b) => order.indexOf(a) - order.indexOf(b)).join('');
          const newEntry: DentalChartEntry = {
              id: `dc_${Date.now()}`, toothNumber: zoomedTooth, procedure: activeToolId === 'cursor' ? 'Restoration' : activeTool.procedure,
              status: activeToolId === 'cursor' ? 'Planned' : activeTool.status, surfaces: sorted, date: new Date().toISOString().split('T')[0], price: 0
          };
          onChartUpdate(newEntry);
      }
      setZoomedTooth(null); setStagedSurfaces([]);
  };

  return (
    <div className="flex flex-col gap-4 relative">
        <div className="flex justify-between items-center bg-slate-100 p-2 rounded-xl">
             {!readOnly && (
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                    {TOOLS.map(tool => (
                        <button key={tool.id} onClick={() => { setActiveToolId(tool.id); setSelectedTooth(null); }} className={`flex flex-col items-center justify-center p-2 rounded-lg min-w-[60px] transition-all ${activeToolId === tool.id ? 'bg-white text-slate-900 shadow-sm scale-105' : 'text-slate-400 hover:text-slate-600'}`}>
                            <tool.icon size={18} className={activeToolId === tool.id ? tool.color : ''} />
                            <span className="text-[10px] font-bold mt-1">{tool.label}</span>
                        </button>
                    ))}
                </div>
             )}
             
             {/* TIME TRAVEL TOGGLE */}
             <button 
                onClick={() => setShowBaseline(!showBaseline)}
                className={`ml-auto flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${showBaseline ? 'bg-amber-100 border-amber-300 text-amber-800' : 'bg-white border-slate-200 text-slate-600'}`}
             >
                 <Clock size={14}/> {showBaseline ? 'VIEWING ADMISSION STATE' : 'VIEWING CURRENT STATE'}
             </button>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 overflow-x-auto shadow-inner bg-slate-50/50 relative min-h-[300px] flex flex-col justify-center">
            <div className="min-w-[700px] flex flex-col gap-6 items-center py-4">
                <div className="flex flex-col items-center w-full">
                    <div className="flex gap-8 pb-4 border-b-2 border-slate-200 w-full justify-center">
                        <div className="flex gap-1">{q1.map(t => <div key={t} className="tooth-component"><GeometricTooth number={t} entries={getToothData(t)} readOnly={readOnly} onSurfaceClick={handleSurfaceClick} onLongPress={handleLongPress} isSelected={selectedTooth === t} /></div>)}</div>
                        <div className="w-0.5 bg-slate-300 h-20 self-end"></div>
                        <div className="flex gap-1">{q2.map(t => <div key={t} className="tooth-component"><GeometricTooth number={t} entries={getToothData(t)} readOnly={readOnly} onSurfaceClick={handleSurfaceClick} onLongPress={handleLongPress} isSelected={selectedTooth === t} /></div>)}</div>
                    </div>
                </div>
                <div className="flex flex-col items-center w-full">
                    <div className="flex gap-8 pt-2 border-t-2 border-slate-200 w-full justify-center">
                        <div className="flex gap-1">{q4.map(t => <div key={t} className="tooth-component"><GeometricTooth number={t} entries={getToothData(t)} readOnly={readOnly} onSurfaceClick={handleSurfaceClick} onLongPress={handleLongPress} isSelected={selectedTooth === t} /></div>)}</div>
                        <div className="w-0.5 bg-slate-300 h-20 self-start"></div>
                        <div className="flex gap-1">{q3.map(t => <div key={t} className="tooth-component"><GeometricTooth number={t} entries={getToothData(t)} readOnly={readOnly} onSurfaceClick={handleSurfaceClick} onLongPress={handleLongPress} isSelected={selectedTooth === t} /></div>)}</div>
                    </div>
                </div>
            </div>

            {selectedTooth && (
                <div className="tooth-popover absolute z-30 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                    <div className="bg-teal-900 text-white px-4 py-3 flex justify-between items-center"><h4 className="font-bold">Tooth #{selectedTooth}</h4><button onClick={() => setSelectedTooth(null)} className="hover:bg-white/20 p-1 rounded-full"><X size={14}/></button></div>
                    <div className="max-h-48 overflow-y-auto p-1">
                        {getToothData(selectedTooth).length > 0 ? getToothData(selectedTooth).slice(0, 3).map((entry, i) => (
                            <div key={i} className="p-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 flex justify-between items-start group">
                                <div><div className="text-xs font-bold text-slate-800">{entry.procedure}</div><div className="flex items-center gap-2 mt-1"><span className={`w-2 h-2 rounded-full ${entry.status === 'Completed' ? 'bg-green-500' : entry.status === 'Planned' ? 'bg-red-500' : 'bg-blue-500'}`} /><span className="text-[10px] text-slate-500 uppercase">{entry.status}</span></div></div>
                            </div>
                        )) : <div className="p-4 text-center text-xs text-slate-400 italic">No records.</div>}
                    </div>
                    <div className="bg-slate-50 p-2 border-t border-slate-100"><button onClick={() => onToothClick(selectedTooth)} className="w-full py-2 text-xs font-bold text-slate-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg flex items-center justify-center gap-2 transition-colors"><FileText size={14} /> Full History</button></div>
                </div>
            )}
        </div>
    </div>
  );
};

export default Odontogram;
