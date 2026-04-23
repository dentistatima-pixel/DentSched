import { Instrument, StockCategory } from "../../types";

export const INSTRUMENTS: Instrument[] = [
    // Diagnostic
    { id: 'inst_mirror', name: 'Mouth Mirror (Front Surface)', category: StockCategory.INSTRUMENTS, quantity: 20, lowStockThreshold: 10, dispensingUnit: 'Piece', location: 'Sterilization Room' },
    { id: 'inst_explorer', name: 'Explorer (Shepherd\'s Hook / 23)', category: StockCategory.INSTRUMENTS, quantity: 20, lowStockThreshold: 10, dispensingUnit: 'Piece', location: 'Sterilization Room' },
    { id: 'inst_cotton_pliers', name: 'Cotton Pliers (Locking)', category: StockCategory.INSTRUMENTS, quantity: 20, lowStockThreshold: 10, dispensingUnit: 'Piece', location: 'Sterilization Room' },
    { id: 'inst_perio_probe', name: 'Periodontal Probe (UNC-15)', category: StockCategory.INSTRUMENTS, quantity: 15, lowStockThreshold: 5, dispensingUnit: 'Piece', location: 'Sterilization Room' },
    { id: 'inst_art_forceps', name: 'Articulating Paper Forceps', category: StockCategory.INSTRUMENTS, quantity: 10, lowStockThreshold: 5, dispensingUnit: 'Piece', location: 'Sterilization Room' },

    // Hygiene
    { id: 'inst_scaler_ant', name: 'Hand Scaler (Sickle - Anterior)', category: StockCategory.INSTRUMENTS, quantity: 15, lowStockThreshold: 5, dispensingUnit: 'Piece', location: 'Sterilization Room' },
    { id: 'inst_scaler_post', name: 'Hand Scaler (Sickle - Posterior)', category: StockCategory.INSTRUMENTS, quantity: 15, lowStockThreshold: 5, dispensingUnit: 'Piece', location: 'Sterilization Room' },
    { id: 'inst_ultrasonic_hp', name: 'Ultrasonic Scaler Handpiece', category: StockCategory.INSTRUMENTS, quantity: 5, lowStockThreshold: 2, dispensingUnit: 'Piece', location: 'Operatory' },
    { id: 'inst_ultrasonic_tip', name: 'Ultrasonic Scaler Tip (Universal)', category: StockCategory.INSTRUMENTS, quantity: 20, lowStockThreshold: 10, dispensingUnit: 'Piece', location: 'Sterilization Room' },
    { id: 'inst_prophy_angle_metal', name: 'Prophy Angle (Metal/Reusable)', category: StockCategory.INSTRUMENTS, quantity: 10, lowStockThreshold: 5, dispensingUnit: 'Piece', location: 'Sterilization Room' },

    // Restorative
    { id: 'inst_hp_high', name: 'High-Speed Handpiece', category: StockCategory.INSTRUMENTS, quantity: 8, lowStockThreshold: 4, dispensingUnit: 'Piece', location: 'Operatory' },
    { id: 'inst_hp_low', name: 'Low-Speed Handpiece (Contra-Angle)', category: StockCategory.INSTRUMENTS, quantity: 8, lowStockThreshold: 4, dispensingUnit: 'Piece', location: 'Operatory' },
    { id: 'inst_composite_placement', name: 'Composite Placement Instrument', category: StockCategory.INSTRUMENTS, quantity: 15, lowStockThreshold: 5, dispensingUnit: 'Piece', location: 'Sterilization Room' },
    { id: 'inst_condenser', name: 'Condenser / Plugger', category: StockCategory.INSTRUMENTS, quantity: 15, lowStockThreshold: 5, dispensingUnit: 'Piece', location: 'Sterilization Room' },
    { id: 'inst_burnisher', name: 'Burnisher (Ball/Football)', category: StockCategory.INSTRUMENTS, quantity: 15, lowStockThreshold: 5, dispensingUnit: 'Piece', location: 'Sterilization Room' },
    { id: 'inst_carver', name: 'Carver (Hollenback)', category: StockCategory.INSTRUMENTS, quantity: 15, lowStockThreshold: 5, dispensingUnit: 'Piece', location: 'Sterilization Room' },
    { id: 'inst_spoon', name: 'Spoon Excavator', category: StockCategory.INSTRUMENTS, quantity: 15, lowStockThreshold: 5, dispensingUnit: 'Piece', location: 'Sterilization Room' },
    { id: 'inst_tofflemire', name: 'Matrix Band Retainer (Tofflemire)', category: StockCategory.INSTRUMENTS, quantity: 10, lowStockThreshold: 5, dispensingUnit: 'Piece', location: 'Sterilization Room' },
    { id: 'inst_curing_light', name: 'Curing Light', category: StockCategory.INSTRUMENTS, quantity: 4, lowStockThreshold: 2, dispensingUnit: 'Piece', location: 'Operatory' },

    // Surgical
    { id: 'inst_scalpel_handle', name: 'Scalpel Handle (No. 3)', category: StockCategory.INSTRUMENTS, quantity: 10, lowStockThreshold: 5, dispensingUnit: 'Piece', location: 'Sterilization Room' },
    { id: 'inst_elevator_periosteal', name: 'Periosteal Elevator (Molt 9)', category: StockCategory.INSTRUMENTS, quantity: 10, lowStockThreshold: 5, dispensingUnit: 'Piece', location: 'Sterilization Room' },
    { id: 'inst_elevator_straight', name: 'Straight Elevator (Medium)', category: StockCategory.INSTRUMENTS, quantity: 10, lowStockThreshold: 5, dispensingUnit: 'Piece', location: 'Sterilization Room' },
    { id: 'inst_elevator_cryer', name: 'Cryer Elevator (East/West)', category: StockCategory.INSTRUMENTS, quantity: 8, lowStockThreshold: 4, dispensingUnit: 'Piece', location: 'Sterilization Room' },
    { id: 'inst_root_pick', name: 'Root Tip Pick', category: StockCategory.INSTRUMENTS, quantity: 8, lowStockThreshold: 4, dispensingUnit: 'Piece', location: 'Sterilization Room' },
    { id: 'inst_luxator', name: 'Luxator (Straight)', category: StockCategory.INSTRUMENTS, quantity: 8, lowStockThreshold: 4, dispensingUnit: 'Piece', location: 'Sterilization Room' },
    { id: 'inst_forceps_150', name: 'Forceps - Upper Universal (150)', category: StockCategory.INSTRUMENTS, quantity: 5, lowStockThreshold: 2, dispensingUnit: 'Piece', location: 'Sterilization Room' },
    { id: 'inst_forceps_151', name: 'Forceps - Lower Universal (151)', category: StockCategory.INSTRUMENTS, quantity: 5, lowStockThreshold: 2, dispensingUnit: 'Piece', location: 'Sterilization Room' },
    { id: 'inst_forceps_17', name: 'Forceps - Lower Molars (17)', category: StockCategory.INSTRUMENTS, quantity: 3, lowStockThreshold: 1, dispensingUnit: 'Piece', location: 'Sterilization Room' },
    { id: 'inst_forceps_23', name: 'Forceps - Lower Molars (23 Cowhorn)', category: StockCategory.INSTRUMENTS, quantity: 3, lowStockThreshold: 1, dispensingUnit: 'Piece', location: 'Sterilization Room' },
    { id: 'inst_curette_surg', name: 'Surgical Curette (Lucas)', category: StockCategory.INSTRUMENTS, quantity: 8, lowStockThreshold: 4, dispensingUnit: 'Piece', location: 'Sterilization Room' },
    { id: 'inst_bone_file', name: 'Bone File', category: StockCategory.INSTRUMENTS, quantity: 5, lowStockThreshold: 2, dispensingUnit: 'Piece', location: 'Sterilization Room' },
    { id: 'inst_needle_holder', name: 'Needle Holder (Mayo-Hegar)', category: StockCategory.INSTRUMENTS, quantity: 10, lowStockThreshold: 5, dispensingUnit: 'Piece', location: 'Sterilization Room' },
    { id: 'inst_hemostat', name: 'Hemostat (Mosquito - Curved)', category: StockCategory.INSTRUMENTS, quantity: 10, lowStockThreshold: 5, dispensingUnit: 'Piece', location: 'Sterilization Room' },
    { id: 'inst_tissue_forceps', name: 'Tissue Forceps (Adson)', category: StockCategory.INSTRUMENTS, quantity: 10, lowStockThreshold: 5, dispensingUnit: 'Piece', location: 'Sterilization Room' },
    { id: 'inst_rongeur', name: 'Bone Rongeur', category: StockCategory.INSTRUMENTS, quantity: 3, lowStockThreshold: 1, dispensingUnit: 'Piece', location: 'Sterilization Room' },
    { id: 'inst_scissors_surg', name: 'Surgical Scissors (Iris)', category: StockCategory.INSTRUMENTS, quantity: 8, lowStockThreshold: 4, dispensingUnit: 'Piece', location: 'Sterilization Room' },
    { id: 'inst_retractor_minn', name: 'Cheek Retractor (Minnesota)', category: StockCategory.INSTRUMENTS, quantity: 8, lowStockThreshold: 4, dispensingUnit: 'Piece', location: 'Sterilization Room' },
    { id: 'inst_mouth_prop', name: 'Mouth Prop (Bite Block)', category: StockCategory.INSTRUMENTS, quantity: 10, lowStockThreshold: 5, dispensingUnit: 'Piece', location: 'Sterilization Room' },
    { id: 'inst_amalgam_carrier', name: 'Amalgam Carrier (Double Ended)', category: StockCategory.INSTRUMENTS, quantity: 5, lowStockThreshold: 2, dispensingUnit: 'Piece', location: 'Sterilization Room' },
    { id: 'inst_ging_knife', name: 'Gingivectomy Knife (Kirkland 15/16)', category: StockCategory.INSTRUMENTS, quantity: 5, lowStockThreshold: 2, dispensingUnit: 'Piece', location: 'Sterilization Room' },
    { id: 'inst_ortho_debonding', name: 'Debonding Pliers', category: StockCategory.INSTRUMENTS, quantity: 3, lowStockThreshold: 1, dispensingUnit: 'Piece', location: 'Sterilization Room' }
];
