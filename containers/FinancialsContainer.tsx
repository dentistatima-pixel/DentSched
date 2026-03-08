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

    const ledger = useMemo(() => {
        return patients.flatMap(p => p.ledger || []);
    }, [patients]);

    return <Financials 
        expenses={expenses} onAddExpense={handleAddExpense}
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
        activeSubTab={route.param || undefined}
        incidents={incidents}
        ledger={ledger}
        stockItems={stock}
    />;
}

export default FinancialsContainer;