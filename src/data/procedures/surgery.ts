import { ProcedureItem } from "../../types";

export const SURGERY_PROCEDURES: ProcedureItem[] = [
  { id: 'proc_ext_simple', name: 'Simple Extraction (Uncomplicated)', category: 'Surgery', defaultPrice: 800, defaultDurationMinutes: 30, requiresImaging: true, triggersPostOpSequence: true, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_elevator_straight', quantity: 1 },
    { stockItemId: 'inst_forceps_150', quantity: 1 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_lido', quantity: 2 },
    { stockItemId: 'cons_needle_short', quantity: 2 },
    { stockItemId: 'cons_topical', quantity: 0.1 },
    { stockItemId: 'cons_gauze_2x2', quantity: 4 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_ext_comp', name: 'Complicated Extraction', category: 'Surgery', defaultPrice: 2500, defaultDurationMinutes: 45, requiresLeadApproval: true, requiresImaging: true, triggersPostOpSequence: true, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_elevator_straight', quantity: 1 },
    { stockItemId: 'inst_forceps_150', quantity: 1 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_lido', quantity: 3 },
    { stockItemId: 'cons_needle_short', quantity: 3 },
    { stockItemId: 'cons_gauze_2x2', quantity: 6 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_odon_upper', name: 'Odontectomy (Wisdom Tooth - Upper)', category: 'Surgery', defaultPrice: 5000, defaultDurationMinutes: 60, requiresLeadApproval: true, requiresImaging: true, triggersPostOpSequence: true, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_scalpel_handle', quantity: 1 },
    { stockItemId: 'inst_elevator_periosteal', quantity: 1 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_lido', quantity: 3 },
    { stockItemId: 'cons_needle_short', quantity: 3 },
    { stockItemId: 'cons_blade_15', quantity: 1 },
    { stockItemId: 'cons_suture_silk', quantity: 1 },
    { stockItemId: 'cons_surg_gelfoam', quantity: 1 },
    { stockItemId: 'cons_gloves_surg', quantity: 1 }
  ]},
  { id: 'proc_odon_lower', name: 'Odontectomy (Wisdom Tooth - Lower)', category: 'Surgery', defaultPrice: 8000, defaultDurationMinutes: 90, requiresLeadApproval: true, requiresImaging: true, triggersPostOpSequence: true, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_scalpel_handle', quantity: 1 },
    { stockItemId: 'inst_elevator_periosteal', quantity: 1 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_lido', quantity: 4 },
    { stockItemId: 'cons_needle_short', quantity: 4 },
    { stockItemId: 'cons_blade_15', quantity: 1 },
    { stockItemId: 'cons_suture_silk', quantity: 1 },
    { stockItemId: 'cons_surg_gelfoam', quantity: 1 },
    { stockItemId: 'cons_gloves_surg', quantity: 1 }
  ]},
  { id: 'proc_odon_severe', name: 'Odontectomy (Severe)', category: 'Surgery', defaultPrice: 10000, defaultDurationMinutes: 120, requiresLeadApproval: true, requiresImaging: true, triggersPostOpSequence: true, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_scalpel_handle', quantity: 1 },
    { stockItemId: 'inst_elevator_periosteal', quantity: 1 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_lido', quantity: 4 },
    { stockItemId: 'cons_needle_short', quantity: 4 },
    { stockItemId: 'cons_blade_15', quantity: 1 },
    { stockItemId: 'cons_suture_silk', quantity: 1 },
    { stockItemId: 'cons_surg_gelfoam', quantity: 1 },
    { stockItemId: 'cons_gloves_surg', quantity: 1 }
  ]},
  { id: 'proc_alveoloplasty', name: 'Alveoloplasty (Bone Reshaping)', category: 'Surgery', defaultPrice: 4000, defaultDurationMinutes: 60, requiresLeadApproval: true, requiresImaging: true, triggersPostOpSequence: true, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_rongeur', quantity: 1 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_lido', quantity: 2 },
    { stockItemId: 'cons_gloves_surg', quantity: 1 }
  ]},
  { id: 'proc_frenectomy', name: 'Frenectomy', category: 'Surgery', defaultPrice: 4000, defaultDurationMinutes: 45, requiresLeadApproval: true, requiresImaging: true, triggersPostOpSequence: true, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_scalpel_handle', quantity: 1 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_lido', quantity: 1 },
    { stockItemId: 'cons_blade_15', quantity: 1 },
    { stockItemId: 'cons_gloves_surg', quantity: 1 }
  ]},
  { id: 'proc_gingivoplasty', name: 'Gingivoplasty (Gum Reshaping)', category: 'Surgery', defaultPrice: 4000, defaultDurationMinutes: 60, requiresLeadApproval: true, requiresImaging: true, triggersPostOpSequence: true, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_ging_knife', quantity: 1 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_lido', quantity: 2 },
    { stockItemId: 'cons_gloves_surg', quantity: 1 }
  ], traySetupInstructions: [
    'Set up surgical handpiece and bone burs',
    'Arrange rongeurs and bone files for smoothing',
    'Prepare suture material (3-0 Silk or 4-0 Vicryl)',
    'Ensure sterile saline irrigation is ready'
  ]},
  { id: 'proc_biopsy', name: 'Biopsy of Oral Tissue', category: 'Surgery', defaultPrice: 4000, defaultDurationMinutes: 45, requiresLeadApproval: true, requiresImaging: true, triggersPostOpSequence: true, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_scalpel_handle', quantity: 1 },
    { stockItemId: 'inst_hemostat', quantity: 1 },
    { stockItemId: 'inst_needle_holder', quantity: 1 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_lido', quantity: 1 },
    { stockItemId: 'cons_blade_15', quantity: 1 },
    { stockItemId: 'cons_biopsy_kit', quantity: 1 },
    { stockItemId: 'cons_suture_silk', quantity: 1 },
    { stockItemId: 'cons_gloves_surg', quantity: 1 }
  ], traySetupInstructions: [
    'Prepare biopsy transport bottle with 10% Formalin',
    'Set up tissue forceps (Adson) and surgical scissors',
    'Label specimen bottle immediately after collection',
    'Complete pathology lab referral form'
  ]}
];
