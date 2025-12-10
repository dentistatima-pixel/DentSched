
import React, { useState, useEffect } from 'react';
import { PerioMeasurement } from '../types';
import { Save, AlertTriangle, Info, ChevronDown, ChevronUp, Activity } from 'lucide-react';

interface PerioChartProps {
    data: PerioMeasurement[];
    onSave: (newData: PerioMeasurement[]) => void;
    readOnly?: boolean;
}

const TEETH_UPPER = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const TEETH_LOWER = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

const PerioChart: React.FC<PerioChartProps> = ({ data, onSave, readOnly }) => {
    // Map toothNumber to measurement object for fast lookup
    const [measurements, setMeasurements] = useState<Record<number, PerioMeasurement>>({});
    const [activeRow, setActiveRow] = useState<'upper' | 'lower'>('upper');

    useEffect(() => {
        const map: Record<number, PerioMeasurement> = {};
        // Initialize with existing data or defaults
        [...TEETH_UPPER, ...TEETH_LOWER].forEach(t => {
            const existing = data.find(d => d.toothNumber === t);
            if (existing) {
                map[t] = existing;
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
    }, [data]);

    const handleValueChange = (tooth: number, field: 'pocketDepths' | 'recession', index: number, value: string) => {
        if (readOnly) return;
        const numVal = value === '' ? null : parseInt(value);
        if (numVal !== null && (isNaN(numVal) || numVal < 0 || numVal > 15)) return; // Basic validation

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

    const saveAll = () => {
        const arrayData = Object.values(measurements);
        onSave(arrayData);
    };

    const PerioRow = ({ tooth }: { tooth: number }) => {
        const m = measurements[tooth];
        if (!m) return null;

        // Visual alert for deep pockets (>4mm)
        const maxDepth = Math.max(...(m.pocketDepths.filter(d => d !== null) as number[]), 0);
        const isConcern = maxDepth >= 5;

        return (
            <div className={`flex flex-col border-r border-slate-200 min-w-[120px] ${isConcern ? 'bg-red-50' : 'bg-white'}`}>
                {/* Header / Tooth # */}
                <div className={`text-center font-bold py-2 border-b border-slate-200 ${isConcern ? 'text-red-700' : 'text-slate-700'}`}>
                    #{tooth}
                    {isConcern && <AlertTriangle size={12} className="inline ml-1 text-red-500"/>}
                </div>

                {/* Facial / Buccal Inputs */}
                <div className="flex justify-center gap-1 p-1 bg-slate-50/50">
                    <span className="text-[9px] text-slate-400 font-bold uppercase w-full text-center mb-1 absolute opacity-0">Facial</span>
                    {[0, 1, 2].map(i => (
                        <div key={`F-${i}`} className="flex flex-col items-center gap-1">
                            {/* Pocket Depth */}
                            <input 
                                type="text" 
                                maxLength={2}
                                value={m.pocketDepths[i] ?? ''}
                                onChange={(e) => handleValueChange(tooth, 'pocketDepths', i, e.target.value)}
                                className={`w-8 h-8 text-center text-sm border rounded focus:outline-none focus:ring-1 focus:ring-teal-500 font-bold
                                    ${(m.pocketDepths[i] || 0) >= 5 ? 'text-red-600 border-red-300 bg-red-50' : 'text-slate-700 border-slate-200'}
                                `}
                                placeholder="-"
                                disabled={readOnly}
                            />
                            {/* Bleeding Toggle */}
                            <button 
                                onClick={() => toggleBleeding(tooth, i)}
                                className={`w-3 h-3 rounded-full border ${m.bleeding[i] ? 'bg-red-500 border-red-500' : 'bg-white border-slate-300 hover:border-red-300'}`}
                                title="Bleeding on Probing"
                                disabled={readOnly}
                            />
                        </div>
                    ))}
                </div>

                {/* Mobility */}
                <div className="py-1 flex justify-center border-y border-slate-100 bg-slate-100/50">
                     <select 
                        value={m.mobility ?? ''}
                        onChange={(e) => handleMobilityChange(tooth, e.target.value)}
                        className="text-xs bg-transparent font-bold text-center outline-none cursor-pointer text-blue-700 w-full appearance-none"
                        disabled={readOnly}
                     >
                         <option value="">Mob: -</option>
                         <option value="0">0</option>
                         <option value="1">I</option>
                         <option value="2">II</option>
                         <option value="3">III</option>
                     </select>
                </div>

                {/* Lingual / Palatal Inputs */}
                <div className="flex justify-center gap-1 p-1 bg-slate-50/50">
                    {[3, 4, 5].map(i => (
                         <div key={`L-${i}`} className="flex flex-col items-center gap-1">
                            {/* Bleeding Toggle */}
                            <button 
                                onClick={() => toggleBleeding(tooth, i)}
                                className={`w-3 h-3 rounded-full border ${m.bleeding[i] ? 'bg-red-500 border-red-500' : 'bg-white border-slate-300 hover:border-red-300'}`}
                                title="Bleeding on Probing"
                                disabled={readOnly}
                            />
                            {/* Pocket Depth */}
                            <input 
                                type="text" 
                                maxLength={2}
                                value={m.pocketDepths[i] ?? ''}
                                onChange={(e) => handleValueChange(tooth, 'pocketDepths', i, e.target.value)}
                                className={`w-8 h-8 text-center text-sm border rounded focus:outline-none focus:ring-1 focus:ring-teal-500 font-bold
                                    ${(m.pocketDepths[i] || 0) >= 5 ? 'text-red-600 border-red-300 bg-red-50' : 'text-slate-700 border-slate-200'}
                                `}
                                placeholder="-"
                                disabled={readOnly}
                            />
                         </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
             {/* Header */}
             <div className="bg-white p-4 border-b border-slate-200 flex justify-between items-center shadow-sm z-10">
                <div className="flex items-center gap-3">
                    <div className="bg-pink-100 p-2 rounded-lg text-pink-700">
                        <Activity size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-lg">Periodontal Chart</h3>
                        <p className="text-xs text-slate-500">Track pocket depths, bleeding, and mobility.</p>
                    </div>
                </div>
                {!readOnly && (
                    <button 
                        onClick={saveAll}
                        className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-sm"
                    >
                        <Save size={18} /> Save Exam
                    </button>
                )}
            </div>

            {/* Content - Scrollable Grid */}
            <div className="flex-1 overflow-x-auto overflow-y-auto p-4 custom-scrollbar">
                
                {/* Legend */}
                <div className="flex gap-4 mb-4 text-xs text-slate-500 justify-center">
                    <div className="flex items-center gap-1"><span className="w-3 h-3 bg-white border border-slate-300"></span> Normal</div>
                    <div className="flex items-center gap-1"><span className="w-3 h-3 bg-red-50 border border-red-300 text-red-600 font-bold text-[10px] flex items-center justify-center">5</span> Deep Pocket (5mm+)</div>
                    <div className="flex items-center gap-1"><span className="w-3 h-3 bg-red-500 rounded-full"></span> Bleeding Point</div>
                </div>

                {/* Upper Arch Container */}
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-2 font-bold text-slate-700 uppercase text-xs tracking-wider">
                        <ChevronUp size={14}/> Upper Arch (18 - 28)
                    </div>
                    <div className="flex border border-slate-300 rounded-lg overflow-hidden shadow-sm w-max">
                        {TEETH_UPPER.map(t => <PerioRow key={t} tooth={t} />)}
                    </div>
                </div>

                {/* Lower Arch Container */}
                <div>
                    <div className="flex items-center gap-2 mb-2 font-bold text-slate-700 uppercase text-xs tracking-wider">
                        <ChevronDown size={14}/> Lower Arch (48 - 38)
                    </div>
                    <div className="flex border border-slate-300 rounded-lg overflow-hidden shadow-sm w-max">
                        {TEETH_LOWER.map(t => <PerioRow key={t} tooth={t} />)}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PerioChart;
