import React, { useState, useRef, useEffect, useMemo } from 'react';
import { DentalChartEntry, TreatmentStatus } from '../types';
import { formatDate } from '../constants';
import { MousePointer2, Hammer, Scissors, Ghost, Activity, Crown, Search, Check, X, ZoomIn, FileText, ArrowRight, MoreHorizontal, CheckCircle, Clock, Baby, FlipHorizontal, Maximize2, Minimize2, ShieldAlert, LockKeyhole, Sparkles } from 'lucide-react';

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
    { id: 'exam', label: 'Finding', icon: Search, procedure: 'Caries', status: 'Planned', color: 'text-lilac-600' },
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

    const timerRef = useRef<number | null>(null);
    const isLongPress = useRef(false);

    const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
        if (readOnly) return;
        isLongPress.current = false;
        timerRef.current = window.setTimeout(() => {
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

    // FIX: Variables must be declared with `let` before assignment.
    let pTop, pBottom, pLeft, pRight, sTop, sBottom, sLeft, sRight;
    
    if (isUpper) { pTop = cB; sTop = 'B'; pBottom = cL; sBottom = 'L'; } 
    else { pTop = cL; sTop = 'L'; pBottom = cB; sBottom = 'B'; }

    if (isPatientRight) { pLeft = cD; sLeft = 'D'; pRight = cM; sRight = 'M'; } 
    else { pLeft = cM; sLeft = 'M'; pRight = cD; sRight = 'D'; }

    const strokeColor = isSelected ? "#0d9488" : "#e2e8f0"; 
    const strokeWidth = isSelected ? "3" : (isZoomed ? "1.5" : "1");

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
            className={`flex flex-col items-center justify-center relative transition-all duration-500 touch-manipulation select-none ${!readOnly && !isZoomed ? "hover:scale-105 active:scale-95" : ""} ${isSelected ? 'z-10 scale-110' : ''}`}
            style={{ width: isZoomed ? (isDeciduous ? '72px' : '96px') : (isDeciduous ? '48px' : '64px'), height: isZoomed ? (isDeciduous ? '90px' : '120px') : (isDeciduous ? '60px' : '80px'), minWidth: isDeciduous ? '48px' : '64px' }}
            onMouseDown={handleStart} onMouseUp={handleEnd} onMouseLeave={handleEnd} onTouchStart={handleStart} onTouchEnd={handleEnd}
        >
            <span className={`font-black font-mono absolute transition-all duration-500 ${isUpper ? (isZoomed ? '-top-6' : '-top-3') : (isZoomed ? '-bottom-6' : '-bottom-3')} ${isSelected ? 'text-teal-700 bg-teal-50 px-3 py-1 rounded-full shadow-lg border border-teal-100 scale-110 z-20' : 'text-slate-400'} ${isZoomed ? 'text-lg' : 'text-sm'}`} aria-hidden="true">
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
}

export const Odontogram: React.FC<OdontogramProps> = ({ chart, readOnly, onToothClick, onChartUpdate }) => {
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
  
  const QuadrantContent: React.FC<{ quadrant: number }> = ({ quadrant }) => {
      let permanentTeeth: number[] = [];
      let deciduousTeeth: number[] = [];
      if (quadrant === 1) { permanentTeeth = q1; deciduousTeeth = dq5; }
      if (quadrant === 2) { permanentTeeth = q2; deciduousTeeth = dq6; }
      if (quadrant === 3) { permanentTeeth = q3; deciduousTeeth = dq7; }
      if (quadrant === 4) { permanentTeeth = q4; deciduousTeeth = dq8; }
      
      const isUpper = quadrant === 1 || quadrant === 2;

      return (
          <div className="flex flex-col items-center gap-6">
              {isUpper && (
                <>
                  <div className="flex gap-2">{permanentTeeth.map(t => <GeometricTooth key={t} number={t} entries={getToothData(t)} readOnly={readOnly} onSurfaceClick={handleSurfaceClick} onLongPress={handleLongPress} isSelected={selectedTooth === t} isZoomed={!!activeQuadrant}/>)}</div>
                  {dentitionMode === 'Mixed' && <div className={`flex gap-2 w-full animate-in slide-in-from-top-2 ${quadrant === 1 ? 'justify-end' : 'justify-start'}`}>{deciduousTeeth.map(t => <GeometricTooth key={t} number={t} entries={getToothData(t)} readOnly={readOnly} onSurfaceClick={handleSurfaceClick} onLongPress={handleLongPress} isSelected={selectedTooth === t} isDeciduous={true} isZoomed={!!activeQuadrant}/>)}</div>}
                </>
              )}
              {!isUpper && (
                 <>
                  {dentitionMode === 'Mixed' && <div className={`flex gap-2 w-full animate-in slide-in-from-bottom-2 ${quadrant === 4 ? 'justify-end' : 'justify-start'}`}>{deciduousTeeth.map(t => <GeometricTooth key={t} number={t} entries={getToothData(t)} readOnly={readOnly} onSurfaceClick={handleSurfaceClick} onLongPress={handleLongPress} isSelected={selectedTooth === t} isDeciduous={true} isZoomed={!!activeQuadrant}/>)}</div>}
                  <div className="flex gap-2">{permanentTeeth.map(t => <GeometricTooth key={t} number={t} entries={getToothData(t)} readOnly={readOnly} onSurfaceClick={handleSurfaceClick} onLongPress={handleLongPress} isSelected={selectedTooth === t} isZoomed={!!activeQuadrant}/>)}</div>
                 </>
              )}
          </div>
      );
  };

  return (
    <div className="flex flex-col gap-6 relative h-full">
        {/* Unified Tool & Perspective Bar */}
        <div className="flex flex-wrap justify-between items-center bg-white/80 backdrop-blur-xl p-3 rounded-[2rem] gap-4 border border-teal-50 shadow-[0_8px_30px_rgba(0,0,0,0.04)] sticky top-0 z-50">
             {!readOnly && (
                <div className="flex gap-2.5 overflow-x-auto no-scrollbar px-1 py-1" role="toolbar" aria-label="Clinical charting palette">
                    {TOOLS.map(tool => (
                        <button 
                            key={tool.id} 
                            onClick={() => { setActiveToolId(tool.id); setSelectedTooth(null); }} 
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
                 <button 
                    onClick={() => setIsPatientPerspective(!isPatientPerspective)}
                    className={`flex items-center gap-3 px-5 py-3 rounded-2xl text-xs font-black tracking-[0.2em] transition-all duration-500 border-2 shadow-sm ${isPatientPerspective ? 'bg-lilac-50 border-lilac-200 text-lilac-700 ring-4 ring-lilac-500/5' : 'bg-white border-slate-100 text-slate-500 hover:border-lilac-200'}`}
                    aria-label={`Perspective toggle`}
                 >
                     <FlipHorizontal size={14}/> {isPatientPerspective ? 'PATIENT' : 'DENTIST'}
                 </button>

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

            <div className="w-full overflow-x-auto flex justify-start md:justify-center px-4">
                <div className={`
                    flex flex-col gap-0 items-center py-16 transition-all duration-500 min-w-max
                    ${isPatientPerspective ? 'scale-x-[-1]' : ''}
                    ${activeQuadrant ? 'opacity-30 blur-md' : ''}
                `}>
                    <div className="flex border-b-4 border-slate-100/50 justify-center">
                        <div onClick={() => setActiveQuadrant(1)} className="p-4 cursor-zoom-in group"><QuadrantContent quadrant={1} /></div>
                        <div className="w-1 bg-gradient-to-b from-slate-100 to-transparent h-48 self-end mb-12 rounded-full"></div>
                        <div onClick={() => setActiveQuadrant(2)} className="p-4 cursor-zoom-in group"><QuadrantContent quadrant={2} /></div>
                    </div>

                    <div className="flex pt-0 border-t-4 border-slate-100/50 justify-center">
                        <div onClick={() => setActiveQuadrant(4)} className="p-4 cursor-zoom-in group"><QuadrantContent quadrant={4} /></div>
                        <div className="w-1 bg-gradient-to-t from-slate-100 to-transparent h-48 self-start mt-12 rounded-full"></div>
                        <div onClick={() => setActiveQuadrant(3)} className="p-4 cursor-zoom-in group"><QuadrantContent quadrant={3} /></div>
                    </div>
                </div>
            </div>

            {selectedTooth && !readOnly && (
                <div 
                  className={`absolute z-[70] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 bg-white/90 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.18)] border-2 border-teal-50 animate-in fade-in zoom-in-95 duration-500 overflow-hidden ring-[16px] ring-white/50 ${isPatientPerspective ? 'scale-x-[-1]' : ''}`}
                  role="dialog"
                >
                    <div className="bg-teal-950 text-white px-8 py-6 flex justify-between items-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-400/10 rounded-full blur-2xl pointer-events-none" />
                        <h4 className="font-black uppercase tracking-[0.2em] text-xs flex items-center gap-3 relative z-10">
                            <Sparkles size={14} className="text-teal-400"/> Identity Bound: #{selectedTooth}
                        </h4>
                        <button onClick={() => setSelectedTooth(null)} className="hover:bg-white/20 p-2.5 rounded-xl transition-all relative z-10 active:scale-90" aria-label="Close details"><X size={18}/></button>
                    </div>
                    <div className={`max-h-64 overflow-y-auto p-6 space-y-4 no-scrollbar ${isPatientPerspective ? 'text-right' : 'text-left'}`}>
                        {getToothData(selectedTooth).length > 0 ? getToothData(selectedTooth).slice(0, 5).map((entry, i) => (
                            <div key={i} className="p-5 bg-slate-50/50 border border-slate-100 rounded-3xl group transition-all duration-500 hover:bg-white hover:border-teal-300 hover:shadow-xl hover:shadow-teal-900/5">
                                <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">{formatDate(entry.date)}</div>
                                <div className="text-sm font-black text-slate-800 leading-tight uppercase tracking-tight">{entry.procedure}</div>
                                <div className={`flex items-center gap-3 mt-4 ${isPatientPerspective ? 'justify-end' : ''}`}>
                                    <span className={`w-2.5 h-2.5 rounded-full ${entry.status === 'Completed' ? 'bg-teal-500' : entry.status === 'Planned' ? 'bg-lilac-500' : 'bg-red-500'} shadow-[0_0_8px_rgba(0,0,0,0.1)]`} aria-hidden="true" />
                                    <span className="text-xs text-slate-500 uppercase font-black tracking-widest">{entry.status}</span>
                                </div>
                            </div>
                        )) : <div className="py-16 flex flex-col items-center justify-center opacity-20 gap-4"><Ghost size={48} aria-hidden="true"/><p className="text-xs font-black uppercase tracking-widest">Virgin Enamel Archive</p></div>}
                    </div>
                    <div className="bg-slate-50 p-6 border-t border-slate-100">
                        <button onClick={() => { onToothClick(selectedTooth!); setSelectedTooth(null); }} className="w-full py-4 bg-white border-2 border-teal-50 rounded-2xl text-xs font-black text-teal-800 uppercase tracking-[0.2em] hover:bg-teal-900 hover:text-white hover:shadow-2xl hover:shadow-teal-900/30 transition-all flex items-center justify-center gap-3">
                            <FileText size={18} /> Chronic Narrative
                        </button>
                    </div>
                </div>
            )}
        </div>
        
        {/* Zoomed Quadrant Modal */}
        {activeQuadrant && (
            <>
                <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-30 animate-in fade-in duration-700" onClick={() => setActiveQuadrant(null)} aria-hidden="true" />
                <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 p-8 rounded-[3.5rem] bg-white shadow-[0_40px_100px_rgba(0,0,0,0.15)] ring-[16px] ring-teal-500/5 border-2 border-teal-100 animate-in zoom-in-95 ${isPatientPerspective ? 'scale-x-[-1]' : ''}`}>
                    <button 
                        aria-label="Exit zoom mode"
                        onClick={(e) => { e.stopPropagation(); setActiveQuadrant(null); }}
                        className="absolute -top-6 -right-6 bg-red-600 text-white p-4 rounded-full shadow-2xl z-50 hover:bg-red-700 transition-all hover:rotate-90 active:scale-90"
                    >
                        <Minimize2 size={28}/>
                    </button>
                    <QuadrantContent quadrant={activeQuadrant} />
                </div>
            </>
        )}

        {!activeQuadrant && !readOnly && (
            <div className="text-center py-4">
                <span className="text-xs font-black text-slate-300 uppercase tracking-[0.5em] animate-pulse">
                    Select Quadrant to initiate Mapping
                </span>
            </div>
        )}
    </div>
  );
};
