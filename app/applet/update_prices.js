const fs = require('fs');

const prices = {
    'cons_bib': [600, 500],
    'cons_saliva_ejector': [120, 100],
    'cons_hve_tip': [150, 50],
    'cons_gloves_s': [300, 100],
    'cons_gloves_m': [300, 100],
    'cons_gloves_l': [300, 100],
    'cons_gloves_surg': [900, 50],
    'cons_mask_l2': [120, 50],
    'cons_headcap': [150, 100],
    'cons_shoecover': [200, 100],
    'cons_cup': [50, 50],
    'cons_tissue': [60, 1],
    'cons_cotton_roll': [50, 50],
    'cons_cotton_ball': [100, 500],
    'cons_gauze_2x2': [150, 200],
    'cons_alcohol': [80, 1],
    'cons_amalgam': [2000, 50],
    'cons_biopsy_kit': [500, 1],
    'cons_ssc_kit': [5000, 1],
    'cons_prophy_paste': [1500, 200],
    'cons_prophy_brush': [800, 144],
    'cons_pumice': [200, 1],
    'cons_h2o2': [50, 1],
    'cons_fluoride': [3500, 50],
    'cons_comp_a2': [2000, 1],
    'cons_comp_a3': [2000, 1],
    'cons_bond': [1800, 1],
    'cons_etch': [400, 1],
    'cons_flowable': [1500, 1],
    'cons_sealant': [1200, 1],
    'cons_art_paper': [100, 1],
    'cons_mylar': [150, 1],
    'cons_polishing_strip': [300, 1],
    'cons_matrix_band': [150, 12],
    'cons_wedges': [400, 400],
    'cons_teflon': [20, 1],
    'cons_microbrush': [150, 100],
    'cons_bur_diamond_round': [250, 5],
    'cons_bur_fissure': [250, 5],
    'cons_lido': [1200, 50],
    'cons_topical': [350, 1],
    'cons_needle_short': [400, 100],
    'cons_needle_long': [400, 100],
    'cons_blade_15': [300, 100],
    'cons_suture_silk': [600, 12],
    'cons_saline': [100, 1],
    'cons_betadine': [250, 1],
    'cons_syringe_irr': [500, 100],
    'cons_endo_kfile': [350, 6],
    'cons_endo_hfile': [350, 6],
    'cons_endo_rotary': [1500, 6],
    'cons_endo_paper_pts': [200, 100],
    'cons_endo_gp_pts': [250, 100],
    'cons_endo_sealer': [2500, 1],
    'cons_rd_sheets': [350, 36],
    'cons_endo_naocl': [150, 1],
    'cons_endo_edta': [450, 1],
    'cons_imp_alginate': [350, 1],
    'cons_imp_pvs_putty': [2500, 2],
    'cons_imp_pvs_light': [1200, 2],
    'cons_imp_bite_reg': [1500, 2],
    'cons_imp_mix_tips': [500, 50],
    'cons_cem_gic': [1800, 1],
    'cons_cem_dycal': [800, 1],
    'cons_cem_temp': [600, 1],
    'cons_cem_irm': [1200, 1],
    'cons_inf_pouches': [400, 200],
    'cons_inf_ind_tape': [250, 1],
    'cons_inf_wipes': [600, 160],
    'cons_inf_enzymatic': [1500, 1],
    'cons_surg_gelfoam': [800, 10],
    'cons_ortho_brackets': [1500, 20],
    'cons_ortho_bands': [1000, 10],
    'cons_ortho_tubes': [800, 10],
    'cons_ortho_niti': [500, 10],
    'cons_ortho_ss': [400, 10],
    'cons_ortho_elastics_tie': [250, 1000],
    'cons_ortho_powerchain': [350, 1],
    'cons_ortho_elastics_io': [150, 100],
    'cons_ortho_lig_wire': [200, 1],
    'cons_ortho_adhesive': [1200, 1],
    'cons_ortho_primer': [800, 1],
    'cons_ortho_band_cem': [1500, 1],
    'cons_ortho_wax': [50, 1]
};

let content = fs.readFileSync('/app/applet/constants.ts', 'utf8');

const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const idMatch = line.match(/id:\s*'([^']+)'/);
    if (idMatch) {
        const itemId = idMatch[1];
        if (prices[itemId]) {
            const [boxPrice, unitsPerBox] = prices[itemId];
            const unitCost = boxPrice / unitsPerBox;
            
            let newLine = line.replace(/,\s*unitCost:\s*[\d.]+/, "");
            const insertion = `, unitCost: ${unitCost.toFixed(2)}, boxPrice: ${boxPrice}, unitsPerBox: ${unitsPerBox}`;
            newLine = newLine.replace(", lowStockThreshold:", `${insertion}, lowStockThreshold:`);
            lines[i] = newLine;
        }
    }
}

fs.writeFileSync('/app/applet/constants.ts', lines.join('\n'));
console.log("Updated constants.ts");
