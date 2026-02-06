
import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { HMOClaim, Expense, ReconciliationRecord, CashSession, PayrollPeriod, PayrollAdjustment, CommissionDispute, PhilHealthClaim, HMOClaimStatus } from '../types';
import { MOCK_CLAIMS, MOCK_EXPENSES, generateUid } from '../constants';
import { useToast } from '../components/ToastSystem';
import { useAppContext } from './AppContext';
import { useAuthorization } from '../hooks/useAuthorization';

interface FinancialContextType {
    hmoClaims: HMOClaim[];
    expenses: Expense[];
    reconciliations: ReconciliationRecord[];
    cashSessions: CashSession[];
    payrollPeriods: PayrollPeriod[];
    payrollAdjustments: PayrollAdjustment[];
    commissionDisputes: CommissionDispute[];
    philHealthClaims: PhilHealthClaim[];
    handleSaveHmoClaim: (claim: Omit<HMOClaim, 'id'>) => Promise<void>;
    handleUpdateHmoClaimStatus: (claimId: string, status: HMOClaimStatus, data?: { amountReceived?: number; rejectionReason?: string }) => Promise<void>;
    handleAddExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
    handleUpdatePhilHealthClaim: (updatedClaim: PhilHealthClaim) => Promise<void>;
    handleSaveReconciliation: (record: Omit<ReconciliationRecord, 'id' | 'timestamp'>) => Promise<void>;
    handleStartCashSession: (openingBalance: number, currentBranch: string) => Promise<void>;
    handleCloseCashSession: (sessionId: string) => Promise<void>;
    handleAddPayrollPeriod: (period: Omit<PayrollPeriod, 'id'>) => Promise<PayrollPeriod | undefined>;
    handleUpdatePayrollPeriod: (period: PayrollPeriod) => Promise<void>;
    handleAddPayrollAdjustment: (adj: PayrollAdjustment) => Promise<void>;
    handleApproveAdjustment: (id: string) => Promise<void>;
    handleAddCommissionDispute: (dispute: CommissionDispute) => Promise<void>;
    handleResolveCommissionDispute: (id: string) => Promise<void>;
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

export const FinancialProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const toast = useToast();
    const { currentUser } = useAppContext();
    const { can } = useAuthorization();

    const [hmoClaims, setHmoClaims] = useState<HMOClaim[]>(MOCK_CLAIMS);
    const [expenses, setExpenses] = useState<Expense[]>(MOCK_EXPENSES);
    const [reconciliations, setReconciliations] = useState<ReconciliationRecord[]>([]);
    const [cashSessions, setCashSessions] = useState<CashSession[]>([]);
    const [payrollPeriods, setPayrollPeriods] = useState<PayrollPeriod[]>([]);
    const [payrollAdjustments, setPayrollAdjustments] = useState<PayrollAdjustment[]>([]);
    const [commissionDisputes, setCommissionDisputes] = useState<CommissionDispute[]>([]);
    const [philHealthClaims, setPhilHealthClaims] = useState<PhilHealthClaim[]>([]);

    const value: FinancialContextType = useMemo(() => {
        if (!can('view:financials')) {
            const unauthorizedAction = async (): Promise<any> => {
                toast.error("Access Denied: Your role does not have permission for financial actions.");
                return Promise.resolve(undefined);
            };
            return {
                hmoClaims: [], expenses: [], reconciliations: [], cashSessions: [],
                payrollPeriods: [], payrollAdjustments: [], commissionDisputes: [], philHealthClaims: [],
                handleSaveHmoClaim: unauthorizedAction, handleUpdateHmoClaimStatus: unauthorizedAction,
                handleAddExpense: unauthorizedAction, handleUpdatePhilHealthClaim: unauthorizedAction,
                handleSaveReconciliation: unauthorizedAction, handleStartCashSession: unauthorizedAction,
                handleCloseCashSession: unauthorizedAction, handleAddPayrollPeriod: unauthorizedAction,
                handleUpdatePayrollPeriod: unauthorizedAction, handleAddPayrollAdjustment: unauthorizedAction,
                handleApproveAdjustment: unauthorizedAction, handleAddCommissionDispute: unauthorizedAction,
                handleResolveCommissionDispute: unauthorizedAction,
            };
        }

        const createAsyncHandler = <T extends any[]>(handler: (...args: T) => void, successMsg?: string) => {
            return async (...args: T): Promise<void> => {
                try { handler(...args); if (successMsg) toast.success(successMsg); } 
                catch (e: any) { toast.error(e.message || "An unexpected error occurred."); }
            };
        };

        const handleAddPayrollPeriod = async (period: Omit<PayrollPeriod, 'id'>): Promise<PayrollPeriod | undefined> => {
            try {
                const newPeriod: PayrollPeriod = { ...period, id: generateUid('pay') };
                setPayrollPeriods(prev => [...prev, newPeriod]);
                toast.success("New payroll period created.");
                return newPeriod;
            } catch(e) { toast.error("Failed to create payroll period."); }
        };

        return { 
            hmoClaims, expenses, reconciliations, cashSessions, payrollPeriods, payrollAdjustments, 
            commissionDisputes, philHealthClaims,
            handleSaveHmoClaim: createAsyncHandler((claim: Omit<HMOClaim, 'id'>) => setHmoClaims(c => [...c, {id: generateUid('hmo'), ...claim}]), "HMO Claim filed."),
            handleUpdateHmoClaimStatus: createAsyncHandler((claimId: string, status: HMOClaimStatus, data?: { amountReceived?: number; rejectionReason?: string }) => { 
                setHmoClaims(c => c.map(claim => 
                    claim.id === claimId 
                    ? { 
                        ...claim, 
                        status: status, 
                        amountReceived: data?.amountReceived ?? claim.amountReceived,
                        rejectionReason: data?.rejectionReason ?? claim.rejectionReason,
                        dateReceived: status === HMOClaimStatus.PAID ? new Date().toISOString().split('T')[0] : claim.dateReceived,
                      } 
                    : claim));
            }, "HMO Claim status updated."),
            handleAddExpense: createAsyncHandler((expense: Omit<Expense, 'id'>) => setExpenses(e => [...e, { id: generateUid('exp'), ...expense }]), "Expense logged."),
            handleUpdatePhilHealthClaim: async (updatedClaim: PhilHealthClaim) => setPhilHealthClaims(prev => prev.map(c => c.id === updatedClaim.id ? updatedClaim : c)),
            handleSaveReconciliation: createAsyncHandler((record: Omit<ReconciliationRecord, 'id' | 'timestamp'>) => setReconciliations(r => [...r, {id: generateUid('rec'), timestamp: new Date().toISOString(), ...record}])),
            handleStartCashSession: createAsyncHandler((openingBalance: number, currentBranch: string) => { if(!currentUser) return; setCashSessions(c => [...c, { id: generateUid('cash'), branch: currentBranch, openedBy: currentUser.id, openedByName: currentUser.name, startTime: new Date().toISOString(), openingBalance: openingBalance, status: 'Open' }]); }, "Cash session started."),
            handleCloseCashSession: createAsyncHandler((sessionId: string) => setCashSessions(c => c.map(s => s.id === sessionId ? { ...s, status: 'Closed', endTime: new Date().toISOString() } : s)), "Cash session closed."),
            handleAddPayrollPeriod,
            handleUpdatePayrollPeriod: createAsyncHandler((period: PayrollPeriod) => setPayrollPeriods(p => p.map(p => p.id === period.id ? period : p))),
            handleAddPayrollAdjustment: createAsyncHandler((adj: PayrollAdjustment) => setPayrollAdjustments(a => [...a, adj])),
            handleApproveAdjustment: createAsyncHandler((id: string) => setPayrollAdjustments(a => a.map(adj => adj.id === id ? { ...adj, status: 'Approved' } : adj))),
            handleAddCommissionDispute: createAsyncHandler((dispute: CommissionDispute) => setCommissionDisputes(d => [...d, dispute])),
            handleResolveCommissionDispute: createAsyncHandler((id: string) => setCommissionDisputes(d => d.map(disp => disp.id === id ? { ...disp, status: 'Resolved' } : disp))),
        };
    }, [can, currentUser, hmoClaims, expenses, reconciliations, cashSessions, payrollPeriods, payrollAdjustments, commissionDisputes, philHealthClaims, toast]);
    
    return <FinancialContext.Provider value={value}>{children}</FinancialContext.Provider>;
};

export const useFinancials = () => {
    const context = useContext(FinancialContext);
    if (context === undefined) {
        throw new Error('useFinancials must be used within a FinancialProvider');
    }
    return context;
};
