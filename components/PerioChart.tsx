
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PerioMeasurement, DentalChartEntry } from '../types';
import { Save, AlertTriangle, Info, ChevronDown, ChevronUp, Activity, ArrowRightLeft, TrendingDown, History, Mic, MicOff, Volume2, FastForward, LineChart, Sparkles } from 'lucide-react';
import { useToast } from './ToastSystem';
import { formatDate } from '../constants';
import { useDictation } from '../hooks/useDictation';

interface PerioChartProps {
    data: PerioMeasurement[];
    dentalChart: DentalChartEntry[];
    onSave: (newData: PerioMeasurement[]) => void;
    readOnly?: boolean;
}

const TEETH_UPPER = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const TEETH_LOWER = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];
const ALL_TEETH = [...TEETH_UPPER, ...TEETH_LOWER];

interface PerioRowProps {
    tooth: number;
    measurement?: PerioMeasurement;
    previousMeasurement?: PerioMeasurement;
    dentalChart: DentalChartEntry[];
    focusedSite: { tooth: number, index: number } | null;
    onValueChange: (tooth: number, field: 'pocketDepths' | 'recession', index: number, value: string) => void;
    onMobilityChange: (tooth: number, value: string) => void;
    onBleedingToggle: (tooth: number, index: number) => void;
    onFocusSite: (tooth: number, index: number) => void;
    readOnly?: boolean;
    compareMode?: boolean;
    inputRefs: React.MutableRefObject<Record<string, HTMLInputElement | null>>;
}

const PerioRow: React.FC<PerioRowProps> = React.memo(({ tooth, measurement, previousMeasurement, dentalChart, focusedSite, onValueChange, onBleedingToggle, onMobilityChange, onFocusSite, readOnly, compareMode, inputRefs }) => {
    const m = measurement;
    if (!m) return null;

    const isMissingOrExtracted = useMemo(() => {
        return dentalChart.some(entry => 
            entry.toothNumber === tooth &&
            (entry.procedure.toLowerCase().includes('extraction') || entry.procedure.toLowerCase().includes('missing'))
        );
    }, [dentalChart, tooth]);

    const maxDepth = Math.max(...(m.pocketDepths.filter(d => d !== null) as number[]), 0);
    const isConcern = maxDepth >= 5;
    
    const getSiteRefKey = (tooth: number, index: number) => `t${tooth}-i${index}`;

    return (
        <div className={`flex flex-col border-r border-slate-100 min-w-[125px] transition-all duration-500 ${isMissingOrExtracted ? 'bg-slate-200 opacity-50' : (isConcern ? 'bg-red-50/30' : 'bg-white')}`}>
            <div className={`text-center font-black py-3 border-b border-slate-100 text-[11px] tracking-widest ${isMissingOrExtracted ? 'text-slate-500 bg-slate-100' : (isConcern ? 'text-red-700 bg-red-50/50' : 'text-slate-500 bg-slate-50/30')}`}>
                #{tooth}
                {isConcern && !isMissingOrExtracted && <AlertTriangle size={10} className="inline ml-1 text-red-500 animate-pulse"/>}
            </div>

            <div className="flex justify-center gap-1.5 p-2 bg-white">
                {[0, 1, 2].map(i => {
                    const isFocused = focusedSite?.tooth === tooth && focusedSite?.index === i;
                    const diff = previousMeasurement && compareMode ? (m.pocketDepths[i] || 0) - (previousMeasurement.pocketDepths[i] || 0) : 0;
                    return (
                        <div key={`F-${i}`} className="flex flex-col items-center gap-2">
                            <div className="relative group/input">
                                <input 
                                    ref={el => { inputRefs.current[getSiteRefKey(tooth, i)] = el; }}
                                    type="text" 
                                    maxLength={2}
                                    value={m.pocketDepths[i] ?? ''}
                                    onFocus={() => onFocusSite(tooth, i)}
                                    onChange={(e) => onValueChange(tooth, 'pocketDepths', i, e.target.value)}
                                    className={`w-10 h-10 text-center text-sm border-2 rounded-xl focus:outline-none transition-all duration-300 font-black
                                        ${isFocused ? 'scale-110 border-teal-600 bg-white shadow-xl shadow-teal-900/10 z-20' : 'border-slate-50 bg-slate-50/50 text-slate-700 group-hover/input:border-teal-200'}
                                        ${(m.pocketDepths[i] || 0) >= 5 ? 'text-red-700 border-red-200 bg-red-50' : ''}
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
                            <button 
                                onClick={() => onBleedingToggle(tooth, i)}
                                className={`w-6 h-6 rounded-lg transition-all ${m.bleeding[i] ? 'bg-red-500 shadow-sm' : 'bg-slate-100 hover:bg-red-100'}`}
                                disabled={readOnly || isMissingOrExtracted}
                            ></button>
                        </div>
                    );
                })}
            </div>
            
            <div className="flex justify-center gap-1.5 p-2 bg-slate-50/30">
                {[3, 4, 5].map(i => {
                    const isFocused = focusedSite?.tooth === tooth && focusedSite?.index === i;
                     const diff = previousMeasurement && compareMode ? (m.pocketDepths[i] || 0) - (previousMeasurement.pocketDepths[i] || 0) : 0;
                    return (
                         <div key={`L-${i}`} className="flex flex-col items-center gap-2">
                            <button 
                                onClick={() => onBleedingToggle(tooth, i)}
                                className={`w-6 h-6 rounded-lg transition-all ${m.bleeding[i] ? 'bg-red-500 shadow-sm' : 'bg-slate-100 hover:bg-red-100'}`}
                                disabled={readOnly || isMissingOrExtracted}
                            ></button>
                            <div className="relative group/input">
                                <input 
                                    ref={el => { inputRefs.current[getSiteRefKey(tooth, i)] = el; }}
                                    type="text" 
                                    maxLength={2}
                                    value={m.pocketDepths[i] ?? ''}
                                    onFocus={() => onFocusSite(tooth, i)}
                                    onChange={(e) => onValueChange(tooth, 'pocketDepths', i, e.target.value)}
                                    className={`w-10 h-10 text-center text-sm border-2 rounded-xl focus:outline-none transition-all duration-300 font-black
                                       ${isFocused ? 'scale-110 border-teal-600 bg-white shadow-xl shadow-teal-900/10 z-20' : 'border-slate-50 bg-slate-50/50 text-slate-700 group-hover/input:border-teal-200'}
                                       ${(m.pocketDepths[i] || 0) >= 5 ? 'text-red-700 border-red-200 bg-red-50' : ''}
                                    `}
                                    placeholder="-"
                                    disabled={readOnly || isMissingOrExtracted}
                                />
                                {compareMode && diff !== 0 && (
                                    <span className={`absolute -bottom-2 -right-2 text-[8px] px-1.5 py-0.5 rounded-full border-2 font-black shadow-sm z-30 ${diff > 0 ? 'bg-red-600 text-white border-white' : 'bg-teal-600 text-white border-white'}`}>
                                        {diff > 0 ? `+${diff}` : diff}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
            
            <div className="text-center font-black p-2 bg-white text-[10px] tracking-widest">
                 <div className="flex justify-center items-center gap-2">
                     <span className="text-slate-400">REC</span>
                     <input 
                        type="text" 
                        maxLength={2}
                        value={m.recession[1] ?? ''}
                        onChange={(e) => onValueChange(tooth, 'recession', 1, e.target.value)}
                        className="w-8 h-8 text-center text-sm rounded-lg border-2 border-slate-100 focus:border-teal-500 outline-none font-bold"
                        placeholder="-"
                        disabled={readOnly || isMissingOrExtracted}
                     />
                 </div>
                 <div className="flex justify-center items-center gap-2 mt-2">
                     <span className="text-slate-400">MOB</span>
                     <input 
                        type="text" 
                        maxLength={1}
                        value={m.mobility ?? ''}
                        onChange={(e) => onMobilityChange(tooth, e.target.value)}
                        className="w-8 h-8 text-center text-sm rounded-lg border-2 border-slate-100 focus:border-teal-500 outline-none font-bold"
                        placeholder="-"
                        disabled={readOnly || isMissingOrExtracted}
                     />
                 </div>
            </div>
        </div>
    );
});

export const PerioChart: React.FC<PerioChartProps> = ({ data, dentalChart, onSave, readOnly }) => {
    const [chartData, setChartData] = useState<PerioMeasurement[]>([]);
    const [focusedSite, setFocusedSite] = useState<{ tooth: number, index: number } | null>(null);
    const toast = useToast();
    const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

    const { isRecording, toggleRecording } = useDictation({
        s: () => {}, o: () => {}, a: () => {}, p: () => {}
    });

    useEffect(() => {
        const initialData: PerioMeasurement[] = ALL_TEETH.map(toothNum => {
            const existing = data.find(d => d.toothNumber === toothNum);
            if (existing) return existing;
            return {
                toothNumber: toothNum,
                pocketDepths: Array(6).fill(null),
                recession: Array(6).fill(null),
                bleeding: Array(6).fill(false),
                mobility: null
            };
        });
        setChartData(initialData);
    }, [data]);
    
    const [history, setHistory] = useState<PerioMeasurement[][]>([]);
    const [compareDate, setCompareDate] = useState<string | null>(null);

    const previousMeasurementForTooth = (tooth: number) => {
        if (!compareDate) return undefined;
        const historyEntry = history.find(h => h[0]?.date === compareDate);
        return historyEntry?.find(m => m.toothNumber === tooth);
    };

    const handleValueChange = (tooth: number, field: 'pocketDepths' | 'recession', index: number, value: string) => {
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

    const handleMobilityChange = (tooth: number, value: string) => {
        const numVal = value === '' ? null : parseInt(value);
        if (numVal !== null && (isNaN(numVal) || numVal < 0 || numVal > 3)) return;
        setChartData(prev => prev.map(m => m.toothNumber === tooth ? { ...m, mobility: numVal, date: new Date().toISOString().split('T')[0] } : m));
    };

    const handleBleedingToggle = (tooth: number, index: number) => {
        setChartData(prev => prev.map(m => {
            if (m.toothNumber === tooth) {
                const newBleeding = [...m.bleeding];
                newBleeding[index] = !newBleeding[index];
                return { ...m, bleeding: newBleeding, date: new Date().toISOString().split('T')[0] };
            }
            return m;
        }));
    };

    const handleFocusSite = (tooth: number, index: number) => {
        setFocusedSite({ tooth, index });
    };

    const handleSave = () => {
        onSave(chartData.filter(m => m.date)); // Only save entries that have been modified
        toast.success("Periodontal chart updated.");
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 rounded-[2rem] border border-slate-200 overflow-hidden shadow-inner">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white/80 backdrop-blur-sm sticky top-0 z-30">
                <div className="flex items-center gap-4">
                    <Activity size={20} className="text-teal-700"/>
                    <h3 className="font-black text-slate-800 uppercase tracking-tight">Periodontal Charting</h3>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => toggleRecording('s')} className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100'}`}>
                        {isRecording ? <MicOff size={14}/> : <Mic size={14}/>} {isRecording ? 'Stop' : 'Dictate'}
                    </button>
                    {!readOnly && <button onClick={handleSave} className="bg-teal-600 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2"><Save size={14}/> Save Chart</button>}
                </div>
            </div>

            <div className="flex-1 overflow-auto no-scrollbar">
                <div className="p-4 min-w-max">
                    <div className="flex bg-slate-100 rounded-t-2xl overflow-hidden shadow-sm">
                        {TEETH_UPPER.map(tooth => <PerioRow key={tooth} tooth={tooth} measurement={chartData.find(m => m.toothNumber === tooth)} previousMeasurement={previousMeasurementForTooth(tooth)} dentalChart={dentalChart} focusedSite={focusedSite} onValueChange={handleValueChange} onBleedingToggle={handleBleedingToggle} onMobilityChange={handleMobilityChange} onFocusSite={handleFocusSite} readOnly={readOnly} compareMode={!!compareDate} inputRefs={inputRefs} />)}
                    </div>
                    <div className="h-2 bg-slate-200 my-2"></div>
                    <div className="flex bg-slate-100 rounded-b-2xl overflow-hidden shadow-sm">
                        {TEETH_LOWER.map(tooth => <PerioRow key={tooth} tooth={tooth} measurement={chartData.find(m => m.toothNumber === tooth)} previousMeasurement={previousMeasurementForTooth(tooth)} dentalChart={dentalChart} focusedSite={focusedSite} onValueChange={handleValueChange} onBleedingToggle={handleBleedingToggle} onMobilityChange={handleMobilityChange} onFocusSite={handleFocusSite} readOnly={readOnly} compareMode={!!compareDate} inputRefs={inputRefs} />)}
                    </div>
                </div>
            </div>
        </div>
    );
};
