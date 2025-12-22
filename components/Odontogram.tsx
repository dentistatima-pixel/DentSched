import React, { useState, useRef, useMemo } from 'react';
import { DentalChartEntry, TreatmentStatus } from '../types';
import { MousePointer2, Hammer, Scissors, Ghost, Activity, Crown, Search, X, FileText, ChevronDown, ChevronRight, LockKeyhole, Minimize2, FlipHorizontal, Clock, Baby, ShieldOff } from 'lucide-react';

interface OdontogramProps {
  chart: DentalChartEntry[];
  readOnly?: boolean;
  onToothClick: (toothNumber: number) => void; 
  onChartUpdate?: (entry: DentalChartEntry) => void;
  isLicenseExpired?: boolean;
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
    { id: 'exam', label: 'Condition', icon: Search, procedure: 'Caries', status: 'Planned', color: 'text-lilac-500' },
    { id: 'restoration', label: 'Filling', icon: Hammer, procedure: 'Composite Restoration', status: 'Completed', color: 'text-teal-500' },
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
    isDeciduous?: boolean;
}> = ({ number, entries, onSurfaceClick, onLongPress, readOnly, isZoomed, isSelected, isDeciduous }) => {
    const quadrant = Math.floor(number / 10);
    const isUpper = quadrant === 1 || quadrant === 2 || quadrant === 5 || quadrant === 6;
    const isPatientRight = quadrant === 1 || quadrant === 4 || quadrant === 5 || quadrant === 8; 
    
    const toothEntries = entries || [];
    const timerRef = useRef<any>(null);

    const handleStart = () => {
        if (readOnly) return;
        timerRef.current = setTimeout(() => {
            onLongPress(number);
        }, 500);
    };

    const handleEnd = () => {
        if (readOnly) return;
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    };

    const handleClick = (e: React.MouseEvent, surface: string) => {
        e.stopPropagation();
        if (readOnly) return;
        onSurfaceClick(number, surface);
    };

    const colorMap: Record<string, string> = {
        'Planned': '#c026d3', // Lilac-500
        'Completed': '#0d9488', // Teal-600
        'Existing': '#3b82f6',
        'Condition': '#f59e0b',
        'None': '#f8fafc'
    };

    const getPriorityColor = (relevantEntries: DentalChartEntry[]) => {
        if (relevantEntries.length === 0) return colorMap['None'];
        if (relevantEntries.some(e => e.status === 'Completed')) return colorMap['Completed'];
        if (relevantEntries.some(e => e.status === 'Planned')) return colorMap['Planned'];
        if (relevantEntries.some(e => e.status === 'Condition')) return colorMap['Condition'];
        return colorMap['Existing'];
    };

    const getFill = (surfaceKey: string) => {
        const relevant = toothEntries.filter(e => e.surfaces && e.surfaces.includes(surfaceKey));
        return getPriorityColor(relevant);
    };
    
    const extractionEntry = toothEntries.find(e => 
        e.procedure.toLowerCase().includes('extraction') || 
        e.procedure.toLowerCase().includes('missing')
    );
    const isMissingOrExtracted = !!extractionEntry;
    const extractionColor = extractionEntry ? (extractionEntry.status === 'Existing' ? '#3b82f6' : '#c026d3') : '#c026d3';

    const strokeColor = isSelected ? "#0d9488" : "#e2e8f0"; 
    const strokeWidth = isSelected ? "3" : "1.5";

    return (
        <div 
            className={`flex flex-col items-center justify-center relative transition-transform ${isSelected ? 'z-10 scale-110' : ''}`}
            style={{ width: isDeciduous ? '48px' : '64px', height: isDeciduous ? '60px' : '80px' }} 
            onMouseDown={handleStart} onMouseUp={handleEnd} onMouseLeave={handleEnd}
        >
            <span className={`font-black absolute ${isUpper ? '-top-1' : '-bottom-1'} transition-colors ${isSelected ? 'text-teal-600' : 'text-slate-400'} text-[10px]`}>
                {number}
            </span>
            <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                {isUpper ? (
                    <>
                        <path d="M0 15 L100 15 L70 38 L30 38 Z" fill={getFill('B')} stroke={strokeColor} strokeWidth={strokeWidth} onClick={(e) => handleClick(e, 'B')} />
                        <path d="M100 15 L100 100 L70 77 L70 38 Z" fill={getFill(isPatientRight ? 'M' : 'D')} stroke={strokeColor} strokeWidth={strokeWidth} onClick={(e) => handleClick(e, isPatientRight ? 'M' : 'D')} />
                        <path d="M0 100 L100 100 L70 77 L30 77 Z" fill={getFill('L')} stroke={strokeColor} strokeWidth={strokeWidth} onClick={(e) => handleClick(e, 'L')} />
                        <path d="M0 15 L0 100 L30 77 L30 38 Z" fill={getFill(isPatientRight ? 'D' : 'M')} stroke={strokeColor} strokeWidth={strokeWidth} onClick={(e) => handleClick(e, isPatientRight ? 'D' : 'M')} />
                        <path d="M30 38 L70 38 L70 77 L30 77 Z" fill={getFill('O')} stroke={strokeColor} strokeWidth={strokeWidth} onClick={(e) => handleClick(e, 'O')} />
                        {isMissingOrExtracted && <path d="M0 15 L100 100 M100 15 L0 100" stroke={extractionColor} strokeWidth="4" opacity="0.8" />}
                    </>
                ) : (
                    <>
                        <path d="M0 0 L100 0 L70 23 L30 23 Z" fill={getFill('L')} stroke={strokeColor} strokeWidth={strokeWidth} onClick={(e) => handleClick(e, 'L')} />
                        <path d="M100 0 L100 85 L70 62 L70 23 Z" fill={getFill(isPatientRight ? 'M' : 'D')} stroke={strokeColor} strokeWidth={strokeWidth} onClick={(e) => handleClick(e, isPatientRight ? 'M' : 'D')} />
                        <path d="M0 85 L100 85 L70 62 L30 62 Z" fill={getFill('B')} stroke={strokeColor} strokeWidth={strokeWidth} onClick={(e) => handleClick(e, 'B')} />
                        <path d="M0 0 L0 85 L30 62 L30 23 Z" fill={getFill(isPatientRight ? 'D' : 'M')} stroke={strokeColor} strokeWidth={strokeWidth} onClick={(e) => handleClick(e, isPatientRight ? 'D' : 'M')} />
                        <path d="M30 23 L70 23 L70 62 L30 62 Z" fill={getFill('O')} stroke={strokeColor} strokeWidth={strokeWidth} onClick={(e) => handleClick(e, 'O')} />
                        {isMissingOrExtracted && <path d="M0 0 L100 85 M100 0 L0 85" stroke={extractionColor} strokeWidth="4" opacity="0.8" />}
                    </>
                )}
            </svg>
        </div>
    );
};

const QuadrantWrapper: React.FC<{ children: React.ReactNode; quadrant: number; active: boolean; onClick: () => void; onClose: () => void }> = ({ children, active, onClick, onClose }) => (
    <div 
        onClick={!active ? onClick : undefined}
        className={`relative p-4 transition-all rounded-[2.5rem] border-2 ${active ? 'bg-white shadow-2xl scale-125 z-40 border-teal-500 ring-8 ring-teal-500/5' : 'hover:bg-slate-50 cursor-pointer border-transparent hover:border-teal-100'}`}
    >
        {active && (
            <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="absolute -top-4 -right-4 bg-red-500 text-white p-2 rounded-full shadow-lg z-50">
                <Minimize2 size={20}/>
            </button>
        )}
        {children}
    </div>
);

const Odontogram: React.FC<OdontogramProps> = ({ chart, readOnly, onToothClick, onChartUpdate, isLicenseExpired }) => {
  const [activeToolId, setActiveToolId] = useState<ToolType>('cursor');
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null); 
  const [dentitionMode, setDentitionMode] = useState<'Permanent' | 'Mixed'>('Permanent');
  const [isPatientPerspective, setIsPatientPerspective] = useState(false);
  const [activeQuadrant, setActiveQuadrant] = useState<number | null>(null);

  const isFormReadOnly = readOnly || isLicenseExpired;

  const activeTool = TOOLS.find(t => t.id === activeToolId) || TOOLS[0];
  const getToothData = (number: number) => chart.filter(e => e.toothNumber === number && !e.isSuperseded);

  const handleSurfaceClick = (tooth: number, surface: string) => {
      if (isFormReadOnly) return;
      if (activeToolId === 'cursor') {
          setSelectedTooth(selectedTooth === tooth ? null : tooth);
          return;
      }
      if (onChartUpdate) {
          onChartUpdate({
              id: `dc_${Date.now()}`,
              toothNumber: tooth,
              procedure: activeTool.procedure,
              status: activeTool.status,
              surfaces: surface,
              date: new Date().toISOString().split('T')[0],
              version: 1
          });
      }
  };

  const arches = {
    q1: [18, 17, 16, 15, 14, 13, 12, 11],
    q2: [21, 22, 23, 24, 25, 26, 27, 28],
    q4: [48, 47, 46, 45, 44, 43, 42, 41],
    q3: [31, 32, 33, 34, 35, 36, 37, 38],
    dq5: [55, 54, 53, 52, 51],
    dq6: [61, 62, 63, 64, 65]
  };

  return (
    <div className="flex flex-col gap-6 relative">
        <div className="flex flex-wrap justify-between items-center bg-white p-3 rounded-3xl shadow-sm border border-slate-100 gap-4">
             <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                 {!isFormReadOnly && TOOLS.map(tool => (
                    <button key={tool.id} onClick={() => setActiveToolId(tool.id)} className={`flex flex-col items-center justify-center p-3 rounded-2xl min-w-[70px] transition-all ${activeToolId === tool.id ? 'bg-teal-50 text-teal-900 border-2 border-teal-500 shadow-sm' : 'text-slate-400 hover:bg-slate-50 border-2 border-transparent'}`}>
                        <tool.icon size={20} className={activeToolId === tool.id ? tool.color : ''} />
                        <span className="text-[10px] font-black uppercase mt-1.5 tracking-tighter">{tool.label}</span>
                    </button>
                 ))}
             </div>
             
             <div className="flex gap-2 ml-auto items-center">
                 <button onClick={() => setIsPatientPerspective(!isPatientPerspective)} className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${isPatientPerspective ? 'bg-teal-50 border-teal-300 text-teal-800' : 'bg-white border-slate-200 text-slate-500'}`}>
                    <FlipHorizontal size={14}/> {isPatientPerspective ? 'Patient View' : 'Clinic View'}
                 </button>
                 <div className="bg-slate-100 rounded-2xl p-1 border border-slate-200 flex">
                    <button onClick={() => setDentitionMode('Permanent')} className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${dentitionMode === 'Permanent' ? 'bg-white shadow text-teal-700' : 'text-slate-400'}`}>Permanent</button>
                    <button onClick={() => setDentitionMode('Mixed')} className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${dentitionMode === 'Mixed' ? 'bg-white shadow text-lilac-600' : 'text-slate-400'}`}>Mixed</button>
                 </div>
             </div>
        </div>

        <div className={`bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl relative min-h-[500px] flex flex-col justify-center items-center overflow-hidden ${isPatientPerspective ? 'scale-x-[-1]' : ''}`}>
            {isLicenseExpired && (
                <div className="absolute inset-0 z-50 bg-red-900/10 backdrop-blur-[2px] flex items-center justify-center">
                    <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border-4 border-red-600 text-center max-w-sm animate-in zoom-in-95">
                        <ShieldOff size={48} className="text-red-600 mx-auto mb-6"/>
                        <h4 className="font-black text-slate-900 uppercase tracking-tight text-xl mb-3">License Gate Triggered</h4>
                        <p className="text-sm text-red-700 font-bold leading-relaxed mb-6">Odontogram interaction is suspended. Your PRC license is marked as EXPIRED in the registry.</p>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 py-2 rounded-full">Regulatory Block Active</div>
                    </div>
                </div>
            )}
            
            {!isLicenseExpired && readOnly && (
                <div className="absolute inset-0 z-50 bg-slate-900/5 backdrop-blur-[1px] flex items-center justify-center">
                    <div className="bg-white/90 p-8 rounded-3xl shadow-2xl border border-red-100 text-center max-w-sm">
                        <LockKeyhole size={32} className="text-red-500 mx-auto mb-4"/>
                        <h4 className="font-black text-slate-800 uppercase tracking-tight mb-2">Registry Lock Active</h4>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">Clinical processing suspended pending DPA consent verification.</p>
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-0 items-center">
                <div className="flex border-b-2 border-slate-200">
                    <QuadrantWrapper quadrant={1} active={activeQuadrant === 1} onClick={() => setActiveQuadrant(1)} onClose={() => setActiveQuadrant(null)}>
                        <div className="flex flex-col gap-2">
                            <div className="flex gap-1">{arches.q1.map(t => <GeometricTooth key={t} number={t} entries={getToothData(t)} readOnly={isFormReadOnly} onSurfaceClick={handleSurfaceClick} onLongPress={() => {}} isSelected={selectedTooth === t} />)}</div>
                            {dentitionMode === 'Mixed' && <div className="flex gap-1 justify-end">{arches.dq5.map(t => <GeometricTooth key={t} number={t} entries={getToothData(t)} readOnly={isFormReadOnly} onSurfaceClick={handleSurfaceClick} onLongPress={() => {}} isSelected={selectedTooth === t} isDeciduous />)}</div>}
                        </div>
                    </QuadrantWrapper>
                    <div className="w-0.5 bg-slate-200 h-32 self-end mb-4 mx-4"></div>
                    <QuadrantWrapper quadrant={2} active={activeQuadrant === 2} onClick={() => setActiveQuadrant(2)} onClose={() => setActiveQuadrant(null)}>
                        <div className="flex flex-col gap-2">
                            <div className="flex gap-1">{arches.q2.map(t => <GeometricTooth key={t} number={t} entries={getToothData(t)} readOnly={isFormReadOnly} onSurfaceClick={handleSurfaceClick} onLongPress={() => {}} isSelected={selectedTooth === t} />)}</div>
                            {dentitionMode === 'Mixed' && <div className="flex gap-1">{arches.dq6.map(t => <GeometricTooth key={t} number={t} entries={getToothData(t)} readOnly={isFormReadOnly} onSurfaceClick={handleSurfaceClick} onLongPress={() => {}} isSelected={selectedTooth === t} isDeciduous />)}</div>}
                        </div>
                    </QuadrantWrapper>
                </div>
                <div className="flex border-t-2 border-slate-200 pt-4">
                    <QuadrantWrapper quadrant={4} active={activeQuadrant === 4} onClick={() => setActiveQuadrant(4)} onClose={() => setActiveQuadrant(null)}>
                        <div className="flex gap-1">{arches.q4.map(t => <GeometricTooth key={t} number={t} entries={getToothData(t)} readOnly={isFormReadOnly} onSurfaceClick={handleSurfaceClick} onLongPress={() => {}} isSelected={selectedTooth === t} />)}</div>
                    </QuadrantWrapper>
                    <div className="w-0.5 bg-slate-200 h-32 self-start mt-4 mx-4"></div>
                    <QuadrantWrapper quadrant={3} active={activeQuadrant === 3} onClick={() => setActiveQuadrant(3)} onClose={() => setActiveQuadrant(null)}>
                        <div className="flex gap-1">{arches.q3.map(t => <GeometricTooth key={t} number={t} entries={getToothData(t)} readOnly={isFormReadOnly} onSurfaceClick={handleSurfaceClick} onLongPress={() => {}} isSelected={selectedTooth === t} />)}</div>
                    </QuadrantWrapper>
                </div>
            </div>

            {selectedTooth && (
                <div className={`absolute z-50 p-6 bg-white rounded-3xl shadow-2xl border border-slate-200 w-80 animate-in zoom-in-95 ${isPatientPerspective ? 'scale-x-[-1]' : ''}`}>
                    <div className="flex justify-between items-center mb-4 border-b pb-2">
                        <h4 className="font-black text-slate-800 uppercase tracking-widest text-xs">Tooth #{selectedTooth} History</h4>
                        <button onClick={() => setSelectedTooth(null)} className="text-slate-400 hover:text-red-500 transition-colors"><X size={16}/></button>
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto no-scrollbar">
                        {getToothData(selectedTooth).length > 0 ? getToothData(selectedTooth).map((entry, i) => (
                            <div key={i} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center">
                                <div><div className="text-xs font-bold text-slate-700">{entry.procedure}</div><div className="text-[9px] font-black text-slate-400 uppercase">{entry.status}</div></div>
                                <div className={`w-2.5 h-2.5 rounded-full ${entry.status === 'Completed' ? 'bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.5)]' : 'bg-lilac-500'}`}/>
                            </div>
                        )) : <div className="text-center py-4 text-xs italic text-slate-400 uppercase tracking-widest font-black">No current records</div>}
                    </div>
                    <button onClick={() => onToothClick(selectedTooth)} className="w-full mt-4 py-3 bg-teal-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-teal-600/20 hover:scale-[1.02] transition-all">
                        <FileText size={14}/> View Full Narrative
                    </button>
                </div>
            )}
        </div>
    </div>
  );
};

export default Odontogram;