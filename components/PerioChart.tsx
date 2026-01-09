import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PerioMeasurement } from '../types';
import { Save, AlertTriangle, Info, ChevronDown, ChevronUp, Activity, ArrowRightLeft, TrendingDown, History, Mic, MicOff, Volume2, FastForward, LineChart } from 'lucide-react';
import { useToast } from './ToastSystem';

interface PerioChartProps {
    data: PerioMeasurement[];
    onSave: (newData: PerioMeasurement[]) => void;
    readOnly?: boolean;
}

// FDI Quadrants split for wrapping on tablet range
const UR = [18, 17, 16, 15, 14, 13, 12, 11];
const UL = [21, 22, 23, 24, 25, 26, 27, 28];
const LR = [48, 47, 46, 45, 44, 43, 42, 41];
const LL = [31, 32, 33, 34, 35, 36, 37, 38];
const ALL_TEETH = [...UR, ...UL, ...LR, ...LL];

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
        <div className={`flex flex-col border-r border-slate-200 min-w-[120px] transition-colors ${isConcern ? 'bg-red-50/50' : 'bg-white'}`}>
            <div className={`text-center font-black py-1.5 border-b border-slate-200 text-[11px] ${isConcern ? 'text-red-700 bg-red-50' : 'text-slate-700 bg-slate-50'}`}>
                #{tooth}
            </div>

            <div className="flex justify-center gap-1 p-1 bg-slate-50/20">
                {[0, 1, 2].map(i => {
                    const isFocused = focusedSite?.tooth === tooth && focusedSite?.index === i;
                    const diff = previousMeasurement && compareMode ? (m.pocketDepths[i] || 0) - (previousMeasurement.pocketDepths[i] || 0) : 0;
                    return (
                        <div key={`F-${i}`} className="flex flex-col items-center gap-1">
                            <div className="relative">
                                <input 
                                    type="text" 
                                    maxLength={2}
                                    value={m.pocketDepths[i] ?? ''}
                                    onFocus={() => onFocusSite(tooth, i)}
                                    onChange={(e) => onValueChange(tooth, 'pocketDepths', i, e.target.value)}
                                    className={`w-9 h-9 text-center text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700 font-black transition-all
                                        ${isFocused ? 'scale-110 border-teal-700 ring-2 ring-teal-500/20 z-10' : 'border-slate-100'}
                                        ${(m.pocketDepths[i] || 0) >= 5 ? 'text-red-700 border-red-300 bg-red-50' : 'text-slate-800'}
                                    `}
                                    placeholder="-"
                                    disabled={readOnly}
                                />
                                {compareMode && diff !== 0 && (
                                    <span className={`absolute -top-1.5 -right-1.5 text-[7px] px-1 rounded-full border font-black ${diff > 0 ? 'bg-red-600 text-white border-red-700' : 'bg-green-600 text-white border-green-700'}`}>
                                        {diff > 0 ? `+${diff}` : diff}
                                    </span>
                                )}
                            </div>
                            <button 
                                onClick={() => onBleedingToggle(tooth, i)}
                                className={`w-5 h-5 rounded-full border-2 transition-transform active:scale-90 ${m.bleeding[i] ? 'bg-red-600 border-red-800 shadow-md' : 'bg-white border-slate-200'}`}
                                disabled={readOnly}
                            />
                        </div>
                    );
                })}
            </div>

            <div className="py-1 flex justify-center border-y border-slate-100 bg-slate-100/30">
                <select 
                    value={m.mobility ?? ''}
                    onChange={(e) => onMobilityChange(tooth, e.target.value)}
                    className="text-[9px] bg-transparent font-black text-center outline-none cursor-pointer text-blue-800 uppercase"
                    disabled={readOnly}
                >
                    <option value="">-</option>
                    <option value="0">0</option>
                    <option value="1">I</option>
                    <option value="2">II</option>
                    <option value="3">III</option>
                </select>
            </div>

            <div className="flex justify-center gap-1 p-1 bg-slate-50/20">
                {[3, 4, 5].map(i => {
                    const isFocused = focusedSite?.tooth === tooth && focusedSite?.index === i;
                    const diff = previousMeasurement && compareMode ? (m.pocketDepths[i] || 0) - (previousMeasurement.pocketDepths[i] || 0) : 0;
                    return (
                        <div key={`L-${i}`} className="flex flex-col items-center gap-1">
                            <button 
                                onClick={() => onBleedingToggle(tooth, i)}
                                className={`w-5 h-5 rounded-full border-2 transition-transform active:scale-90 ${m.bleeding[i] ? 'bg-red-600 border-red-800 shadow-md' : 'bg-white border-slate-200'}`}
                                disabled={readOnly}
                            />
                            <div className="relative">
                                <input 
                                    type="text" 
                                    maxLength={2}
                                    value={m.pocketDepths[i] ?? ''}
                                    onFocus={() => onFocusSite(tooth, i)}
                                    onChange={(e) => onValueChange(tooth, 'pocketDepths', i, e.target.value)}
                                    className={`w-9 h-9 text-center text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700 font-black transition-all
                                        ${isFocused ? 'scale-110 border-teal-700 ring-2 ring-teal-500/20 z-10' : 'border-slate-100'}
                                        ${(m.pocketDepths[i] || 0) >= 5 ? 'text-red-700 border-red-300 bg-red-50' : 'text-slate-800'}
                                    `}
                                    placeholder="-"
                                    disabled={readOnly}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
});

const PerioChart: React.FC<PerioChartProps> = ({ data, onSave, readOnly }) => {
    const toast = useToast();
    const [measurements, setMeasurements] = useState<Record<number, PerioMeasurement>>({});
    const [compareMode, setCompareMode] = useState(false);
    const [focusedSite, setFocusedSite] = useState<{ tooth: number, index: number } | null>(null);
    
    const historicalDates = useMemo(() => {
        const dates = Array.from(new Set(data.map(m => m.date))).sort((a: any, b: any) => new Date(b).getTime() - new Date(a).getTime());
        return dates as string[];
    }, [data]);

    const previousDate = historicalDates[1];

    useEffect(() => {
        const map: Record<number, PerioMeasurement> = {};
        ALL_TEETH.forEach(t => {
            const current = data.filter(d => d.toothNumber === t).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
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

    const handleValueChange = (tooth: number, field: 'pocketDepths' | 'recession', index: number, value: string) => {
        if (readOnly) return;
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

    const handleMobilityChange = (tooth: number, value: string) => {
        if (readOnly) return;
        const numVal = value === '' ? null : parseInt(value) as 0|1|2|3;
        setMeasurements(prev => ({
            ...prev,
            [tooth]: { ...prev[tooth], mobility: numVal }
        }));
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden relative">
             <div className="bg-white p-4 border-b flex justify-between items-center shadow-sm z-10">
                <div className="flex items-center gap-3">
                    <div className="bg-lilac-100 p-2 rounded-xl text-lilac-700"><Activity size={24} /></div>
                    <div>
                        <h3 className="font-black text-slate-800 text-sm">Periodontal Mapping</h3>
                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Stacked Quad-View for tablet efficiency</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {!readOnly && (
                        <button 
                            onClick={() => onSave(Object.values(measurements))}
                            className="bg-teal-700 text-white px-5 py-2 rounded-xl font-black text-xs uppercase shadow-lg shadow-teal-700/20"
                        >
                            Save Exam
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-12 no-scrollbar">
                
                {/* Maxillary Section (Segmented) */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 font-black text-slate-400 uppercase text-[10px] tracking-widest ml-1"><ChevronUp size={14} className="text-teal-600"/> Maxillary (Upper Arch)</div>
                    <div className="flex flex-wrap gap-6 justify-center lg:justify-start">
                        <div className="border border-slate-200 rounded-[2.2rem] overflow-hidden shadow-xl bg-white w-max">
                            <div className="flex">
                                {UR.map(t => <PerioRow key={t} tooth={t} focusedSite={focusedSite} measurement={measurements[t]} onValueChange={handleValueChange} onFocusSite={(tooth, index) => setFocusedSite({ tooth, index })} onMobilityChange={handleMobilityChange} onBleedingToggle={toggleBleeding} readOnly={readOnly} />)}
                            </div>
                        </div>
                        <div className="border border-slate-200 rounded-[2.2rem] overflow-hidden shadow-xl bg-white w-max">
                            <div className="flex">
                                {UL.map(t => <PerioRow key={t} tooth={t} focusedSite={focusedSite} measurement={measurements[t]} onValueChange={handleValueChange} onFocusSite={(tooth, index) => setFocusedSite({ tooth, index })} onMobilityChange={handleMobilityChange} onBleedingToggle={toggleBleeding} readOnly={readOnly} />)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mandibular Section (Segmented) */}
                <div className="space-y-6 pb-24">
                    <div className="flex items-center gap-2 font-black text-slate-400 uppercase text-[10px] tracking-widest ml-1"><ChevronDown size={14} className="text-lilac-600"/> Mandibular (Lower Arch)</div>
                    <div className="flex flex-wrap gap-6 justify-center lg:justify-start">
                        <div className="border border-slate-200 rounded-[2.2rem] overflow-hidden shadow-xl bg-white w-max">
                            <div className="flex">
                                {LR.map(t => <PerioRow key={t} tooth={t} focusedSite={focusedSite} measurement={measurements[t]} onValueChange={handleValueChange} onFocusSite={(tooth, index) => setFocusedSite({ tooth, index })} onMobilityChange={handleMobilityChange} onBleedingToggle={toggleBleeding} readOnly={readOnly} />)}
                            </div>
                        </div>
                        <div className="border border-slate-200 rounded-[2.2rem] overflow-hidden shadow-xl bg-white w-max">
                            <div className="flex">
                                {LL.map(t => <PerioRow key={t} tooth={t} focusedSite={focusedSite} measurement={measurements[t]} onValueChange={handleValueChange} onFocusSite={(tooth, index) => setFocusedSite({ tooth, index })} onMobilityChange={handleMobilityChange} onBleedingToggle={toggleBleeding} readOnly={readOnly} />)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PerioChart;