import React from 'react';
import { useFinancials } from '../contexts/FinancialContext';
import { usePatient } from '../contexts/PatientContext';
import { useAppointments } from '../contexts/AppointmentContext';
import { useSettings } from '../contexts/SettingsContext';
import { useStaff } from '../contexts/StaffContext';
import { useAppContext } from '../contexts/AppContext';
import { useClinicalOps } from '../contexts/ClinicalOpsContext';
import { useNavigate } from '../contexts/RouterContext';
import { Financials } from '../components/Financials';

function FinancialsContainer({ route }: { route: { param: string | null } }) {
    const { 
        hmoClaims, handleSaveHmoClaim, handleUpdateHmoClaimStatus, 
        expenses, handleAddExpense, 
        philHealthClaims, handleUpdatePhilHealthClaim,
        reconciliations, handleSaveReconciliation,
        cashSessions, handleStartCashSession, handleCloseCashSession,
        payrollPeriods, handleAddPayrollPeriod, handleUpdatePayrollPeriod,
        payrollAdjustments, handleAddPayrollAdjustment, handleApproveAdjustment,
        commissionDisputes, handleAddCommissionDispute, handleResolveCommissionDispute
    } = useFinancials();
    const { patients } = usePatient();
    const { appointments } = useAppointments();
    const { fieldSettings } = useSettings();
    const { staff } = useStaff();
    const { currentUser, currentBranch, governanceTrack, setGovernanceTrack } = useAppContext();
    const { incidents } = useClinicalOps();
    const navigate = useNavigate();

    return <Financials 
        claims={hmoClaims} onSaveHmoClaim={handleSaveHmoClaim} onUpdateHmoClaimStatus={handleUpdateHmoClaimStatus}
        expenses={expenses} onAddExpense={handleAddExpense}
        philHealthClaims={philHealthClaims || []} onUpdatePhilHealthClaim={handleUpdatePhilHealthClaim}
        reconciliations={reconciliations} onSaveReconciliation={handleSaveReconciliation}
        cashSessions={cashSessions} onStartCashSession={(bal) => handleStartCashSession(bal, currentBranch)} onCloseCashSession={handleCloseCashSession}
        payrollPeriods={payrollPeriods} onAddPayrollPeriod={handleAddPayrollPeriod} onUpdatePayrollPeriod={handleUpdatePayrollPeriod}
        payrollAdjustments={payrollAdjustments} onAddPayrollAdjustment={handleAddPayrollAdjustment} onApproveAdjustment={handleApproveAdjustment}
        commissionDisputes={commissionDisputes} onAddCommissionDispute={handleAddCommissionDispute} onResolveCommissionDispute={handleResolveCommissionDispute}
        patients={patients}
        appointments={appointments}
        staff={staff}
        currentUser={currentUser!}
        currentBranch={currentBranch}
        governanceTrack={governanceTrack}
        setGovernanceTrack={setGovernanceTrack}
        onBack={() => navigate('admin')}
        activeSubTab={route.param || undefined}
        incidents={incidents}
    />;
}

export default FinancialsContainer;
