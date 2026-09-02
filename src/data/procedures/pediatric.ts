import { ProcedureItem } from "../../types";

export const PEDIATRIC_PROCEDURES: ProcedureItem[] = [
  { id: 'proc_ssc', name: 'Stainless Steel Crown (Pediatric)', category: 'Pediatric', defaultPrice: 4000, defaultDurationMinutes: 60, billOfMaterials: [
    { stockItemId: 'inst_mirror', quantity: 1 },
    { stockItemId: 'inst_hp_high', quantity: 1 },
    { stockItemId: 'cons_bib', quantity: 1 },
    { stockItemId: 'cons_lido', quantity: 1 },
    { stockItemId: 'cons_ssc_kit', quantity: 1 },
    { stockItemId: 'cons_cem_gic', quantity: 1 },
    { stockItemId: 'cons_gloves_m', quantity: 2 }
  ]}
];
