import React, { useState } from 'react';
import { ConsentFormTemplate, ProcedureItem, Patient, Appointment, SignatureChainEntry, PediatricConsent } from '../types';
import { FileText } from 'lucide-react';
import ConsentCaptureModal from './ConsentCaptureModal'; 

interface ConsentFormManagerProps {
    isOpen: boolean;
    procedure?: ProcedureItem;
    templates: ConsentFormTemplate[];
    patient: Patient;
    appointment: Appointment;
    onClose: () => void;
    onSave: (chain: SignatureChainEntry[], pediatricConsent?: PediatricConsent) => void; 
}

export const ConsentFormManager: React.FC<ConsentFormManagerProps> = ({ isOpen, procedure, templates, patient, appointment, onClose, onSave }) => {
    const [selectedTemplate, setSelectedTemplate] = useState<ConsentFormTemplate | null>(null);
    const [showTemplateSelector, setShowTemplateSelector] = useState(true);

    if (!isOpen) return null;

    const getRelevantTemplates = () => {
        if (!procedure) return templates.filter(t => t.category === 'GENERAL');
        
        return templates.filter(t => {
            if (procedure.requiresSurgicalConsent) return t.category === 'SURGICAL';
            if (procedure.isMinorProcedure) return t.category === 'PREVENTIVE';
            return t.category === 'GENERAL' || t.category === procedure.category;
        });
    };

    const TemplateSelector = () => (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8">
          <h3 className="text-2xl font-black mb-6">Select Consent Form</h3>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {getRelevantTemplates().map(template => (
              <button
                key={template.id}
                onClick={() => {
                  setSelectedTemplate(template);
                  setShowTemplateSelector(false);
                }}
                className="w-full text-left p-4 border-2 border-slate-200 rounded-xl hover:border-teal-500 hover:bg-teal-50 transition-all"
              >
                <div className="flex items-start gap-3">
                  <FileText size={24} className="text-teal-600 mt-1" />
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900">{template.name}</h4>
                    <p className="text-sm text-slate-600 mt-1">{template.description}</p>
                    <div className="flex gap-2 mt-2">
                      <span className="text-xs bg-slate-100 px-2 py-1 rounded">{template.category}</span>
                      {template.requiresWitness && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">Requires Witness</span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
          <button onClick={onClose} className="mt-4 w-full py-3 bg-slate-100 text-slate-600 rounded-xl font-bold">
            Cancel
          </button>
        </div>
      </div>
    );
    
    return (
        <>
            {showTemplateSelector && <TemplateSelector />}
            {selectedTemplate && (
              <ConsentCaptureModal 
                isOpen={true}
                template={selectedTemplate}
                patient={patient}
                appointment={appointment}
                onClose={onClose}
                onSave={onSave}
                procedure={procedure}
              />
            )}
        </>
    );
};

export default ConsentFormManager;
