
export enum UserRole {
  ADMIN = 'ADMIN',
  PROFESSIONAL = 'PROFESSIONAL'
}

export interface User {
  id: string;
  email: string;
  password?: string;
  pin?: string; // Nuevo: Pin de 4 a 6 dígitos
  firstName: string;
  lastName: string;
  name: string;
  dob?: string;
  role: UserRole;
  avatar?: string;
  specialty?: string;
  sessionValue: number;
  commissionRate: number;
}

export enum DocType {
  FACTURA = 'Factura',
  INFORME = 'Informe',
  PLANILLA = 'Planilla',
  OTRO = 'Otro'
}

export interface Document {
  id: string;
  patientId: string;
  type: DocType;
  name: string;
  date: string;
  url: string;
  amount?: number;
  receiptNumber?: string;
  status?: 'pendiente' | 'pagada';
}

export interface ContactPerson {
  name: string;
  phone: string;
  email: string;
}

export interface ResponsiblePerson {
  name: string;
  address: string;
  phone: string;
  email: string;
}

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  diagnosis: string;
  insurance: string;
  avatar?: string; // Nuevo: Soporte para foto local
  affiliateNumber?: string;
  school?: string;
  supportTeacher?: ContactPerson;
  therapeuticCompanion?: ContactPerson;
  responsible: ResponsiblePerson;
  assignedProfessionals: string[];
  clinicalHistory: ClinicalNote[];
  documents: Document[];
}

export interface ClinicalNote {
  id: string;
  date: string;
  professionalId: string;
  content: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  professionalId: string;
  start: string;
  end: string;
  particularValue: number;
  insuranceValue: number;
  baseValue: number;
}

export interface SupabaseLog {
  id: string;
  timestamp: string;
  action: string;
  status: 'success' | 'error';
  message: string;
}
