import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PerioMeasurement } from '../types';
import { Save, AlertTriangle, Info, ChevronDown, ChevronUp, Activity, ArrowRightLeft, TrendingDown, History, Mic, MicOff, Volume2, FastForward, LineChart, Sparkles } from 'lucide-react';
import { useToast } from './ToastSystem';
import { formatDate } from '../constants';

interface PerioChartProps {
    data: PerioMeasurement[];
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
    focusedSite: { tooth: number, index: number } | null;
    onValueChange: (tooth: number, field: 'pocketDepths' | 'recession', index: number, value: string) => void;
    onMobilityChange: (tooth: number, value: string) => void;
    onBleedingToggle: (tooth: number, index: number) => void;
    onFocusSite: (tooth: number, index: number) => void;
    readOnly?: boolean;
    compareMode?: boolean;
}

const PerioRow: React.FC<PerioRowProps> = React.memo(({ tooth, measurement, previousMeasurement, focusedSite, onValueChange, onBleedingToggle, onMobilityChange, onFocusSite, readOnly, compareMode }) => {
    const m = measurement;
    if (!m) return null;

    const maxDepth = Math.max(...(m.pocketDepths.filter(d => d !== null) as number[]), 0);
    const isConcern = maxDepth >= 5;

    return (
        <div className={`flex flex-col border-r border-slate-100 min-w-[125px] transition-all duration-500 ${isConcern ? 'bg-red-50/30' : 'bg-white'}`}>
            <div className={`text-center font-black py-3 border-b border-slate-100 text-[11px] tracking-widest ${isConcern ? 'text-red-700 bg-red-50/50' : 'text-slate-500 bg-slate-50/30'}`}>
                #{tooth}
                {isConcern && <AlertTriangle size={10} className="inline ml-1 text-red-500 animate-pulse"/>}
            </div>

            <div className="flex justify-center gap-1.5 p-2 bg-white">
                {[0, 1, 2].map(i => {
                    const isFocused = focusedSite?.tooth === tooth && focusedSite?.index === i;
                    const diff = previousMeasurement && compareMode ? (m.pocketDepths[i] || 0) - (previousMeasurement.pocketDepths[i] || 0) : 0;
                    return (
                        <div key={`F-${i}`} className="flex flex-col items-center gap-2">
                            <div className="relative group/input">
                                <input 
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
                                    disabled={readOnly}
                                />
                                {compareMode && diff !== 0 && (
                                    <span className={`absolute -top-2 -right-2 text-[8px] px-1.5 py-0.5 rounded-full border-2 font-black shadow-sm z-30 ${diff > 0 ? 'bg-red-600 text-white border-white' : 'bg-teal-600 text-white border-white'}`}>
                                        {diff > 0 ? `+${diff}` : diff}
                                    </span>
                                )}
                            </div>
                            <button 
                                onClick={() => onBleedingToggle(tooth, i)}
                                className={`w-6 h-6 rounded-full border-2 shadow-sm transition-all duration-300 active:scale-75 ${m.bleeding[i] ? 'bg-red-600 border-red-200 scale-110 ring-4 ring-red-500/10' : 'bg-slate-100 border-slate-200 hover:border-red-400'}`}
                                disabled={readOnly}
                            />
                        </div>
                    );
                })}
            </div>

            <div className="py-2.5 flex justify-center border-y border-slate-100 bg-slate-50/50">
                    <select 
                        value={m.mobility ?? ''}
                        aria-label={`Mobility for tooth ${tooth}`}
                        onChange={(e) => onMobilityChange(tooth, e.target.value)}
                        className="text-[10px] bg-transparent font-black text-center outline-none cursor-pointer text-teal-800 w-full appearance-none uppercase tracking-widest"
                        disabled={readOnly}
                    >
                        <option value="">MOB: -</option>
                        <option value="0">0</option>
                        <option value="1">I</option>
                        <option value="2">II</option>
                        <option value="3">III</option>
                    </select>
            </div>

            <div className="flex justify-center gap-1.5 p-2 bg-white">
                {[3, 4, 5].map(i => {
                    const isFocused = focusedSite?.tooth === tooth && focusedSite?.index === i;
                    const diff = previousMeasurement && compareMode ? (m.pocketDepths[i] || 0) - (previousMeasurement.pocketDepths[i] || 0) : 0;
                    return (
                        <div key={`L-${i}`} className="flex flex-col items-center gap-2">
                        <button 
                            onClick={() => onBleedingToggle(tooth, i)}
                            className={`w-6 h-6 rounded-full border-2 shadow-sm transition-all duration-300 active:scale-75 ${m.bleeding[i] ? 'bg-red-600 border-red-200 scale-110 ring-4 ring-red-500/10' : 'bg-slate-100 border-slate-200 hover:border-red-400'}`}
                            disabled={readOnly}
                        />
                        <div className="relative group/input">
                            <input 
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
                                disabled={readOnly}
                            />
                            {compareMode && diff !== 0 && (
                                <span className={`absolute -top-2 -right-2 text-[8px] px-1.5 py-0.5 rounded-full border-2 font-black shadow-sm z-30 ${diff > 0 ? 'bg-red-600 text-white border-white' : 'bg-teal-600 text-white border-white'}`}>
                                    {diff > 0 ? `+${diff}` : diff}
                                </span>
                            )}
                        </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
});

const PerioProgressionGraph: React.FC<{ data: PerioMeasurement[] }> = ({ data }) => {
    const historicalDates = useMemo(() => {
        return Array.from(new Set(data.map(m => m.date).filter(Boolean)))
            .sort((a: any, b: any) => new Date(a).getTime() - new Date(b).getTime());
    }, [data]);

    const stats = useMemo(() => {
        return historicalDates.map(date => {
            const dateMeasurements = data.filter(m => m.date === date);
            const allDepths = dateMeasurements.flatMap(m => m.pocketDepths).filter(d => d !== null) as number[];
            const avg = allDepths.length > 0 ? allDepths.reduce((a, b) => a + b, 0) / allDepths.length : 0;
            return { date, avg };
        });
    }, [historicalDates, data]);

    if (stats.length < 2) return null;

    const maxAvg = Math.max(...stats.map(s => s.avg), 5);

    return (
        <div className="bg-white p-10 rounded-[3rem] border-2 border-teal-50 shadow-2xl shadow-teal-900/5 animate-in slide-in-from-top-4 duration-700 mb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            
            <div className="flex items-center gap-4 text-teal-950 font-black uppercase tracking-tighter text-xl mb-12 relative z-10">
                <div className="bg-teal-600 text-white p-2.5 rounded-2xl shadow-xl shadow-teal-600/20"><LineChart size={24}/></div>
                Hygiene Performance Vector
            </div>

            <div className="h-48 flex items-end gap-3 relative border-b-2 border-l-2 border-slate-100 ml-12 mb-12 px-6 pt-6 relative z-10">
                <div className="absolute -left-12 top-0 bottom-0 flex flex-col justify-between text-[10px] font-black text-slate-400 py-1 tracking-widest uppercase">
                    <span>{maxAvg.toFixed(1)}mm</span>
                    <span className="opacity-40">{(maxAvg/2).toFixed(1)}</span>
                    <span>0</span>
                </div>
                
                {stats.map((s, i) => {
                    const height = (s.avg / maxAvg) * 100;
                    return (
                        <div key={i} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                            <div 
                                className="w-full bg-gradient-to-t from-lilac-500/20 to-teal-600 rounded-t-2xl transition-all duration-1000 group-hover:scale-x-105 group-hover:brightness-110 relative border-x-4 border-white shadow-lg" 
                                style={{ height: `${height}%` }}
                            >
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-[10px] font-black text-white bg-teal-900 px-3 py-1 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100">
                                    {s.avg.toFixed(2)}mm
                                </div>
                            </div>
                            <div className="absolute -bottom-10 text-[10px] font-black text-slate-400 whitespace-nowrap rotate-45 origin-left uppercase tracking-tighter transition-colors group-hover:text-teal-700">
                                {formatDate(s.date)}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const PerioChart: React.FC<PerioChartProps> = ({ data, onSave, readOnly }) => {
    const toast = useToast();
    const [measurements, setMeasurements] = useState<Record<number, PerioMeasurement>>({});
    const [compareMode, setCompareMode] = useState(false);
    const [showGraph, setShowGraph] = useState(true);
    const [focusedSite, setFocusedSite] = useState<{ tooth: number, index: number } | null>(null);
    
    const historicalDates = useMemo(() => {
        const dates = Array.from(new Set(data.map(m => m.date))).sort((a: any, b: any) => new Date(b).getTime() - new Date(a).getTime());
        return dates as string[];
    }, [data]);

    const previousDate = historicalDates[1];

    useEffect(() => {
        const map: Record<number, PerioMeasurement> = {};
        ALL_TEETH.forEach(t => {
            const current = data.filter(d => d.toothNumber === t).sort((a: any, b: any) => new Date(b.date || '').getTime() - new Date(a.date || '').getTime())[0];
            if (current) {
                map[t] = { ...current };
            } else {
                map[t] = {
                    toothNumber: t,
                    pocketDepths: [null, null, null, null, null, null],
                    recession: [null, null, null, null, null, null],
                    bleeding: [false, false, false, false, false, false],
                    mobility: null
                };
            }
        });
        setMeasurements(map);
        if (!readOnly) setFocusedSite({ tooth: 18, index: 0 });
    }, [data, readOnly]);

    const advanceFocus = (current: { tooth: number, index: number }) => {
        let { tooth, index } = current;
        if (index < 5) {
            setFocusedSite({ tooth, index: index + 1 });
        } else {
            const currentIdx = ALL_TEETH.indexOf(tooth);
            if (currentIdx < ALL_TEETH.length - 1) {
                setFocusedSite({ tooth: ALL_TEETH[currentIdx + 1], index: 0 });
            } else {
                setFocusedSite(null);
                toast.info("Clinical examination complete.");
            }
        }
    };

    const handleValueChange = (tooth: number, field: 'pocketDepths' | 'recession', index: number, value: string) => {
        if (readOnly) return;
        if (value.length === 1 && /^\d$/.test(value)) {
            const numVal = parseInt(value);
            setMeasurements(prev => {
                const toothData = { ...prev[tooth] };
                const newValues = [...toothData[field]];
                newValues[index] = numVal;
                toothData[field] = newValues;
                return { ...prev, [tooth]: toothData };
            });
            advanceFocus({ tooth, index });
            return;
        }
        const numVal = value === '' ? null : parseInt(value);
        if (numVal !== null && (isNaN(numVal) || numVal < 0 || numVal > 15)) return;
        setMeasurements(prev => {
            const toothData = { ...prev[tooth] };
            const newValues = [...toothData[field]];
            newValues[index] = numVal;
            toothData[field] = newValues;
            return { ...prev, [tooth]: toothData };
        });
    };

    const handleMobilityChange = (tooth: number, value: string) => {
        if (readOnly) return;
        const numVal = value === '' ? null : parseInt(value) as 0|1|2|3;
        setMeasurements(prev => ({ ...prev, [tooth]: { ...prev[tooth], mobility: numVal } }));
    };

    const toggleBleeding = (tooth: number, index: number) => {
        if (readOnly) return;
        setMeasurements(prev => {
            const toothData = { ...prev[tooth] };
            const newBleeding = [...toothData.bleeding];
            newBleeding[index] = !newBleeding[index];
            toothData.bleeding = newBleeding;
            return { ...prev, [tooth]: toothData };
        });
    };

    const saveAll = () => {
        const arrayData = Object.values(measurements);
        onSave(arrayData);
        toast.success("Periodontal record synchronized.");
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-[3rem] border border-slate-100 overflow-hidden relative shadow-[inset_0_4px_20px_rgba(0,0,0,0.02)]">
             <div className="bg-white/80 backdrop-blur-xl p-6 border-b border-slate-100 flex justify-between items-center shadow-sm z-20 sticky top-0">
                <div className="flex items-center gap-4">
                    <div className="bg-lilac-600 text-white p-3 rounded-2xl shadow-xl shadow-lilac-600/20"><Activity size={24} /></div>
                    <div>
                        <h3 className="text-lg font-black text-slate-800 tracking-tight uppercase leading-none">Periodontal Hub</h3>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1.5">Temporal Attachment Tracking</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setShowGraph(!showGraph)} className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all flex items-center gap-2 ${showGraph ? 'bg-teal-50 border-teal-500 text-teal-800 shadow-lg' : 'bg-white border-slate-100 text-slate-400'}`}><LineChart size={16}/> Trends</button>
                    {previousDate && (
                        <button onClick={() => setCompareMode(!compareMode)} className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all flex items-center gap-2 ${compareMode ? 'bg-lilac-600 border-lilac-600 text-white shadow-xl' : 'bg-white border-slate-100 text-slate-400'}`}><ArrowRightLeft size={16}/> Comp: {formatDate(previousDate)}</button>
                    )}
                    {!readOnly && (
                        <button onClick={saveAll} className="bg-teal-600 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-teal-600/30 hover:bg-teal-700 transition-all flex items-center gap-3"><Save size={18} /> Save Record</button>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-x-auto overflow-y-auto p-10 space-y-12 no-scrollbar scroll-smooth">
                {showGraph && <PerioProgressionGraph data={data} />}

                {!readOnly && focusedSite && (
                    <div className="bg-teal-900 text-white p-8 rounded-[3rem] flex items-center justify-between mb-8 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
                        <div className="flex items-center gap-6 relative z-10">
                            <div className="bg-teal-600 p-4 rounded-3xl shadow-lg animate-pulse"><Sparkles size={32}/></div>
                            <div>
                                <div className="text-[10px] font-black text-teal-400 uppercase tracking-[0.4em] mb-1">Direct Data Entry</div>
                                <div className="text-3xl font-black uppercase tracking-tighter leading-none">TOOTH #{focusedSite.tooth} <span className="text-teal-400 mx-2">/</span> SITE {focusedSite.index + 1}</div>
                            </div>
                        </div>
                        <div className="text-right relative z-10 hidden md:block">
                            <p className="text-[10px] font-black text-teal-500 uppercase tracking-widest leading-relaxed">Touch-Optimized Matrix</p>
                            <p className="text-xs font-bold text-teal-100 opacity-60">Sequence: Distal-Center-Mesial</p>
                        </div>
                    </div>
                )}

                <div className="space-y-6">
                    <div className="flex items-center gap-4 font-black text-slate-400 uppercase text-[10px] tracking-[0.4em] ml-2">
                        <ChevronUp size={20} className="text-teal-600"/> Maxillary Arch Registry
                    </div>
                    <div className="flex border-4 border-white rounded-[3.5rem] overflow-hidden shadow-2xl w-max bg-slate-100/30">
                        {TEETH_UPPER.map(t => (
                            <PerioRow 
                                key={t} 
                                tooth={t} 
                                focusedSite={focusedSite}
                                measurement={measurements[t]} 
                                previousMeasurement={compareMode ? data.find(d => d.toothNumber === t && d.date === previousDate) : undefined}
                                onValueChange={handleValueChange}
                                onFocusSite={(tooth, index) => setFocusedSite({ tooth, index })}
                                onMobilityChange={handleMobilityChange}
                                onBleedingToggle={toggleBleeding}
                                readOnly={readOnly}
                                compareMode={compareMode}
                            />
                        ))}
                    </div>
                </div>

                <div className="space-y-6 pb-24">
                    <div className="flex items-center gap-4 font-black text-slate-400 uppercase text-[10px] tracking-[0.4em] ml-2">
                        <ChevronDown size={20} className="text-lilac-600"/> Mandibular Arch Registry
                    </div>
                    <div className="flex border-4 border-white rounded-[3.5rem] overflow-hidden shadow-2xl w-max bg-slate-100/30">
                        {TEETH_LOWER.map(t => (
                            <PerioRow 
                                key={t} 
                                tooth={t} 
                                focusedSite={focusedSite}
                                measurement={measurements[t]} 
                                previousMeasurement={compareMode ? data.find(d => d.toothNumber === t && d.date === previousDate) : undefined}
                                onValueChange={handleValueChange}
                                onFocusSite={(tooth, index) => setFocusedSite({ tooth, index })}
                                onMobilityChange={handleMobilityChange}
                                onBleedingToggle={toggleBleeding}
                                readOnly={readOnly}
                                compareMode={compareMode}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Matrix Legend */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-xl border border-slate-100 px-8 py-4 rounded-[2rem] shadow-2xl flex gap-8 items-center z-30">
                <div className="flex items-center gap-3"><div className="w-4 h-4 bg-red-600 rounded-full shadow-lg shadow-red-600/20" /><span className="text-[10px] font-black uppercase text-slate-600 tracking-widest">BOP Active</span></div>
                <div className="flex items-center gap-3"><div className="w-4 h-4 bg-red-50 border-2 border-red-200 rounded" /><span className="text-[10px] font-black uppercase text-slate-600 tracking-widest">At-Risk Depth</span></div>
                <div className="w-px h-6 bg-slate-100" />
                <div className="flex items-center gap-3"><div className="w-4 h-4 bg-teal-600 rounded" /><span className="text-[10px] font-black uppercase text-slate-600 tracking-widest">Active Site</span></div>
            </div>
        </div>
    );
};

export default PerioChart;