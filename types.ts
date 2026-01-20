export type UserRole = 'DOCTOR' | 'ASSISTANT' | 'SUPER_ADMIN';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
  clinicName?: string;
}

export enum AppointmentStatus {
  PENDING = 'En attente',
  CONFIRMED = 'Confirmé',
  COMPLETED = 'Terminé',
  CANCELLED = 'Annulé',
  RESCHEDULED = 'Reporté',
  NOSHOW = 'Absent',
}

export enum AppointmentType {
  CONSULTATION = 'Consultation',
  TREATMENT = 'Séance Traitement',
  CONTROL = 'Contrôle',
  URGENCY = 'Urgence',
}

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  age: number;
  gender: 'M' | 'F';
  insuranceType: 'CNOPS' | 'CNSS' | 'Private' | 'None';
  lastVisit?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  start: Date;
  duration: number; // in minutes
  type: AppointmentType;
  status: AppointmentStatus;
  notes?: string;
  patientName: string; // denormalized for easy display
}

export interface KPI {
  label: string;
  value: string | number;
  change: number; // percentage
  trend: 'up' | 'down' | 'neutral';
}

export interface CabinetStats {
  appointmentsToday: number;
  pendingConfirmations: number;
  revenueToday: number;
  activeTreatments: number;
}