import { useFinancials } from '../contexts/FinancialContext';
import { usePatient } from '../contexts/PatientContext';
import { useAppointments } from '../contexts/AppointmentContext';
import { useClinicalOps } from '../contexts/ClinicalOpsContext';
import { useStaff } from '../contexts/StaffContext';
import { useAppContext } from '../contexts/AppContext';
import { useInventory } from '../contexts/InventoryContext';
import { Financials } from '../components/Financials';
import { useMemo } from 'react';

function FinancialsContainer({ route }: { route: { param: string | null } }) {
    const { 
        expenses, handleAddExpense, 
        reconciliations, handleSaveReconciliation,
        cashSessions, handleStartCashSession, handleCloseCashSession,
        payrollPeriods, handleAddPayrollPeriod, handleUpdatePayrollPeriod,
        payrollAdjustments, handleAddPayrollAdjustment, handleApproveAdjustment,
        commissionDisputes, handleAddCommissionDispute, handleResolveCommissionDispute
    } = useFinancials();
    const { patients } = usePatient();
    const { appointments } = useAppointments();
    const { staff } = useStaff();
    const { currentUser, currentBranch, governanceTrack, setGovernanceTrack } = useAppContext();
    const { incidents } = useClinicalOps();
    const { stock } = useInventory();

    const filteredExpenses = useMemo(() => expenses.filter(e => e.branch === currentBranch), [expenses, currentBranch]);
    const filteredReconciliations = useMemo(() => reconciliations.filter(r => r.branch === currentBranch), [reconciliations, currentBranch]);
    const filteredCashSessions = useMemo(() => cashSessions.filter(s => s.branch === currentBranch), [cashSessions, currentBranch]);
    const filteredAppointments = useMemo(() => appointments.filter(a => a.branch === currentBranch), [appointments, currentBranch]);

    const ledger = useMemo(() => {
        return patients.flatMap(p => p.ledger || []).filter(l => l.branch === currentBranch);
    }, [patients, currentBranch]);

    return <Financials 
        expenses={filteredExpenses} onAddExpense={handleAddExpense}
        reconciliations={filteredReconciliations} onSaveReconciliation={handleSaveReconciliation}
        cashSessions={filteredCashSessions} onStartCashSession={(bal) => handleStartCashSession(bal, currentBranch)} onCloseCashSession={handleCloseCashSession}
        payrollPeriods={payrollPeriods} onAddPayrollPeriod={handleAddPayrollPeriod} onUpdatePayrollPeriod={handleUpdatePayrollPeriod}
        payrollAdjustments={payrollAdjustments} onAddPayrollAdjustment={handleAddPayrollAdjustment} onApproveAdjustment={handleApproveAdjustment}
        commissionDisputes={commissionDisputes} onAddCommissionDispute={handleAddCommissionDispute} onResolveCommissionDispute={handleResolveCommissionDispute}
        patients={patients}
        appointments={filteredAppointments}
        staff={staff}
        currentUser={currentUser!}
        currentBranch={currentBranch}
        governanceTrack={governanceTrack}
        setGovernanceTrack={setGovernanceTrack}
        activeSubTab={route.param || undefined}
        incidents={incidents}
        ledger={ledger}
        stockItems={stock}
    />;
}

export default FinancialsContainer;