import { ProcedureItem } from "../../types";

export const PROSTHODONTIC_PROCEDURES: ProcedureItem[] = [
  { id: 'proc_crown_pfm', name: 'Porcelain to Non-precious Metal (PFM NP)', category: 'Prosthodontics', defaultPrice: 5000, defaultDurationMinutes: 60, requiresImaging: true, triggersPostOpSequence: true, defaultLabFee: 3000, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_hp_high', quantity: 1 },
    { stockItemId: 'inst_hp_low', quantity: 1 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_lido', quantity: 1 },
    { stockItemId: 'cons_needle_short', quantity: 1 },
    { stockItemId: 'cons_imp_pvs_putty', quantity: 0.2 },
    { stockItemId: 'cons_imp_pvs_light', quantity: 0.5 },
    { stockItemId: 'cons_imp_mix_tips', quantity: 2 },
    { stockItemId: 'cons_cem_temp', quantity: 0.1 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_crown_pfm_premium', name: 'Porcelain to Metal (Noritake/IPS Ivoclar)', category: 'Prosthodontics', defaultPrice: 8000, defaultDurationMinutes: 60, requiresLeadApproval: true, requiresImaging: true, triggersPostOpSequence: true, defaultLabFee: 4000, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_hp_high', quantity: 1 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_lido', quantity: 1 },
    { stockItemId: 'cons_imp_pvs_putty', quantity: 0.2 },
    { stockItemId: 'cons_cem_temp', quantity: 0.1 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_crown_full_metal', name: 'Full Metal Crown (Non-Precious)', category: 'Prosthodontics', defaultPrice: 5500, defaultDurationMinutes: 60, requiresLeadApproval: true, requiresImaging: true, triggersPostOpSequence: true, defaultLabFee: 2500, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_hp_high', quantity: 1 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_lido', quantity: 1 },
    { stockItemId: 'cons_imp_pvs_putty', quantity: 0.2 },
    { stockItemId: 'cons_cem_temp', quantity: 0.1 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_crown_full_tilite', name: 'Full Metal Crown (Tilite Metal)', category: 'Prosthodontics', defaultPrice: 8500, defaultDurationMinutes: 60, requiresLeadApproval: true, requiresImaging: true, triggersPostOpSequence: true, defaultLabFee: 3500, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_hp_high', quantity: 1 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_lido', quantity: 1 },
    { stockItemId: 'cons_imp_pvs_putty', quantity: 0.2 },
    { stockItemId: 'cons_cem_temp', quantity: 0.1 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_crown_emax', name: 'E-Max Crown', category: 'Prosthodontics', defaultPrice: 10000, defaultDurationMinutes: 60, requiresLeadApproval: true, requiresImaging: true, triggersPostOpSequence: true, defaultLabFee: 5000, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_hp_high', quantity: 1 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_lido', quantity: 1 },
    { stockItemId: 'cons_imp_pvs_putty', quantity: 0.2 },
    { stockItemId: 'cons_cem_temp', quantity: 0.1 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_crown_zirc_pf', name: 'Zirconia Crown (Porcelain Fused)', category: 'Prosthodontics', defaultPrice: 18000, defaultDurationMinutes: 60, requiresLeadApproval: true, requiresImaging: true, triggersPostOpSequence: true, defaultLabFee: 5000, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_hp_high', quantity: 1 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_lido', quantity: 1 },
    { stockItemId: 'cons_imp_pvs_putty', quantity: 0.2 },
    { stockItemId: 'cons_cem_temp', quantity: 0.1 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_crown_zirc_full', name: 'Zirconia Crown (Full)', category: 'Prosthodontics', defaultPrice: 20000, defaultDurationMinutes: 60, requiresLeadApproval: true, requiresImaging: true, triggersPostOpSequence: true, defaultLabFee: 5000, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_hp_high', quantity: 1 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_lido', quantity: 1 },
    { stockItemId: 'cons_imp_pvs_putty', quantity: 0.2 },
    { stockItemId: 'cons_cem_temp', quantity: 0.1 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_crown_pink_gum', name: 'Additional Zirconia/Emax Pink Gum', category: 'Prosthodontics', defaultPrice: 1500, defaultDurationMinutes: 15, billOfMaterials: [] },
  { id: 'proc_crown_tilite', name: 'Porcelain to Tilite (PFM Tilite)', category: 'Prosthodontics', defaultPrice: 10000, defaultDurationMinutes: 60, requiresLeadApproval: true, requiresImaging: true, triggersPostOpSequence: true, defaultLabFee: 4000, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_hp_high', quantity: 1 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_lido', quantity: 1 },
    { stockItemId: 'cons_imp_pvs_putty', quantity: 0.2 },
    { stockItemId: 'cons_cem_temp', quantity: 0.1 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_crown_3d', name: '3D Printed Crown', category: 'Prosthodontics', defaultPrice: 5000, defaultDurationMinutes: 45, requiresLeadApproval: true, requiresImaging: true, triggersPostOpSequence: true, defaultLabFee: 2000, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_hp_high', quantity: 1 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_lido', quantity: 1 },
    { stockItemId: 'cons_imp_pvs_putty', quantity: 0.2 },
    { stockItemId: 'cons_cem_temp', quantity: 0.1 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_crown_temp', name: 'Temporary Crown', category: 'Prosthodontics', defaultPrice: 2000, defaultDurationMinutes: 30, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_hp_high', quantity: 1 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_cem_temp', quantity: 0.1 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_veneer_comp', name: 'Direct Composite Veneer', category: 'Prosthodontics', defaultPrice: 2500, defaultDurationMinutes: 60, requiresLeadApproval: true, triggersPostOpSequence: true, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_hp_high', quantity: 1 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_comp_a2', quantity: 0.5 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_veneer_ceramage', name: 'Indirect Ceramage Veneer', category: 'Prosthodontics', defaultPrice: 10000, defaultDurationMinutes: 90, requiresLeadApproval: true, requiresImaging: true, triggersPostOpSequence: true, defaultLabFee: 3000, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_hp_high', quantity: 1 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_imp_pvs_putty', quantity: 0.2 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_veneer_emax', name: 'E-Max Veneer', category: 'Prosthodontics', defaultPrice: 10000, defaultDurationMinutes: 90, requiresLeadApproval: true, requiresImaging: true, triggersPostOpSequence: true, defaultLabFee: 5000, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_hp_high', quantity: 1 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_imp_pvs_putty', quantity: 0.2 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_veneer_zirc', name: 'Zirconia Veneer', category: 'Prosthodontics', defaultPrice: 20000, defaultDurationMinutes: 90, requiresLeadApproval: true, requiresImaging: true, triggersPostOpSequence: true, defaultLabFee: 5000, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_hp_high', quantity: 1 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_imp_pvs_putty', quantity: 0.2 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_bridge_maryland', name: 'Maryland Bridge (Non-Precious)', category: 'Prosthodontics', defaultPrice: 10000, defaultDurationMinutes: 90, requiresLeadApproval: true, requiresImaging: true, triggersPostOpSequence: true, defaultLabFee: 4000, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_hp_high', quantity: 1 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_imp_pvs_putty', quantity: 0.3 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_inlay_metal', name: 'Inlay/Onlay (Non-Precious Metal)', category: 'Prosthodontics', defaultPrice: 3500, defaultDurationMinutes: 60, requiresLeadApproval: true, triggersPostOpSequence: true, defaultLabFee: 2000, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_hp_high', quantity: 1 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_imp_pvs_putty', quantity: 0.2 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_inlay_tilite', name: 'Inlay/Onlay (Tilite Metal)', category: 'Prosthodontics', defaultPrice: 5500, defaultDurationMinutes: 60, requiresLeadApproval: true, triggersPostOpSequence: true, defaultLabFee: 3000, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_hp_high', quantity: 1 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_imp_pvs_putty', quantity: 0.2 },
    { stockItemId: 'cons_cem_temp', quantity: 0.1 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_inlay_ceramage', name: 'Inlay/Onlay (Ceramage)', category: 'Prosthodontics', defaultPrice: 8000, defaultDurationMinutes: 60, requiresLeadApproval: true, triggersPostOpSequence: true, defaultLabFee: 3000, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_hp_high', quantity: 1 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_imp_pvs_putty', quantity: 0.2 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_post_core_np', name: 'Post & Core (Non-Precious)', category: 'Prosthodontics', defaultPrice: 3500, defaultDurationMinutes: 45, triggersPostOpSequence: true, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_hp_high', quantity: 1 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_imp_pvs_putty', quantity: 0.1 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_post_core_tilite', name: 'Post & Core (Tilite)', category: 'Prosthodontics', defaultPrice: 5500, defaultDurationMinutes: 45, triggersPostOpSequence: true, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_hp_high', quantity: 1 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_imp_pvs_putty', quantity: 0.1 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_recement', name: 'Recementation', category: 'Prosthodontics', defaultPrice: 1500, defaultDurationMinutes: 30, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_cem_gic', quantity: 0.5 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_crown_removal', name: 'Crown Removal', category: 'Prosthodontics', defaultPrice: 2000, defaultDurationMinutes: 30, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_hp_high', quantity: 1 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_bridge_3u_pfm', name: '3-Unit Bridge (PFM)', category: 'Prosthodontics', defaultPrice: 45000, defaultDurationMinutes: 120, requiresLeadApproval: true, requiresImaging: true, triggersPostOpSequence: true, defaultLabFee: 9000, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_hp_high', quantity: 1 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_lido', quantity: 2 },
    { stockItemId: 'cons_needle_short', quantity: 2 },
    { stockItemId: 'cons_imp_pvs_putty', quantity: 0.4 },
    { stockItemId: 'cons_imp_pvs_light', quantity: 1 },
    { stockItemId: 'cons_cem_temp', quantity: 0.2 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_denture_comp', name: 'Complete Denture (Ordinary Acrylic - per arch)', category: 'Prosthodontics', defaultPrice: 5000, defaultDurationMinutes: 60, requiresLeadApproval: true, triggersPostOpSequence: true, defaultLabFee: 2000, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_imp_tray', quantity: 2 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_imp_alginate', quantity: 1 },
    { stockItemId: 'cons_imp_pvs_light', quantity: 0.5 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_denture_lucitone', name: 'Branded Resin Base (Lucitone)', category: 'Prosthodontics', defaultPrice: 8000, defaultDurationMinutes: 60, requiresLeadApproval: true, triggersPostOpSequence: true, defaultLabFee: 3000, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_imp_tray', quantity: 2 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_imp_alginate', quantity: 1 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_denture_hi_impact', name: 'Branded Resin Base (Hi-Impact)', category: 'Prosthodontics', defaultPrice: 8000, defaultDurationMinutes: 60, requiresLeadApproval: true, triggersPostOpSequence: true, defaultLabFee: 3000, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_imp_tray', quantity: 2 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_imp_alginate', quantity: 1 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_denture_vertex', name: 'Branded Resin Base (Vertex)', category: 'Prosthodontics', defaultPrice: 10000, defaultDurationMinutes: 60, requiresLeadApproval: true, triggersPostOpSequence: true, defaultLabFee: 4000, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_imp_tray', quantity: 2 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_imp_alginate', quantity: 1 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_denture_ivocap', name: 'Ivocap System Denture (per arch)', category: 'Prosthodontics', defaultPrice: 25000, defaultDurationMinutes: 60, requiresLeadApproval: true, triggersPostOpSequence: true, defaultLabFee: 8000, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_imp_tray', quantity: 2 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_imp_alginate', quantity: 1 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_denture_flex_partial', name: 'Flexible Denture (Partial)', category: 'Prosthodontics', defaultPrice: 12000, defaultDurationMinutes: 60, requiresLeadApproval: true, triggersPostOpSequence: true, defaultLabFee: 4000, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_imp_tray', quantity: 2 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_imp_alginate', quantity: 1 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_denture_flex_full', name: 'Flexible Denture (Full)', category: 'Prosthodontics', defaultPrice: 15000, defaultDurationMinutes: 60, requiresLeadApproval: true, triggersPostOpSequence: true, defaultLabFee: 5000, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_imp_tray', quantity: 2 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_imp_alginate', quantity: 1 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_denture_flex_combo', name: 'Flexible Denture (Combination Metal/Flexite)', category: 'Prosthodontics', defaultPrice: 18000, defaultDurationMinutes: 60, requiresLeadApproval: true, triggersPostOpSequence: true, defaultLabFee: 6000, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_imp_tray', quantity: 2 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_imp_alginate', quantity: 1 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_denture_flexicryl', name: 'Flexible Denture (Flexicryl)', category: 'Prosthodontics', defaultPrice: 16000, defaultDurationMinutes: 60, requiresLeadApproval: true, triggersPostOpSequence: true, defaultLabFee: 5000, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_imp_tray', quantity: 2 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_imp_alginate', quantity: 1 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_denture_thermosen', name: 'Flexible Denture (Thermosen)', category: 'Prosthodontics', defaultPrice: 16500, defaultDurationMinutes: 60, requiresLeadApproval: true, triggersPostOpSequence: true, defaultLabFee: 5500, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_imp_tray', quantity: 2 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_imp_alginate', quantity: 1 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_denture_partial_1_3', name: '1-3 units partial denture', category: 'Prosthodontics', defaultPrice: 8000, defaultDurationMinutes: 60, requiresLeadApproval: true, requiresConsent: true, requiresImaging: true, triggersPostOpSequence: true, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_imp_tray', quantity: 2 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_imp_alginate', quantity: 1 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_denture_partial_4_6', name: '4-6 units partial denture', category: 'Prosthodontics', defaultPrice: 12000, defaultDurationMinutes: 60, requiresLeadApproval: true, requiresConsent: true, requiresImaging: true, triggersPostOpSequence: true, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_imp_tray', quantity: 2 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_imp_alginate', quantity: 1 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_denture_partial_7_10', name: '7-10 units partial denture', category: 'Prosthodontics', defaultPrice: 18000, defaultDurationMinutes: 90, requiresLeadApproval: true, requiresConsent: true, requiresImaging: true, triggersPostOpSequence: true, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_imp_tray', quantity: 2 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_imp_alginate', quantity: 1 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_denture_flex_unilateral', name: 'Flexible denture unilateral', category: 'Prosthodontics', defaultPrice: 10000, defaultDurationMinutes: 45, requiresLeadApproval: true, requiresConsent: true, requiresImaging: true, triggersPostOpSequence: true, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_imp_tray', quantity: 2 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_imp_alginate', quantity: 1 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_denture_flex_8_pontic', name: 'Flexible denture Up to 8 pontic', category: 'Prosthodontics', defaultPrice: 25000, defaultDurationMinutes: 90, requiresLeadApproval: true, requiresConsent: true, requiresImaging: true, triggersPostOpSequence: true, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_imp_tray', quantity: 2 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_imp_alginate', quantity: 1 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_denture_thermosen_partial', name: 'Thermosen Partial', category: 'Prosthodontics', defaultPrice: 15000, defaultDurationMinutes: 60, requiresLeadApproval: true, requiresConsent: true, requiresImaging: true, triggersPostOpSequence: true, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_imp_tray', quantity: 2 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_imp_alginate', quantity: 1 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_denture_thermosen_full', name: 'Thermosen Full', category: 'Prosthodontics', defaultPrice: 35000, defaultDurationMinutes: 120, requiresLeadApproval: true, requiresConsent: true, requiresImaging: true, triggersPostOpSequence: true, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_imp_tray', quantity: 2 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_imp_alginate', quantity: 1 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_denture_metal_1_8', name: 'Metal Framework Denture (1-8 Pontic)', category: 'Prosthodontics', defaultPrice: 7500, defaultDurationMinutes: 60, requiresLeadApproval: true, triggersPostOpSequence: true, defaultLabFee: 3000, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_imp_tray', quantity: 2 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_imp_alginate', quantity: 1 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_denture_metal_9plus', name: 'Metal Framework Denture (9+ Pontic)', category: 'Prosthodontics', defaultPrice: 10500, defaultDurationMinutes: 60, requiresLeadApproval: true, triggersPostOpSequence: true, defaultLabFee: 4000, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_imp_tray', quantity: 2 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_imp_alginate', quantity: 1 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_denture_metal_acrylic', name: 'Metal Framework w/ Acrylic Base', category: 'Prosthodontics', defaultPrice: 12500, defaultDurationMinutes: 60, requiresLeadApproval: true, triggersPostOpSequence: true, defaultLabFee: 4500, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_imp_tray', quantity: 2 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_imp_alginate', quantity: 1 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_denture_reline', name: 'Denture Adjustment / Relining', category: 'Prosthodontics', defaultPrice: 3500, defaultDurationMinutes: 45, defaultLabFee: 1500, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_hp_low', quantity: 1 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_imp_pvs_light', quantity: 0.3 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]},
  { id: 'proc_jacket_cement', name: 'Jacket Crown Cementation', category: 'Prosthodontics', defaultPrice: 2000, defaultDurationMinutes: 30, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_explorer', quantity: 1 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_cem_gic', quantity: 1 },
    { stockItemId: 'cons_art_paper', quantity: 0.1 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]}
];
