import React, { useState } from 'react';
import { Users, Phone, Send, ArrowLeft } from 'lucide-react';
import FamilyGroupManager from './FamilyGroupManager';
import RecallCenter from './RecallCenter';
import ReferralManager from './ReferralManager';
import { FieldSettings, Patient, Referral, User, RecallStatus } from '../types';

interface PatientEngagementProps {
    settings: FieldSettings;
    onUpdateSettings: (newSettings: FieldSettings) => void;
    patients: Patient[];
    referrals: Referral[];
    onSaveReferral: (referral: Omit<Referral, 'id'>) => void;
    staff: User[];
    onUpdatePatientRecall: (patientId: string, status: RecallStatus) => void;
    onBack?: () => void;
}

const PatientEngagement: React.FC<PatientEngagementProps> = ({
    settings,
    onUpdateSettings,
    patients,
    referrals,
    onSaveReferral,
    staff,
    onUpdatePatientRecall,
    onBack
}) => {
    const [activeTab, setActiveTab] = useState<'family' | 'recall' | 'referrals'>('family');

    const tabs = [
        { id: 'family', label: 'Family Groups', icon: Users },
        { id: 'recall', label: 'Recall Center', icon: Phone },
        { id: 'referrals', label: 'Referrals', icon: Send },
    ] as const;

    return (
        <div className="h-full flex flex-col bg-slate-50/50">
            <div className="bg-white border-b border-slate-200 px-8 py-6">
                <div className="flex items-center gap-4 mb-6">
                    {onBack && (
                        <button onClick={onBack} className="bg-white p-4 rounded-full shadow-sm border hover:bg-slate-100 transition-all active:scale-90" aria-label="Back to Admin">
                            <ArrowLeft size={24} className="text-slate-600"/>
                        </button>
                    )}
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Patient Engagement</h1>
                        <p className="text-slate-500 mt-1">Manage family groups, patient recalls, and referrals</p>
                    </div>
                </div>

                <div className="flex gap-6 border-b border-slate-200">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 pb-4 px-1 border-b-2 transition-colors ${
                                    isActive
                                        ? 'border-teal-600 text-teal-600'
                                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                }`}
                            >
                                <Icon className="w-4 h-4" />
                                <span className="font-medium">{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="flex-1 overflow-auto p-8">
                {activeTab === 'family' && (
                    <FamilyGroupManager
                        settings={settings}
                        onUpdateSettings={onUpdateSettings}
                        patients={patients}
                    />
                )}
                {activeTab === 'recall' && (
                    <RecallCenter
                        patients={patients}
                        onUpdatePatientRecall={onUpdatePatientRecall}
                    />
                )}
                {activeTab === 'referrals' && (
                    <ReferralManager
                        patients={patients}
                        referrals={referrals}
                        onSaveReferral={onSaveReferral}
                        staff={staff}
                    />
                )}
            </div>
        </div>
    );
};

export default PatientEngagement;
