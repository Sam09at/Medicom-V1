
import { 
  Appointment, AppointmentStatus, AppointmentType, Patient, User, Treatment, 
  MedicalDocument, InventoryItem, LabOrder, Expense, SaaSUser, PricingPlan, 
  ApiMetric, TenantDetailed, AiModelConfig, Webhook, ModuleConfiguration, EmailTemplate,
  MedicalService, OnboardingLead, Partner, AuditLog, CronJob, AppError, SecurityEvent,
  FeatureFlag, BroadcastMessage, Region, CacheMetric, JobQueue, Deployment,
  ComplianceRecord, FeatureRequest, Addon, Backup, ChurnRisk, ContentPage, TranslationModule
} from './types';

export const DEFAULT_MODULES: ModuleConfiguration = {
  dashboard: true,
  calendar: true,
  patients: true,
  treatments: true,
  inventory: true,
  labOrders: true,
  documents: true,
  records: true,
  billing: true,
  reports: true,
  support: true
};

export const STARTER_MODULES: ModuleConfiguration = {
  dashboard: true,
  calendar: true,
  patients: true,
  treatments: false,
  inventory: false,
  labOrders: false,
  documents: true,
  records: false,
  billing: true,
  reports: false,
  support: true
};

export const PRO_MODULES: ModuleConfiguration = {
  dashboard: true,
  calendar: true,
  patients: true,
  treatments: true,
  inventory: true,
  labOrders: false,
  documents: true,
  records: true,
  billing: true,
  reports: true,
  support: true
};

export const ASSISTANT_MODULES: ModuleConfiguration = {
  dashboard: true,
  calendar: true,
  patients: true,
  treatments: false, // No clinical treatments
  inventory: true,
  labOrders: true,
  documents: true,
  records: false, // No medical records/notes
  billing: true,
  reports: false, // No financial intelligence
  support: true
};

export const CURRENT_USER_DOCTOR: User = {
  id: 'u1',
  name: 'Dr. Amina El Amrani',
  role: 'DOCTOR',
  avatar: 'https://picsum.photos/id/64/100/100',
  clinicName: 'Cabinet Dentaire Dr. Amina',
  plan: 'Premium',
  enabledModules: DEFAULT_MODULES
};

export const CURRENT_USER_ASSISTANT: User = {
  id: 'u2',
  name: 'Sarah Benani',
  role: 'ASSISTANT',
  avatar: 'https://picsum.photos/id/65/100/100',
  clinicName: 'Cabinet Dentaire Dr. Amina',
  plan: 'Premium',
  enabledModules: ASSISTANT_MODULES
};

export const CURRENT_USER_ADMIN: User = {
  id: 'u99',
  name: 'Sami Benjekkoun',
  role: 'SUPER_ADMIN',
  avatar: 'https://picsum.photos/id/1005/100/100',
  enabledModules: DEFAULT_MODULES
};

export const MOCK_PATIENTS: Patient[] = [
  { id: 'p1', firstName: 'Karim', lastName: 'Benali', phone: '0661234567', age: 34, gender: 'M', insuranceType: 'CNOPS', lastVisit: '24 Jan 2024', email: 'karim@gmail.com', medicalHistory: ['Allergie Pénicilline', 'Hypertension'] },
  { id: 'p2', firstName: 'Fatima', lastName: 'Zahra', phone: '0661987654', age: 28, gender: 'F', insuranceType: 'CNSS', lastVisit: '15 Jan 2024', email: 'fatima@gmail.com' },
  { id: 'p3', firstName: 'Youssef', lastName: 'Idrissi', phone: '0662334455', age: 45, gender: 'M', insuranceType: 'Private', lastVisit: '23 Jan 2024' },
  { id: 'p4', firstName: 'Layla', lastName: 'Amrani', phone: '0663112233', age: 22, gender: 'F', insuranceType: 'None', lastVisit: '22 Jan 2024' },
  { id: 'p5', firstName: 'Omar', lastName: 'Tazi', phone: '0664556677', age: 52, gender: 'M', insuranceType: 'CNSS', lastVisit: '20 Jan 2024' },
];

export const MOCK_APPOINTMENTS: Appointment[] = [
  { id: 'a1', patientId: 'p1', doctorId: 'u1', start: new Date('2024-01-24T09:00:00'), duration: 30, type: AppointmentType.CONSULTATION, status: AppointmentStatus.ARRIVED, patientName: 'Karim Benali' },
  { id: 'a2', patientId: 'p2', doctorId: 'u1', start: new Date('2024-01-24T10:00:00'), duration: 60, type: AppointmentType.TREATMENT, status: AppointmentStatus.PENDING, patientName: 'Fatima Zahra' },
  { id: 'a3', patientId: 'p3', doctorId: 'u1', start: new Date('2024-01-24T11:30:00'), duration: 15, type: AppointmentType.CONTROL, status: AppointmentStatus.PENDING, patientName: 'Youssef Idrissi' },
];

export const MOCK_DOCUMENTS: MedicalDocument[] = [
  { id: 'd1', patientName: 'Karim Benali', type: 'Radio', fileName: 'Panoramique_2024.jpg', date: '24 Jan 2024', size: '2.4 MB' },
  { id: 'd2', patientName: 'Fatima Zahra', type: 'Ordonnance', fileName: 'Prescription_Soins.pdf', date: '15 Jan 2024', size: '156 KB' },
  { id: 'd3', patientName: 'Karim Benali', type: 'Radio', fileName: 'RetroAlveolaire_36.jpg', date: '24 Jan 2024', size: '1.1 MB' },
];

export const MOCK_EXPENSES: Expense[] = [
  { id: 'e1', description: 'Loyer Mensuel', category: 'Rent', amount: 8000, date: '01 Jan 2024', status: 'Paid' },
  { id: 'e2', description: 'Facture Lydec', category: 'Utilities', amount: 1200, date: '15 Jan 2024', status: 'Paid' },
  { id: 'e3', description: 'Fournitures DentalPro', category: 'Supplies', amount: 4500, date: '20 Jan 2024', status: 'Pending' },
];

export const MOCK_TREATMENTS: Treatment[] = [
  { id: 't1', name: 'Réhabilitation Globale', patientName: 'Karim Benali', totalSessions: 8, completedSessions: 3, startDate: '10 Jan 2024', status: 'Active', amount: 12500 },
  { id: 't2', name: 'Traitement Orthodontique', patientName: 'Fatima Zahra', totalSessions: 24, completedSessions: 12, startDate: '15 Juin 2023', status: 'Active', amount: 22000 },
];

export const MOCK_INVENTORY: InventoryItem[] = [
  { id: 'i1', name: 'Gants Latex (M)', category: 'Consumable', quantity: 15, minThreshold: 10, unit: 'Boîtes', supplier: 'MedicalExpress', lastRestock: '20 Jan 2024' },
  { id: 'i2', name: 'Masques FFP2', category: 'Consumable', quantity: 4, minThreshold: 10, unit: 'Boîtes', supplier: 'DentalSupply', lastRestock: '15 Jan 2024' },
  { id: 'i3', name: 'Anesthésique Septanest', category: 'Consumable', quantity: 25, minThreshold: 5, unit: 'Cartouches', supplier: 'MedicalExpress', lastRestock: '22 Jan 2024' },
];

export const MOCK_LAB_ORDERS: LabOrder[] = [
  { id: 'l1', patientName: 'Karim Benali', labName: 'Labo Atlas', type: 'Couronne Zircone', sentDate: '22 Jan 2024', dueDate: '29 Jan 2024', status: 'In Progress', cost: 1200 },
  { id: 'l2', patientName: 'Omar Tazi', labName: 'Smile Lab', type: 'Appareil Résine', sentDate: '15 Jan 2024', dueDate: '22 Jan 2024', status: 'Received', cost: 2500 },
];

export const MOCK_TENANTS_DETAILED: TenantDetailed[] = [
  { id: 'TEN-001', name: 'Cabinet Dentaire Amina', contactName: 'Dr. Amina', email: 'amina@cabinet.ma', plan: 'Premium', status: 'Active', usersCount: 3, storageUsed: '1.2 GB', joinedAt: '12/05/2023', mrr: 850, region: 'Casablanca', enabledModules: DEFAULT_MODULES },
  { id: 'TEN-002', name: 'Clinique du Sourire', contactName: 'Dr. Tazi', email: 'tazi@sourire.ma', plan: 'Pro', status: 'Active', usersCount: 8, storageUsed: '4.5 GB', joinedAt: '01/08/2023', mrr: 1200, region: 'Rabat', enabledModules: PRO_MODULES },
  { id: 'TEN-003', name: 'Ortho Plus Tanger', contactName: 'Mme. Bennani', email: 'admin@orthoplus.ma', plan: 'Starter', status: 'Suspended', usersCount: 2, storageUsed: '0.5 GB', joinedAt: '15/09/2023', mrr: 450, region: 'Tanger', enabledModules: STARTER_MODULES },
];

export const MOCK_SAAS_USERS: SaaSUser[] = [
  { id: 'su1', name: 'Sami Admin', email: 'sami@medicom.ma', role: 'Super Admin', clinic: 'Platform', lastLogin: 'Il y a 5 min', status: 'Active' },
  { id: 'su2', name: 'Dr. Amina', email: 'amina@cabinet.ma', role: 'Doctor', clinic: 'Cabinet Amina', lastLogin: 'Hier', status: 'Active' },
];

// Removed 'defaultModules' as it does not exist in PricingPlan type
export const MOCK_PLANS: PricingPlan[] = [
  { id: 'p1', name: 'Starter', price: 450, currency: 'MAD', billing: 'Monthly', features: ['Agenda', 'Dossiers Patients', 'Documents'], activeClinics: 12 },
  { id: 'p2', name: 'Pro', price: 850, currency: 'MAD', billing: 'Monthly', features: ['Tout Starter', 'Facturation', 'Comptabilité', 'Stock'], activeClinics: 25, isPopular: true },
  { id: 'p3', name: 'Premium', price: 1500, currency: 'MAD', billing: 'Monthly', features: ['Tout Pro', 'Assistant IA', 'Support VIP', 'White Label'], activeClinics: 5 },
];

export const MOCK_WEBHOOKS: Webhook[] = [
  { id: 'wh1', url: 'https://api.clinic-sys.com/hooks/medicom', events: ['appointment.created', 'patient.updated'], status: 'Active', failureRate: 0.5 },
];

export const MOCK_API_METRICS: ApiMetric[] = [
  { endpoint: '/api/v1/appointments', requests: 45000, avgLatency: 42, errors: 2 },
  { endpoint: '/api/v1/patients', requests: 12000, avgLatency: 55, errors: 0 },
  { endpoint: '/api/v1/billing', requests: 8000, avgLatency: 120, errors: 15 },
];

export const MOCK_AI_CONFIGS: AiModelConfig[] = [
  { id: 'ai1', name: 'Medicom Assistant v1', provider: 'OpenAI', costPer1kTokens: 0.01, status: 'Active', usage24h: 125000 },
];

export const MOCK_TEMPLATES: EmailTemplate[] = [
  { id: 't1', name: 'Bienvenue Nouveau Cabinet', subject: 'Bienvenue sur Medicom !', lastModified: '12 Jan 2024', type: 'Email' },
];

export const MOCK_NOTIFICATIONS = [
  { id: 'n1', title: 'Nouveau Rendez-vous', message: 'M. Karim Benali a pris RDV pour demain à 10h.', time: 'il y a 5 min', read: false },
  { id: 'n2', title: 'Rappel Stock', message: 'Le stock de "Gants Latex" est faible (4 boîtes restantes).', time: 'il y a 1h', read: false },
  { id: 'n3', title: 'Paiement Reçu', message: 'Facture #FAC-2024-001 réglée par Mme. Zahra.', time: 'hier', read: true },
];

export const MOCK_SERVICES: MedicalService[] = [
  { id: 's1', name: 'Consultation Standard', code: 'C1', price: 300, duration: 15 },
  { id: 's2', name: 'Détartrage complet', code: 'D1', price: 500, duration: 30 },
  { id: 's3', name: 'Composite 1 face', code: 'R1', price: 450, duration: 45 },
  { id: 's4', name: 'Extraction simple', code: 'E1', price: 400, duration: 30 },
];

// Fixed OnboardingLead objects missing properties
export const MOCK_ONBOARDING: OnboardingLead[] = [
  { id: 'ob1', clinicName: 'Clinique du Sourire', doctorName: 'Dr. Tazi', status: 'Training', startDate: '2024-01-01', contact: '0612345678' },
  { id: 'ob2', clinicName: 'Cabinet Amina', doctorName: 'Dr. Amina', status: 'Live', startDate: '2023-12-15', contact: '0661223344' },
  { id: 'ob3', clinicName: 'Ortho Plus', doctorName: 'Dr. Bennani', status: 'Contract_Signed', startDate: '2024-01-20', contact: '0677889900' },
];

// Fixed Partner type mismatch
export const MOCK_PARTNERS: Partner[] = [
  { id: 'p1', name: 'Dental Distribution SA', type: 'Reseller', commissionRate: 5, activeReferrals: 12, totalRevenue: 45000, status: 'Active' },
  { id: 'p2', name: 'Association Dentistes Casa', type: 'Referral', commissionRate: 0, activeReferrals: 8, totalRevenue: 0, status: 'Active' },
];

// Added missing exports required by features
export const MOCK_AUDIT_LOGS: AuditLog[] = [
  { id: 'log1', action: 'Login', actorName: 'Dr. Amina', clinicName: 'Cabinet Amina', timestamp: '2024-01-24 10:00', ipAddress: '192.168.1.1', status: 'Success' },
];

export const MOCK_JOBS: CronJob[] = [
  { id: 'job1', name: 'Backup Database', lastRun: '2024-01-24 00:00', nextRun: '2024-01-25 00:00', status: 'Idle', frequency: 'Daily' },
];

export const MOCK_APP_ERRORS: AppError[] = [
  { id: 'err1', message: 'PDF Generation failed', component: 'Billing', occurrences: 5, lastSeen: '2024-01-24 10:10', status: 'Open' },
];

export const MOCK_SECURITY_EVENTS: SecurityEvent[] = [
  { id: 'sec1', ip: '45.12.33.1', location: 'Casablanca', threatLevel: 'Low', date: '2024-01-24', reason: 'Failed login attempt' },
];

export const MOCK_FLAGS: FeatureFlag[] = [
  { id: 'flag1', key: 'ai-assistant', name: 'AI Assistant', status: 'Active', rolloutPercentage: 100 },
];

export const MOCK_BROADCASTS: BroadcastMessage[] = [
  { id: 'b1', title: 'System Maintenance', message: 'Planned maintenance on Sunday.', target: 'All', status: 'Sent', sentAt: '2024-01-20' },
];

export const MOCK_REGIONS: Region[] = [
  { id: 'reg1', name: 'Casablanca', code: 'CASA', activeTenants: 18, status: 'Healthy' },
  { id: 'reg2', name: 'Rabat', code: 'RAB', activeTenants: 12, status: 'Healthy' },
];

export const MOCK_CACHE_METRICS: CacheMetric[] = [
  { name: 'Redis Main', hitRate: 94, memoryUsed: 1024, keys: 4500, uptime: '12 days' },
];

export const MOCK_QUEUES: JobQueue[] = [
  { id: 'q1', name: 'Email Queue', active: 0, failed: 0, delayed: 0, status: 'Healthy' },
];

export const MOCK_DEPLOYMENTS: Deployment[] = [
  { id: 'dep1', version: '2.4.0', date: '2024-01-20', status: 'Success', author: 'Sami', commitHash: 'abc1234' },
];

export const MOCK_COMPLIANCE: ComplianceRecord[] = [
  { id: 'comp1', clinicName: 'Cabinet Amina', dpaSigned: true, dataLocation: 'Casablanca', lastAudit: '2023-12-01', status: 'Compliant' },
];

export const MOCK_FEATURE_REQUESTS: FeatureRequest[] = [
  { id: 'fr1', title: 'DarkMode', description: 'Enable dark mode', votes: 45, status: 'Planned', tags: ['UI'] },
  { id: 'fr2', title: 'Mobile App', description: 'Native app for iOS', votes: 120, status: 'Live', tags: ['Feature'] },
];

export const MOCK_ADDONS: Addon[] = [
  { id: 'add1', name: 'AI Assistant', description: 'Smart clinical notes', price: 200, activeInstalls: 5, status: 'Available', icon: 'wand' },
  { id: 'add2', name: 'SMS Pack', description: 'Bulk SMS marketing', price: 100, activeInstalls: 15, status: 'Available', icon: 'message' },
];

export const MOCK_BACKUPS: Backup[] = [
  { id: 'bk1', clinicName: 'Cabinet Amina', size: '1.2 GB', createdAt: '2024-01-24', type: 'Auto', status: 'Success' },
];

export const MOCK_CHURN_RISK: ChurnRisk[] = [
  { id: 'risk1', clinicName: 'Clinique du Nord', riskScore: 85, mrr: 2500, factors: ['Low activity'] },
];

export const MOCK_CONTENT: ContentPage[] = [
  { id: 'pg1', title: 'Privacy Policy', lastUpdated: '2023-10-10', status: 'Published', slug: '/privacy' },
];

export const MOCK_TRANSLATIONS: TranslationModule[] = [
  { id: 'tr1', name: 'French', progress: 100, lastUpdated: '2024-01-01', keys: 1200 },
  { id: 'tr2', name: 'Arabic', progress: 85, lastUpdated: '2024-01-15', keys: 1200 },
];
