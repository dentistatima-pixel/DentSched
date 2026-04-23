import { DIAGNOSTIC_PROCEDURES } from "./diagnostic";
import { RESTORATIVE_PROCEDURES } from "./restorative";
import { ENDODONTIC_PROCEDURES } from "./endodontics";
import { SURGERY_PROCEDURES } from "./surgery";
import { PROSTHODONTIC_PROCEDURES } from "./prosthodontics";
import { PERIODONTIC_PROCEDURES } from "./periodontics";
import { PEDIATRIC_PROCEDURES } from "./pediatric";
import { ORTHODONTIC_PROCEDURES } from "./orthodontics";
import { ProcedureItem } from "../../types";

export const DEFAULT_PROCEDURES: ProcedureItem[] = [
  ...DIAGNOSTIC_PROCEDURES,
  ...RESTORATIVE_PROCEDURES,
  ...ENDODONTIC_PROCEDURES,
  ...SURGERY_PROCEDURES,
  ...PROSTHODONTIC_PROCEDURES,
  ...PERIODONTIC_PROCEDURES,
  ...PEDIATRIC_PROCEDURES,
  ...ORTHODONTIC_PROCEDURES
];
