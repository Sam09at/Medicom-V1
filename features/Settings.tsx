import React, { useState, useEffect } from 'react';
import {
  IconMessage,
  IconCheck,
  IconUsers,
  IconUserPlus,
  IconPlus,
  IconMoreHorizontal,
  IconShield,
  IconDollarSign,
  IconGlobe,
  IconCode,
  IconEdit,
  IconTrash,
  IconClipboard,
  IconHome,
  IconX,
  IconClock,
  IconSettings,
} from '../components/Icons';
import { MOCK_SERVICES } from '../constants';
import { MedicalService } from '../types';
import { supabase, getCurrentTenantId } from '../lib/supabase';
import { useTranslation } from 'react-i18next';
import { applyLanguageDirection } from '../lib/i18n';
import { useMedicomStore } from '../store';

const MOCK_STAFF = [
  {
    id: 1,
    name: 'Dr. Amina El Amrani',
    role: 'Propriétaire',
    email: 'amina@cabinet.ma',
    status: 'Actif',
    lastActive: 'Il y a 5 min',
  },
  {
    id: 2,
    name: 'Sarah Benani',
    role: 'Assistante',
    email: 'sarah@cabinet.ma',
    status: 'Actif',
    lastActive: 'Il y a 1h',
  },
  {
    id: 3,
    name: 'Dr. Karim Tazi',
    role: 'Remplaçant',
    email: 'karim@gmail.com',
    status: 'Inactif',
    lastActive: 'Il y a 2 jours',
  },
];

export const Settings: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState('general');
  const [currentLang, setCurrentLang] = useState(i18n.language || 'fr');

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    setCurrentLang(lang);
    applyLanguageDirection(lang);
  };

  // General State
  const [clinicInfo, setClinicInfo] = useState({
    name: 'Cabinet Dentaire Dr. Amina',
    address: '123 Bd Zerktouni, Casablanca',
    phone: '+212 522 123 456',
    email: 'contact@cabinet-amina.ma',
    ice: '001122334455667',
    website: 'www.cabinet-amina.ma',
  });

  // Notification States
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [reminderTime, setReminderTime] = useState('24');
  const [messageTemplate, setMessageTemplate] = useState(
    'Bonjour {patient}, ceci est un rappel pour votre rendez-vous chez {cabinet} le {date} à {heure}. Répondez STOP pour ne plus recevoir de SMS.'
  );

  // Services State
  const [services, setServices] = useState<MedicalService[]>(MOCK_SERVICES);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<MedicalService | null>(null);
  const [newService, setNewService] = useState({
    name: '',
    code: '',
    price: 0,
    durationMinutes: 30,
  });

  // Users State
  const [users, setUsers] = useState(MOCK_STAFF);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'Assistante' });

  // Widget State
  const [widgetColor, setWidgetColor] = useState('#2563eb');
  const [widgetTitle, setWidgetTitle] = useState('Prendre rendez-vous en ligne');
  const [copied, setCopied] = useState(false);

  // Schedule State
  const [schedule, setSchedule] = useState([
    { day: 'Lundi', open: '09:00', close: '18:00', active: true },
    { day: 'Mardi', open: '09:00', close: '18:00', active: true },
    { day: 'Mercredi', open: '09:00', close: '18:00', active: true },
    { day: 'Jeudi', open: '09:00', close: '18:00', active: true },
    { day: 'Vendredi', open: '09:00', close: '17:00', active: true },
    { day: 'Samedi', open: '09:00', close: '13:00', active: true },
    { day: 'Dimanche', open: '00:00', close: '00:00', active: false },
  ]);

  const [tenantId, setTenantId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Store & Doctor Preferences
  const currentUser = useMedicomStore((state) => state.currentUser);
  const setDoctorPreferencesStore = useMedicomStore((state) => state.setDoctorPreferences);
  const [autoStatusConsultation, setAutoStatusConsultation] = useState(false);
  const [autoRemoveConsultation, setAutoRemoveConsultation] = useState(false);
  const [defaultCalendarView, setDefaultCalendarView] = useState<'day' | 'week' | 'month'>('week');
  const [defaultSlotDuration, setDefaultSlotDuration] = useState<number>(30);
  const [noteTemplates, setNoteTemplates] = useState<
    { id: string; title: string; content: string }[]
  >([]);
  const [favoriteActs, setFavoriteActs] = useState<string[]>([]);

  // Load data from Supabase
  useEffect(() => {
    const loadSettings = async () => {
      if (!supabase) return;
      try {
        const tid = await getCurrentTenantId();
        setTenantId(tid);
        if (!tid) return;

        // Load tenant info
        const { data: tenant } = await supabase
          .from('tenants')
          .select('name, settings_json, email, website, ice')
          .eq('id', tid)
          .single();

        if (tenant) {
          setClinicInfo((prev) => ({
            ...prev,
            name: tenant.name || prev.name,
            email: tenant.email || prev.email,
            website: tenant.website || prev.website,
            ice: tenant.ice || prev.ice,
            ...(tenant.settings_json?.clinic || {}),
          }));
          if (tenant.settings_json?.schedule) {
            setSchedule(tenant.settings_json.schedule);
          }
          if (tenant.settings_json?.notifications) {
            const n = tenant.settings_json.notifications;
            setSmsEnabled(n.smsEnabled ?? true);
            setReminderTime(n.reminderTime ?? '24');
            setMessageTemplate(n.messageTemplate ?? messageTemplate);
          }
          if (currentUser?.role === 'doctor' && tenant.settings_json?.doctors?.[currentUser.id]) {
            const docPrefs = tenant.settings_json.doctors[currentUser.id];
            setAutoStatusConsultation(docPrefs.autoStatusConsultation ?? false);
            setAutoRemoveConsultation(docPrefs.autoRemoveConsultation ?? false);
            setDefaultCalendarView(docPrefs.defaultCalendarView ?? 'week');
            setDefaultSlotDuration(docPrefs.defaultSlotDuration ?? 30);
            setNoteTemplates(docPrefs.favorites?.noteTemplates || []);
            setFavoriteActs(docPrefs.favorites?.acts || []);
            setDoctorPreferencesStore(docPrefs);
          }
        }

        // Load medical services
        const { data: svcData } = await supabase
          .from('medical_services')
          .select('*')
          .eq('tenant_id', tid)
          .eq('is_active', true)
          .order('name');

        if (svcData && svcData.length > 0) {
          setServices(
            svcData.map((s: any) => ({
              id: s.id,
              tenantId: s.tenant_id,
              name: s.name,
              code: s.code,
              category: s.category,
              durationMinutes: s.duration_minutes,
              price: Number(s.price),
              tvaRate: Number(s.tva_rate),
              isActive: s.is_active,
            }))
          );
        }

        // Load staff/users
        const { data: staffData } = await supabase
          .from('users')
          .select('id, first_name, last_name, email, role, updated_at')
          .eq('tenant_id', tid);

        if (staffData && staffData.length > 0) {
          setUsers(
            staffData.map((u: any) => ({
              id: u.id,
              name: `${u.first_name || ''} ${u.last_name || ''}`.trim(),
              role:
                u.role === 'clinic_admin'
                  ? 'Propriétaire'
                  : u.role === 'doctor'
                    ? 'Médecin'
                    : 'Assistante',
              email: u.email,
              status: 'Actif',
              lastActive: u.updated_at ? new Date(u.updated_at).toLocaleDateString('fr-FR') : 'N/A',
            }))
          );
        }
      } catch (err) {
        console.warn('[Settings] Using fallback data:', err);
      }
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (supabase && tenantId) {
        // Load current tenant first to merge settings_json
        const { data: currentTenant } = await supabase
          .from('tenants')
          .select('settings_json')
          .eq('id', tenantId)
          .single();

        const currentSettings = currentTenant?.settings_json || {};
        const doctorsSettings = currentSettings.doctors || {};

        if (currentUser?.role === 'doctor') {
          doctorsSettings[currentUser.id] = {
            ...(doctorsSettings[currentUser.id] || {}),
            autoStatusConsultation,
            autoRemoveConsultation,
            defaultCalendarView,
            defaultSlotDuration,
            favorites: {
              acts: favoriteActs,
              noteTemplates,
            },
          };
        }

        // Save clinic info to tenants table
        await supabase
          .from('tenants')
          .update({
            name: clinicInfo.name,
            email: clinicInfo.email,
            website: clinicInfo.website,
            ice: clinicInfo.ice,
            settings_json: {
              ...currentSettings,
              clinic: { address: clinicInfo.address, phone: clinicInfo.phone },
              schedule,
              notifications: { smsEnabled, reminderTime, messageTemplate },
              doctors: doctorsSettings,
            },
          })
          .eq('id', tenantId);

        // Update local store as well
        if (currentUser?.role === 'doctor') {
          setDoctorPreferencesStore(doctorsSettings[currentUser.id]);
        }
      }
    } catch (err) {
      console.error('[Settings] Save failed:', err);
    } finally {
      setSaving(false);
    }

    // Visual feedback
    const btn = document.getElementById('save-btn');
    if (btn) {
      const originalText = btn.innerText;
      btn.innerText = 'Sauvegardé !';
      btn.classList.add('bg-green-600', 'hover:bg-green-700');
      btn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
      setTimeout(() => {
        btn.innerText = originalText;
        btn.classList.remove('bg-green-600', 'hover:bg-green-700');
        btn.classList.add('bg-blue-600', 'hover:bg-blue-700');
      }, 2000);
    }
  };

  const handleInviteUser = (e: React.FormEvent) => {
    e.preventDefault();
    const user = {
      id: Date.now(),
      name: newUser.name,
      role: newUser.role,
      email: newUser.email,
      status: 'Actif',
      lastActive: 'Jamais',
    };
    setUsers([...users, user]);
    setIsUserModalOpen(false);
    setNewUser({ name: '', email: '', role: 'Assistante' });
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingService) {
      setServices(
        services.map((s) =>
          s.id === editingService.id ? { ...editingService, ...newService, isActive: true } : s
        )
      );
      if (supabase && tenantId) {
        await supabase
          .from('medical_services')
          .update({
            name: newService.name,
            code: newService.code,
            price: newService.price,
            duration_minutes: newService.durationMinutes,
          })
          .eq('id', editingService.id);
      }
    } else {
      const service: MedicalService = {
        id: `s-${Date.now()}`,
        ...newService,
        isActive: true,
      };
      setServices([...services, service]);
      if (supabase && tenantId) {
        await supabase.from('medical_services').insert({
          tenant_id: tenantId,
          name: newService.name,
          code: newService.code,
          price: newService.price,
          duration_minutes: newService.durationMinutes,
          is_active: true,
        });
      }
    }
    setIsServiceModalOpen(false);
    setEditingService(null);
    setNewService({ name: '', code: '', price: 0, durationMinutes: 30 });
  };

  const openServiceModal = (service?: MedicalService) => {
    if (service) {
      setEditingService(service);
      setNewService({
        name: service.name,
        code: service.code || '',
        price: service.price,
        durationMinutes: service.durationMinutes,
      });
    } else {
      setEditingService(null);
      setNewService({ name: '', code: '', price: 0, durationMinutes: 30 });
    }
    setIsServiceModalOpen(true);
  };

  const deleteService = async (id: string) => {
    if (confirm('Supprimer cet acte ?')) {
      setServices(services.filter((s) => s.id !== id));
      if (supabase) {
        await supabase.from('medical_services').update({ is_active: false }).eq('id', id);
      }
    }
  };

  const widgetCode = `<iframe src="https://medicom.ma/widget/cabinet-amina" width="100%" height="600" frameborder="0"></iframe>`;

  const copyWidgetCode = () => {
    navigator.clipboard.writeText(widgetCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const updateSchedule = (index: number, field: string, value: string | boolean) => {
    const newSchedule = [...schedule];
    (newSchedule[index] as any)[field] = value;
    setSchedule(newSchedule);
  };

  return (
    <div className="w-full mx-auto space-y-6 font-sans relative">
      <div className="mb-2">
        <h2 className="text-[2rem] font-bold tracking-tight leading-tight text-slate-900">
          Paramètres du Cabinet
        </h2>
        <p className="text-[1rem] font-medium text-slate-500 mt-1">
          Gérez la configuration globale, les actes et l'équipe.
        </p>
      </div>{' '}
      {/* Service Modal */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setIsServiceModalOpen(false)}
          ></div>
          <div className="bg-white rounded-[8px] shadow-xl w-full max-w-sm relative z-10 p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900">
                {editingService ? "Modifier l'acte" : 'Nouvel Acte'}
              </h3>
              <button onClick={() => setIsServiceModalOpen(false)}>
                <IconX className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleSaveService} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Libellé</label>
                <input
                  type="text"
                  required
                  className="w-full border border-slate-300 rounded-[8px] p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  value={newService.name}
                  onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Code</label>
                  <input
                    type="text"
                    required
                    className="w-full border border-slate-300 rounded-[8px] p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    value={newService.code}
                    onChange={(e) => setNewService({ ...newService, code: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Prix (MAD)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    className="w-full border border-slate-300 rounded-[8px] p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    value={newService.price}
                    onChange={(e) =>
                      setNewService({ ...newService, price: parseInt(e.target.value) })
                    }
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Durée (min)</label>
                <select
                  className="w-full border border-slate-300 rounded-[8px] p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  value={newService.durationMinutes}
                  onChange={(e) =>
                    setNewService({ ...newService, durationMinutes: parseInt(e.target.value) })
                  }
                >
                  <option value="15">15 min</option>
                  <option value="30">30 min</option>
                  <option value="45">45 min</option>
                  <option value="60">1h 00</option>
                  <option value="90">1h 30</option>
                </select>
              </div>
              <button type="submit" className="btn-primary w-full">
                Enregistrer
              </button>
            </form>
          </div>
        </div>
      )}
      {/* User Invite Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setIsUserModalOpen(false)}
          ></div>
          <div className="bg-white rounded-[8px] shadow-xl w-full max-w-sm relative z-10 p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900">Inviter un membre</h3>
              <button onClick={() => setIsUserModalOpen(false)}>
                <IconX className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleInviteUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nom complet</label>
                <input
                  type="text"
                  required
                  className="w-full border border-slate-300 rounded-[8px] p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Sarah Benani"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  className="w-full border border-slate-300 rounded-[8px] p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="email@cabinet.ma"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Rôle</label>
                <select
                  className="w-full border border-slate-300 rounded-[8px] p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                >
                  <option value="Assistante">Assistant(e)</option>
                  <option value="Secrétaire">Secrétaire</option>
                  <option value="Remplaçant">Dentiste Remplaçant</option>
                </select>
              </div>
              <button type="submit" className="btn-primary w-full">
                Envoyer l'invitation
              </button>
            </form>
          </div>
        </div>
      )}
      <div className="bg-white rounded-[2.5rem] border border-slate-100/50 overflow-hidden min-h-[700px] flex shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        {/* Settings Sidebar */}
        <div className="w-72 border-r border-slate-100/50 bg-slate-50/30 p-6">
          <nav className="space-y-1.5 flex flex-col">
            <button
              onClick={() => setActiveTab('general')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-[0.875rem] font-bold rounded-[8px] transition-all ${activeTab === 'general' ? 'bg-white text-blue-600 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] border border-slate-100/80' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/50 border border-transparent'}`}
            >
              <IconHome className="w-5 h-5" /> Général
            </button>
            <button
              onClick={() => setActiveTab('services')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-[0.875rem] font-bold rounded-[8px] transition-all ${activeTab === 'services' ? 'bg-white text-blue-600 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] border border-slate-100/80' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/50 border border-transparent'}`}
            >
              <IconDollarSign className="w-5 h-5" /> Services & Tarifs
            </button>
            <button
              onClick={() => setActiveTab('schedule')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-[0.875rem] font-bold rounded-[8px] transition-all ${activeTab === 'schedule' ? 'bg-white text-blue-600 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] border border-slate-100/80' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/50 border border-transparent'}`}
            >
              <IconClock className="w-5 h-5" /> Horaires
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-[0.875rem] font-bold rounded-[8px] transition-all ${activeTab === 'notifications' ? 'bg-white text-blue-600 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] border border-slate-100/80' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/50 border border-transparent'}`}
            >
              <IconMessage className="w-5 h-5" /> Notifications & SMS
            </button>
            <button
              onClick={() => setActiveTab('widget')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-[0.875rem] font-bold rounded-[8px] transition-all ${activeTab === 'widget' ? 'bg-white text-blue-600 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] border border-slate-100/80' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/50 border border-transparent'}`}
            >
              <IconGlobe className="w-5 h-5" /> Widget Réservation
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-[0.875rem] font-bold rounded-[8px] transition-all ${activeTab === 'users' ? 'bg-white text-blue-600 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] border border-slate-100/80' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/50 border border-transparent'}`}
            >
              <IconUsers className="w-5 h-5" /> Équipe & Accès
            </button>
            <button
              onClick={() => setActiveTab('language')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-[0.875rem] font-bold rounded-[8px] transition-all ${activeTab === 'language' ? 'bg-white text-blue-600 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] border border-slate-100/80' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/50 border border-transparent'}`}
            >
              <IconGlobe className="w-5 h-5" /> Langue
            </button>
            {currentUser?.role === 'doctor' && (
              <button
                onClick={() => setActiveTab('doctor_prefs')}
                className={`w-full flex items-center gap-3 px-4 py-3 text-[0.875rem] font-bold rounded-[8px] transition-all ${activeTab === 'doctor_prefs' ? 'bg-white text-blue-600 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] border border-slate-100/80' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/50 border border-transparent'}`}
              >
                <IconSettings className="w-5 h-5" /> Préférences
              </button>
            )}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 p-10 bg-white overflow-y-auto">
          {/* --- GENERAL TAB --- */}
          {activeTab === 'general' && (
            <div className="space-y-10 max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div>
                <h3 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[8px] bg-slate-50 flex items-center justify-center text-slate-600">
                    <IconHome className="w-5 h-5" />
                  </div>
                  Profil du Cabinet
                </h3>
                <p className="mt-2 text-[0.875rem] font-medium text-slate-500 ml-13">
                  Ces informations apparaissent sur vos ordonnances et factures.
                </p>
              </div>

              <div className="bg-slate-50/50 p-6 sm:p-8 rounded-3xl border border-transparent shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] space-y-8">
                {/* Logo Section */}
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 bg-white rounded-[8px] border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]">
                    Logo
                  </div>
                  <div>
                    <button className="text-[0.875rem] font-bold text-blue-600 hover:text-blue-700 transition-colors">
                      Changer le logo
                    </button>
                    <p className="text-[0.75rem] text-slate-400 font-medium mt-1 uppercase tracking-widest">
                      JPG, PNG max 2MB.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-6">
                  <div className="sm:col-span-4 space-y-2">
                    <label className="block text-[0.75rem] font-bold text-slate-400 uppercase tracking-widest">
                      Nom du Cabinet
                    </label>
                    <input
                      type="text"
                      value={clinicInfo.name}
                      onChange={(e) => setClinicInfo({ ...clinicInfo, name: e.target.value })}
                      className="w-full px-5 py-3.5 bg-white border border-slate-100/80 rounded-[8px] text-[0.875rem] font-bold text-slate-900 transition-all outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/20 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]"
                    />
                  </div>

                  <div className="sm:col-span-6 space-y-2">
                    <label className="block text-[0.75rem] font-bold text-slate-400 uppercase tracking-widest">
                      Adresse Complète
                    </label>
                    <textarea
                      rows={2}
                      value={clinicInfo.address}
                      onChange={(e) => setClinicInfo({ ...clinicInfo, address: e.target.value })}
                      className="w-full px-5 py-3.5 bg-white border border-slate-100/80 rounded-[8px] text-[0.875rem] font-bold text-slate-900 transition-all outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/20 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] resize-none"
                    />
                  </div>

                  <div className="sm:col-span-3 space-y-2">
                    <label className="block text-[0.75rem] font-bold text-slate-400 uppercase tracking-widest">
                      Téléphone
                    </label>
                    <input
                      type="text"
                      value={clinicInfo.phone}
                      onChange={(e) => setClinicInfo({ ...clinicInfo, phone: e.target.value })}
                      className="w-full px-5 py-3.5 bg-white border border-slate-100/80 rounded-[8px] text-[0.875rem] font-bold text-slate-900 transition-all outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/20 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]"
                    />
                  </div>

                  <div className="sm:col-span-3 space-y-2">
                    <label className="block text-[0.75rem] font-bold text-slate-400 uppercase tracking-widest">
                      Email Contact
                    </label>
                    <input
                      type="email"
                      value={clinicInfo.email}
                      onChange={(e) => setClinicInfo({ ...clinicInfo, email: e.target.value })}
                      className="w-full px-5 py-3.5 bg-white border border-slate-100/80 rounded-[8px] text-[0.875rem] font-bold text-slate-900 transition-all outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/20 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]"
                    />
                  </div>

                  <div className="sm:col-span-3 space-y-2">
                    <label className="block text-[0.75rem] font-bold text-slate-400 uppercase tracking-widest">
                      ICE / Tax ID
                    </label>
                    <input
                      type="text"
                      value={clinicInfo.ice}
                      onChange={(e) => setClinicInfo({ ...clinicInfo, ice: e.target.value })}
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100/80 rounded-[8px] text-[0.875rem] font-bold text-slate-900 transition-all outline-none shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]"
                    />
                  </div>

                  <div className="sm:col-span-3 space-y-2">
                    <label className="block text-[0.75rem] font-bold text-slate-400 uppercase tracking-widest">
                      Site Web
                    </label>
                    <input
                      type="text"
                      value={clinicInfo.website}
                      onChange={(e) => setClinicInfo({ ...clinicInfo, website: e.target.value })}
                      className="w-full px-5 py-3.5 bg-white border border-slate-100/80 rounded-[8px] text-[0.875rem] font-bold text-slate-900 transition-all outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/20 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-6">
                <button
                  id="save-btn"
                  type="button"
                  onClick={handleSave}
                  className="btn-primary py-3.5 px-6 rounded-[8px] text-[0.875rem]"
                >
                  Enregistrer les modifications
                </button>
              </div>
            </div>
          )}

          {/* --- NOTIFICATIONS TAB --- */}
          {activeTab === 'notifications' && (
            <div className="space-y-10 max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div>
                <h3 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[8px] bg-slate-50 flex items-center justify-center text-slate-600">
                    <IconMessage className="w-5 h-5" />
                  </div>
                  Configuration SMS
                </h3>
                <p className="mt-2 text-[0.875rem] font-medium text-slate-500 ml-13">
                  Gérez les rappels automatiques envoyés à vos patients.
                </p>
              </div>

              <div className="bg-slate-50/50 p-6 sm:p-8 rounded-3xl border border-transparent shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[0.875rem] font-bold text-slate-900">
                      Rappels de Rendez-vous
                    </div>
                    <div className="text-[0.8125rem] text-slate-500 font-medium mt-1">
                      Envoyer automatiquement un SMS avant chaque consultation.
                    </div>
                  </div>
                  <button
                    onClick={() => setSmsEnabled(!smsEnabled)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${smsEnabled ? 'bg-blue-600 shadow-md shadow-blue-200/50' : 'bg-slate-200'}`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${smsEnabled ? 'translate-x-5' : 'translate-x-0'}`}
                    />
                  </button>
                </div>

                {smsEnabled && (
                  <div className="space-y-6 pt-6 border-t border-slate-200/50">
                    <div className="space-y-2">
                      <label className="block text-[0.75rem] font-bold text-slate-400 uppercase tracking-widest">
                        Délai d'envoi
                      </label>
                      <select
                        value={reminderTime}
                        onChange={(e) => setReminderTime(e.target.value)}
                        className="w-full px-5 py-3.5 bg-white border border-slate-100/80 rounded-[8px] text-[0.875rem] font-bold text-slate-900 transition-all outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/20 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] appearance-none"
                      >
                        <option value="2">2 heures avant</option>
                        <option value="24">24 heures avant (recommandé)</option>
                        <option value="48">48 heures avant</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[0.75rem] font-bold text-slate-400 uppercase tracking-widest">
                        Modèle de message
                      </label>
                      <div className="mt-1">
                        <textarea
                          rows={4}
                          value={messageTemplate}
                          onChange={(e) => setMessageTemplate(e.target.value)}
                          className="w-full px-5 py-3.5 bg-white border border-slate-100/80 rounded-[8px] text-[0.875rem] font-medium text-slate-700 transition-all outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/20 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] resize-none leading-relaxed"
                        />
                      </div>
                      <p className="mt-2 text-[0.75rem] font-medium text-slate-500">
                        Variables disponibles : {`{patient}, {cabinet}, {date}, {heure}`}.
                      </p>
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-blue-50/50 text-blue-700 rounded-[8px] text-[0.8125rem] font-medium border border-blue-100/50">
                      <IconCheck className="w-5 h-5 shrink-0 text-blue-500" />
                      <p>
                        Les patients ont la possibilité de se désinscrire (opt-out) à tout moment en
                        répondant STOP, conformément à la réglementation.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-6">
                <button
                  type="button"
                  onClick={handleSave}
                  className="btn-primary py-3.5 px-6 rounded-[8px] text-[0.875rem]"
                >
                  Enregistrer les paramètres SMS
                </button>
              </div>
            </div>
          )}

          {/* --- STAFF TAB --- */}
          {activeTab === 'users' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[8px] bg-slate-50 flex items-center justify-center text-slate-600">
                      <IconUsers className="w-5 h-5" />
                    </div>
                    Équipe & Accès
                  </h3>
                  <p className="mt-2 text-[0.875rem] font-medium text-slate-500 ml-13">
                    Gérez les membres de votre cabinet et leurs permissions.
                  </p>
                </div>
                <button
                  onClick={() => setIsUserModalOpen(true)}
                  className="btn-primary py-3 px-5 rounded-[8px] flex items-center gap-2 text-[0.875rem]"
                >
                  <IconUserPlus className="w-5 h-5" /> Inviter un membre
                </button>
              </div>

              <div className="bg-white border border-slate-100/50 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <table className="min-w-full">
                  <thead className="bg-slate-50/50 border-b border-slate-100/50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-4 text-left text-[0.65rem] font-bold text-slate-400 uppercase tracking-[0.1em]"
                      >
                        Utilisateur
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-4 text-left text-[0.65rem] font-bold text-slate-400 uppercase tracking-[0.1em]"
                      >
                        Rôle
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-4 text-left text-[0.65rem] font-bold text-slate-400 uppercase tracking-[0.1em]"
                      >
                        Statut
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-4 text-left text-[0.65rem] font-bold text-slate-400 uppercase tracking-[0.1em]"
                      >
                        Dernière activité
                      </th>
                      <th scope="col" className="relative px-6 py-4">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-50">
                    {users.map((member) => (
                      <tr key={member.id} className="hover:bg-slate-50/30 transition-colors group">
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-slate-100/80 border border-slate-200/50 flex items-center justify-center text-[0.875rem] font-bold text-slate-500 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]">
                              {member.name.substring(0, 1)}
                            </div>
                            <div className="ml-4">
                              <div className="text-[0.875rem] font-bold text-slate-900">
                                {member.name}
                              </div>
                              <div className="text-[0.75rem] font-medium text-slate-500 mt-0.5">
                                {member.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.75rem] font-bold ${
                              member.role === 'Propriétaire'
                                ? 'bg-purple-50 text-purple-600 border border-purple-100/50'
                                : member.role === 'Assistante'
                                  ? 'bg-blue-50 text-blue-600 border border-blue-100/50'
                                  : 'bg-slate-50 text-slate-600 border border-slate-100/50'
                            }`}
                          >
                            {member.role === 'Propriétaire' && (
                              <IconShield className="w-3.5 h-3.5" />
                            )}
                            {member.role}
                          </span>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.75rem] font-bold ${
                              member.status === 'Actif'
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100/50'
                                : 'bg-slate-50 text-slate-500 border border-slate-100/50'
                            }`}
                          >
                            {member.status}
                          </span>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap text-[0.875rem] font-medium text-slate-500">
                          {member.lastActive}
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap text-right">
                          <button className="p-2 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-[8px] transition-all opacity-0 group-hover:opacity-100">
                            <IconMoreHorizontal className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* --- SERVICES TAB --- */}
          {activeTab === 'services' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[8px] bg-slate-50 flex items-center justify-center text-slate-600">
                      <IconDollarSign className="w-5 h-5" />
                    </div>
                    Catalogue des Actes
                  </h3>
                  <p className="mt-2 text-[0.875rem] font-medium text-slate-500 ml-13">
                    Configurez les tarifs et codes de vos prestations.
                  </p>
                </div>
                <button
                  onClick={() => openServiceModal()}
                  className="btn-primary py-3 px-5 rounded-[8px] flex items-center gap-2 text-[0.875rem]"
                >
                  <IconPlus className="w-5 h-5" /> Ajouter un acte
                </button>
              </div>

              <div className="bg-white border border-slate-100/50 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <table className="min-w-full">
                  <thead className="bg-slate-50/50 border-b border-slate-100/50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-4 text-left text-[0.65rem] font-bold text-slate-400 uppercase tracking-[0.1em]"
                      >
                        Libellé
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-4 text-left text-[0.65rem] font-bold text-slate-400 uppercase tracking-[0.1em]"
                      >
                        Code
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-4 text-left text-[0.65rem] font-bold text-slate-400 uppercase tracking-[0.1em]"
                      >
                        Durée (min)
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-4 text-left text-[0.65rem] font-bold text-slate-400 uppercase tracking-[0.1em]"
                      >
                        Tarif (MAD)
                      </th>
                      <th scope="col" className="relative px-6 py-4">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-50/80">
                    {services.map((service) => (
                      <tr key={service.id} className="hover:bg-slate-50/30 transition-colors group">
                        <td className="px-6 py-5 whitespace-nowrap text-[0.875rem] font-bold text-slate-900">
                          {service.name}
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap text-[0.875rem] font-mono text-slate-500 bg-slate-50/50 px-2 py-1 rounded inline-block mt-3.5 ml-6">
                          {service.code}
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap text-[0.875rem] font-medium text-slate-500">
                          {service.durationMinutes}
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap text-[0.875rem] font-extrabold text-blue-600">
                          {Number(service.price).toLocaleString()}{' '}
                          <span className="text-[0.65rem] text-slate-400 font-bold uppercase tracking-wider ml-0.5">
                            MAD
                          </span>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap text-right">
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => openServiceModal(service)}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-[8px] transition-all"
                            >
                              <IconEdit className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => deleteService(service.id)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-[8px] transition-all"
                            >
                              <IconTrash className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* --- SCHEDULE TAB --- */}
          {activeTab === 'schedule' && (
            <div className="space-y-10 max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div>
                <h3 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[8px] bg-slate-50 flex items-center justify-center text-slate-600">
                    <IconClock className="w-5 h-5" />
                  </div>
                  Horaires d'ouverture
                </h3>
                <p className="mt-2 text-[0.875rem] font-medium text-slate-500 ml-13">
                  Définissez vos plages de disponibilité.
                </p>
              </div>

              <div className="bg-white border border-slate-100/50 rounded-[2rem] overflow-hidden divide-y divide-slate-50 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                {schedule.map((day, idx) => (
                  <div
                    key={day.day}
                    className={`flex items-center justify-between p-5 transition-colors ${day.active ? '' : 'bg-slate-50/50'}`}
                  >
                    <div className="flex items-center gap-4 w-36">
                      <input
                        type="checkbox"
                        checked={day.active}
                        onChange={(e) => updateSchedule(idx, 'active', e.target.checked)}
                        className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span
                        className={`text-[0.875rem] font-bold ${day.active ? 'text-slate-900' : 'text-slate-400'}`}
                      >
                        {day.day}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {day.active ? (
                        <>
                          <input
                            type="time"
                            value={day.open}
                            onChange={(e) => updateSchedule(idx, 'open', e.target.value)}
                            className="w-28 px-4 py-2.5 bg-slate-50 border border-slate-100/80 rounded-[8px] text-[0.875rem] font-bold text-slate-900 transition-all outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/20 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] text-center"
                          />
                          <span className="text-[0.875rem] font-medium text-slate-400">à</span>
                          <input
                            type="time"
                            value={day.close}
                            onChange={(e) => updateSchedule(idx, 'close', e.target.value)}
                            className="w-28 px-4 py-2.5 bg-slate-50 border border-slate-100/80 rounded-[8px] text-[0.875rem] font-bold text-slate-900 transition-all outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/20 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] text-center"
                          />
                        </>
                      ) : (
                        <span className="px-4 py-2 text-[0.75rem] font-bold uppercase tracking-wider text-slate-400 bg-slate-100/50 rounded-[8px]">
                          Fermé
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-6">
                <button
                  type="button"
                  onClick={handleSave}
                  className="btn-primary py-3.5 px-6 rounded-[8px] text-[0.875rem]"
                >
                  Enregistrer les horaires
                </button>
              </div>
            </div>
          )}

          {/* --- BOOKING WIDGET TAB --- */}
          {activeTab === 'widget' && (
            <div className="space-y-10 max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div>
                <h3 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[8px] bg-slate-50 flex items-center justify-center text-slate-600">
                    <IconGlobe className="w-5 h-5" />
                  </div>
                  Widget de Réservation
                </h3>
                <p className="mt-2 text-[0.875rem] font-medium text-slate-500 ml-13">
                  Personnalisez l'apparence de votre module de prise de RDV en ligne.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Config Form */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="block text-[0.75rem] font-bold text-slate-400 uppercase tracking-widest">
                      Titre du Widget
                    </label>
                    <input
                      type="text"
                      value={widgetTitle}
                      onChange={(e) => setWidgetTitle(e.target.value)}
                      className="w-full px-5 py-3.5 bg-white border border-slate-100/80 rounded-[8px] text-[0.875rem] font-bold text-slate-900 transition-all outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/20 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[0.75rem] font-bold text-slate-400 uppercase tracking-widest">
                      Couleur Principale
                    </label>
                    <div className="flex gap-4">
                      {['#2563eb', '#10b981', '#7c3aed', '#db2777', '#ea580c'].map((color) => (
                        <button
                          key={color}
                          onClick={() => setWidgetColor(color)}
                          className={`w-10 h-10 rounded-full border-[3px] transition-all shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] hover:scale-110 ${widgetColor === color ? 'border-slate-900 scale-110' : 'border-transparent'}`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-50/50 p-6 rounded-[8px] border border-slate-100/80 relative group shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)]">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-[0.875rem] font-bold text-slate-900 flex items-center gap-2">
                        <IconCode className="w-4 h-4 text-slate-500" /> Intégration
                      </h4>
                      <button
                        onClick={copyWidgetCode}
                        className="text-[0.8125rem] font-bold flex items-center gap-1.5 text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-[30px] transition-colors"
                      >
                        {copied ? (
                          <>
                            <IconCheck className="w-4 h-4" /> Copié
                          </>
                        ) : (
                          <>
                            <IconClipboard className="w-4 h-4" /> Copier
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-[0.75rem] font-medium text-slate-500 mb-4">
                      Copiez ce code dans votre site web (WordPress, Wix...).
                    </p>
                    <div className="bg-slate-800 text-slate-300 p-4 rounded-[8px] font-mono text-[0.8125rem] overflow-x-auto shadow-inner">
                      {widgetCode}
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div className="bg-white border border-slate-100/80 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col h-[420px]">
                  <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-100/80 flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                      <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                    </div>
                    <div className="text-[0.65rem] font-bold text-slate-400 bg-white px-3 py-1 rounded-[30px] flex-1 text-center border border-slate-100/50 mx-4 max-w-[200px]">
                      medicom.ma/booking
                    </div>
                  </div>
                  <div className="flex-1 bg-white p-8 flex flex-col items-center justify-center space-y-6">
                    <h4 className="text-xl font-bold tracking-tight" style={{ color: widgetColor }}>
                      {widgetTitle}
                    </h4>
                    <div className="w-full max-w-xs space-y-3">
                      <div className="h-12 bg-slate-50 rounded-[8px] border border-slate-100/80 w-full animate-pulse"></div>
                      <div className="h-12 bg-slate-50 rounded-[8px] border border-slate-100/80 w-full animate-pulse delay-75"></div>
                      <button
                        className="w-full h-12 rounded-[8px] text-white font-bold text-[0.875rem] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] transition-transform hover:scale-[1.02]"
                        style={{ backgroundColor: widgetColor }}
                      >
                        Voir les disponibilités
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'language' && (
            <div className="space-y-10 max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div>
                <h3 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[8px] bg-slate-50 flex items-center justify-center text-slate-600">
                    <IconGlobe className="w-5 h-5" />
                  </div>
                  Langue de l'interface
                </h3>
                <p className="mt-2 text-[0.875rem] font-medium text-slate-500 ml-13">
                  Choisissez la langue d'affichage de l'application.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                  { code: 'fr', label: 'Français', flag: '🇫🇷', desc: 'Langue par défaut' },
                  { code: 'ar', label: 'العربية', flag: '🇲🇦', desc: 'Arabe (RTL)' },
                  { code: 'en', label: 'English', flag: '🇬🇧', desc: 'English' },
                ].map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`p-6 rounded-3xl border text-left transition-all ${
                      currentLang === lang.code
                        ? 'border-blue-500 bg-blue-50/50 ring-4 ring-blue-500/10 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]'
                        : 'border-slate-200/60 hover:border-slate-300 hover:bg-slate-50/50 hover:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] bg-white'
                    }`}
                  >
                    <div className="text-3xl mb-4">{lang.flag}</div>
                    <div className="font-bold text-slate-900 text-[1rem]">{lang.label}</div>
                    <div className="text-[0.75rem] font-medium text-slate-500 mt-1">
                      {lang.desc}
                    </div>
                    {currentLang === lang.code && (
                      <div className="mt-4 flex items-center gap-1.5 text-[0.75rem] text-blue-600 font-bold uppercase tracking-wider">
                        <IconCheck className="w-4 h-4" /> Actif
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <div className="bg-amber-50/80 border border-amber-200/60 rounded-[8px] p-4 text-[0.875rem] font-medium text-amber-800 mt-8 flex gap-3">
                <span className="text-xl">⚠️</span>
                <p>
                  <strong>Note :</strong> La traduction arabe et anglaise couvre les éléments
                  principaux de navigation. Les contenus cliniques restent en français.
                </p>
              </div>
            </div>
          )}

          {/* --- DOCTOR PREFERENCES TAB --- */}
          {activeTab === 'doctor_prefs' && currentUser?.role === 'doctor' && (
            <div className="space-y-10 max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div>
                <h3 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[8px] bg-slate-50 flex items-center justify-center text-slate-600">
                    <IconSettings className="w-5 h-5" />
                  </div>
                  Préférences du Médecin
                </h3>
                <p className="mt-2 text-[0.875rem] font-medium text-slate-500 ml-13">
                  Ces paramètres s'appliquent uniquement à votre compte.
                </p>
              </div>

              <div className="bg-slate-50/50 p-6 sm:p-8 rounded-3xl border border-transparent shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <label
                      htmlFor="auto-status"
                      className="text-[0.875rem] font-bold text-slate-900 block"
                    >
                      Changer statut auto 'En consultation'
                    </label>
                    <p className="text-[0.8125rem] text-slate-500 font-medium mt-1">
                      Met à jour le statut du patient à l'ouverture du dossier.
                    </p>
                  </div>
                  <button
                    id="auto-status"
                    onClick={() => setAutoStatusConsultation(!autoStatusConsultation)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${autoStatusConsultation ? 'bg-blue-600 shadow-md shadow-blue-200/50' : 'bg-slate-200'}`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${autoStatusConsultation ? 'translate-x-5' : 'translate-x-0'}`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label
                      htmlFor="auto-remove"
                      className="text-[0.875rem] font-bold text-slate-900 block"
                    >
                      Changer statut auto 'Terminé'
                    </label>
                    <p className="text-[0.8125rem] text-slate-500 font-medium mt-1">
                      Marque la consultation comme terminée lors de la clôture.
                    </p>
                  </div>
                  <button
                    id="auto-remove"
                    onClick={() => setAutoRemoveConsultation(!autoRemoveConsultation)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${autoRemoveConsultation ? 'bg-blue-600 shadow-md shadow-blue-200/50' : 'bg-slate-200'}`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${autoRemoveConsultation ? 'translate-x-5' : 'translate-x-0'}`}
                    />
                  </button>
                </div>

                <div className="pt-8 border-t border-slate-200/50">
                  <h4 className="text-[1rem] font-bold text-slate-900 mb-6 flex items-center gap-2 tracking-tight">
                    <IconClock className="w-5 h-5 text-slate-400" /> Préférences du Calendrier
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-[0.75rem] font-bold text-slate-400 uppercase tracking-widest">
                        Vue par défaut
                      </label>
                      <select
                        value={defaultCalendarView}
                        onChange={(e) => setDefaultCalendarView(e.target.value as any)}
                        className="w-full px-5 py-3.5 bg-white border border-slate-100/80 rounded-[8px] text-[0.875rem] font-bold text-slate-900 transition-all outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/20 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] appearance-none"
                      >
                        <option value="day">Jour</option>
                        <option value="week">Semaine</option>
                        <option value="month">Mois</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[0.75rem] font-bold text-slate-400 uppercase tracking-widest">
                        Durée de RDV par défaut
                      </label>
                      <select
                        value={defaultSlotDuration}
                        onChange={(e) => setDefaultSlotDuration(Number(e.target.value))}
                        className="w-full px-5 py-3.5 bg-white border border-slate-100/80 rounded-[8px] text-[0.875rem] font-bold text-slate-900 transition-all outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/20 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] appearance-none"
                      >
                        <option value={15}>15 min</option>
                        <option value={30}>30 min</option>
                        <option value={45}>45 min</option>
                        <option value={60}>60 min</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-200/50">
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="text-[1rem] font-bold text-slate-900 flex items-center gap-2 tracking-tight">
                      <IconClipboard className="w-5 h-5 text-slate-400" /> Modèles de Notes
                    </h4>
                    <button
                      onClick={() =>
                        setNoteTemplates([
                          ...noteTemplates,
                          { id: Math.random().toString(), title: '', content: '' },
                        ])
                      }
                      className="text-[0.8125rem] text-blue-600 font-bold hover:text-blue-800 flex items-center gap-1.5 bg-blue-50/50 px-3 py-1.5 rounded-[30px] transition-colors border border-blue-100/50"
                    >
                      <IconPlus className="w-4 h-4" /> Ajouter
                    </button>
                  </div>

                  <div className="space-y-4">
                    {noteTemplates.map((template, idx) => (
                      <div
                        key={template.id}
                        className="bg-white border border-slate-100/80 p-5 rounded-3xl space-y-4 relative shadow-[0_4px_12px_rgba(0,0,0,0.02)] group hover:shadow-[0_8px_20px_rgba(0,0,0,0.04)] transition-all"
                      >
                        <button
                          onClick={() =>
                            setNoteTemplates(noteTemplates.filter((t) => t.id !== template.id))
                          }
                          className="absolute top-5 right-5 text-slate-300 hover:text-rose-500 transition-colors p-1"
                        >
                          <IconTrash className="w-5 h-5" />
                        </button>
                        <div className="pr-8 space-y-2">
                          <label className="block text-[0.75rem] font-bold text-slate-400 uppercase tracking-widest">
                            Titre du modèle
                          </label>
                          <input
                            type="text"
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-100/80 rounded-[8px] text-[0.875rem] font-bold text-slate-900 transition-all outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/20 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]"
                            placeholder="Ex: Contrôle post-traitement"
                            value={template.title}
                            onChange={(e) => {
                              const newTemplates = [...noteTemplates];
                              newTemplates[idx].title = e.target.value;
                              setNoteTemplates(newTemplates);
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-[0.75rem] font-bold text-slate-400 uppercase tracking-widest">
                            Contenu
                          </label>
                          <textarea
                            rows={3}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100/80 rounded-[8px] text-[0.875rem] font-medium text-slate-700 transition-all outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/20 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] resize-none leading-relaxed"
                            placeholder="Contenu synthétique..."
                            value={template.content}
                            onChange={(e) => {
                              const newTemplates = [...noteTemplates];
                              newTemplates[idx].content = e.target.value;
                              setNoteTemplates(newTemplates);
                            }}
                          />
                        </div>
                      </div>
                    ))}
                    {noteTemplates.length === 0 && (
                      <div className="text-center py-10 px-4 text-[0.875rem] font-medium text-slate-400 bg-white border border-dashed border-slate-200 rounded-3xl">
                        Aucun modèle configuré. Ajoutez-en un pour gagner du temps lors de vos
                        consultations.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-6">
                <button
                  type="button"
                  onClick={handleSave}
                  className="btn-primary py-3.5 px-6 rounded-[8px] text-[0.875rem]"
                >
                  Enregistrer les préférences
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
