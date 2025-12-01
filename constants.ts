
import { User, UserRole, Patient, Appointment, AppointmentType, AppointmentStatus } from './types';

// Generators for mock data
const generateId = () => Math.random().toString(36).substring(2, 9);

// --- DATE UTILITY ---
export const formatDate = (dateStr: string | undefined | null) => {
  if (!dateStr) return '-';
  
  // Handle ISO YYYY-MM-DD explicitly to avoid timezone shifts
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = dateStr.split('-');
    return `${month}/${day}/${year}`;
  }

  // Handle standard Date objects or ISO strings with time
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  
  return date.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric'
  });
};

export const STAFF: User[] = [
  { id: 'admin1', name: 'Sarah Connor', role: UserRole.ADMIN, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah' },
  { id: 'admin2', name: 'John Smith', role: UserRole.ADMIN, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John' },
  { id: 'admin3', name: 'Emily Blunt', role: UserRole.ADMIN, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily' },
  // Dentists (20)
  { id: 'doc1', name: 'Dr. Alexander Crentist', role: UserRole.DENTIST, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex' },
  { id: 'doc2', name: 'Dr. Benjamin Molar', role: UserRole.DENTIST, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ben' },
  { id: 'doc3', name: 'Dr. Cassandra Filling', role: UserRole.DENTIST, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Cass' },
  { id: 'doc4', name: 'Dr. David Crown', role: UserRole.DENTIST, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dave' },
  { id: 'doc5', name: 'Dr. Elena Root', role: UserRole.DENTIST, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elena' },
  { id: 'doc6', name: 'Dr. Fiona Bridge', role: UserRole.DENTIST, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Fiona' },
  { id: 'doc7', name: 'Dr. George Gum', role: UserRole.DENTIST, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=George' },
  { id: 'doc8', name: 'Dr. Hannah Enamel', role: UserRole.DENTIST, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hannah' },
  { id: 'doc9', name: 'Dr. Ian Implant', role: UserRole.DENTIST, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ian' },
  { id: 'doc10', name: 'Dr. Julia Jaw', role: UserRole.DENTIST, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Julia' },
  { id: 'doc11', name: 'Dr. Kevin Canine', role: UserRole.DENTIST, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kevin' },
  { id: 'doc12', name: 'Dr. Laura Lip', role: UserRole.DENTIST, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Laura' },
  { id: 'doc13', name: 'Dr. Michael Mouth', role: UserRole.DENTIST, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike' },
  { id: 'doc14', name: 'Dr. Natalie Nerve', role: UserRole.DENTIST, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nat' },
  { id: 'doc15', name: 'Dr. Oliver Ortho', role: UserRole.DENTIST, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver' },
  { id: 'doc16', name: 'Dr. Paula Plaque', role: UserRole.DENTIST, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Paula' },
  { id: 'doc17', name: 'Dr. Quentin Quip', role: UserRole.DENTIST, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Quentin' },
  { id: 'doc18', name: 'Dr. Rachel Resin', role: UserRole.DENTIST, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rachel' },
  { id: 'doc19', name: 'Dr. Samuel Smile', role: UserRole.DENTIST, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sam' },
  { id: 'doc20', name: 'Dr. Tina Tooth', role: UserRole.DENTIST, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tina' },
  // Hygienists (20)
  { id: 'hyg1', name: 'H. Sarah Sparkle', role: UserRole.HYGIENIST, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hyg1' },
  { id: 'hyg2', name: 'H. Fred Floss', role: UserRole.HYGIENIST, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hyg2' },
  { id: 'hyg3', name: 'H. Mary Mint', role: UserRole.HYGIENIST, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hyg3' },
  { id: 'hyg4', name: 'H. Chris Clean', role: UserRole.HYGIENIST, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hyg4' },
  { id: 'hyg5', name: 'H. Pat Polish', role: UserRole.HYGIENIST, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hyg5' },
  { id: 'hyg6', name: 'H. Alex Air', role: UserRole.HYGIENIST, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hyg6' },
  { id: 'hyg7', name: 'H. Sam Scale', role: UserRole.HYGIENIST, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hyg7' },
  { id: 'hyg8', name: 'H. Jo Jet', role: UserRole.HYGIENIST, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hyg8' },
  { id: 'hyg9', name: 'H. Lou Laser', role: UserRole.HYGIENIST, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hyg9' },
  { id: 'hyg10', name: 'H. Val Varnish', role: UserRole.HYGIENIST, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hyg10' },
  { id: 'hyg11', name: 'H. Kim Kit', role: UserRole.HYGIENIST, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hyg11' },
  { id: 'hyg12', name: 'H. Lee Loupes', role: UserRole.HYGIENIST, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hyg12' },
  { id: 'hyg13', name: 'H. Morgan Mask', role: UserRole.HYGIENIST, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hyg13' },
  { id: 'hyg14', name: 'H. Nic Needle', role: UserRole.HYGIENIST, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hyg14' },
  { id: 'hyg15', name: 'H. Ollie Oral', role: UserRole.HYGIENIST, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hyg15' },
  { id: 'hyg16', name: 'H. Pam Paste', role: UserRole.HYGIENIST, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hyg16' },
  { id: 'hyg17', name: 'H. Quinn Quip', role: UserRole.HYGIENIST, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hyg17' },
  { id: 'hyg18', name: 'H. Rob Rinse', role: UserRole.HYGIENIST, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hyg18' },
  { id: 'hyg19', name: 'H. Sue Shine', role: UserRole.HYGIENIST, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hyg19' },
  { id: 'hyg20', name: 'H. Tom Tip', role: UserRole.HYGIENIST, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hyg20' }
];

export const PATIENTS: Patient[] = [];

export const APPOINTMENTS: Appointment[] = [];
