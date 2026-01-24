
export type UserRole = 'DOCTOR' | 'ASSISTANT' | 'SUPER_ADMIN';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
  clinicName?: string;
  plan?: 'Starter' | 'Pro' | 'Premium';
  mrr?: number;
  email?: string;
  phone?: string;
}

// ... (Existing types unchanged) ...

export enum AppointmentStatus {
  PENDING = 'En attente',
  CONFIRMED = 'Confirmé',
  ARRIVED = 'En salle d\'attente',
  IN_PROGRESS = 'En consultation',
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
  BREAK = 'Pause / Absence',
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
  email?: string;
  address?: string;
  notes?: string;
  medicalHistory?: string[];
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  start: Date;
  duration: number;
  type: AppointmentType;
  status: AppointmentStatus;
  notes?: string;
  patientName: string;
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  dueDate?: string;
  priority?: 'High' | 'Medium' | 'Low';
  assignee?: string;
}

export interface KPI {
  label: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
}

export interface CabinetStats {
  appointmentsToday: number;
  pendingConfirmations: number;
  revenueToday: number;
  activeTreatments: number;
  waitingRoom: number;
}

export interface Treatment {
  id: string;
  patientName: string;
  name: string;
  totalSessions: number;
  completedSessions: number;
  startDate: string;
  status: 'Active' | 'Completed' | 'Paused';
  amount: number;
}

export interface Prospect {
  id: string;
  clinicName: string;
  contactName: string;
  city: string;
  status: 'New' | 'Contacted' | 'Demo' | 'Converted' | 'Lost';
  source: string;
  date: string;
  priority?: 'High' | 'Medium' | 'Low';
  leadScore?: number;
  notes?: string;
  email?: string;
  phone?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'Consumable' | 'Instrument' | 'Equipment';
  quantity: number;
  minThreshold: number;
  unit: string;
  supplier: string;
  lastRestock: string;
}

export interface LabOrder {
  id: string;
  patientName: string;
  labName: string;
  type: string;
  sentDate: string;
  dueDate: string;
  status: 'Sent' | 'In Progress' | 'Received' | 'Fitted';
  cost: number;
}

export interface Expense {
  id: string;
  description: string;
  category: 'Rent' | 'Utilities' | 'Salaries' | 'Supplies' | 'Other';
  amount: number;
  date: string;
  status: 'Paid' | 'Pending';
}

export interface Quote {
  id: string;
  patient: string;
  date: string;
  amount: number;
  status: 'Draft' | 'Sent' | 'Accepted' | 'Rejected';
  items: string;
  validUntil: string;
}

export interface Campaign {
  id: string;
  name: string;
  type: 'SMS' | 'Email' | 'WhatsApp';
  status: 'Draft' | 'Scheduled' | 'Sent';
  audience: string;
  sentCount: number;
  date: string;
}

export interface Drug {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

export interface Prescription {
  id: string;
  consultationId: string;
  date: string;
  drugs: Drug[];
}

export interface Consultation {
  id: string;
  appointmentId: string;
  patientId: string;
  date: string;
  vitals?: {
    bp?: string;
    weight?: string;
    temp?: string;
  };
  symptoms: string;
  diagnosis: string;
  notes: string;
  prescription?: Prescription;
}

export interface MedicalService {
  id: string;
  name: string;
  code: string;
  price: number;
  duration: number;
}

export interface MedicalDocument {
  id: string;
  patientName: string;
  type: 'Radio' | 'Ordonnance' | 'Analyse' | 'Certificat' | 'Autre';
  fileName: string;
  date: string;
  size: string;
  tags?: string[];
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  time: string;
  read: boolean;
}

export type TicketStatus = 'Open' | 'In Progress' | 'Waiting' | 'Resolved' | 'Closed';
export type TicketPriority = 'Low' | 'Normal' | 'High' | 'Urgent';
export type TicketCategory = 'Technical' | 'Billing' | 'Feature' | 'Bug';

export interface TicketMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  createdAt: string;
  isInternal: boolean;
  attachments?: string[];
}

export interface Ticket {
  id: string;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  user: {
    id: string;
    name: string;
    clinicName: string;
    plan: string;
    avatar: string;
  };
  assignedTo?: {
    id: string;
    name: string;
    avatar: string;
  };
  lastUpdate: string;
  createdAt: string;
  messages: TicketMessage[];
  tags: string[];
}

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

export interface SearchResult {
  id: string;
  type: 'Patient' | 'RDV' | 'Traitement';
  title: string;
  subtitle: string;
  url?: string;
}

// --- NEW SAAS TYPES ---

export interface AuditLog {
  id: string;
  action: string;
  actorName: string;
  clinicName: string;
  timestamp: string;
  ipAddress: string;
  status: 'Success' | 'Failure';
}

export interface SystemMetric {
  time: string;
  value: number;
  metric: 'CPU' | 'Memory' | 'Latency' | 'Errors';
}

export interface BroadcastMessage {
  id: string;
  title: string;
  message: string;
  target: 'All' | 'Premium' | 'Free';
  status: 'Sent' | 'Draft';
  sentAt?: string;
}

export interface SaaSUser {
  id: string;
  name: string;
  email: string;
  role: string;
  clinic: string;
  lastLogin: string;
  status: 'Active' | 'Locked';
}

export interface PricingPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  billing: 'Monthly' | 'Yearly';
  features: string[];
  activeClinics: number;
  isPopular?: boolean;
}

export interface OnboardingLead {
  id: string;
  clinicName: string;
  doctorName: string;
  status: 'Contract_Sent' | 'Contract_Signed' | 'Training' | 'Data_Import' | 'Live';
  startDate: string;
  contact: string;
}

export interface Addon {
  id: string;
  name: string;
  description: string;
  price: number;
  activeInstalls: number;
  status: 'Available' | 'Beta' | 'Deprecated';
  icon: string;
}

export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  status: 'Active' | 'Inactive';
  rolloutPercentage: number;
  targetClinics?: string[]; // IDs
}

export interface Integration {
  id: string;
  name: string;
  type: 'Payment' | 'Insurance' | 'SMS' | 'Lab';
  status: 'Connected' | 'Error';
  apiKeyPrefix: string;
  lastSync: string;
}

export interface ContentPage {
  id: string;
  title: string;
  lastUpdated: string;
  status: 'Published' | 'Draft';
  slug: string;
}

export interface Backup {
  id: string;
  clinicName: string;
  size: string;
  createdAt: string;
  type: 'Auto' | 'Manual';
  status: 'Success' | 'Failed';
}

export interface CronJob {
  id: string;
  name: string;
  lastRun: string;
  nextRun: string;
  status: 'Running' | 'Idle' | 'Error';
  frequency: string;
}

export interface StorageStat {
  clinicName: string;
  used: number; // GB
  limit: number; // GB
  files: number;
}

export interface SecurityEvent {
  id: string;
  ip: string;
  location: string;
  threatLevel: 'Low' | 'Medium' | 'High';
  date: string;
  reason: string;
}

export interface TranslationModule {
  id: string;
  name: string;
  progress: number;
  lastUpdated: string;
  keys: number;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  lastModified: string;
  type: 'Email' | 'SMS';
}

export interface MaintenanceTask {
  id: string;
  name: string;
  description: string;
  lastRun: string;
  status: 'Ready' | 'Running';
}

export interface CustomDomain {
  id: string;
  clinicName: string;
  domain: string;
  status: 'Active' | 'Pending' | 'Error';
  dnsStatus: 'Propagated' | 'Pending';
}

export interface ChurnRisk {
  id: string;
  clinicName: string;
  riskScore: number; // 0-100
  mrr: number;
  factors: string[];
}

export interface TenantTheme {
  id: string;
  clinicName: string;
  primaryColor: string;
  logoUrl?: string;
  isActive: boolean;
}

export interface Partner {
  id: string;
  name: string;
  type: 'Reseller' | 'Referral';
  commissionRate: number;
  activeReferrals: number;
  totalRevenue: number;
  status: 'Active' | 'Inactive';
}

export interface ComplianceRecord {
  id: string;
  clinicName: string;
  dpaSigned: boolean;
  dataLocation: string;
  lastAudit: string;
  status: 'Compliant' | 'Warning' | 'Non-Compliant';
}

export interface ApiMetric {
  endpoint: string;
  requests: number;
  avgLatency: number;
  errors: number;
}

export interface FeatureRequest {
  id: string;
  title: string;
  description: string;
  votes: number;
  status: 'Under Review' | 'Planned' | 'In Progress' | 'Live';
  tags: string[];
}

export interface UserSession {
  id: string;
  userId: string;
  userName: string;
  clinicName: string;
  ip: string;
  device: string;
  loginTime: string;
  lastActive: string;
}

export interface Webhook {
  id: string;
  url: string;
  events: string[];
  status: 'Active' | 'Inactive';
  failureRate: number;
}

export interface FailedPayment {
  id: string;
  clinicName: string;
  amount: number;
  date: string;
  reason: string;
  retryCount: number;
  status: 'Failed' | 'Retrying';
}

export interface AppError {
  id: string;
  message: string;
  component: string;
  occurrences: number;
  lastSeen: string;
  status: 'Open' | 'Resolved';
}

export interface AiModelConfig {
  id: string;
  name: string;
  provider: 'OpenAI' | 'Anthropic' | 'Google';
  costPer1kTokens: number;
  status: 'Active' | 'Deprecated';
  usage24h: number; // Tokens
}

export interface GatewayStatus {
  id: string;
  name: string;
  type: 'SMS' | 'Email';
  provider: 'Twilio' | 'SendGrid' | 'AWS SES';
  status: 'Operational' | 'Degraded' | 'Down';
  deliveryRate: number; // %
  balance?: number;
}

export interface Deployment {
  id: string;
  version: string;
  date: string;
  status: 'Success' | 'Failed' | 'Rolling Back';
  author: string;
  commitHash: string;
}

export interface Region {
  id: string;
  name: string;
  code: string;
  activeTenants: number;
  status: 'Healthy' | 'Maintenance';
}

export interface CacheMetric {
  name: string; // e.g. "Main Redis"
  hitRate: number; // %
  memoryUsed: number; // MB
  keys: number;
  uptime: string;
}

export interface JobQueue {
  id: string;
  name: string;
  active: number;
  failed: number;
  delayed: number;
  status: 'Healthy' | 'Congested' | 'Down';
}

export interface FirewallRule {
  id: string;
  type: 'IP' | 'Country' | 'RateLimit';
  value: string;
  action: 'Block' | 'Challenge';
  hits: number;
  status: 'Active' | 'Inactive';
}

export interface SlowQuery {
  id: string;
  query: string;
  duration: number; // ms
  timestamp: string;
  caller: string;
}

export interface LicenseDetail {
  id: string;
  clinicName: string;
  plan: string;
  seatsUsed: number;
  seatsLimit: number;
  expiresAt: string;
  status: 'Valid' | 'Expired' | 'OverLimit';
}

export interface AuditReportDoc {
  id: string;
  name: string;
  type: 'Access' | 'Data' | 'Financial';
  generatedAt: string;
  size: string;
  status: 'Ready' | 'Generating';
}

// --- NEW TENANT TYPE ---
export interface TenantDetailed {
  id: string;
  name: string;
  contactName: string;
  email: string;
  plan: 'Starter' | 'Pro' | 'Premium';
  status: 'Active' | 'Suspended' | 'Pending';
  usersCount: number;
  storageUsed: string;
  joinedAt: string;
  mrr: number;
  region: string;
}
