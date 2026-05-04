export type ClinicSpecialty =
  | 'dentistry' | 'orthodontics' | 'pediatric_dentistry' | 'oral_surgery'
  | 'periodontology' | 'endodontics' | 'general_medicine' | 'cardiology'
  | 'dermatology' | 'psychology' | 'pediatrics' | 'gynecology'
  | 'ophthalmology' | 'orthopedics' | 'ent' | 'other';

export type PlanTier = 'starter' | 'pro' | 'premium' | 'enterprise';

export type UserRole = 'super_admin' | 'clinic_admin' | 'doctor' | 'staff' | 'patient';

export interface DoctorPreferences {
  autoStatusConsultation: boolean;
  autoRemoveConsultation: boolean;
  defaultCalendarView?: 'day' | 'week' | 'month';
  defaultSlotDuration?: number;
  favorites?: {
    acts?: string[]; // Array of act/service IDs
    noteTemplates?: Array<{ id: string; title: string; content: string }>;
  };
  [key: string]: any;
}

export interface ModuleConfiguration {
  dashboard: boolean;
  calendar: boolean;
  patients: boolean;
  treatments: boolean;
  inventory: boolean;
  labOrders: boolean;
  documents: boolean;
  records: boolean;
  billing: boolean;
  reports: boolean;
  support: boolean;
  landingPageBuilder: boolean;
}

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
  enabledModules?: ModuleConfiguration;
  preferences?: DoctorPreferences;
  // Optional fields populated from real Supabase auth (non-breaking additions)
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  tenantId?: string;
  isActive?: boolean;
  planTier?: 'starter' | 'pro' | 'premium';
}

// ── DB row types (used only inside lib/api/ mappers, never in components) ──────

/** Raw row from public.users — snake_case mirrors actual DB columns */
export interface UserRow {
  id: string;
  tenant_id: string | null;
  role: UserRole;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  module_config: Record<string, boolean> | null;
  created_at: string;
  updated_at: string;
}

/** Raw row from public.tenants — snake_case mirrors actual DB columns */
export interface TenantRow {
  id: string;
  name: string;
  domain: string | null;
  plan_tier: 'starter' | 'pro' | 'premium';
  status: 'active' | 'suspended' | 'trial' | 'cancelled';
  settings_json: Record<string, unknown>;
  logo_url: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  ice: string | null;
  region: string | null;
  created_at: string;
  updated_at: string;
}

/** Auth credentials for the login form */
export interface LoginCredentials {
  email: string;
  password: string;
}

/** Payload for the password reset request */
export interface PasswordResetRequest {
  email: string;
}

export type WaitingRoomFilter = 'all' | 'my_patients';

export enum AppointmentStatus {
  PENDING = 'En attente',
  CONFIRMED = 'Confirmé',
  ARRIVED = "En salle d'attente",
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
  insuranceId?: string;
  lastVisit?: string;
  email?: string;
  address?: string;
  city?: string;
  dateOfBirth?: string;
  insuranceNumber?: string;
  allergies?: string[];
  pathologies?: string[];
  notes?: string;
  medicalHistory?: string[];
  isActive?: boolean;
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
  source?: 'manual' | 'public_booking' | 'phone';
  noShowScore?: number;
  whatsappConfirmedAt?: string | null;
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

export type ToothStatus =
  | 'Healthy'
  | 'Caries'
  | 'Treated'
  | 'Missing'
  | 'Crown'
  | 'RootCanal'
  | 'Implant'
  | 'Bridge'
  | 'ExtractionNeeded'
  | 'Planned';

export type ToothSurface = 'Mesial' | 'Distal' | 'Occlusal' | 'Lingual' | 'Vestibular';

export interface ToothData {
  status: ToothStatus;
  surfaces: ToothSurface[];
  notes?: string;
}

export interface TreatmentSession {
  id: string;
  tenantId: string;
  treatmentPlanId: string;
  appointmentId?: string;
  doctorId: string;
  serviceId?: string;
  serviceName?: string;
  toothNumbers: number[];
  procedureNotes?: string;
  status: 'Planned' | 'Completed' | 'Skipped';
  durationMinutes: number;
  price: number;
  sessionDate?: string;
  sessionOrder: number;
}

export interface TreatmentPlan {
  id: string;
  tenantId: string;
  patientId: string;
  doctorId: string;
  title: string;
  description?: string;
  status: 'Draft' | 'Active' | 'Completed' | 'Cancelled';
  totalAmount: number;
  odontogramSnapshot?: Record<
    number,
    { status: ToothStatus; surfaces: ToothSurface[]; notes?: string }
  >;
  sessions: TreatmentSession[];
  createdAt: string;
  updatedAt: string;
  patientName?: string;
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

export interface LabContact {
  id: string;
  tenantId: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  isActive: boolean;
}

export interface LabOrder {
  id: string;
  tenantId: string;
  patientId: string;
  patientName?: string; // Joined
  labContactId?: string;
  labName?: string; // Joined
  doctorId?: string;
  orderDate: string;
  dueDate?: string;
  status: 'Sent' | 'In Progress' | 'Received' | 'Fitted' | 'Cancelled';
  type: string;
  toothNumbers: string[];
  shade?: string;
  description?: string;
  cost: number;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  toothNumber?: number;
}

export interface Payment {
  id: string;
  invoiceId: string;
  patientId: string;
  amount: number;
  method: 'Cash' | 'Card' | 'Check' | 'Transfer' | 'Insurance' | 'Other';
  date: string;
  reference?: string;
  notes?: string;
}

export interface Invoice {
  id: string;
  tenantId: string;
  patientId: string;
  patientName?: string; // Joined
  number: string;
  status: 'Draft' | 'Pending' | 'Paid' | 'Partial' | 'Overdue' | 'Cancelled';
  type: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  dueDate?: string;
  issuedAt: string;
  items?: InvoiceItem[];
  payments?: Payment[]; // Joined
}

export interface Quote {
  id: string;
  tenantId: string;
  patientId: string;
  patientName?: string; // Joined
  number: string;
  status: 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Expired';
  totalAmount: number;
  validUntil?: string;
  issuedAt: string;
  items: any[]; // JSON
}

export interface Expense {
  id: string;
  tenantId: string;
  description: string;
  category: 'Rent' | 'Utilities' | 'Salaries' | 'Supplies' | 'Lab' | 'Equipment' | 'Other';
  amount: number;
  date: string;
  status: 'Paid' | 'Pending';
  receiptUrl?: string;
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
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes?: string;
}

export interface Prescription {
  id: string;
  tenantId: string;
  consultationId?: string;
  patientId: string;
  doctorId: string;
  drugs: Drug[];
  notes?: string;
  issuedAt: string;
  pdfUrl?: string;
}

export interface Consultation {
  id: string;
  tenantId: string;
  patientId: string;
  appointmentId?: string;
  doctorId: string;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'completed' | 'cancelled';
  chiefComplaint?: string;
  examination?: string;
  diagnosis?: string;
  treatmentPlan?: string;
  notes?: string;
  vitals?: {
    bpSystolic?: number;
    bpDiastolic?: number;
    heartRate?: number;
    temp?: number;
    weight?: number;
    height?: number;
  };
  invoiceId?: string;
  // Joins
  patientName?: string;
  doctorName?: string;
}

export interface MedicalService {
  id: string;
  tenantId?: string; // Optional for mocks
  name: string;
  code?: string; // Legacy support
  category?: string;
  durationMinutes: number;
  price: number;
  tvaRate?: number;
  isActive: boolean;
}

export interface Document {
  id: string;
  tenantId: string;
  patientId: string;
  uploadedBy?: string;
  name: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  category: 'prescription' | 'xray' | 'scan' | 'report' | 'id' | 'insurance' | 'other';
  isGenerated: boolean;
  createdAt: string;
  url?: string; // Signed URL
  patientName?: string;
}

export interface MedicalDocument {
  id: string;
  patientName: string;
  type: 'Radio' | 'Ordonnance' | 'Analyse' | 'Certificat' | 'Autre' | 'FeuilleSoin';
  fileName: string;
  date: string;
  size: string;
  tags?: string[];
}

export interface InsuranceTemplate {
  id: string;
  provider: 'CNSS' | 'CNOPS' | 'Private';
  name: string;
  type: 'Medical' | 'Dental' | 'Special';
  lastUpdated: string;
  isActive: boolean;
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
  targetClinics?: string[];
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
  used: number;
  limit: number;
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
  riskScore: number;
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
  usage24h: number;
}

export interface GatewayStatus {
  id: string;
  name: string;
  type: 'SMS' | 'Email';
  provider: 'Twilio' | 'SendGrid' | 'AWS SES';
  status: 'Operational' | 'Degraded' | 'Down';
  deliveryRate: number;
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
  name: string;
  hitRate: number;
  memoryUsed: number;
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
  duration: number;
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
  enabledModules: ModuleConfiguration;
  // Optional fields populated from real Supabase auth (non-breaking additions)
  planTier?: 'starter' | 'pro' | 'premium';
  domain?: string | null;
  logoUrl?: string | null;
  address?: string | null;
  city?: string | null;
  phone?: string | null;
  website?: string | null;
  ice?: string | null;
  // Lifecycle & specialty fields (migration 017)
  specialty?: ClinicSpecialty;
  adminDomain?: string | null;
  publicDomain?: string | null;
  onboardingStatus?: 'pending' | 'provisioning' | 'active' | 'suspended';
  trialEndsAt?: string | null;
  billingEmail?: string | null;
  slug?: string | null;
}

// ── Landing page types (Phase 0 scaffold — Phase 1 builds the editor) ──────────

export interface LandingPage {
  id: string;
  tenantId: string;
  slug: string;
  isPublished: boolean;
  headline: string | null;
  description: string | null;
  heroImageUrl: string | null;
  accentColor: string;
  contactEmail: string | null;
  contactPhone: string | null;
  addressDisplay: string | null;
  city: string | null;
  googleMapsUrl: string | null;
  scheduleJson: Record<string, unknown>;
  sectionsJson?: PageSection[];
  tenantName?: string;
  createdAt: string;
  updatedAt: string;
}

export type PageSectionType =
  | 'hero' | 'about' | 'services' | 'doctors'
  | 'booking' | 'testimonials' | 'faq' | 'contact' | 'hours';

export interface PageSection {
  id: string;
  type: PageSectionType;
  visible: boolean;
  content: Record<string, unknown>;
}

export interface WhatsAppMessage {
  id: string;
  tenantId: string;
  appointmentId?: string;
  direction: 'outbound' | 'inbound';
  templateName?: string;
  phoneTo: string;
  messageBody?: string;
  status: 'queued' | 'sent' | 'delivered' | 'read' | 'failed';
  externalMessageId?: string;
  errorMessage?: string;
  sentAt?: string;
  createdAt: string;
}

export interface AvailableSlot {
  slotStart: string;
  slotEnd: string;
  doctorId: string;
  doctorName: string;
}

export interface BookingHold {
  id: string;
  tenantId: string;
  slotStart: string;
  slotEnd: string;
  whatsappNumber: string;
  expiresAt: string;
}
