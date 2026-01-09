import React, { useState, useRef, useEffect, useMemo } from 'react';
import { DentalChartEntry, TreatmentStatus } from '../types';
import { formatDate } from '../constants';
import { MousePointer2, Hammer, Scissors, Ghost, Activity, Crown, Search, Check, X, ZoomIn, FileText, ArrowRight, MoreHorizontal, CheckCircle, Clock, Baby, FlipHorizontal, Maximize2, Minimize2, ShieldAlert, LockKeyhole } from 'lucide-react';

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
    { id: 'cursor', label: 'Select', icon: MousePointer2, procedure: '', status: 'Existing', color: 'text-slate-800' },
    { id: 'exam', label: 'Condition', icon: Search, procedure: 'Caries', status: 'Planned', color: 'text-lilac-600' },
    { id: 'restoration', label: 'Filling', icon: Hammer, procedure: 'Composite Restoration', status: 'Completed', color: 'text-teal-600' },
    { id: 'endo', label: 'Endo', icon: Activity, procedure: 'Root Canal', status: 'Planned', color: 'text-purple-600' },
    { id: 'crown', label: 'Crown', icon: Crown, procedure: 'Crown', status: 'Planned', color: 'text-amber-600' },
    { id: 'extraction', label: 'Extract', icon: Scissors, procedure: 'Extraction', status: 'Planned', color: 'text-red-700' },
    { id: 'missing', label: 'Missing', icon: Ghost, procedure: 'Missing', status: 'Existing', color: 'text-slate-500' },
];

const GeometricTooth: React.FC<{
    number: number;
    entries?: DentalChartEntry[]; 
    onSurfaceClick: (tooth: number, surface: string) => void;
    onLongPress: (tooth: number) => void;
    readOnly?: boolean;
    isZoomed?: boolean;
    isSelected?: boolean;
    isDeciduous?: boolean;
}> = ({ number, entries, onSurfaceClick, onLongPress, readOnly, isZoomed, isSelected, isDeciduous }) => {
    const quadrant = Math.floor(number / 10);
    const isUpper = quadrant === 1 || quadrant === 2 || quadrant === 5 || quadrant === 6;
    const isPatientRight = quadrant === 1 || quadrant === 4 || quadrant === 5 || quadrant === 8; 
    
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
        'Planned': '#c026d3', 
        'Completed': '#14b8a6', 
        'Existing': '#3b82f6', 
        'Condition': '#ef4444', 
        'None': '#f8fafc'
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
    const extractionColor = extractionEntry ? (extractionEntry.status === 'Existing' ? '#3b82f6' : '#c026d3') : '#c026d3';

    const hasRootCanal = toothEntries.some(e => e.procedure.toLowerCase().includes('root canal'));

    let pTop, pBottom, pLeft, pRight, sTop, sBottom, sLeft, sRight;
    
    if (isUpper) { pTop = cB; sTop = 'B'; pBottom = cL; sBottom = 'L'; } 
    else { pTop = cL; sTop = 'L'; pBottom = cB; sBottom = 'B'; }

    if (isPatientRight) { pLeft = cD; sLeft = 'D'; pRight = cM; sRight = 'M'; } 
    else { pLeft = cM; sLeft = 'M'; pRight = cD; sRight = 'D'; }

    const strokeColor = isSelected ? "#0d9488" : "#cbd5e1"; 
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
            role="button"
            aria-label={`Tooth #${number}, ${toothEntries.length} clinical records`}
            className={`flex flex-col items-center justify-center relative transition-transform touch-manipulation select-none ${!readOnly && !isZoomed ? "hover:scale-105 active:scale-95" : ""} ${isSelected ? 'z-10 scale-110' : ''}`}
            style={{ width: isZoomed ? '120px' : isDeciduous ? '42px' : '52px', height: isZoomed ? '150px' : isDeciduous ? '52px' : '64px' }} 
            onMouseDown={handleStart} onMouseUp={handleEnd} onMouseLeave={handleEnd} onTouchStart={handleStart} onTouchEnd={handleEnd}
        >
            <span className={`font-black font-mono absolute ${isUpper ? '-top-2' : '-bottom-2'} transition-colors ${isSelected ? 'text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full shadow-sm' : 'text-slate-500'} ${isZoomed ? 'text-lg' : 'text-[9px]'}`} aria-hidden="true">
                {number}
            </span>
            <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                {isUpper ? (
                    <>
                        <g onClick={(e) => handleClick(e, 'R')} role="button" aria-label={`Tooth ${number} Root segment`}>
                            <path d={u_root} fill={cRootFill} stroke={strokeColor} strokeWidth={strokeWidth} />
                            {hasRootCanal && <line x1="50" y1="0" x2="50" y2="15" stroke="white" strokeWidth="2" />}
                        </g>
                        <path d={u_top} fill={pTop} stroke={strokeColor} strokeWidth={strokeWidth} onClick={(e) => handleClick(e, sTop)} role="button" aria-label={`Tooth ${number} ${sTop} surface`} />
                        <path d={u_rgt} fill={pRight} stroke={strokeColor} strokeWidth={strokeWidth} onClick={(e) => handleClick(e, sRight)} role="button" aria-label={`Tooth ${number} ${sRight} surface`} />
                        <path d={u_btm} fill={pBottom} stroke={strokeColor} strokeWidth={strokeWidth} onClick={(e) => handleClick(e, sBottom)} role="button" aria-label={`Tooth ${number} ${sBottom} surface`} />
                        <path d={u_lft} fill={pLeft} stroke={strokeColor} strokeWidth={strokeWidth} onClick={(e) => handleClick(e, sLeft)} role="button" aria-label={`Tooth ${number} ${sLeft} surface`} />
                        <path d={u_ctr} fill={cO} stroke={strokeColor} strokeWidth={strokeWidth} onClick={(e) => handleClick(e, 'O')} role="button" aria-label={`Tooth ${number} Occlusal surface`} />
                        {isMissingOrExtracted && <path d={u_cross} stroke={extractionColor} strokeWidth="5" opacity="0.8" />}
                    </>
                ) : (
                    <>
                        <g onClick={(e) => handleClick(e, 'R')} role="button" aria-label={`Tooth ${number} Root segment`}>
                            <path d={l_root} fill={cRootFill} stroke={strokeColor} strokeWidth={strokeWidth} />
                            {hasRootCanal && <line x1="50" y1="85" x2="50" y2="100" stroke="white" strokeWidth="2" />}
                        </g>
                        <path d={l_top} fill={pTop} stroke={strokeColor} strokeWidth={strokeWidth} onClick={(e) => handleClick(e, sTop)} role="button" aria-label={`Tooth ${number} ${sTop} surface`} />
                        <path d={l_rgt} fill={pRight} stroke={strokeColor} strokeWidth={strokeWidth} onClick={(e) => handleClick(e, sRight)} role="button" aria-label={`Tooth ${number} ${sRight} surface`} />
                        <path d={l_btm} fill={pBottom} stroke={strokeColor} strokeWidth={strokeWidth} onClick={(e) => handleClick(e, sBottom)} role="button" aria-label={`Tooth ${number} ${sBottom} surface`} />
                        <path d={l_lft} fill={pLeft} stroke={strokeColor} strokeWidth={strokeWidth} onClick={(e) => handleClick(e, sLeft)} role="button" aria-label={`Tooth ${number} ${sLeft} surface`} />
                        <path d={l_ctr} fill={cO} stroke={strokeColor} strokeWidth={strokeWidth} onClick={(e) => handleClick(e, 'O')} role="button" aria-label={`Tooth ${number} Occlusal surface`} />
                        {isMissingOrExtracted && <path d={l_cross} stroke={extractionColor} strokeWidth="5" opacity="0.8" />}
                    </>
                )}
            </svg>
        </div>
    )
}

interface QuadrantWrapperProps {
    children: React.ReactNode;
    quadrant: number;
    activeQuadrant: number | null;
    setActiveQuadrant: (q: number | null) => void;
}

const QuadrantWrapper: React.FC<QuadrantWrapperProps> = ({ children, quadrant, activeQuadrant, setActiveQuadrant }) => {
    const isSelected = activeQuadrant === quadrant;
    
    // Focused overlay behavior for Tablet optimization
    if (isSelected) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12 animate-in fade-in duration-300">
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setActiveQuadrant(null)}></div>
                <div className="bg-white p-12 rounded-[4rem] shadow-2xl relative z-10 border-4 border-teal-500 scale-110 md:scale-125">
                    <button 
                      aria-label="Exit zoom mode"
                      onClick={(e) => { e.stopPropagation(); setActiveQuadrant(null); }}
                      className="absolute -top-4 -right-4 bg-red-600 text-white p-3 rounded-full shadow-xl hover:bg-red-700 transition-colors"
                    >
                        <Minimize2 size={28}/>
                    </button>
                    {children}
                </div>
            </div>
        );
    }

    return (
        <div 
          onClick={() => !activeQuadrant && setActiveQuadrant(quadrant)}
          className={`
              relative p-4 transition-all rounded-[2rem]
              ${!activeQuadrant ? 'hover:bg-slate-100 cursor-zoom-in border-2 border-transparent hover:border-teal-300' : 'opacity-40 blur-[1px]'}
          `}
          role="region"
          aria-label={`Quadrant ${quadrant} grid`}
        >
            {children}
        </div>
    );
};

const Odontogram: React.FC<OdontogramProps> = ({ chart, readOnly, onToothClick, onChartUpdate }) => {
  const [activeToolId, setActiveToolId] = useState<ToolType>('cursor');
  const [zoomedTooth, setZoomedTooth] = useState<number | null>(null);
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null); 
  const [showBaseline, setShowBaseline] = useState(false); 
  const [dentitionMode, setDentitionMode] = useState<'Permanent' | 'Mixed'>('Permanent');
  const [isPatientPerspective, setIsPatientPerspective] = useState(false);
  const [activeQuadrant, setActiveQuadrant] = useState<number | null>(null);

  const activeTool = TOOLS.find(t => t.id === activeToolId) || TOOLS[0];

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

  const handleLongPress = (tooth: number) => { setZoomedTooth(tooth); setSelectedTooth(null); };

  return (
    <div className="flex flex-col gap-6 relative h-full">
        <div className="flex flex-wrap justify-between items-center bg-slate-100/60 backdrop-blur-md p-2.5 rounded-2xl gap-3 border border-slate-200 shadow-inner shrink-0">
             {!readOnly && (
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar" role="toolbar" aria-label="Clinical charting tools">
                    {TOOLS.map(tool => (
                        <button 
                            key={tool.id} 
                            onClick={() => { setActiveToolId(tool.id); setSelectedTooth(null); }} 
                            className={`flex flex-col items-center justify-center p-2 rounded-xl min-w-[56px] transition-all duration-300 ${activeToolId === tool.id ? 'bg-white text-slate-900 shadow-md -translate-y-1' : 'text-slate-600 hover:text-slate-800'}`}
                            aria-pressed={activeToolId === tool.id}
                            aria-label={`Charting tool: ${tool.label}`}
                        >
                            <tool.icon size={18} className={activeToolId === tool.id ? tool.color : ''} />
                            <span className="text-[9px] font-black uppercase tracking-tighter mt-1">{tool.label}</span>
                        </button>
                    ))}
                </div>
             )}
             
             <div className="flex gap-2 ml-auto items-center">
                 <button 
                    onClick={() => setIsPatientPerspective(!isPatientPerspective)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[9px] font-black tracking-widest transition-all border shadow-sm ${isPatientPerspective ? 'bg-teal-100 border-teal-300 text-teal-800' : 'bg-white border-slate-200 text-slate-700 hover:border-teal-300'}`}
                 >
                     <FlipHorizontal size={12}/> {isPatientPerspective ? 'PATIENT' : 'DENTIST'}
                 </button>

                 <div className="bg-white rounded-xl p-0.5 border border-slate-200 flex shadow-sm">
                    <button onClick={() => setDentitionMode('Permanent')} className={`px-2 py-1 rounded-lg text-[9px] font-black transition-all ${dentitionMode === 'Permanent' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-600 hover:text-teal-700'}`}>ADULT</button>
                    <button onClick={() => setDentitionMode('Mixed')} className={`px-2 py-1 rounded-lg text-[9px] font-black transition-all flex items-center gap-1 ${dentitionMode === 'Mixed' ? 'bg-lilac-600 text-white shadow-md' : 'text-slate-600 hover:text-lilac-700'}`}><Baby size={10}/> MIXED</button>
                 </div>
             </div>
        </div>

        <div 
          className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-2xl bg-slate-50/20 relative min-h-[400px] flex flex-col justify-center items-center shrink-0"
          role="img"
          aria-label="Graphic dental chart"
        >
            {readOnly && (
                <div className="absolute inset-0 z-50 bg-slate-900/10 backdrop-blur-[2px] flex items-center justify-center p-8 text-center animate-in fade-in">
                    <div className="bg-white p-8 rounded-[3rem] shadow-2xl border-4 border-red-50 max-w-xs flex flex-col items-center justify-center">
                        <LockKeyhole size={32} className="text-red-600 mb-4" />
                        <h4 className="text-base font-black text-slate-800 uppercase tracking-tighter mb-2">Clinical Lock Active</h4>
                        <p className="text-[11px] text-slate-700 font-medium">Record restricted due to DPA status.</p>
                    </div>
                </div>
            )}

            <div className={`
                flex flex-col gap-0 items-center py-6 transition-all duration-700
                ${isPatientPerspective ? 'scale-x-[-1]' : ''}
                ${activeQuadrant ? 'opacity-0 scale-90 blur-xl pointer-events-none' : 'opacity-100 scale-100'}
            `}>
                <div className="flex border-b border-slate-200">
                    <QuadrantWrapper quadrant={1} activeQuadrant={activeQuadrant} setActiveQuadrant={setActiveQuadrant}>
                        <div className="flex flex-col items-center">
                            <div className="flex gap-0.5">{q1.map(t => <GeometricTooth key={t} number={t} entries={getToothData(t)} readOnly={readOnly} onSurfaceClick={handleSurfaceClick} onLongPress={handleLongPress} isSelected={selectedTooth === t} isZoomed={activeQuadrant === 1} />)}</div>
                            {dentitionMode === 'Mixed' && <div className="flex gap-0.5 justify-end w-full mt-2">{dq5.map(t => <GeometricTooth key={t} number={t} entries={getToothData(t)} readOnly={readOnly} onSurfaceClick={handleSurfaceClick} onLongPress={handleLongPress} isSelected={selectedTooth === t} isDeciduous={true} isZoomed={activeQuadrant === 1} />)}</div>}
                        </div>
                    </QuadrantWrapper>
                    <div className="w-px bg-slate-200 h-24 self-end"></div>
                    <QuadrantWrapper quadrant={2} activeQuadrant={activeQuadrant} setActiveQuadrant={setActiveQuadrant}>
                        <div className="flex flex-col items-center">
                            <div className="flex gap-0.5">{q2.map(t => <GeometricTooth key={t} number={t} entries={getToothData(t)} readOnly={readOnly} onSurfaceClick={handleSurfaceClick} onLongPress={handleLongPress} isSelected={selectedTooth === t} isZoomed={activeQuadrant === 2} />)}</div>
                            {dentitionMode === 'Mixed' && <div className="flex gap-0.5 justify-start w-full mt-2">{dq6.map(t => <GeometricTooth key={t} number={t} entries={getToothData(t)} readOnly={readOnly} onSurfaceClick={handleSurfaceClick} onLongPress={handleLongPress} isSelected={selectedTooth === t} isDeciduous={true} isZoomed={activeQuadrant === 2} />)}</div>}
                        </div>
                    </QuadrantWrapper>
                </div>
                <div className="flex border-t border-slate-200">
                    <QuadrantWrapper quadrant={4} activeQuadrant={activeQuadrant} setActiveQuadrant={setActiveQuadrant}>
                        <div className="flex flex-col items-center">
                            {dentitionMode === 'Mixed' && <div className="flex gap-0.5 justify-end w-full mb-2">{dq8.map(t => <GeometricTooth key={t} number={t} entries={getToothData(t)} readOnly={readOnly} onSurfaceClick={handleSurfaceClick} onLongPress={handleLongPress} isSelected={selectedTooth === t} isDeciduous={true} isZoomed={activeQuadrant === 4} />)}</div>}
                            <div className="flex gap-0.5">{q4.map(t => <GeometricTooth key={t} number={t} entries={getToothData(t)} readOnly={readOnly} onSurfaceClick={handleSurfaceClick} onLongPress={handleLongPress} isSelected={selectedTooth === t} isZoomed={activeQuadrant === 4} />)}</div>
                        </div>
                    </QuadrantWrapper>
                    <div className="w-px bg-slate-200 h-24 self-start"></div>
                    <QuadrantWrapper quadrant={3} activeQuadrant={activeQuadrant} setActiveQuadrant={setActiveQuadrant}>
                        <div className="flex flex-col items-center">
                            {dentitionMode === 'Mixed' && <div className="flex gap-0.5 justify-start w-full mb-2">{dq7.map(t => <GeometricTooth key={t} number={t} entries={getToothData(t)} readOnly={readOnly} onSurfaceClick={handleSurfaceClick} onLongPress={handleLongPress} isSelected={selectedTooth === t} isDeciduous={true} isZoomed={activeQuadrant === 3} />)}</div>}
                            <div className="flex gap-0.5">{q3.map(t => <GeometricTooth key={t} number={t} entries={getToothData(t)} readOnly={readOnly} onSurfaceClick={handleSurfaceClick} onLongPress={handleLongPress} isSelected={selectedTooth === t} isZoomed={activeQuadrant === 3} />)}</div>
                        </div>
                    </QuadrantWrapper>
                </div>
            </div>

            {selectedTooth && !readOnly && !activeQuadrant && (
                <div 
                  className={`absolute z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 bg-white rounded-[2rem] shadow-[0_40px_80px_rgba(0,0,0,0.15)] border-2 border-slate-200 animate-in fade-in zoom-in-95 overflow-hidden ${isPatientPerspective ? 'scale-x-[-1]' : ''}`}
                >
                    <div className="bg-teal-900 text-white px-5 py-3 flex justify-between items-center">
                        <h4 className="font-black uppercase tracking-widest text-[10px]">Record: #{selectedTooth}</h4>
                        <button onClick={() => setSelectedTooth(null)} className="p-1.5 rounded-xl"><X size={14}/></button>
                    </div>
                    <div className="max-h-48 overflow-y-auto p-4 space-y-2 no-scrollbar">
                        {getToothData(selectedTooth).length > 0 ? getToothData(selectedTooth).map((entry, i) => (
                            <div key={i} className="p-3 bg-slate-50 border rounded-xl">
                                <div className="text-[9px] font-black text-slate-400 uppercase">{formatDate(entry.date)}</div>
                                <div className="text-[11px] font-black text-slate-800 leading-tight uppercase">{entry.procedure}</div>
                            </div>
                        )) : <div className="py-8 text-center opacity-30 text-[10px] font-black uppercase tracking-widest">Clean Archive</div>}
                    </div>
                    <div className="bg-slate-50 p-4 border-t">
                        <button onClick={() => { onToothClick(selectedTooth!); setSelectedTooth(null); }} className="w-full py-3 bg-white border rounded-xl text-[10px] font-black text-teal-800 uppercase tracking-widest hover:border-teal-600 transition-all flex items-center justify-center gap-2"><FileText size={14} /> View Narrative</button>
                    </div>
                </div>
            )}
        </div>
        {!activeQuadrant && !readOnly && (
            <div className="text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
                Click quadrant to focus surface mapping
            </div>
        )}
    </div>
  );
};

export default Odontogram;