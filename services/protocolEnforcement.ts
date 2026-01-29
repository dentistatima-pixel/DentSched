
import { Patient, ProcedureItem, ClinicalProtocolRule, ClearanceRequest } from '../types';

export const checkClinicalProtocols = (
  patient: Patient,
  procedure: ProcedureItem,
  rules: ClinicalProtocolRule[]
): { violations: string[]; requiresClearance: boolean; documentCategory?: string } => {
  
  const violations: string[] = [];
  let requiresClearance = false;
  let documentCategory: string | undefined = undefined;
  
  for (const rule of rules) {
    // Check if procedure matches rule trigger
    const procedureMatches = rule.triggerProcedureCategories.includes(
      procedure.category || ''
    );
    
    if (!procedureMatches) continue;
    
    // Check if patient has risk condition
    const hasRiskCondition = rule.requiresMedicalConditions.some(condition =>
      (patient.medicalConditions || []).includes(condition)
    );
    
    if (hasRiskCondition) {
      // Check if required clearance document exists and is valid (e.g., within 3 months)
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      
      const hasClearance = (patient.clearanceRequests || []).some(cr =>
        cr.documentCategory === rule.requiresDocumentCategory &&
        cr.status === 'Approved' &&
        cr.approvedAt && new Date(cr.approvedAt) > threeMonthsAgo
      );
      
      if (!hasClearance) {
        violations.push(rule.alertMessage);
        requiresClearance = true;
        documentCategory = rule.requiresDocumentCategory;
      }
    }
  }
  
  return { violations, requiresClearance, documentCategory };
};
