import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { PerioMeasurement, DentalChartEntry } from '../types';
import { Save, AlertTriangle, Info, MoveHorizontal, Diamond, Shield, History, Plus, Maximize2, Minimize2, ArrowRightLeft, Edit2, Droplet } from 'lucide-react';
import { useToast } from './ToastSystem';
import { formatDate } from '../constants';

interface PerioChartProps {
    data: PerioMeasurement[];
    dentalChart: DentalChartEntry[];
    onSave: (newData: PerioMeasurement[]) => void;
    readOnly?: boolean;
}

const TEETH_UPPER = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const TEETH_LOWER = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];
const ALL_TEETH = [...TEETH_UPPER, ...TEETH_LOWER];
const SITES_PER_TOOTH = 6;

const legendDefs = [
    { label: 'Recession', value: '1-15mm', icon: <div className="w-5 h-4 bg-blue-50 border border-blue-200 rounded-sm" aria-hidden="true"/> },
    { label: 'PPD', value: '1-15', icon: <div className="w-6 h-5 bg-amber-50 border border-amber-200 rounded-md" aria-hidden="true"/> },
    { label: 'CAL', value: '(calc)', icon: <div className="w-6 h-6 bg-green-50 border border-green-200 rounded-md" aria-hidden="true"/> },
    { label: 'BOP', value: '0-3', icon: <div className="w-4 h-4 bg-red-400 border border-red-500 rounded-full" aria-hidden="true"/> },
    { label: 'Mobility', value: '0-3', icon: <MoveHorizontal size={16} className="text-orange-700" aria-hidden="true"/> },
    { label: 'Furcation', value: '0-3', icon: <Diamond size={16} className="text-indigo-700" aria-hidden="true"/> },
    { label: 'Plaque Index', value: '0-3', icon: <Shield size={16} className="text-green-700" aria-hidden="true"/> },
];

const HeaderVisualKey: React.FC = () => (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {legendDefs.map((item, index) => (
            <React.Fragment key={item.label}>
                <div className="flex items-center gap-2">
                   {item.icon}
                   <div>
                     <p className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 leading-none">{item.label}</p>
                     <p className="text-xs font-mono text-slate-900 dark:text-slate-200 font-black">{item.value}</p>
                   </div>
                </div>
                {index < legendDefs.length - 1 && (
                    <div className="w-px h-8 bg-slate-200 dark:bg-slate-700" />
                )}
            </React.Fragment>
        ))}
    </div>
);

interface PerioRowProps {
    tooth: number;
    measurement?: PerioMeasurement;
    compareMeasurement?: PerioMeasurement;
    dentalChart: DentalChartEntry[];
    focusedSite: { tooth: number, index: number } | null;
    onValueChange: (tooth: number, field: 'pocketDepths' | 'recession', index: number, value: string) => void;
    onMobilityCycle: (tooth: number, currentValue: number | null) => void;
    onBopCycle: (tooth: number, currentValue: number | null) => void;
    onPlaqueIndexCycle: (tooth: number, currentValue: number | null) => void;
    onFurcationChange: (tooth: number, value: number | null) => void;
    onFocusSite: (tooth: number, index: number) => void;
    isColumnFocused?: boolean;
    readOnly?: boolean;
    compareMode: boolean;
    inputRefs: React.MutableRefObject<Record<string, HTMLInputElement | null>>;
}

const PerioRow: React.FC<PerioRowProps> = React.memo(({ tooth, measurement, compareMeasurement, dentalChart, focusedSite, onValueChange, onMobilityCycle, onBopCycle, onPlaqueIndexCycle, onFurcationChange, onFocusSite, readOnly, compareMode, inputRefs, isColumnFocused }) => {
    const m = measurement;
    if (!m) return null;

    const isMolar = useMemo(() => [6, 7, 8].includes(tooth % 10), [tooth]);

    const isMissingOrExtracted = useMemo(() => {
        return dentalChart.some(entry => 
            entry.toothNumber === tooth &&
            (entry.procedure.toLowerCase().includes('extraction') || entry.procedure.toLowerCase().includes('missing'))
        );
    }, [dentalChart, tooth]);

    const maxDepth = Math.max(...(m.pocketDepths.filter(d => d !== null) as number[]), 0);
    const isConcern = maxDepth >= 5;
    
    const getSiteRefKey = (tooth: number, index: number) => `t${tooth}-i${index}`;

    const renderSite = (index: number) => {
        const isFocused = focusedSite?.tooth === tooth && focusedSite?.index === index;
        const diff = compareMeasurement && compareMode ? (m.pocketDepths[index] || 0) - (compareMeasurement.pocketDepths[index] || 0) : 0;
        const cal = (m.pocketDepths[index] || 0) + (m.recession[index] || 0);
        
        return (
            <div key={`site-${index}`} className="flex flex-col items-center gap-1">
                 {/* Recession Input */}
                <input 
                    type="text" 
                    maxLength={2}
                    value={m.recession[index] ?? ''}
                    onFocus={() => onFocusSite(tooth, index + SITES_PER_TOOTH)} // Use a separate index range for recession
                    onChange={(e) => onValueChange(tooth, 'recession', index, e.target.value)}
                    className="w-8 h-6 text-center text-xs border rounded focus:outline-none transition-all duration-300 font-bold bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 focus:scale-110"
                    placeholder="-"
                    disabled={readOnly || isMissingOrExtracted}
                />
                {/* Pocket Depth Input */}
                <div className="relative group/input">
                    <input 
                        ref={el => { inputRefs.current[getSiteRefKey(tooth, index)] = el; }}
                        type="text" 
                        maxLength={2}
                        value={m.pocketDepths[index] ?? ''}
                        onFocus={() => onFocusSite(tooth, index)}
                        onChange={(e) => onValueChange(tooth, 'pocketDepths', index, e.target.value)}
                        className={`w-10 h-8 text-center text-sm border-2 rounded-xl focus:outline-none transition-all duration-300 font-black
                            ${isFocused ? 'scale-110 border-teal-600 dark:border-teal-400 bg-white dark:bg-slate-900 shadow-xl shadow-teal-900/10 dark:shadow-teal-400/10 z-20' : 'border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 group-hover/input:border-amber-400'}
                            ${(m.pocketDepths[index] || 0) >= 5 ? 'text-red-700 dark:text-red-300 border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/30' : ''}
                        `}
                        placeholder="-"
                        disabled={readOnly || isMissingOrExtracted}
                    />
                    {compareMode && diff !== 0 && (
                        <span className={`absolute -top-2 -right-2 text-[8px] px-1.5 py-0.5 rounded-full border-2 font-black shadow-sm z-30 ${diff > 0 ? 'bg-red-600 text-white border-white' : 'bg-teal-600 text-white border-white'}`}>
                            {diff > 0 ? `+${diff}` : diff}
                        </span>
                    )}
                </div>
                {/* CAL Display */}
                <div className="w-10 h-10 text-center text-xs border rounded-md flex items-center justify-center font-black bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700 text-green-700 dark:text-green-300">
                    {cal > 0 ? cal : '-'}
                </div>
            </div>
        )
    };

    return (
        <div className={`flex flex-col border-r border-slate-200 dark:border-slate-700 min-w-[150px] transition-all duration-500 ${isMissingOrExtracted ? 'bg-slate-200 dark:bg-slate-700 opacity-60' : isColumnFocused ? 'bg-teal-50 dark:bg-teal-900/30' : (isConcern ? 'bg-red-50/30 dark:bg-red-900/20' : 'bg-white dark:bg-slate-800/50')}`}>
            <div className={`text-center font-black py-3 border-b border-slate-200 dark:border-slate-700 text-[11px] tracking-widest ${isMissingOrExtracted ? 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700' : (isConcern ? 'text-red-700 bg-red-50/50 dark:bg-red-900/40 dark:text-red-300' : 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/50')}`}>
                #{tooth}
                {isConcern && !isMissingOrExtracted && <AlertTriangle size={10} className="inline ml-1 text-red-500 animate-pulse"/>}
            </div>

            <div className="p-2 border-b border-slate-200 dark:border-slate-700">
                <div className="text-center text-[9px] uppercase font-bold text-slate-400 mb-1">Buccal</div>
                <div className="flex justify-around items-start">
                    {[0, 1, 2].map(renderSite)}
                </div>
            </div>
            
            <div className="p-2 text-center font-black bg-slate-100 dark:bg-slate-700/50 text-[10px] tracking-widest border-b border-slate-200 dark:border-slate-700 flex justify-center items-center gap-4">
                 <div className="flex justify-center items-center gap-2">
                     <span className="text-slate-400 dark:text-slate-500">MOB</span>
                     <button
                        onClick={() => onMobilityCycle(tooth, m.mobility)}
                        disabled={readOnly || isMissingOrExtracted}
                        className="w-8 h-8 flex items-center justify-center text-sm rounded-lg border-2 border-orange-100 dark:border-orange-900 bg-white dark:bg-slate-800 focus:border-orange-500 outline-none font-bold text-orange-700 dark:text-orange-400"
                     >
                        <MoveHorizontal size={10}/>
                        <span>{m.mobility ?? '-'}</span>
                     </button>
                 </div>
                 <div className="flex items-center gap-2">
                    <span className="text-slate-400 dark:text-slate-500">BOP</span>
                    <button
                        onClick={() => onBopCycle(tooth, m.bop ?? null)}
                        disabled={readOnly || isMissingOrExtracted}
                        className="w-8 h-8 flex items-center justify-center gap-1 text-sm rounded-lg border-2 border-red-100 dark:border-red-900 bg-white dark:bg-slate-800 focus:border-red-500 outline-none font-bold text-red-700 dark:text-red-400"
                    >
                        <Droplet size={10}/>
                        <span>{m.bop ?? '-'}</span>
                    </button>
                 </div>
                 {isMolar && (
                     <div className="flex items-center gap-2">
                         <span className="text-slate-400 dark:text-slate-500">FUR</span>
                         <button
                            onClick={() => {
                                const currentValue = m.furcation;
                                const nextValue = currentValue === 3 ? null : (currentValue ?? 0) + 1;
                                onFurcationChange(tooth, nextValue);
                            }}
                            disabled={readOnly || isMissingOrExtracted}
                            className="w-8 h-8 flex items-center justify-center gap-1 text-sm rounded-lg border-2 border-indigo-100 dark:border-indigo-900 bg-white dark:bg-slate-800 focus:border-indigo-500 outline-none font-bold text-indigo-700 dark:text-indigo-400"
                         >
                            <Diamond size={10}/>
                            <span>{m.furcation ?? '-'}</span>
                         </button>
                     </div>
                 )}
                 <div className="flex items-center gap-2">
                     <span className="text-slate-400 dark:text-slate-500">PI</span>
                      <button
                        onClick={() => onPlaqueIndexCycle(tooth, m.plaqueIndex)}
                        disabled={readOnly || isMissingOrExtracted}
                        className="w-8 h-8 flex items-center justify-center gap-1 text-sm rounded-lg border-2 border-green-100 dark:border-green-900 bg-white dark:bg-slate-800 focus:border-green-500 outline-none font-bold text-green-700 dark:text-green-400"
                     >
                        <Shield size={10}/>
                        <span>{m.plaqueIndex ?? '-'}</span>
                     </button>
                 </div>
            </div>
             
            <div className="p-2">
                <div className="flex justify-around items-start">
                    {[3, 4, 5].map(renderSite)}
                </div>
                 <div className="text-center text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 mt-1">Lingual</div>
            </div>

        </div>
    );
});

export const PerioChart: React.FC<PerioChartProps> = ({ data, dentalChart, onSave, readOnly: isPatientReadOnly }) => {
    const [chartData, setChartData] = useState<PerioMeasurement[]>([]);
    const [activeDate, setActiveDate] = useState<string | 'new'>('new');
    const [focusedSite, setFocusedSite] = useState<{ tooth: number, index: number } | null>(null);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [compareMode, setCompareMode] = useState(false);
    const [comparisonDate, setComparisonDate] = useState<string | null>(null);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    
    const toast = useToast();
    const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
    const historyButtonRef = useRef<HTMLButtonElement>(null);

    const historicalDates = useMemo(() => {
        const dates = new Set(data.map(d => d.date).filter(Boolean) as string[]);
        return Array.from(dates).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    }, [data]);

    const getChartByDate = useCallback((chartHistory: PerioMeasurement[], date: string): PerioMeasurement[] => {
        const measurements = chartHistory.filter(d => d.date === date);
        return ALL_TEETH.map(toothNum => {
            return measurements.find(m => m.toothNumber === toothNum) || {
                toothNumber: toothNum, date: date,
                pocketDepths: Array(SITES_PER_TOOTH).fill(null), recession: Array(SITES_PER_TOOTH).fill(null),
                bop: null, mobility: null, furcation: null, plaqueIndex: null,
            };
        });
    }, []);
    
    const handleNewChart = useCallback(() => {
        const newChart = ALL_TEETH.map(toothNum => ({
            toothNumber: toothNum,
            date: new Date().toISOString().split('T')[0],
            pocketDepths: Array(SITES_PER_TOOTH).fill(null), recession: Array(SITES_PER_TOOTH).fill(null),
            bop: null, mobility: null, furcation: null, plaqueIndex: null,
        }));
        setChartData(newChart);
        setActiveDate('new');
        setCompareMode(false);
        setComparisonDate(null);
    }, []);
    
    const handleHistorySelect = useCallback((date: string) => {
        setChartData(getChartByDate(data, date));
        setActiveDate(date);
        setIsHistoryOpen(false);
        setCompareMode(false);
        setComparisonDate(null);
    }, [data, getChartByDate]);

    useEffect(() => {
        if (historicalDates.length > 0) {
            handleHistorySelect(historicalDates[0]);
        } else {
            handleNewChart();
        }
    }, [data, historicalDates, handleHistorySelect, handleNewChart]);

    const comparisonChartData = useMemo(() => {
        if (!compareMode || !comparisonDate) return null;
        return getChartByDate(data, comparisonDate);
    }, [compareMode, comparisonDate, getChartByDate, data]);
    
    const handleEditChart = () => {
        const today = new Date().toISOString().split('T')[0];
        const editableChart = chartData.map(m => ({ ...m, date: today }));
        setChartData(editableChart);
        setActiveDate('new');
        toast.info("Copied historical data to a new chart for today. Save to create a new record.");
    };

    const handleSave = () => {
        const today = new Date().toISOString().split('T')[0];
        const otherHistory = data.filter(d => d.date !== today);
        const newHistory = [...otherHistory, ...chartData];
        onSave(newHistory);
        toast.success("Periodontal chart saved.");
        setActiveDate(today);
    };

    const isChartReadOnly = activeDate !== 'new' || isPatientReadOnly;

    const handleValueChange = (tooth: number, field: 'pocketDepths' | 'recession', index: number, value: string) => {
        if(isChartReadOnly) return;
        const numVal = value === '' ? null : parseInt(value);
        if (numVal !== null && (isNaN(numVal) || numVal < 0 || numVal > 20)) return;

        setChartData(prev => prev.map(m => {
            if (m.toothNumber === tooth) {
                const newValues = [...m[field]];
                newValues[index] = numVal;
                return { ...m, [field]: newValues, date: new Date().toISOString().split('T')[0] };
            }
            return m;
        }));
    };
    
    const handleMobilityCycle = (tooth: number, currentValue: number | null) => { if(isChartReadOnly) return; const nextValue = currentValue === 3 ? null : (currentValue ?? 0) + 1; setChartData(prev => prev.map(m => m.toothNumber === tooth ? { ...m, mobility: nextValue, date: new Date().toISOString().split('T')[0] } : m)); };
    const handleBopCycle = (tooth: number, currentValue: number | null) => { if(isChartReadOnly) return; const nextValue = currentValue === 3 ? null : (currentValue ?? 0) + 1; setChartData(prev => prev.map(m => m.toothNumber === tooth ? { ...m, bop: nextValue, date: new Date().toISOString().split('T')[0] } : m)); };
    const handlePlaqueIndexCycle = (tooth: number, currentValue: number | null) => { if(isChartReadOnly) return; const nextValue = currentValue === 3 ? null : (currentValue ?? 0) + 1; setChartData(prev => prev.map(m => m.toothNumber === tooth ? { ...m, plaqueIndex: nextValue, date: new Date().toISOString().split('T')[0] } : m)); };
    const handleFurcationChange = (tooth: number, value: number | null) => { if(isChartReadOnly) return; setChartData(prev => prev.map(m => m.toothNumber === tooth ? { ...m, furcation: value, date: new Date().toISOString().split('T')[0] } : m)); };
    const handleFocusSite = (tooth: number, index: number) => { setFocusedSite({ tooth, index }); };

    return (
        <div className={`flex flex-col bg-slate-50 dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-inner transition-all duration-300 ${isFullScreen ? 'fixed inset-0 top-24 z-[60] rounded-none' : 'relative h-full'}`}>
            <div className="sticky top-0 z-30">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm">
                    <div className="flex items-center gap-6"><h3 className="font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">Perio Chart</h3><HeaderVisualKey /></div>
                </div>
                {/* Toolbar */}
                <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                        {!isPatientReadOnly && <button onClick={handleNewChart} className="bg-white border-2 border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-xs font-black uppercase flex items-center gap-2"><Plus size={14}/> New Chart</button>}
                        {activeDate !== 'new' && !isPatientReadOnly && <button onClick={handleEditChart} className="bg-white border-2 border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-xs font-black uppercase flex items-center gap-2"><Edit2 size={14}/> Edit This Chart</button>}
                        <div className="relative">
                            <button ref={historyButtonRef} onClick={() => setIsHistoryOpen(p => !p)} className="bg-white border-2 border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-xs font-black uppercase flex items-center gap-2"><History size={14}/> History</button>
                            {isHistoryOpen && (
                                <div className="absolute top-full mt-2 w-48 bg-white border rounded-lg shadow-lg z-40 p-1">
                                    {historicalDates.map(date => <button key={date} onClick={() => handleHistorySelect(date)} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 rounded">{formatDate(date)}</button>)}
                                </div>
                            )}
                        </div>
                        <button onClick={() => setCompareMode(p => !p)} className={`px-4 py-2 rounded-lg text-xs font-black uppercase flex items-center gap-2 border-2 ${compareMode ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-white border-slate-200 text-slate-600'}`}><ArrowRightLeft size={14}/> Compare</button>
                        {compareMode && (
                             <select value={comparisonDate || ''} onChange={e => setComparisonDate(e.target.value)} className="input !min-h-0 !h-auto py-2 text-xs">
                                <option value="">Select date...</option>
                                {historicalDates.filter(d => d !== activeDate).map(date => <option key={date} value={date}>{formatDate(date)}</option>)}
                            </select>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500 uppercase">Viewing: {activeDate === 'new' ? 'New Entry' : formatDate(activeDate)}</span>
                        {!isPatientReadOnly && <button onClick={handleSave} className="bg-teal-600 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2"><Save size={14}/> Save Chart</button>}
                        <button onClick={() => setIsFullScreen(fs => !fs)} className="p-2.5 rounded-lg bg-slate-100 text-slate-600 border-2 border-slate-200">{isFullScreen ? <Minimize2 size={14}/> : <Maximize2 size={14}/>}</button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto no-scrollbar">
                <div className="p-4 min-w-max">
                    <div className="flex bg-slate-100 dark:bg-slate-900/50 rounded-t-2xl overflow-hidden shadow-sm">
                        {TEETH_UPPER.map(tooth => <PerioRow key={tooth} tooth={tooth} measurement={chartData.find(m => m.toothNumber === tooth)} compareMeasurement={comparisonChartData?.find(m => m.toothNumber === tooth)} dentalChart={dentalChart} focusedSite={focusedSite} onValueChange={handleValueChange} onMobilityCycle={handleMobilityCycle} onBopCycle={handleBopCycle} onPlaqueIndexCycle={handlePlaqueIndexCycle} onFurcationChange={handleFurcationChange} onFocusSite={handleFocusSite} readOnly={isChartReadOnly} compareMode={compareMode} inputRefs={inputRefs} isColumnFocused={focusedSite?.tooth === tooth} />)}
                    </div>
                    <div className="h-1 bg-slate-200 dark:bg-slate-700 my-1"></div>
                    <div className="flex bg-slate-100 dark:bg-slate-900/50 rounded-b-2xl overflow-hidden shadow-sm">
                        {TEETH_LOWER.map(tooth => <PerioRow key={tooth} tooth={tooth} measurement={chartData.find(m => m.toothNumber === tooth)} compareMeasurement={comparisonChartData?.find(m => m.toothNumber === tooth)} dentalChart={dentalChart} focusedSite={focusedSite} onValueChange={handleValueChange} onMobilityCycle={handleMobilityCycle} onBopCycle={handleBopCycle} onPlaqueIndexCycle={handlePlaqueIndexCycle} onFurcationChange={handleFurcationChange} onFocusSite={handleFocusSite} readOnly={isChartReadOnly} compareMode={compareMode} inputRefs={inputRefs} isColumnFocused={focusedSite?.tooth === tooth} />)}
                    </div>
                </div>
            </div>
        </div>
    );
};
