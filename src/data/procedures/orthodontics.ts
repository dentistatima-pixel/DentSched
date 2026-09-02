import { ProcedureItem } from "../../types";

export const ORTHODONTIC_PROCEDURES: ProcedureItem[] = [
  { id: 'proc_ortho_consult', name: 'Orthodontic Consultation', category: 'Orthodontics', defaultPrice: 1500, defaultDurationMinutes: 45, requiresImaging: true, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_imp_tray', quantity: 2 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_imp_alginate', quantity: 1 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_ortho_metal_c1', name: 'Metal Brackets (Class 1)', category: 'Orthodontics', defaultPrice: 35000, defaultDurationMinutes: 90, requiresLeadApproval: true, requiresImaging: true, triggersPostOpSequence: true, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_ortho_bracket_tweezer', quantity: 1 },
    { stockItemId: 'inst_ortho_band_pusher', quantity: 1 },
    { stockItemId: 'inst_ortho_weingart', quantity: 1 },
    { stockItemId: 'inst_ortho_mathieu', quantity: 1 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_ortho_bracket_kit', quantity: 1 },
    { stockItemId: 'cons_ortho_wire_ni_ti', quantity: 2 },
    { stockItemId: 'cons_etch', quantity: 0.2 },
    { stockItemId: 'cons_bond', quantity: 0.2 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_ortho_metal_c2', name: 'Metal Brackets (Class 2)', category: 'Orthodontics', defaultPrice: 45000, defaultDurationMinutes: 90, requiresLeadApproval: true, requiresImaging: true, triggersPostOpSequence: true, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_ortho_bracket_tweezer', quantity: 1 },
    { stockItemId: 'inst_ortho_band_pusher', quantity: 1 },
    { stockItemId: 'inst_ortho_weingart', quantity: 1 },
    { stockItemId: 'inst_ortho_mathieu', quantity: 1 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_ortho_bracket_kit', quantity: 1 },
    { stockItemId: 'cons_ortho_wire_ni_ti', quantity: 2 },
    { stockItemId: 'cons_etch', quantity: 0.2 },
    { stockItemId: 'cons_bond', quantity: 0.2 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_ortho_metal_c3', name: 'Metal Brackets (Class 3)', category: 'Orthodontics', defaultPrice: 50000, defaultDurationMinutes: 90, requiresLeadApproval: true, requiresImaging: true, triggersPostOpSequence: true, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_ortho_bracket_tweezer', quantity: 1 },
    { stockItemId: 'inst_ortho_band_pusher', quantity: 1 },
    { stockItemId: 'inst_ortho_weingart', quantity: 1 },
    { stockItemId: 'inst_ortho_mathieu', quantity: 1 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_ortho_bracket_kit', quantity: 1 },
    { stockItemId: 'cons_ortho_wire_ni_ti', quantity: 2 },
    { stockItemId: 'cons_etch', quantity: 0.2 },
    { stockItemId: 'cons_bond', quantity: 0.2 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_ortho_ceramic_c1', name: 'Ceramic Brackets (Class 1)', category: 'Orthodontics', defaultPrice: 45000, defaultDurationMinutes: 90, requiresLeadApproval: true, requiresImaging: true, triggersPostOpSequence: true, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_ortho_plier', quantity: 1 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_ortho_bracket_kit', quantity: 1 },
    { stockItemId: 'cons_ortho_wire_ni_ti', quantity: 2 },
    { stockItemId: 'cons_etch', quantity: 0.2 },
    { stockItemId: 'cons_bond', quantity: 0.2 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_ortho_ceramic_c2', name: 'Ceramic Brackets (Class 2)', category: 'Orthodontics', defaultPrice: 50000, defaultDurationMinutes: 90, requiresLeadApproval: true, requiresImaging: true, triggersPostOpSequence: true, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_ortho_plier', quantity: 1 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_ortho_bracket_kit', quantity: 1 },
    { stockItemId: 'cons_ortho_wire_ni_ti', quantity: 2 },
    { stockItemId: 'cons_etch', quantity: 0.2 },
    { stockItemId: 'cons_bond', quantity: 0.2 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_ortho_ceramic_c3', name: 'Ceramic Brackets (Class 3)', category: 'Orthodontics', defaultPrice: 55000, defaultDurationMinutes: 90, requiresLeadApproval: true, requiresImaging: true, triggersPostOpSequence: true, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_ortho_plier', quantity: 1 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_ortho_bracket_kit', quantity: 1 },
    { stockItemId: 'cons_ortho_wire_ni_ti', quantity: 2 },
    { stockItemId: 'cons_etch', quantity: 0.2 },
    { stockItemId: 'cons_bond', quantity: 0.2 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_ortho_sapphire_c1', name: 'Sapphire Brackets (Class 1)', category: 'Orthodontics', defaultPrice: 50000, defaultDurationMinutes: 90, requiresLeadApproval: true, requiresImaging: true, triggersPostOpSequence: true, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_ortho_plier', quantity: 1 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_ortho_bracket_kit', quantity: 1 },
    { stockItemId: 'cons_ortho_wire_ni_ti', quantity: 2 },
    { stockItemId: 'cons_etch', quantity: 0.2 },
    { stockItemId: 'cons_bond', quantity: 0.2 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_ortho_sapphire_c2', name: 'Sapphire Brackets (Class 2)', category: 'Orthodontics', defaultPrice: 55000, defaultDurationMinutes: 90, requiresLeadApproval: true, requiresImaging: true, triggersPostOpSequence: true, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_ortho_plier', quantity: 1 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_ortho_bracket_kit', quantity: 1 },
    { stockItemId: 'cons_ortho_wire_ni_ti', quantity: 2 },
    { stockItemId: 'cons_etch', quantity: 0.2 },
    { stockItemId: 'cons_bond', quantity: 0.2 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_ortho_sapphire_c3', name: 'Sapphire Brackets (Class 3)', category: 'Orthodontics', defaultPrice: 60000, defaultDurationMinutes: 90, requiresLeadApproval: true, requiresImaging: true, triggersPostOpSequence: true, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_ortho_plier', quantity: 1 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_ortho_bracket_kit', quantity: 1 },
    { stockItemId: 'cons_ortho_wire_ni_ti', quantity: 2 },
    { stockItemId: 'cons_etch', quantity: 0.2 },
    { stockItemId: 'cons_bond', quantity: 0.2 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_ortho_swlf_c1', name: 'SWLF Brackets (Class 1)', category: 'Orthodontics', defaultPrice: 60000, defaultDurationMinutes: 90, requiresLeadApproval: true, requiresImaging: true, triggersPostOpSequence: true, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_ortho_plier', quantity: 1 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_ortho_bracket_kit', quantity: 1 },
    { stockItemId: 'cons_ortho_wire_ni_ti', quantity: 2 },
    { stockItemId: 'cons_etch', quantity: 0.2 },
    { stockItemId: 'cons_bond', quantity: 0.2 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_ortho_swlf_c2', name: 'SWLF Brackets (Class 2)', category: 'Orthodontics', defaultPrice: 65000, defaultDurationMinutes: 90, requiresLeadApproval: true, requiresImaging: true, triggersPostOpSequence: true, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_ortho_plier', quantity: 1 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_ortho_bracket_kit', quantity: 1 },
    { stockItemId: 'cons_ortho_wire_ni_ti', quantity: 2 },
    { stockItemId: 'cons_etch', quantity: 0.2 },
    { stockItemId: 'cons_bond', quantity: 0.2 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_ortho_swlf_c3', name: 'SWLF Brackets (Class 3)', category: 'Orthodontics', defaultPrice: 70000, defaultDurationMinutes: 90, requiresLeadApproval: true, requiresImaging: true, triggersPostOpSequence: true, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_ortho_plier', quantity: 1 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_ortho_bracket_kit', quantity: 1 },
    { stockItemId: 'cons_ortho_wire_ni_ti', quantity: 2 },
    { stockItemId: 'cons_etch', quantity: 0.2 },
    { stockItemId: 'cons_bond', quantity: 0.2 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_ortho_sl_std_c1', name: 'Self-Ligating (Standard) (Class 1)', category: 'Orthodontics', defaultPrice: 60000, defaultDurationMinutes: 90, requiresLeadApproval: true, requiresImaging: true, triggersPostOpSequence: true, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_ortho_plier', quantity: 1 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_ortho_bracket_kit', quantity: 1 },
    { stockItemId: 'cons_ortho_wire_ni_ti', quantity: 2 },
    { stockItemId: 'cons_etch', quantity: 0.2 },
    { stockItemId: 'cons_bond', quantity: 0.2 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_ortho_sl_std_c2', name: 'Self-Ligating (Standard) (Class 2)', category: 'Orthodontics', defaultPrice: 65000, defaultDurationMinutes: 90, requiresLeadApproval: true, requiresImaging: true, triggersPostOpSequence: true, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_ortho_plier', quantity: 1 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_ortho_bracket_kit', quantity: 1 },
    { stockItemId: 'cons_ortho_wire_ni_ti', quantity: 2 },
    { stockItemId: 'cons_etch', quantity: 0.2 },
    { stockItemId: 'cons_bond', quantity: 0.2 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_ortho_sl_std_c3', name: 'Self-Ligating (Standard) (Class 3)', category: 'Orthodontics', defaultPrice: 70000, defaultDurationMinutes: 90, requiresLeadApproval: true, requiresImaging: true, triggersPostOpSequence: true, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_ortho_plier', quantity: 1 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_ortho_bracket_kit', quantity: 1 },
    { stockItemId: 'cons_ortho_wire_ni_ti', quantity: 2 },
    { stockItemId: 'cons_etch', quantity: 0.2 },
    { stockItemId: 'cons_bond', quantity: 0.2 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_ortho_sl_brand_c1', name: 'Self-Ligating (Damon/Empower) (Class 1)', category: 'Orthodontics', defaultPrice: 70000, defaultDurationMinutes: 90, requiresLeadApproval: true, requiresImaging: true, triggersPostOpSequence: true, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_ortho_plier', quantity: 1 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_ortho_bracket_kit', quantity: 1 },
    { stockItemId: 'cons_ortho_wire_ni_ti', quantity: 2 },
    { stockItemId: 'cons_etch', quantity: 0.2 },
    { stockItemId: 'cons_bond', quantity: 0.2 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_ortho_sl_brand_c2', name: 'Self-Ligating (Damon/Empower) (Class 2)', category: 'Orthodontics', defaultPrice: 75000, defaultDurationMinutes: 90, requiresLeadApproval: true, requiresImaging: true, triggersPostOpSequence: true, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_ortho_plier', quantity: 1 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_ortho_bracket_kit', quantity: 1 },
    { stockItemId: 'cons_ortho_wire_ni_ti', quantity: 2 },
    { stockItemId: 'cons_etch', quantity: 0.2 },
    { stockItemId: 'cons_bond', quantity: 0.2 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_ortho_sl_brand_c3', name: 'Self-Ligating (Damon/Empower) (Class 3)', category: 'Orthodontics', defaultPrice: 80000, defaultDurationMinutes: 90, requiresLeadApproval: true, requiresImaging: true, triggersPostOpSequence: true, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_ortho_plier', quantity: 1 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_ortho_bracket_kit', quantity: 1 },
    { stockItemId: 'cons_ortho_wire_ni_ti', quantity: 2 },
    { stockItemId: 'cons_etch', quantity: 0.2 },
    { stockItemId: 'cons_bond', quantity: 0.2 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_ortho_sl_cer_c1', name: 'Self-Ligating (Ceramic) (Class 1)', category: 'Orthodontics', defaultPrice: 80000, defaultDurationMinutes: 90, requiresLeadApproval: true, requiresImaging: true, triggersPostOpSequence: true, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_ortho_plier', quantity: 1 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_ortho_bracket_kit', quantity: 1 },
    { stockItemId: 'cons_ortho_wire_ni_ti', quantity: 2 },
    { stockItemId: 'cons_etch', quantity: 0.2 },
    { stockItemId: 'cons_bond', quantity: 0.2 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_ortho_sl_cer_c2', name: 'Self-Ligating (Ceramic) (Class 2)', category: 'Orthodontics', defaultPrice: 85000, defaultDurationMinutes: 90, requiresLeadApproval: true, requiresImaging: true, triggersPostOpSequence: true, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_ortho_plier', quantity: 1 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_ortho_bracket_kit', quantity: 1 },
    { stockItemId: 'cons_ortho_wire_ni_ti', quantity: 2 },
    { stockItemId: 'cons_etch', quantity: 0.2 },
    { stockItemId: 'cons_bond', quantity: 0.2 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_ortho_sl_cer_c3', name: 'Self-Ligating (Ceramic) (Class 3)', category: 'Orthodontics', defaultPrice: 90000, defaultDurationMinutes: 90, requiresLeadApproval: true, requiresImaging: true, triggersPostOpSequence: true, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_ortho_plier', quantity: 1 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_ortho_bracket_kit', quantity: 1 },
    { stockItemId: 'cons_ortho_wire_ni_ti', quantity: 2 },
    { stockItemId: 'cons_etch', quantity: 0.2 },
    { stockItemId: 'cons_bond', quantity: 0.2 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_ortho_aligner', name: 'Clear Aligners (Invisalign/ClearCorrect)', category: 'Orthodontics', defaultPrice: 80000, defaultDurationMinutes: 45, requiresLeadApproval: true, requiresImaging: true, triggersPostOpSequence: true, defaultLabFee: 50000, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_imp_pvs_putty', quantity: 0.4 },
    { stockItemId: 'cons_imp_pvs_light', quantity: 1 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_ortho_adj', name: 'Orthodontic Adjustment', category: 'Orthodontics', defaultPrice: 1000, defaultDurationMinutes: 30, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_ortho_plier', quantity: 1 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_ortho_ligature', quantity: 20 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_ortho_wire', name: 'Archwire Change', category: 'Orthodontics', defaultPrice: 1500, defaultDurationMinutes: 30, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_ortho_plier', quantity: 1 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_ortho_wire_ni_ti', quantity: 2 },
    { stockItemId: 'cons_ortho_ligature', quantity: 20 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_ortho_rebond', name: 'Bracket Rebonding', category: 'Orthodontics', defaultPrice: 500, defaultDurationMinutes: 15, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_ortho_plier', quantity: 1 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_etch', quantity: 0.1 },
    { stockItemId: 'cons_bond', quantity: 0.1 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_ortho_full_rebond', name: 'Bracket Placement Full Arch', category: 'Orthodontics', defaultPrice: 5000, defaultDurationMinutes: 60, requiresLeadApproval: true, triggersPostOpSequence: true, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_ortho_plier', quantity: 1 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_etch', quantity: 0.5 },
    { stockItemId: 'cons_bond', quantity: 0.5 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_ortho_lost_bracket', name: 'Lost Bracket Fee', category: 'Orthodontics', defaultPrice: 500, defaultDurationMinutes: 15, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_ortho_bracket_kit', quantity: 0.05 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_ortho_lost_tube', name: 'Lost Buccal Tube Fee', category: 'Orthodontics', defaultPrice: 800, defaultDurationMinutes: 15, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_ortho_bracket_kit', quantity: 0.05 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_retainer_imp', name: 'Impression for Retainer', category: 'Orthodontics', defaultPrice: 1000, defaultDurationMinutes: 30, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_imp_tray', quantity: 2 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_imp_alginate', quantity: 1 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_retainer_fit_hawley', name: 'Retainer Fitting (Hawley)', category: 'Orthodontics', defaultPrice: 5000, defaultDurationMinutes: 30, defaultLabFee: 1500, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_retainer_fit_clear', name: 'Retainer Fitting (Clear/Essix)', category: 'Orthodontics', defaultPrice: 4000, defaultDurationMinutes: 30, defaultLabFee: 1000, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_retainer_fit_lingual', name: 'Retainer Fitting (Fixed Lingual)', category: 'Orthodontics', defaultPrice: 3000, defaultDurationMinutes: 45, defaultLabFee: 1000, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_etch', quantity: 0.1 },
    { stockItemId: 'cons_bond', quantity: 0.1 },
    { stockItemId: 'cons_comp_flow', quantity: 0.2 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_mouthguard', name: 'Mouthguard (Sports/Night)', category: 'Orthodontics', defaultPrice: 5000, defaultDurationMinutes: 30, defaultLabFee: 1500, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_imp_tray', quantity: 2 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_imp_alginate', quantity: 1 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]}
];
