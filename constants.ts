
import { Appointment, AppointmentStatus, AppointmentType, Patient, User, Treatment, AppNotification, MedicalService, MedicalDocument, InventoryItem, LabOrder, Expense, AuditLog, BroadcastMessage, SaaSUser, PricingPlan, OnboardingLead, Addon, FeatureFlag, Integration, ContentPage, Backup, CronJob, StorageStat, SecurityEvent, TranslationModule, EmailTemplate, MaintenanceTask, CustomDomain, ChurnRisk, TenantTheme, Partner, ComplianceRecord, ApiMetric, FeatureRequest, UserSession, Webhook, FailedPayment, AppError, AiModelConfig, GatewayStatus, Deployment, Region, CacheMetric, JobQueue, FirewallRule, SlowQuery, LicenseDetail, AuditReportDoc, TenantDetailed } from './types';

// ... (Existing constants unchanged) ...

export const CURRENT_USER_DOCTOR: User = {
  id: 'u1',
  name: 'Dr. Amina',
  role: 'DOCTOR',
  avatar: 'https://picsum.photos/id/64/100/100',
  clinicName: 'Cabinet Dentaire Amina'
};

export const CURRENT_USER_ADMIN: User = {
  id: 'u99',
  name: 'Sami (CEO)',
  role: 'SUPER_ADMIN',
  avatar: 'https://picsum.photos/id/1005/100/100',
};

export const MOCK_PATIENTS: Patient[] = [
  { id: 'p1', firstName: 'Karim', lastName: 'Benali', phone: '+212 600-112233', age: 42, gender: 'M', insuranceType: 'CNOPS', lastVisit: '2024-01-10' },
  { id: 'p2', firstName: 'Fatima', lastName: 'Zahra', phone: '+212 600-445566', age: 29, gender: 'F', insuranceType: 'CNSS', lastVisit: '2024-01-15' },
  { id: 'p3', firstName: 'Youssef', lastName: 'Idrissi', phone: '+212 600-778899', age: 35, gender: 'M', insuranceType: 'Private', lastVisit: '2023-12-20' },
  { id: 'p4', firstName: 'Layla', lastName: 'Amrani', phone: '+212 600-001122', age: 55, gender: 'F', insuranceType: 'None', lastVisit: '2024-01-18' },
  { id: 'p5', firstName: 'Omar', lastName: 'Tazi', phone: '+212 661-998877', age: 60, gender: 'M', insuranceType: 'CNOPS' },
];

export const MOCK_TREATMENTS: Treatment[] = [
  { id: 'T1', name: 'Orthodontie Complète', patientName: 'Karim Benali', totalSessions: 24, completedSessions: 12, startDate: '10 Jan 2023', status: 'Active', amount: 25000 },
  { id: 'T2', name: 'Implants Dentaires (x2)', patientName: 'Fatima Zahra', totalSessions: 6, completedSessions: 2, startDate: '15 Jan 2024', status: 'Active', amount: 12000 },
  { id: 'T3', name: 'Blanchiment', patientName: 'Omar Tazi', totalSessions: 3, completedSessions: 3, startDate: '01 Dec 2023', status: 'Completed', amount: 3000 },
  { id: 'T4', name: 'Soins Parodontaux', patientName: 'Layla Amrani', totalSessions: 8, completedSessions: 1, startDate: '20 Jan 2024', status: 'Paused', amount: 4500 },
];

const today = new Date();
const setTime = (hours: number, minutes: number, dayOffset: number = 0) => {
  const d = new Date(today);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hours, minutes, 0, 0);
  return d;
};

export const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: 'a1',
    patientId: 'p1',
    doctorId: 'u1',
    start: setTime(9, 0),
    duration: 30,
    type: AppointmentType.CONSULTATION,
    status: AppointmentStatus.CONFIRMED,
    patientName: 'Karim Benali'
  },
  {
    id: 'a2',
    patientId: 'p2',
    doctorId: 'u1',
    start: setTime(10, 0),
    duration: 45,
    type: AppointmentType.TREATMENT,
    status: AppointmentStatus.PENDING,
    patientName: 'Fatima Zahra'
  },
  {
    id: 'a3',
    patientId: 'p3',
    doctorId: 'u1',
    start: setTime(11, 30),
    duration: 30,
    type: AppointmentType.CONTROL,
    status: AppointmentStatus.COMPLETED,
    patientName: 'Youssef Idrissi'
  },
  {
    id: 'a4',
    patientId: 'p4',
    doctorId: 'u1',
    start: setTime(14, 0),
    duration: 60,
    type: AppointmentType.TREATMENT,
    status: AppointmentStatus.CONFIRMED,
    patientName: 'Layla Amrani'
  },
  {
    id: 'a5',
    patientId: 'p5',
    doctorId: 'u1',
    start: setTime(9, 0, 1),
    duration: 30,
    type: AppointmentType.CONSULTATION,
    status: AppointmentStatus.PENDING,
    patientName: 'Omar Tazi'
  }
];

export const STATUS_COLORS: Record<AppointmentStatus, string> = {
  [AppointmentStatus.PENDING]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  [AppointmentStatus.CONFIRMED]: 'bg-blue-100 text-blue-800 border-blue-200',
  [AppointmentStatus.COMPLETED]: 'bg-green-100 text-green-800 border-green-200',
  [AppointmentStatus.CANCELLED]: 'bg-red-100 text-red-800 border-red-200',
  [AppointmentStatus.RESCHEDULED]: 'bg-purple-100 text-purple-800 border-purple-200',
  [AppointmentStatus.NOSHOW]: 'bg-gray-200 text-gray-800 border-gray-300',
  [AppointmentStatus.ARRIVED]: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  [AppointmentStatus.IN_PROGRESS]: 'bg-pink-100 text-pink-800 border-pink-200',
};

export const MOCK_NOTIFICATIONS: AppNotification[] = [
  { id: 'n1', title: 'Nouveau Rendez-vous', message: 'Karim Benali a réservé pour demain 10:00.', type: 'info', time: 'Il y a 5 min', read: false },
  { id: 'n2', title: 'Paiement Reçu', message: 'Facture #F2024-001 réglée par virement.', type: 'success', time: 'Il y a 20 min', read: false },
  { id: 'n3', title: 'Stock Faible', message: 'Le stock de "Anesthésique Local" est bas.', type: 'warning', time: 'Il y a 2h', read: true },
];

export const MOCK_SERVICES: MedicalService[] = [
  { id: 's1', name: 'Consultation Standard', code: 'C', price: 300, duration: 30 },
  { id: 's2', name: 'Détartrage (Haut & Bas)', code: 'DET', price: 500, duration: 45 },
  { id: 's3', name: 'Extraction Simple', code: 'EXT', price: 350, duration: 30 },
  { id: 's4', name: 'Composite 1 Face', code: 'COMP1', price: 400, duration: 45 },
  { id: 's5', name: 'Blanchiment Dentaire', code: 'WHIT', price: 2500, duration: 60 },
];

export const MOCK_DOCUMENTS: MedicalDocument[] = [
  { id: 'd1', patientName: 'Karim Benali', type: 'Radio', fileName: 'Panoramique_240124.jpg', date: '24 Jan 2024', size: '2.4 MB', tags: ['Dents', 'Radio'] },
  { id: 'd2', patientName: 'Fatima Zahra', type: 'Ordonnance', fileName: 'Ord_Antibio_120124.pdf', date: '12 Jan 2024', size: '150 KB', tags: ['Traitement'] },
  { id: 'd3', patientName: 'Youssef Idrissi', type: 'Analyse', fileName: 'Sang_Complet.pdf', date: '10 Jan 2024', size: '1.1 MB', tags: ['Laboratoire'] },
  { id: 'd4', patientName: 'Layla Amrani', type: 'Certificat', fileName: 'Certificat_Absence.pdf', date: '05 Jan 2024', size: '80 KB', tags: ['Admin'] },
];

export const MOCK_INVENTORY: InventoryItem[] = [
  { id: 'i1', name: 'Anesthésique (Articaïne)', category: 'Consumable', quantity: 15, minThreshold: 20, unit: 'Boîtes', supplier: 'PharmaDent', lastRestock: '10 Jan 2024' },
  { id: 'i2', name: 'Gants Latex (M)', category: 'Consumable', quantity: 50, minThreshold: 10, unit: 'Boîtes', supplier: 'MedicalExpress', lastRestock: '15 Jan 2024' },
  { id: 'i3', name: 'Composite A2', category: 'Consumable', quantity: 4, minThreshold: 5, unit: 'Seringues', supplier: 'DentalPro', lastRestock: '05 Dec 2023' },
  { id: 'i4', name: 'Fraises Diamantées', category: 'Instrument', quantity: 25, minThreshold: 10, unit: 'Unités', supplier: 'DentalPro', lastRestock: '20 Jan 2024' },
];

export const MOCK_LAB_ORDERS: LabOrder[] = [
  { id: 'L-101', patientName: 'Karim Benali', labName: 'Labo Prothèse Atlas', type: 'Couronne Céramique', sentDate: '24 Jan 2024', dueDate: '31 Jan 2024', status: 'Sent', cost: 800 },
  { id: 'L-102', patientName: 'Fatima Zahra', labName: 'Labo Prothèse Atlas', type: 'Bridge 3 éléments', sentDate: '20 Jan 2024', dueDate: '28 Jan 2024', status: 'In Progress', cost: 2400 },
  { id: 'L-103', patientName: 'Omar Tazi', labName: 'Smile Lab', type: 'Gouttière', sentDate: '15 Jan 2024', dueDate: '22 Jan 2024', status: 'Received', cost: 400 },
];

export const MOCK_EXPENSES: Expense[] = [
  { id: 'e1', description: 'Loyer Cabinet', category: 'Rent', amount: 5000, date: '01 Jan 2024', status: 'Paid' },
  { id: 'e2', description: 'Facture Électricité', category: 'Utilities', amount: 850, date: '05 Jan 2024', status: 'Paid' },
  { id: 'e3', description: 'Commande Gants & Masques', category: 'Supplies', amount: 1200, date: '10 Jan 2024', status: 'Paid' },
  { id: 'e4', description: 'Maintenance Fauteuil', category: 'Other', amount: 1500, date: '20 Jan 2024', status: 'Pending' },
];

export const MOCK_AUDIT_LOGS: AuditLog[] = [
  { id: 'log-1', action: 'LOGIN_SUCCESS', actorName: 'Dr. Amina', clinicName: 'Cabinet Amina', timestamp: '2024-01-25 09:00:12', ipAddress: '192.168.1.1', status: 'Success' },
  { id: 'log-2', action: 'EXPORT_PATIENTS', actorName: 'Dr. Karim', clinicName: 'Ortho Rabat', timestamp: '2024-01-25 10:15:00', ipAddress: '105.12.33.44', status: 'Success' },
  { id: 'log-3', action: 'LOGIN_FAILED', actorName: 'Unknown', clinicName: 'Cabinet Amina', timestamp: '2024-01-25 11:20:45', ipAddress: '45.33.22.11', status: 'Failure' },
  { id: 'log-4', action: 'DELETE_INVOICE', actorName: 'Sarah Benani', clinicName: 'Cabinet Amina', timestamp: '2024-01-24 16:30:00', ipAddress: '192.168.1.1', status: 'Success' },
];

export const MOCK_SAAS_USERS: SaaSUser[] = [
  { id: 'u1', name: 'Dr. Amina', email: 'amina@doc.ma', role: 'Admin', clinic: 'Cabinet Amina', lastLogin: '25 Jan 09:00', status: 'Active' },
  { id: 'u2', name: 'Sarah B.', email: 'sarah@doc.ma', role: 'Assistant', clinic: 'Cabinet Amina', lastLogin: '25 Jan 08:30', status: 'Active' },
  { id: 'u3', name: 'Dr. Karim', email: 'karim@ortho.ma', role: 'Admin', clinic: 'Ortho Rabat', lastLogin: '24 Jan 18:00', status: 'Active' },
  { id: 'u4', name: 'Hassan', email: 'hassan@ortho.ma', role: 'Staff', clinic: 'Ortho Rabat', lastLogin: '20 Jan 10:00', status: 'Locked' },
];

export const MOCK_BROADCASTS: BroadcastMessage[] = [
  { id: 'b1', title: 'Maintenance Système', message: 'Mise à jour prévue ce soir à 23h. Durée estimée : 15 min.', target: 'All', status: 'Sent', sentAt: '24 Jan 10:00' },
  { id: 'b2', title: 'Nouvelle fonctionnalité : IA', message: 'Découvrez notre module d\'assistance IA dans vos consultations.', target: 'Premium', status: 'Draft' },
];

export const MOCK_PLANS: PricingPlan[] = [
  { id: 'plan-1', name: 'Starter', price: 490, currency: 'MAD', billing: 'Monthly', features: ['Agenda', 'Dossiers Patients', '1 Utilisateur'], activeClinics: 12, isPopular: false },
  { id: 'plan-2', name: 'Pro', price: 890, currency: 'MAD', billing: 'Monthly', features: ['Tout Starter', 'Facturation', 'SMS', '3 Utilisateurs'], activeClinics: 45, isPopular: true },
  { id: 'plan-3', name: 'Premium', price: 1490, currency: 'MAD', billing: 'Monthly', features: ['Tout Pro', 'IA Assistant', 'Multi-sites', 'Illimité'], activeClinics: 20, isPopular: false },
];

export const MOCK_ONBOARDING: OnboardingLead[] = [
  { id: 'lead-1', clinicName: 'Cabinet Dr. Yassine', doctorName: 'Yassine Filali', status: 'Contract_Sent', startDate: '24 Jan 2024', contact: '+212 600...' },
  { id: 'lead-2', clinicName: 'Smile Agadir', doctorName: 'Meryem Alaoui', status: 'Training', startDate: '20 Jan 2024', contact: '+212 661...' },
  { id: 'lead-3', clinicName: 'Ortho Kids', doctorName: 'Salma Tazi', status: 'Data_Import', startDate: '18 Jan 2024', contact: '+212 662...' },
  { id: 'lead-4', clinicName: 'Dental Space', doctorName: 'Kamal Idrissi', status: 'Live', startDate: '15 Jan 2024', contact: '+212 663...' },
];

export const MOCK_ADDONS: Addon[] = [
  { id: 'add-1', name: 'Pack SMS 5000', description: '5000 SMS transactionnels et rappels', price: 500, activeInstalls: 120, status: 'Available', icon: 'message' },
  { id: 'add-2', name: 'Assistant IA', description: 'Génération de lettres et aide au diagnostic', price: 200, activeInstalls: 45, status: 'Beta', icon: 'wand' },
  { id: 'add-3', name: 'Connecteur WhatsApp', description: 'Notifications via WhatsApp Business', price: 150, activeInstalls: 80, status: 'Available', icon: 'phone' },
];

export const MOCK_FLAGS: FeatureFlag[] = [
  { id: 'flag-1', key: 'new_calendar_v2', name: 'Calendrier V2 (React)', status: 'Active', rolloutPercentage: 20, targetClinics: ['clinic-1', 'clinic-5'] },
  { id: 'flag-2', key: 'ai_diagnosis', name: 'Diagnostic IA', status: 'Inactive', rolloutPercentage: 0 },
];

export const MOCK_INTEGRATIONS: Integration[] = [
  { id: 'int-1', name: 'CNOPS Gateway', type: 'Insurance', status: 'Connected', apiKeyPrefix: 'cnops_live_', lastSync: '10 min ago' },
  { id: 'int-2', name: 'CMI Payment', type: 'Payment', status: 'Connected', apiKeyPrefix: 'cmi_prod_', lastSync: '1 hour ago' },
  { id: 'int-3', name: 'Twilio SMS', type: 'SMS', status: 'Error', apiKeyPrefix: 'sk_live_', lastSync: '2 days ago' },
];

export const MOCK_CONTENT: ContentPage[] = [
  { id: 'page-1', title: 'Conditions Générales d\'Utilisation', lastUpdated: '10 Jan 2024', status: 'Published', slug: '/terms' },
  { id: 'page-2', title: 'Politique de Confidentialité', lastUpdated: '15 Dec 2023', status: 'Published', slug: '/privacy' },
  { id: 'page-3', title: 'Guide de Démarrage', lastUpdated: '20 Jan 2024', status: 'Draft', slug: '/help/start' },
];

export const MOCK_BACKUPS: Backup[] = [
  { id: 'bk-1', clinicName: 'Cabinet Amina', size: '2.4 GB', createdAt: '25 Jan 03:00', type: 'Auto', status: 'Success' },
  { id: 'bk-2', clinicName: 'Ortho Rabat', size: '5.1 GB', createdAt: '25 Jan 03:30', type: 'Auto', status: 'Success' },
  { id: 'bk-3', clinicName: 'Dental Space', size: '1.2 GB', createdAt: '25 Jan 04:00', type: 'Auto', status: 'Failed' },
  { id: 'bk-4', clinicName: 'Cabinet Amina', size: '2.3 GB', createdAt: '24 Jan 14:00', type: 'Manual', status: 'Success' },
];

export const MOCK_JOBS: CronJob[] = [
  { id: 'job-1', name: 'Daily Invoice Generation', lastRun: '25 Jan 00:00', nextRun: '26 Jan 00:00', status: 'Idle', frequency: 'Daily' },
  { id: 'job-2', name: 'SMS Reminders Batch', lastRun: '25 Jan 09:00', nextRun: '25 Jan 12:00', status: 'Running', frequency: 'Every 3h' },
  { id: 'job-3', name: 'Database Cleanup', lastRun: '22 Jan 02:00', nextRun: '29 Jan 02:00', status: 'Idle', frequency: 'Weekly' },
];

export const MOCK_STORAGE: StorageStat[] = [
  { clinicName: 'Centre Radio Casa', used: 450, limit: 1000, files: 12500 },
  { clinicName: 'Cabinet Amina', used: 12, limit: 50, files: 3400 },
  { clinicName: 'Ortho Rabat', used: 25, limit: 50, files: 5600 },
];

export const MOCK_SECURITY_EVENTS: SecurityEvent[] = [
  { id: 'sec-1', ip: '45.22.11.90', location: 'Moscow, RU', threatLevel: 'High', date: '25 Jan 10:12', reason: 'Multiple failed logins' },
  { id: 'sec-2', ip: '12.34.56.78', location: 'Paris, FR', threatLevel: 'Medium', date: '24 Jan 18:45', reason: 'Abnormal API usage' },
];

export const MOCK_TRANSLATIONS: TranslationModule[] = [
  { id: 'mod-1', name: 'Authentication', progress: 100, lastUpdated: '10 Jan', keys: 45 },
  { id: 'mod-2', name: 'Dashboard', progress: 100, lastUpdated: '12 Jan', keys: 120 },
  { id: 'mod-3', name: 'Clinical', progress: 85, lastUpdated: '20 Jan', keys: 350 },
  { id: 'mod-4', name: 'Settings', progress: 90, lastUpdated: '15 Jan', keys: 80 },
];

export const MOCK_TEMPLATES: EmailTemplate[] = [
  { id: 'tmpl-1', name: 'Bienvenue (Activation)', subject: 'Bienvenue sur Medicom', lastModified: '10 Jan 2024', type: 'Email' },
  { id: 'tmpl-2', name: 'Facture Mensuelle', subject: 'Votre facture Medicom', lastModified: '15 Jan 2024', type: 'Email' },
  { id: 'tmpl-3', name: 'Reset Password', subject: 'Réinitialisation mot de passe', lastModified: '20 Dec 2023', type: 'Email' },
  { id: 'tmpl-4', name: 'Alerte SMS', subject: 'Rappel RDV', lastModified: '22 Jan 2024', type: 'SMS' },
];

export const MOCK_MAINTENANCE: MaintenanceTask[] = [
  { id: 'maint-1', name: 'Clear Redis Cache', description: 'Vide le cache applicatif global', lastRun: '2h ago', status: 'Ready' },
  { id: 'maint-2', name: 'Reindex ElasticSearch', description: 'Reconstruit les index de recherche', lastRun: '1d ago', status: 'Ready' },
  { id: 'maint-3', name: 'Rotate Access Logs', description: 'Archive les logs d\'accès anciens', lastRun: '6h ago', status: 'Ready' },
];

export const MOCK_DOMAINS: CustomDomain[] = [
  { id: 'dom-1', clinicName: 'Clinique Atlas', domain: 'atlas.medicom.ma', status: 'Active', dnsStatus: 'Propagated' },
  { id: 'dom-2', clinicName: 'Dr. Tazi', domain: 'tazi.medicom.ma', status: 'Pending', dnsStatus: 'Pending' },
  { id: 'dom-3', clinicName: 'Centre Dentaire', domain: 'cd.medicom.ma', status: 'Error', dnsStatus: 'Propagated' },
];

export const MOCK_CHURN_RISK: ChurnRisk[] = [
  { id: 'risk-1', clinicName: 'Cabinet Dr. Lina', riskScore: 85, mrr: 890, factors: ['Low Login Rate', 'Ticket Sentiment Negative'] },
  { id: 'risk-2', clinicName: 'Ortho Sud', riskScore: 65, mrr: 1490, factors: ['Failed Payment', 'Decreasing Usage'] },
  { id: 'risk-3', clinicName: 'Pediatrie Nord', riskScore: 40, mrr: 490, factors: ['Support Ticket Spike'] },
];

export const MOCK_THEMES: TenantTheme[] = [
  { id: 'theme-1', clinicName: 'Clinique Atlas', primaryColor: '#0f766e', isActive: true },
  { id: 'theme-2', clinicName: 'Dr. Tazi', primaryColor: '#be185d', isActive: true },
  { id: 'theme-3', clinicName: 'Centre Dentaire', primaryColor: '#1d4ed8', isActive: false },
];

export const MOCK_PARTNERS: Partner[] = [
  { id: 'prt-1', name: 'MediSoft Distributor', type: 'Reseller', commissionRate: 20, activeReferrals: 15, totalRevenue: 120000, status: 'Active' },
  { id: 'prt-2', name: 'Dr. Influencer', type: 'Referral', commissionRate: 10, activeReferrals: 5, totalRevenue: 25000, status: 'Active' },
];

export const MOCK_COMPLIANCE: ComplianceRecord[] = [
  { id: 'comp-1', clinicName: 'Cabinet Amina', dpaSigned: true, dataLocation: 'Morocco (Azure)', lastAudit: '10 Jan 2024', status: 'Compliant' },
  { id: 'comp-2', clinicName: 'Ortho Rabat', dpaSigned: true, dataLocation: 'Morocco (Azure)', lastAudit: '15 Dec 2023', status: 'Compliant' },
  { id: 'comp-3', clinicName: 'New Dental', dpaSigned: false, dataLocation: 'France (OVH)', lastAudit: 'Pending', status: 'Non-Compliant' },
];

export const MOCK_API_METRICS: ApiMetric[] = [
  { endpoint: '/api/v1/appointments', requests: 150000, avgLatency: 45, errors: 12 },
  { endpoint: '/api/v1/patients', requests: 85000, avgLatency: 30, errors: 5 },
  { endpoint: '/api/v1/invoices', requests: 25000, avgLatency: 120, errors: 2 },
  { endpoint: '/api/v1/auth', requests: 45000, avgLatency: 25, errors: 50 },
];

export const MOCK_FEATURE_REQUESTS: FeatureRequest[] = [
  { id: 'feat-1', title: 'Mobile App for Patients', description: 'iOS and Android app for booking.', votes: 150, status: 'Planned', tags: ['Mobile', 'Patient'] },
  { id: 'feat-2', title: 'Dark Mode', description: 'Native dark mode support.', votes: 45, status: 'Under Review', tags: ['UI'] },
  { id: 'feat-3', title: 'WhatsApp Integration', description: 'Send reminders via WhatsApp.', votes: 210, status: 'In Progress', tags: ['Communication'] },
];

export const MOCK_SESSIONS: UserSession[] = [
  { id: 'sess-1', userId: 'u1', userName: 'Dr. Amina', clinicName: 'Cabinet Amina', ip: '105.15.22.1', device: 'Chrome / Windows', loginTime: '09:00', lastActive: '2 min ago' },
  { id: 'sess-2', userId: 'u99', userName: 'Sami', clinicName: 'Admin', ip: '41.200.10.5', device: 'Safari / iPhone', loginTime: '10:15', lastActive: 'Active now' },
];

export const MOCK_WEBHOOKS: Webhook[] = [
  { id: 'wh-1', url: 'https://hooks.slack.com/services/T000/B000/XXXX', events: ['clinic.created', 'payment.failed'], status: 'Active', failureRate: 0 },
  { id: 'wh-2', url: 'https://zapier.com/hooks/catch/123456/', events: ['ticket.created'], status: 'Inactive', failureRate: 5 },
];

export const MOCK_FAILED_PAYMENTS: FailedPayment[] = [
  { id: 'pay-1', clinicName: 'Cabinet Dr. Yassine', amount: 890, date: '25 Jan 2024', reason: 'Card Declined', retryCount: 2, status: 'Retrying' },
  { id: 'pay-2', clinicName: 'Sourire Marrakech', amount: 1490, date: '24 Jan 2024', reason: 'Insufficient Funds', retryCount: 3, status: 'Failed' },
];

export const MOCK_APP_ERRORS: AppError[] = [
  { id: 'err-1', message: 'NullReferenceException: Object reference not set', component: 'CalendarView.tsx', occurrences: 54, lastSeen: '10 min ago', status: 'Open' },
  { id: 'err-2', message: 'TimeoutError: API request took too long', component: 'Billing.tsx', occurrences: 12, lastSeen: '1 hour ago', status: 'Resolved' },
];

export const MOCK_AI_CONFIGS: AiModelConfig[] = [
  { id: 'ai-1', name: 'GPT-4 Turbo', provider: 'OpenAI', costPer1kTokens: 0.01, status: 'Active', usage24h: 1500000 },
  { id: 'ai-2', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', costPer1kTokens: 0.003, status: 'Active', usage24h: 800000 },
  { id: 'ai-3', name: 'Gemini Pro 1.5', provider: 'Google', costPer1kTokens: 0.002, status: 'Deprecated', usage24h: 50000 },
];

export const MOCK_GATEWAYS: GatewayStatus[] = [
  { id: 'gw-1', name: 'Transactional SMS', type: 'SMS', provider: 'Twilio', status: 'Operational', deliveryRate: 99.8, balance: 4500 },
  { id: 'gw-2', name: 'Marketing Email', type: 'Email', provider: 'SendGrid', status: 'Degraded', deliveryRate: 85.0, balance: 0 },
  { id: 'gw-3', name: 'System Alerts', type: 'Email', provider: 'AWS SES', status: 'Operational', deliveryRate: 99.9 },
];

export const MOCK_DEPLOYMENTS: Deployment[] = [
  { id: 'dep-1', version: 'v2.4.0', date: '25 Jan 10:00', status: 'Success', author: 'Sami', commitHash: 'a1b2c3d' },
  { id: 'dep-2', version: 'v2.3.5', date: '20 Jan 14:30', status: 'Success', author: 'Sami', commitHash: 'e5f6g7h' },
  { id: 'dep-3', version: 'v2.3.4', date: '18 Jan 09:15', status: 'Failed', author: 'Bot', commitHash: 'i8j9k0l' },
];

export const MOCK_REGIONS: Region[] = [
  { id: 'reg-1', name: 'Casablanca (Azure)', code: 'ma-casa-1', activeTenants: 150, status: 'Healthy' },
  { id: 'reg-2', name: 'Paris (AWS)', code: 'eu-west-3', activeTenants: 45, status: 'Healthy' },
  { id: 'reg-3', name: 'Backup (OVH)', code: 'eu-backup-1', activeTenants: 0, status: 'Maintenance' },
];

export const MOCK_CACHE_METRICS: CacheMetric[] = [
  { name: 'Redis Primary', hitRate: 94.5, memoryUsed: 450, keys: 125000, uptime: '14d 2h' },
  { name: 'CDN Cache', hitRate: 88.2, memoryUsed: 1200, keys: 45000, uptime: '30d 5h' },
];

export const MOCK_QUEUES: JobQueue[] = [
  { id: 'q-1', name: 'Emails (Transactional)', active: 12, failed: 0, delayed: 0, status: 'Healthy' },
  { id: 'q-2', name: 'PDF Generation', active: 45, failed: 2, delayed: 5, status: 'Congested' },
  { id: 'q-3', name: 'Data Import', active: 5, failed: 1, delayed: 0, status: 'Healthy' },
];

export const MOCK_FIREWALL: FirewallRule[] = [
  { id: 'fw-1', type: 'Country', value: 'CN', action: 'Block', hits: 1540, status: 'Active' },
  { id: 'fw-2', type: 'IP', value: '185.12.44.1', action: 'Block', hits: 230, status: 'Active' },
  { id: 'fw-3', type: 'RateLimit', value: '/api/auth/login', action: 'Challenge', hits: 50, status: 'Active' },
];

export const MOCK_SLOW_QUERIES: SlowQuery[] = [
  { id: 'sq-1', query: 'SELECT * FROM appointments WHERE date > ...', duration: 1250, timestamp: '10:45:00', caller: 'Dashboard' },
  { id: 'sq-2', query: 'UPDATE patients SET last_visit = ...', duration: 800, timestamp: '10:42:12', caller: 'PatientUpdate' },
];

export const MOCK_LICENSES: LicenseDetail[] = [
  { id: 'lic-1', clinicName: 'Cabinet Amina', plan: 'Premium', seatsUsed: 4, seatsLimit: 5, expiresAt: '2025-01-01', status: 'Valid' },
  { id: 'lic-2', clinicName: 'Ortho Rabat', plan: 'Pro', seatsUsed: 3, seatsLimit: 3, expiresAt: '2024-06-01', status: 'Valid' },
  { id: 'lic-3', clinicName: 'Dr. Tazi', plan: 'Starter', seatsUsed: 2, seatsLimit: 1, expiresAt: '2024-02-01', status: 'OverLimit' },
];

export const MOCK_AUDIT_REPORTS: AuditReportDoc[] = [
  { id: 'rep-1', name: 'Access Logs - Jan 2024', type: 'Access', generatedAt: '25 Jan 10:00', size: '4.5 MB', status: 'Ready' },
  { id: 'rep-2', name: 'Financial Audit 2023', type: 'Financial', generatedAt: '20 Jan 14:00', size: '12 MB', status: 'Ready' },
  { id: 'rep-3', name: 'Data Changes (Last 24h)', type: 'Data', generatedAt: 'Pending...', size: '-', status: 'Generating' },
];

// --- NEW MOCK DATA ---

export const MOCK_TENANTS_DETAILED: TenantDetailed[] = [
  { id: 't1', name: 'Cabinet Dentaire Amina', contactName: 'Dr. Amina El Amrani', email: 'amina@cabinet.ma', plan: 'Premium', status: 'Active', usersCount: 4, storageUsed: '12GB', joinedAt: '2023-01-15', mrr: 1490, region: 'Casablanca' },
  { id: 't2', name: 'Centre Ortho Rabat', contactName: 'Dr. Karim Tazi', email: 'karim@ortho.ma', plan: 'Pro', status: 'Active', usersCount: 3, storageUsed: '5GB', joinedAt: '2023-05-20', mrr: 890, region: 'Rabat' },
  { id: 't3', name: 'Sourire Marrakech', contactName: 'Dr. Leila Benjelloun', email: 'leila@sourire.ma', plan: 'Starter', status: 'Pending', usersCount: 1, storageUsed: '0.5GB', joinedAt: '2024-01-10', mrr: 490, region: 'Marrakech' },
];
