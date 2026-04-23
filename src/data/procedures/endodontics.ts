import { ProcedureItem } from "../../types";

export const ENDODONTIC_PROCEDURES: ProcedureItem[] = [
  { id: 'proc_rct_ant_ortho', name: 'Anterior Root Canal Therapy (Ortho Patient)', category: 'Endodontics', defaultPrice: 5000, defaultDurationMinutes: 90, requiresImaging: true, triggersPostOpSequence: true, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_endo_explorer', quantity: 1 },
    { stockItemId: 'inst_rd_forceps', quantity: 1 },
    { stockItemId: 'inst_rd_punch', quantity: 1 },
    { stockItemId: 'inst_rd_clamps', quantity: 1 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_lido', quantity: 2 },
    { stockItemId: 'cons_needle_short', quantity: 2 },
    { stockItemId: 'cons_rd_sheets', quantity: 1 },
    { stockItemId: 'cons_endo_kfile', quantity: 1 },
    { stockItemId: 'cons_endo_naocl', quantity: 0.2 },
    { stockItemId: 'cons_endo_paper_pts', quantity: 1 },
    { stockItemId: 'cons_endo_gp_pts', quantity: 1 },
    { stockItemId: 'cons_endo_sealer', quantity: 0.2 },
    { stockItemId: 'cons_cem_irm', quantity: 0.1 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_rct_post_ortho', name: 'Posterior Root Canal Therapy (Ortho Patient)', category: 'Endodontics', defaultPrice: 6500, defaultDurationMinutes: 120, requiresLeadApproval: true, requiresImaging: true, triggersPostOpSequence: true, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_endo_explorer', quantity: 1 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_lido', quantity: 3 },
    { stockItemId: 'cons_needle_short', quantity: 3 },
    { stockItemId: 'cons_rd_sheets', quantity: 1 },
    { stockItemId: 'cons_endo_kfile', quantity: 1 },
    { stockItemId: 'cons_endo_naocl', quantity: 0.3 },
    { stockItemId: 'cons_endo_paper_pts', quantity: 1 },
    { stockItemId: 'cons_endo_gp_pts', quantity: 1 },
    { stockItemId: 'cons_endo_sealer', quantity: 0.2 },
    { stockItemId: 'cons_cem_irm', quantity: 0.1 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_rct_ant_nonortho', name: 'Anterior Root Canal Therapy (Non-Ortho)', category: 'Endodontics', defaultPrice: 5500, defaultDurationMinutes: 90, requiresImaging: true, triggersPostOpSequence: true, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_endo_explorer', quantity: 1 },
    { stockItemId: 'inst_rd_forceps', quantity: 1 },
    { stockItemId: 'inst_rd_punch', quantity: 1 },
    { stockItemId: 'inst_rd_clamps', quantity: 1 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_lido', quantity: 2 },
    { stockItemId: 'cons_needle_short', quantity: 2 },
    { stockItemId: 'cons_rd_sheets', quantity: 1 },
    { stockItemId: 'cons_endo_kfile', quantity: 1 },
    { stockItemId: 'cons_endo_naocl', quantity: 0.2 },
    { stockItemId: 'cons_endo_paper_pts', quantity: 1 },
    { stockItemId: 'cons_endo_gp_pts', quantity: 1 },
    { stockItemId: 'cons_endo_sealer', quantity: 0.2 },
    { stockItemId: 'cons_cem_irm', quantity: 0.1 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_rct_post_nonortho', name: 'Posterior Root Canal Therapy (Non-Ortho)', category: 'Endodontics', defaultPrice: 7000, defaultDurationMinutes: 120, requiresLeadApproval: true, requiresImaging: true, triggersPostOpSequence: true, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_endo_explorer', quantity: 1 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_lido', quantity: 3 },
    { stockItemId: 'cons_needle_short', quantity: 3 },
    { stockItemId: 'cons_rd_sheets', quantity: 1 },
    { stockItemId: 'cons_endo_kfile', quantity: 1 },
    { stockItemId: 'cons_endo_naocl', quantity: 0.3 },
    { stockItemId: 'cons_endo_paper_pts', quantity: 1 },
    { stockItemId: 'cons_endo_gp_pts', quantity: 1 },
    { stockItemId: 'cons_endo_sealer', quantity: 0.2 },
    { stockItemId: 'cons_cem_irm', quantity: 0.1 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_apico', name: 'Apicoectomy', category: 'Endodontics', defaultPrice: 4000, defaultDurationMinutes: 60, requiresLeadApproval: true, requiresImaging: true, triggersPostOpSequence: true, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_scalpel_handle', quantity: 1 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_lido', quantity: 2 },
    { stockItemId: 'cons_needle_short', quantity: 2 },
    { stockItemId: 'cons_blade_15', quantity: 1 },
    { stockItemId: 'cons_suture_silk', quantity: 1 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_pulpotomy', name: 'Pulpotomy (Primary Tooth)', category: 'Endodontics', defaultPrice: 2000, defaultDurationMinutes: 60, requiresImaging: true, triggersPostOpSequence: true, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_spoon', quantity: 1 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_lido', quantity: 1 },
    { stockItemId: 'cons_needle_short', quantity: 1 },
    { stockItemId: 'cons_cem_irm', quantity: 0.1 },
    { stockItemId: 'cons_cotton_ball', quantity: 2 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_pulp_regen', name: 'Pulp Regeneration', category: 'Endodontics', defaultPrice: 2000, defaultDurationMinutes: 60, requiresLeadApproval: true, requiresImaging: true, triggersPostOpSequence: true, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_lido', quantity: 1 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_pulp_cap', name: 'Pulp Capping (Direct/Indirect)', category: 'Endodontics', defaultPrice: 1500, defaultDurationMinutes: 30, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_spoon', quantity: 1 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_cem_dycal', quantity: 1 },
    { stockItemId: 'cons_microbrush', quantity: 1 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ], traySetupInstructions: [
    'Prepare Calcium Hydroxide (Dycal) base and catalyst',
    'Set up small spoon excavator for gentle caries removal',
    'Ensure sterile cotton pellets are available for hemorrhage control'
  ]}
];
