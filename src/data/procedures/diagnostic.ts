import { ProcedureItem } from "../../types";

export const DIAGNOSTIC_PROCEDURES: ProcedureItem[] = [
  { id: 'proc_consult', name: 'Initial Consultation & Examination', category: 'Diagnostic & Preventive', defaultPrice: 800, defaultDurationMinutes: 30, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_explorer', quantity: 1 },
    { stockItemId: 'inst_cotton_pliers', quantity: 1 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_cup', quantity: 1 },
    { stockItemId: 'cons_saliva_ejector', quantity: 1 },
    { stockItemId: 'cons_gauze_2x2', quantity: 2 },
    { stockItemId: 'cons_gloves_m', quantity: 2 },
    { stockItemId: 'cons_mask_l2', quantity: 1 }
  ]},
  { id: 'proc_xray_pa', name: 'Periapical X-Ray (Single)', category: 'Diagnostic & Preventive', defaultPrice: 500, defaultDurationMinutes: 10, requiresImaging: true, billOfMaterials: [
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_gloves_m', quantity: 2 },
    { stockItemId: 'cons_mask_l2', quantity: 1 },
    { stockItemId: 'cons_inf_wipes', quantity: 2 }
  ]},
  { id: 'proc_xray_pano', name: 'Panoramic X-Ray', category: 'Diagnostic & Preventive', defaultPrice: 1500, defaultDurationMinutes: 15, requiresImaging: true, billOfMaterials: [
    { stockItemId: 'cons_gloves_m', quantity: 2 },
    { stockItemId: 'cons_mask_l2', quantity: 1 },
    { stockItemId: 'cons_inf_wipes', quantity: 2 }
  ]},
  { id: 'proc_prophy_light', name: 'Oral Prophylaxis (Light to Moderate)', category: 'Diagnostic & Preventive', defaultPrice: 1200, defaultDurationMinutes: 45, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_explorer', quantity: 1 },
    { stockItemId: 'inst_ultrasonic_hp', quantity: 1 },
    { stockItemId: 'inst_ultrasonic_tip', quantity: 1 },
    { stockItemId: 'inst_prophy_angle_metal', quantity: 1 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_cup', quantity: 1 },
    { stockItemId: 'cons_saliva_ejector', quantity: 1 },
    { stockItemId: 'cons_hve_tip', quantity: 1 },
    { stockItemId: 'cons_prophy_paste', quantity: 1 },
    { stockItemId: 'cons_prophy_brush', quantity: 1 },
    { stockItemId: 'cons_gloves_m', quantity: 2 },
    { stockItemId: 'cons_mask_l2', quantity: 1 }
  ]},
  { id: 'proc_prophy_heavy', name: 'Oral Prophylaxis (Heavy w/ Stain Removal)', category: 'Diagnostic & Preventive', defaultPrice: 1800, defaultDurationMinutes: 60, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_explorer', quantity: 1 },
    { stockItemId: 'inst_ultrasonic_hp', quantity: 1 },
    { stockItemId: 'inst_ultrasonic_tip', quantity: 1 },
    { stockItemId: 'inst_scaler_ant', quantity: 1 },
    { stockItemId: 'inst_scaler_post', quantity: 1 },
    { stockItemId: 'inst_prophy_angle_metal', quantity: 1 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_cup', quantity: 1 },
    { stockItemId: 'cons_saliva_ejector', quantity: 1 },
    { stockItemId: 'cons_hve_tip', quantity: 1 },
    { stockItemId: 'cons_prophy_paste', quantity: 1 },
    { stockItemId: 'cons_prophy_brush', quantity: 1 },
    { stockItemId: 'cons_gloves_m', quantity: 2 },
    { stockItemId: 'cons_mask_l2', quantity: 1 },
    { stockItemId: 'cons_topical', quantity: 0.1 }
  ]},
  { id: 'proc_fluoride', name: 'Topical Fluoride Application', category: 'Diagnostic & Preventive', defaultPrice: 800, defaultDurationMinutes: 15, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_fluoride', quantity: 1 },
    { stockItemId: 'cons_microbrush', quantity: 1 },
    { stockItemId: 'cons_cotton_roll', quantity: 4 },
    { stockItemId: 'cons_saliva_ejector', quantity: 1 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_sealant', name: 'Fissure Sealant (per tooth)', category: 'Diagnostic & Preventive', defaultPrice: 1000, defaultDurationMinutes: 20, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_explorer', quantity: 1 },
    { stockItemId: 'inst_curing_light', quantity: 1 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_etch', quantity: 0.1 },
    { stockItemId: 'cons_sealant', quantity: 0.1 },
    { stockItemId: 'cons_microbrush', quantity: 2 },
    { stockItemId: 'cons_cotton_roll', quantity: 4 },
    { stockItemId: 'cons_art_paper', quantity: 0.1 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]}
];
