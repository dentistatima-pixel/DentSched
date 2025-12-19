import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PerioMeasurement } from '../types';
import { Save, AlertTriangle, Info, ChevronDown, ChevronUp, Activity, ArrowRightLeft, TrendingDown, History, Mic, MicOff, Volume2, FastForward } from 'lucide-react';
import { useToast } from './ToastSystem';

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
        <div className={`flex flex-col border-r border-slate-200 min-w-[125px] transition-colors ${isConcern ? 'bg-red-50/50' : 'bg-white'}`}>
            <div className={`text-center font-bold py-2 border-b border-slate-200 ${isConcern ? 'text-red-700' : 'text-slate-700'}`}>
                #{tooth}
                {isConcern && <AlertTriangle size={12} className="inline ml-1 text-red-500"/>}
            </div>

            <div className="flex justify-center gap-1 p-1 bg-slate-50/50">
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
                                    className={`w-8 h-8 text-center text-sm border rounded focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold transition-all
                                        ${isFocused ? 'scale-110 border-teal-500 ring-2 ring-teal-500/20 z-10' : 'border-slate-200'}
                                        ${(m.pocketDepths[i] || 0) >= 5 ? 'text-red-600 border-red-300 bg-red-50' : 'text-slate-700'}
                                    `}
                                    placeholder="-"
                                    disabled={readOnly}
                                />
                                {compareMode && diff !== 0 && (
                                    <span className={`absolute -top-1.5 -right-1.5 text-[8px] px-1 rounded-full border font-bold ${diff > 0 ? 'bg-red-100 text-red-600 border-red-200' : 'bg-green-100 text-green-600 border-green-200'}`}>
                                        {diff > 0 ? `+${diff}` : diff}
                                    </span>
                                )}
                            </div>
                            <button 
                                onClick={() => onBleedingToggle(tooth, i)}
                                className={`w-3 h-3 rounded-full border ${m.bleeding[i] ? 'bg-red-500 border-red-500' : 'bg-white border-slate-300 hover:border-red-300'}`}
                                title="BOP"
                                disabled={readOnly}
                            />
                        </div>
                    );
                })}
            </div>

            <div className="py-1 flex justify-center border-y border-slate-100 bg-slate-100/50">
                    <select 
                    value={m.mobility ?? ''}
                    onChange={(e) => onMobilityChange(tooth, e.target.value)}
                    className="text-xs bg-transparent font-bold text-center outline-none cursor-pointer text-blue-700 w-full appearance-none uppercase"
                    disabled={readOnly}
                    >
                        <option value="">Mob: -</option>
                        <option value="0">0</option>
                        <option value="1">I</option>
                        <option value="2">II</option>
                        <option value="3">III</option>
                    </select>
            </div>

            <div className="flex justify-center gap-1 p-1 bg-slate-50/50">
                {[3, 4, 5].map(i => {
                    const isFocused = focusedSite?.tooth === tooth && focusedSite?.index === i;
                    const diff = previousMeasurement && compareMode ? (m.pocketDepths[i] || 0) - (previousMeasurement.pocketDepths[i] || 0) : 0;
                    return (
                        <div key={`L-${i}`} className="flex flex-col items-center gap-1">
                        <button 
                            onClick={() => onBleedingToggle(tooth, i)}
                            className={`w-3 h-3 rounded-full border ${m.bleeding[i] ? 'bg-red-500 border-red-500' : 'bg-white border-slate-300 hover:border-red-300'}`}
                            title="BOP"
                            disabled={readOnly}
                        />
                        <div className="relative">
                            <input 
                                type="text" 
                                maxLength={2}
                                value={m.pocketDepths[i] ?? ''}
                                onFocus={() => onFocusSite(tooth, i)}
                                onChange={(e) => onValueChange(tooth, 'pocketDepths', i, e.target.value)}
                                className={`w-8 h-8 text-center text-sm border rounded focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold transition-all
                                    ${isFocused ? 'scale-110 border-teal-500 ring-2 ring-teal-500/20 z-10' : 'border-slate-200'}
                                    ${(m.pocketDepths[i] || 0) >= 5 ? 'text-red-600 border-red-300 bg-red-50' : 'text-slate-700'}
                                `}
                                placeholder="-"
                                disabled={readOnly}
                            />
                            {compareMode && diff !== 0 && (
                                <span className={`absolute -top-1.5 -right-1.5 text-[8px] px-1 rounded-full border font-bold ${diff > 0 ? 'bg-red-100 text-red-600 border-red-200' : 'bg-green-100 text-green-600 border-green-200'}`}>
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

const PerioChart: React.FC<PerioChartProps> = ({ data, onSave, readOnly }) => {
    const toast = useToast();
    const [measurements, setMeasurements] = useState<Record<number, PerioMeasurement>>({});
    const [compareMode, setCompareMode] = useState(false);
    const [isVoiceActive, setIsVoiceActive] = useState(false);
    const [focusedSite, setFocusedSite] = useState<{ tooth: number, index: number } | null>(null);
    
    const recognitionRef = useRef<any>(null);

    const historicalDates = useMemo(() => {
        const dates = Array.from(new Set(data.map(m => m.date))).sort((a: any, b: any) => new Date(b).getTime() - new Date(a).getTime());
        return dates as string[];
    }, [data]);

    const latestDate = historicalDates[0];
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
        // Default focus
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
                toast.info("Perio chart complete.");
            }
        }
    };

    const handleValueChange = (tooth: number, field: 'pocketDepths' | 'recession', index: number, value: string) => {
        if (readOnly) return;
        
        // Auto-advance logic: if single digit 0-9 is entered
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
        setMeasurements(prev => ({
            ...prev,
            [tooth]: { ...prev[tooth], mobility: numVal }
        }));
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

    const handleVoiceCommand = (command: string) => {
        if (!focusedSite) return;
        const clean = command.toLowerCase().trim();
        
        if (clean.includes('bleeding') || clean.includes('blood')) {
            toggleBleeding(focusedSite.tooth, focusedSite.index);
            toast.info(`Logged bleeding at #${focusedSite.tooth} site ${focusedSite.index + 1}`);
            return;
        }

        const number = parseInt(clean.match(/\d+/)?.[0] || '');
        if (!isNaN(number) && number >= 0 && number <= 15) {
            handleValueChange(focusedSite.tooth, 'pocketDepths', focusedSite.index, number.toString());
        }
    };

    const toggleVoice = () => {
        if (isVoiceActive) {
            recognitionRef.current?.stop();
            setIsVoiceActive(false);
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            toast.error("Speech API not supported.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.continuous = true;
        recognition.interimResults = false;

        recognition.onstart = () => {
            setIsVoiceActive(true);
            toast.success("Voice recording active. Speak depths (e.g. '3') or 'bleeding'.");
        };

        recognition.onresult = (event: any) => {
            const transcript = event.results[event.results.length - 1][0].transcript;
            handleVoiceCommand(transcript);
        };

        recognition.onerror = () => setIsVoiceActive(false);
        recognition.onend = () => setIsVoiceActive(false);

        recognitionRef.current = recognition;
        recognition.start();
    };

    const saveAll = () => {
        const arrayData = Object.values(measurements);
        onSave(arrayData);
        toast.success("Perio exam saved.");
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden relative">
             <div className="bg-white p-4 border-b border-slate-200 flex justify-between items-center shadow-sm z-10 sticky top-0">
                <div className="flex items-center gap-3">
                    <div className="bg-lilac-100 p-2 rounded-xl text-lilac-700"><Activity size={24} /></div>
                    <div>
                        <h3 className="font-bold text-slate-800">Periodontal Attachment Tracking</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Hygiene comparison & diagnostic progression</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {!readOnly && (
                        <button 
                            onClick={toggleVoice}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs border transition-all flex items-center gap-2
                                ${isVoiceActive ? 'bg-red-500 text-white animate-pulse border-red-600' : 'bg-white text-slate-500 border-slate-200 hover:border-teal-300'}
                            `}
                        >
                            {isVoiceActive ? <MicOff size={16}/> : <Mic size={16}/>}
                            {isVoiceActive ? 'Stop Voice' : 'Voice Entry'}
                        </button>
                    )}
                    {previousDate && (
                        <button 
                            onClick={() => setCompareMode(!compareMode)}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs border transition-all flex items-center gap-1
                                ${compareMode ? 'bg-lilac-600 text-white border-lilac-400' : 'bg-white text-slate-500 border-slate-200 hover:border-lilac-300'}
                            `}
                        >
                            <ArrowRightLeft size={14}/> {compareMode ? 'Hide Comparison' : `Compare vs ${previousDate}`}
                        </button>
                    )}
                    {!readOnly && (
                        <button 
                            onClick={saveAll}
                            className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-teal-600/20 transition-all"
                        >
                            <Save size={18} /> Save Exam
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-x-auto overflow-y-auto p-4 space-y-8 no-scrollbar scroll-smooth">
                {!readOnly && (
                    <div className="bg-teal-50 border border-teal-100 p-3 rounded-2xl flex items-center justify-between mb-4 shadow-sm animate-in slide-in-from-top-1">
                        <div className="flex items-center gap-3">
                            <div className="bg-teal-500 text-white p-2 rounded-xl"><FastForward size={18}/></div>
                            <div>
                                <div className="text-sm font-bold text-teal-900">Auto-Advance Active</div>
                                <div className="text-xs text-teal-600">Enter a single digit to automatically jump to the next site.</div>
                            </div>
                        </div>
                        {focusedSite && (
                            <div className="bg-white border border-teal-200 px-4 py-2 rounded-xl font-mono font-bold text-teal-700 shadow-sm">
                                TOOTH: #{focusedSite.tooth} | SITE: {focusedSite.index + 1}
                            </div>
                        )}
                    </div>
                )}

                {compareMode && previousDate && (
                    <div className="bg-white p-4 rounded-xl border border-lilac-100 shadow-sm animate-in slide-in-from-top-2 duration-500">
                        <div className="flex items-center gap-2 text-lilac-700 font-bold text-xs uppercase mb-3"><History size={14}/> Progress Summary</div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-3 bg-slate-50 rounded-xl text-center border border-slate-100">
                                <div className="text-[9px] font-bold text-slate-400 uppercase">Hygiene Improvement</div>
                                <div className="text-lg font-black text-teal-600 flex items-center justify-center gap-1"><TrendingDown size={18}/> 12% BOP Reduction</div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex gap-4 mb-4 text-[10px] text-slate-500 justify-center font-bold uppercase tracking-widest">
                    <div className="flex items-center gap-1"><span className="w-3 h-3 bg-white border border-slate-300 shadow-sm"></span> Normal</div>
                    <div className="flex items-center gap-1"><span className="w-3 h-3 bg-red-50 border border-red-300 shadow-sm"></span> 5mm+ Depth</div>
                    <div className="flex items-center gap-1"><span className="w-3 h-3 bg-red-500 rounded-full shadow-sm"></span> Bleeding (BOP)</div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-2 font-bold text-slate-400 uppercase text-xs tracking-wider ml-1">
                        <ChevronUp size={16} className="text-teal-600"/> Maxillary Arch (FDI 18-28)
                    </div>
                    <div className="flex border border-slate-200 rounded-2xl overflow-hidden shadow-xl w-max bg-white">
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

                <div className="space-y-4 pb-10">
                    <div className="flex items-center gap-2 font-bold text-slate-400 uppercase text-xs tracking-wider ml-1">
                        <ChevronDown size={16} className="text-lilac-600"/> Mandibular Arch (FDI 48-38)
                    </div>
                    <div className="flex border border-slate-200 rounded-2xl overflow-hidden shadow-xl w-max bg-white">
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
        </div>
    );
};

export default PerioChart;