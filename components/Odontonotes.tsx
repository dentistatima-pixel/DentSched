

import React, { useState, useRef, useEffect } from 'react';
import { DentalChartEntry, ProcedureItem } from '../types';
import { Send, FileText, User, Calendar, Clock, Tag, DollarSign, PenTool, Image as ImageIcon, CheckCircle, ChevronDown, ChevronRight, X, Eraser, Plus } from 'lucide-react';
import { formatDate } from '../constants';

interface OdontonotesProps {
  entries: DentalChartEntry[];
  onAddEntry: (entry: DentalChartEntry) => void;
  currentUser: string;
  readOnly?: boolean;
  procedures: ProcedureItem[];
}

// Simple Canvas Component for Drawing/Signatures
const SimpleCanvas = ({ onSave, onClose, isSignature = false }: { onSave: (dataUrl: string) => void, onClose: () => void, isSignature?: boolean }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.width = canvas.parentElement?.clientWidth || 300;
            canvas.height = 200;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 2;
                ctx.lineCap = 'round';
            }
        }
    }, []);

    const startDraw = (e: any) => {
        setIsDrawing(true);
        draw(e);
    };

    const stopDraw = () => {
        setIsDrawing(false);
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx?.beginPath();
        }
    };

    const draw = (e: any) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (canvas && ctx) {
            const rect = canvas.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            
            ctx.lineTo(clientX - rect.left, clientY - rect.top);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(clientX - rect.left, clientY - rect.top);
        }
    };

    const handleSave = () => {
        if (canvasRef.current) {
            onSave(canvasRef.current.toDataURL());
        }
    };

    const handleClear = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (canvas && ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
                <div className="p-3 bg-slate-800 text-white flex justify-between items-center">
                    <h4 className="font-bold text-sm">{isSignature ? 'Patient Signature' : 'Annotation / Drawing'}</h4>
                    <button onClick={onClose}><X size={18}/></button>
                </div>
                <div className="p-4 bg-slate-100 relative">
                    <canvas 
                        ref={canvasRef}
                        className="bg-white rounded-lg border border-slate-300 shadow-sm cursor-crosshair touch-none w-full"
                        onMouseDown={startDraw}
                        onMouseUp={stopDraw}
                        onMouseMove={draw}
                        onTouchStart={startDraw}
                        onTouchEnd={stopDraw}
                        onTouchMove={draw}
                    />
                    <div className="text-[10px] text-slate-400 mt-1 text-center italic">Sign/Draw in the box above</div>
                </div>
                <div className="p-3 bg-white border-t border-slate-100 flex gap-2">
                    <button onClick={handleClear} className="flex-1 py-2 text-slate-600 bg-slate-100 rounded-lg font-bold text-xs flex items-center justify-center gap-1"><Eraser size={14}/> Clear</button>
                    <button onClick={handleSave} className="flex-1 py-2 text-white bg-teal-600 rounded-lg font-bold text-xs flex items-center justify-center gap-1"><CheckCircle size={14}/> Save</button>
                </div>
            </div>
        </div>
    );
};

const Odontonotes: React.FC<OdontonotesProps> = ({ entries, onAddEntry, currentUser, readOnly, procedures }) => {
  // Input State
  const [noteText, setNoteText] = useState('');
  const [toothNum, setToothNum] = useState<string>('');
  const [selectedProcedure, setSelectedProcedure] = useState('');
  
  // Financials State
  const [charge, setCharge] = useState<string>('');
  const [payment, setPayment] = useState<string>('');
  const [receipt, setReceipt] = useState('');
  
  // Ortho Mode
  const [orthoMode, setOrthoMode] = useState(false);
  
  // Modals
  const [activeCanvas, setActiveCanvas] = useState<'signature' | 'drawing' | null>(null);
  
  // Attachments Staged
  const [stagedSignature, setStagedSignature] = useState<string | null>(null);
  const [stagedDrawing, setStagedDrawing] = useState<string | null>(null);

  const isCommLog = selectedProcedure === 'Communication Log';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim() && !selectedProcedure && !charge && !payment) return;
    
    const tNum = isCommLog ? 0 : (toothNum ? parseInt(toothNum) : 0);
    
    // Auto-select "Clinical Note" if no procedure selected but notes exist
    const procName = selectedProcedure || (noteText ? 'Clinical Note' : 'Transaction');
    
    const newEntry: DentalChartEntry = {
        id: `dc_${Date.now()}`,
        toothNumber: tNum,
        procedure: procName,
        status: 'Completed',
        notes: noteText,
        price: charge ? parseFloat(charge) : 0,
        payment: payment ? parseFloat(payment) : 0,
        receiptNumber: receipt,
        signature: stagedSignature || undefined,
        drawing: stagedDrawing || undefined,
        date: new Date().toISOString().split('T')[0],
        author: currentUser
    };

    onAddEntry(newEntry);
    
    // Reset Form
    setNoteText('');
    setToothNum('');
    setSelectedProcedure('');
    setCharge('');
    setPayment('');
    setReceipt('');
    setStagedSignature(null);
    setStagedDrawing(null);
  };

  // Sort entries by date desc (newest first)
  const sorted = [...entries].sort((a, b) => new Date(b.date || '').getTime() - new Date(a.date || '').getTime());

  // Helper for Ortho Macros
  const appendText = (text: string) => {
      setNoteText(prev => prev ? `${prev} ${text}` : text);
  };

  const handleProcedureSelect = (name: string) => {
      setSelectedProcedure(name);
      // Auto-fill price
      const proc = procedures.find(p => p.name === name);
      if (proc) {
          setCharge(proc.price.toString());
      }
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-xl border border-slate-200 overflow-hidden">
      
      {/* --- INPUT AREA --- */}
      {!readOnly && (
          <div className="bg-slate-50 border-b border-slate-200 shadow-sm z-10 p-4">
             <form onSubmit={handleSubmit} className="space-y-3">
                 {/* Row 1: Clinical Basics */}
                 <div className="flex gap-2">
                     <div className={`w-16 transition-all ${isCommLog ? 'opacity-50' : ''}`}>
                         <input
                             type="number"
                             placeholder="#"
                             className="w-full p-2 rounded-lg border border-slate-300 text-sm focus:border-teal-500 outline-none font-mono text-center"
                             value={toothNum}
                             onChange={e => setToothNum(e.target.value)}
                             disabled={isCommLog}
                         />
                     </div>
                     <div className="flex-1 relative">
                        <select 
                            value={selectedProcedure}
                            onChange={(e) => handleProcedureSelect(e.target.value)}
                            className="w-full p-2 rounded-lg border border-slate-300 text-sm focus:border-teal-500 outline-none appearance-none bg-white"
                        >
                            <option value="">- Select Procedure -</option>
                            {procedures.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-3 text-slate-400 pointer-events-none"/>
                     </div>
                     <button 
                        type="button"
                        onClick={() => setOrthoMode(!orthoMode)}
                        className={`px-3 py-2 rounded-lg font-bold text-xs border transition-colors ${orthoMode ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-white text-slate-500 border-slate-300'}`}
                     >
                         Ortho
                     </button>
                 </div>

                 {/* Row 2: Ortho Macros (Collapsible) */}
                 {orthoMode && (
                     <div className="bg-purple-50 p-2 rounded-lg border border-purple-100 grid grid-cols-2 md:grid-cols-4 gap-2 animate-in slide-in-from-top-2">
                         <button type="button" onClick={() => appendText('Adj U/L.')} className="bg-white p-1.5 rounded text-[10px] font-bold text-purple-800 shadow-sm hover:bg-purple-100">Adj U/L</button>
                         <button type="button" onClick={() => appendText('Changed O-Rings.')} className="bg-white p-1.5 rounded text-[10px] font-bold text-purple-800 shadow-sm hover:bg-purple-100">O-Rings</button>
                         <button type="button" onClick={() => appendText('Power Chain.')} className="bg-white p-1.5 rounded text-[10px] font-bold text-purple-800 shadow-sm hover:bg-purple-100">Power Chain</button>
                         <button type="button" onClick={() => appendText('Open Coil.')} className="bg-white p-1.5 rounded text-[10px] font-bold text-purple-800 shadow-sm hover:bg-purple-100">Open Coil</button>
                         
                         <div className="col-span-2 md:col-span-4 flex gap-2 overflow-x-auto no-scrollbar pt-1">
                             {['012', '014', '016', '018', '16x22', '17x25', '19x25'].map(wire => (
                                 <button key={wire} type="button" onClick={() => appendText(`Wire: ${wire} NiTi.`)} className="bg-white px-2 py-1 rounded text-[10px] border border-purple-100 whitespace-nowrap hover:bg-purple-100">{wire}</button>
                             ))}
                         </div>
                     </div>
                 )}

                 {/* Row 3: Notes Text Area */}
                 <div className="relative">
                     <textarea
                         placeholder={isCommLog ? "Log details of phone call, SMS, or other communication..." : "Detailed clinical notes..."}
                         className="w-full p-3 rounded-lg border border-slate-300 text-sm focus:border-teal-500 outline-none min-h-[60px]"
                         value={noteText}
                         onChange={e => setNoteText(e.target.value)}
                     />
                 </div>

                 {/* Row 4: Financials & Actions */}
                 <div className="flex flex-col md:flex-row gap-2 items-center">
                     <div className="flex gap-2 flex-1 w-full">
                         <div className="relative flex-1">
                             <span className="absolute left-2 top-2 text-slate-400 text-xs font-bold">₱</span>
                             <input type="number" placeholder="Charge" value={charge} onChange={e => setCharge(e.target.value)} className="w-full pl-6 pr-2 py-2 rounded-lg border border-slate-300 text-sm font-bold text-slate-700 placeholder:font-normal"/>
                         </div>
                         <div className="relative flex-1">
                             <span className="absolute left-2 top-2 text-slate-400 text-xs font-bold">₱</span>
                             <input type="number" placeholder="Payment" value={payment} onChange={e => setPayment(e.target.value)} className="w-full pl-6 pr-2 py-2 rounded-lg border border-slate-300 text-sm font-bold text-green-700 placeholder:font-normal"/>
                         </div>
                         <input type="text" placeholder="Rcpt #" value={receipt} onChange={e => setReceipt(e.target.value)} className="w-20 p-2 rounded-lg border border-slate-300 text-xs"/>
                     </div>
                     
                     <div className="flex gap-2 w-full md:w-auto">
                        <button type="button" onClick={() => setActiveCanvas('signature')} className={`p-2 rounded-lg border ${stagedSignature ? 'bg-green-100 border-green-300 text-green-700' : 'bg-white border-slate-300 text-slate-500'}`} title="Patient Signature"><PenTool size={18}/></button>
                        <button type="button" onClick={() => setActiveCanvas('drawing')} className={`p-2 rounded-lg border ${stagedDrawing ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-white border-slate-300 text-slate-500'}`} title="Add Drawing"><ImageIcon size={18}/></button>
                        <button type="submit" className="flex-1 md:flex-none bg-teal-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-teal-700 transition-colors shadow-sm flex items-center justify-center gap-2">
                            <Plus size={18} /> Add Entry
                        </button>
                     </div>
                 </div>
             </form>
          </div>
      )}

      {/* --- CANVAS MODALS --- */}
      {activeCanvas && (
          <SimpleCanvas 
            isSignature={activeCanvas === 'signature'}
            onClose={() => setActiveCanvas(null)}
            onSave={(data) => {
                if (activeCanvas === 'signature') setStagedSignature(data);
                else setStagedDrawing(data);
                setActiveCanvas(null);
            }}
          />
      )}

      {/* --- GRID VIEW (TABLE) --- */}
      <div className="flex-1 overflow-auto bg-white">
          <table className="w-full text-left border-collapse">
              <thead className="bg-slate-100 sticky top-0 z-10 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                      <th className="p-3 border-b border-slate-200 w-24">Date</th>
                      <th className="p-3 border-b border-slate-200 w-16 text-center">T#</th>
                      <th className="p-3 border-b border-slate-200 w-1/4">Procedure</th>
                      <th className="p-3 border-b border-slate-200">Notes / Details</th>
                      <th className="p-3 border-b border-slate-200 w-24 text-right">Debit</th>
                      <th className="p-3 border-b border-slate-200 w-24 text-right">Credit</th>
                      <th className="p-3 border-b border-slate-200 w-24 text-right">Bal</th>
                  </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-100">
                  {sorted.length === 0 ? (
                      <tr>
                          <td colSpan={7} className="p-10 text-center text-slate-400 italic">No clinical records found.</td>
                      </tr>
                  ) : (
                      sorted.map((entry, idx) => {
                          const isEven = idx % 2 === 0;
                          return (
                              <tr key={idx} className={`${isEven ? 'bg-white' : 'bg-slate-50/50'} hover:bg-blue-50/30 transition-colors`}>
                                  <td className="p-3 font-mono text-xs text-slate-500 align-top">{formatDate(entry.date)}</td>
                                  <td className="p-3 text-center font-bold text-slate-700 align-top">{entry.toothNumber || '-'}</td>
                                  <td className="p-3 font-bold text-slate-800 align-top">
                                      {entry.procedure}
                                      {entry.receiptNumber && <div className="text-[10px] text-slate-400 font-normal mt-1">OR: {entry.receiptNumber}</div>}
                                  </td>
                                  <td className="p-3 text-slate-600 align-top">
                                      <div className="whitespace-pre-wrap">{entry.notes}</div>
                                      {/* Attachments */}
                                      {(entry.signature || entry.drawing) && (
                                          <div className="flex gap-2 mt-2">
                                              {entry.signature && (
                                                  <div className="border border-slate-200 rounded p-1 bg-white inline-block">
                                                      <div className="text-[9px] text-slate-400 uppercase mb-0.5">Signed</div>
                                                      <img src={entry.signature} alt="Signature" className="h-8 object-contain opacity-70" />
                                                  </div>
                                              )}
                                              {entry.drawing && (
                                                  <div className="border border-slate-200 rounded p-1 bg-white inline-block">
                                                      <div className="text-[9px] text-slate-400 uppercase mb-0.5">Sketch</div>
                                                      <img src={entry.drawing} alt="Drawing" className="h-12 object-contain" />
                                                  </div>
                                              )}
                                          </div>
                                      )}
                                      <div className="text-[10px] text-slate-400 mt-1 italic">By: {entry.author}</div>
                                  </td>
                                  <td className="p-3 text-right font-mono text-slate-700 align-top">
                                      {entry.price ? `₱${entry.price.toLocaleString()}` : '-'}
                                  </td>
                                  <td className="p-3 text-right font-mono text-green-700 font-bold align-top">
                                      {entry.payment ? `₱${entry.payment.toLocaleString()}` : '-'}
                                  </td>
                                  <td className="p-3 text-right font-mono text-slate-400 text-xs align-top">
                                      {/* Running balance calc would need reverse iteration, simplifying here */}
                                      -
                                  </td>
                              </tr>
                          );
                      })
                  )}
              </tbody>
          </table>
      </div>
    </div>
  );
};

export default Odontonotes;
