import { ProcedureItem } from "../../types";

export const PERIODONTIC_PROCEDURES: ProcedureItem[] = [
  { id: 'proc_srp', name: 'Scaling and Root Planing (Deep Cleaning)', category: 'Periodontics', defaultPrice: 3000, defaultDurationMinutes: 60, requiresImaging: true, triggersPostOpSequence: true, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_perio_probe', quantity: 1 },
    { stockItemId: 'inst_ultrasonic_hp', quantity: 1 },
    { stockItemId: 'inst_scaler_ant', quantity: 1 },
    { stockItemId: 'inst_scaler_post', quantity: 1 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_lido', quantity: 1 },
    { stockItemId: 'cons_topical', quantity: 0.1 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ], traySetupInstructions: [
    'Set up ultrasonic scaler with subgingival tips',
    'Arrange Gracey curettes for specific quadrants',
    'Prepare topical anesthetic and local anesthetic carpules',
    'Ensure sharp hand instruments'
  ]},
  { id: 'proc_gingivectomy', name: 'Gingivectomy (per segment)', category: 'Periodontics', defaultPrice: 4500, defaultDurationMinutes: 60, requiresLeadApproval: true, requiresImaging: true, triggersPostOpSequence: true, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_scalpel_handle', quantity: 1 },
    { stockItemId: 'inst_ging_knife', quantity: 1 },
    { stockItemId: 'inst_needle_holder', quantity: 1 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_lido', quantity: 1 },
    { stockItemId: 'cons_blade_15', quantity: 1 },
    { stockItemId: 'cons_suture_silk', quantity: 1 },
    { stockItemId: 'cons_gloves_surg', quantity: 1 }
  ], traySetupInstructions: [
    'Prepare Kirkland and Orban gingivectomy knives',
    'Set up periodontal probe for pocket marking',
    'Arrange surgical scissors and tissue forceps',
    'Prepare periodontal dressing (Coepak) if needed'
  ]},
  { id: 'proc_curettage', name: 'Subgingival Curettage', category: 'Periodontics', defaultPrice: 2500, defaultDurationMinutes: 45, requiresLeadApproval: true, requiresImaging: true, triggersPostOpSequence: true, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_perio_probe', quantity: 1 },
    { stockItemId: 'inst_scaler_ant', quantity: 1 },
    { stockItemId: 'inst_scaler_post', quantity: 1 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_lido', quantity: 1 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]}
];
