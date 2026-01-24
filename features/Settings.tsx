
import React, { useState } from 'react';
import { IconMessage, IconCheck, IconUsers, IconPlus, IconMoreHorizontal, IconShield, IconDollarSign, IconGlobe, IconCode, IconEdit, IconTrash, IconClipboard, IconHome, IconX, IconClock } from '../components/Icons';
import { MOCK_SERVICES } from '../constants';
import { MedicalService } from '../types';

const MOCK_STAFF = [
    { id: 1, name: 'Dr. Amina El Amrani', role: 'Propriétaire', email: 'amina@cabinet.ma', status: 'Actif', lastActive: 'Il y a 5 min' },
    { id: 2, name: 'Sarah Benani', role: 'Assistante', email: 'sarah@cabinet.ma', status: 'Actif', lastActive: 'Il y a 1h' },
    { id: 3, name: 'Dr. Karim Tazi', role: 'Remplaçant', email: 'karim@gmail.com', status: 'Inactif', lastActive: 'Il y a 2 jours' },
];

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');
  
  // General State
  const [clinicInfo, setClinicInfo] = useState({
      name: 'Cabinet Dentaire Dr. Amina',
      address: '123 Bd Zerktouni, Casablanca',
      phone: '+212 522 123 456',
      email: 'contact@cabinet-amina.ma',
      ice: '001122334455667',
      website: 'www.cabinet-amina.ma'
  });

  // Notification States
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [reminderTime, setReminderTime] = useState('24');
  const [messageTemplate, setMessageTemplate] = useState("Bonjour {patient}, ceci est un rappel pour votre rendez-vous chez {cabinet} le {date} à {heure}. Répondez STOP pour ne plus recevoir de SMS.");

  // Services State
  const [services, setServices] = useState<MedicalService[]>(MOCK_SERVICES);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<MedicalService | null>(null);
  const [newService, setNewService] = useState({ name: '', code: '', price: 0, duration: 30 });

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

  const handleSave = () => {
    // In a real app, this would be an API call
    const btn = document.getElementById('save-btn');
    if(btn) {
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
          lastActive: 'Jamais' 
      };
      setUsers([...users, user]);
      setIsUserModalOpen(false);
      setNewUser({ name: '', email: '', role: 'Assistante' });
  };

  const handleSaveService = (e: React.FormEvent) => {
      e.preventDefault();
      if (editingService) {
          setServices(services.map(s => s.id === editingService.id ? { ...editingService, ...newService } : s));
      } else {
          const service: MedicalService = {
              id: `s-${Date.now()}`,
              ...newService
          };
          setServices([...services, service]);
      }
      setIsServiceModalOpen(false);
      setEditingService(null);
      setNewService({ name: '', code: '', price: 0, duration: 30 });
  };

  const openServiceModal = (service?: MedicalService) => {
      if (service) {
          setEditingService(service);
          setNewService({ name: service.name, code: service.code, price: service.price, duration: service.duration });
      } else {
          setEditingService(null);
          setNewService({ name: '', code: '', price: 0, duration: 30 });
      }
      setIsServiceModalOpen(true);
  };

  const deleteService = (id: string) => {
      if(confirm('Supprimer cet acte ?')) {
          setServices(services.filter(s => s.id !== id));
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
    <div className="max-w-5xl mx-auto space-y-6 font-sans relative">
      <h2 className="text-xl font-semibold text-slate-800">Paramètres du Cabinet</h2>
      
      {/* Service Modal */}
      {isServiceModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsServiceModalOpen(false)}></div>
              <div className="bg-white rounded-lg shadow-xl w-full max-w-sm relative z-10 p-6 space-y-4 animate-in zoom-in-95 duration-200">
                  <div className="flex justify-between items-center">
                      <h3 className="text-lg font-bold text-slate-900">{editingService ? 'Modifier l\'acte' : 'Nouvel Acte'}</h3>
                      <button onClick={() => setIsServiceModalOpen(false)}><IconX className="w-5 h-5 text-slate-400" /></button>
                  </div>
                  <form onSubmit={handleSaveService} className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Libellé</label>
                          <input 
                            type="text" required
                            className="w-full border border-slate-300 rounded-md p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                            value={newService.name}
                            onChange={e => setNewService({...newService, name: e.target.value})}
                          />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Code</label>
                              <input 
                                type="text" required
                                className="w-full border border-slate-300 rounded-md p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                value={newService.code}
                                onChange={e => setNewService({...newService, code: e.target.value})}
                              />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Prix (MAD)</label>
                              <input 
                                type="number" required min="0"
                                className="w-full border border-slate-300 rounded-md p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                value={newService.price}
                                onChange={e => setNewService({...newService, price: parseInt(e.target.value)})}
                              />
                          </div>
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Durée (min)</label>
                          <select 
                            className="w-full border border-slate-300 rounded-md p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            value={newService.duration}
                            onChange={e => setNewService({...newService, duration: parseInt(e.target.value)})}
                          >
                              <option value="15">15 min</option>
                              <option value="30">30 min</option>
                              <option value="45">45 min</option>
                              <option value="60">1h 00</option>
                              <option value="90">1h 30</option>
                          </select>
                      </div>
                      <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700 transition-colors">
                          Enregistrer
                      </button>
                  </form>
              </div>
          </div>
      )}

      {/* User Invite Modal */}
      {isUserModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsUserModalOpen(false)}></div>
              <div className="bg-white rounded-lg shadow-xl w-full max-w-sm relative z-10 p-6 space-y-4 animate-in zoom-in-95 duration-200">
                  <div className="flex justify-between items-center">
                      <h3 className="text-lg font-bold text-slate-900">Inviter un membre</h3>
                      <button onClick={() => setIsUserModalOpen(false)}><IconX className="w-5 h-5 text-slate-400" /></button>
                  </div>
                  <form onSubmit={handleInviteUser} className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Nom complet</label>
                          <input 
                            type="text" required
                            className="w-full border border-slate-300 rounded-md p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Ex: Sarah Benani"
                            value={newUser.name}
                            onChange={e => setNewUser({...newUser, name: e.target.value})}
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                          <input 
                            type="email" required
                            className="w-full border border-slate-300 rounded-md p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="email@cabinet.ma"
                            value={newUser.email}
                            onChange={e => setNewUser({...newUser, email: e.target.value})}
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Rôle</label>
                          <select 
                            className="w-full border border-slate-300 rounded-md p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            value={newUser.role}
                            onChange={e => setNewUser({...newUser, role: e.target.value})}
                          >
                              <option value="Assistante">Assistant(e)</option>
                              <option value="Secrétaire">Secrétaire</option>
                              <option value="Remplaçant">Dentiste Remplaçant</option>
                          </select>
                      </div>
                      <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700 transition-colors">
                          Envoyer l'invitation
                      </button>
                  </form>
              </div>
          </div>
      )}

      <div className="bg-white rounded-md border border-slate-200 overflow-hidden min-h-[600px] flex shadow-sm">
        {/* Settings Sidebar */}
        <div className="w-64 border-r border-slate-200 bg-slate-50 p-4">
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('general')}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'general' ? 'bg-white text-blue-700 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'}`}
            >
              <IconHome className="w-4 h-4" /> Général
            </button>
            <button
              onClick={() => setActiveTab('services')}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'services' ? 'bg-white text-blue-700 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'}`}
            >
              <IconDollarSign className="w-4 h-4" /> Services & Tarifs
            </button>
            <button
              onClick={() => setActiveTab('schedule')}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'schedule' ? 'bg-white text-blue-700 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'}`}
            >
              <IconClock className="w-4 h-4" /> Horaires
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'notifications' ? 'bg-white text-blue-700 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'}`}
            >
              <IconMessage className="w-4 h-4" /> Notifications & SMS
            </button>
            <button
              onClick={() => setActiveTab('widget')}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'widget' ? 'bg-white text-blue-700 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'}`}
            >
              <IconGlobe className="w-4 h-4" /> Widget Réservation
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'users' ? 'bg-white text-blue-700 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'}`}
            >
              <IconUsers className="w-4 h-4" /> Équipe & Accès
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 p-8 bg-white overflow-y-auto">
          
          {/* --- GENERAL TAB --- */}
          {activeTab === 'general' && (
              <div className="space-y-8 max-w-2xl">
                  <div>
                      <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                          <IconHome className="w-4 h-4 text-slate-400" />
                          Profil du Cabinet
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                          Ces informations apparaissent sur vos ordonnances et factures.
                      </p>
                  </div>

                  <div className="space-y-6">
                      {/* Logo Section */}
                      <div className="flex items-center gap-6">
                          <div className="w-20 h-20 bg-slate-100 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                              Logo
                          </div>
                          <div>
                              <button className="text-sm font-medium text-blue-600 hover:text-blue-700">Changer le logo</button>
                              <p className="text-xs text-slate-500 mt-1">JPG, PNG max 2MB.</p>
                          </div>
                      </div>

                      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                          <div className="sm:col-span-4">
                              <label className="block text-sm font-medium text-slate-700">Nom du Cabinet</label>
                              <input 
                                type="text" 
                                value={clinicInfo.name}
                                onChange={e => setClinicInfo({...clinicInfo, name: e.target.value})}
                                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2" 
                              />
                          </div>

                          <div className="sm:col-span-6">
                              <label className="block text-sm font-medium text-slate-700">Adresse Complète</label>
                              <textarea 
                                rows={2}
                                value={clinicInfo.address}
                                onChange={e => setClinicInfo({...clinicInfo, address: e.target.value})}
                                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2" 
                              />
                          </div>

                          <div className="sm:col-span-3">
                              <label className="block text-sm font-medium text-slate-700">Téléphone</label>
                              <input 
                                type="text" 
                                value={clinicInfo.phone}
                                onChange={e => setClinicInfo({...clinicInfo, phone: e.target.value})}
                                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2" 
                              />
                          </div>

                          <div className="sm:col-span-3">
                              <label className="block text-sm font-medium text-slate-700">Email Contact</label>
                              <input 
                                type="email" 
                                value={clinicInfo.email}
                                onChange={e => setClinicInfo({...clinicInfo, email: e.target.value})}
                                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2" 
                              />
                          </div>

                          <div className="sm:col-span-3">
                              <label className="block text-sm font-medium text-slate-700">ICE / Tax ID</label>
                              <input 
                                type="text" 
                                value={clinicInfo.ice}
                                onChange={e => setClinicInfo({...clinicInfo, ice: e.target.value})}
                                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 bg-slate-50" 
                              />
                          </div>

                          <div className="sm:col-span-3">
                              <label className="block text-sm font-medium text-slate-700">Site Web</label>
                              <input 
                                type="text" 
                                value={clinicInfo.website}
                                onChange={e => setClinicInfo({...clinicInfo, website: e.target.value})}
                                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2" 
                              />
                          </div>
                      </div>
                  </div>

                  <div className="flex justify-end pt-6 border-t border-slate-100">
                    <button
                      id="save-btn"
                      type="button"
                      onClick={handleSave}
                      className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
                    >
                      Enregistrer les modifications
                    </button>
                  </div>
              </div>
          )}

          {/* --- NOTIFICATIONS TAB --- */}
          {activeTab === 'notifications' && (
            <div className="space-y-8 max-w-2xl">
              <div>
                <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <IconMessage className="w-4 h-4 text-slate-400" />
                  Configuration SMS
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Gérez les rappels automatiques envoyés à vos patients.
                </p>
              </div>

              <div className="pt-6 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm text-slate-900">Rappels de Rendez-vous</div>
                    <div className="text-xs text-slate-500 mt-1">Envoyer automatiquement un SMS avant chaque consultation.</div>
                  </div>
                  <button 
                    onClick={() => setSmsEnabled(!smsEnabled)}
                    className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${smsEnabled ? 'bg-blue-600' : 'bg-slate-200'}`}
                  >
                    <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${smsEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>

              {smsEnabled && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Délai d'envoi</label>
                    <select 
                      value={reminderTime}
                      onChange={(e) => setReminderTime(e.target.value)}
                      className="block w-full rounded-md border-slate-300 py-2 pl-3 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 bg-white shadow-sm"
                    >
                      <option value="2">2 heures avant</option>
                      <option value="24">24 heures avant (recommandé)</option>
                      <option value="48">48 heures avant</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Modèle de message</label>
                    <div className="mt-1">
                      <textarea
                        rows={4}
                        value={messageTemplate}
                        onChange={(e) => setMessageTemplate(e.target.value)}
                        className="block w-full rounded-md border-slate-300 p-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <p className="mt-2 text-xs text-slate-400">
                      Variables disponibles : {`{patient}, {cabinet}, {date}, {heure}`}.
                    </p>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-blue-50/50 text-blue-700 rounded-md text-xs border border-blue-100">
                    <IconCheck className="w-4 h-4 mt-0.5 shrink-0" />
                    <p>Les patients ont la possibilité de se désinscrire (opt-out) à tout moment en répondant STOP, conformément à la réglementation.</p>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleSave}
                  className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          )}

          {/* --- STAFF TAB --- */}
          {activeTab === 'users' && (
            <div className="space-y-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                            <IconUsers className="w-4 h-4 text-slate-400" />
                            Gestion de l'équipe
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">Ajoutez des membres à votre cabinet et gérez leurs permissions.</p>
                    </div>
                    <button 
                        onClick={() => setIsUserModalOpen(true)}
                        className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        <IconPlus className="w-4 h-4" /> Inviter
                    </button>
                </div>

                <div className="bg-white border border-slate-200 rounded-md overflow-hidden shadow-sm">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Membre</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Rôle</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Statut</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Dernière activité</th>
                                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {users.map((member) => (
                                <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                                                {member.name.substring(0, 1)}
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-slate-900">{member.name}</div>
                                                <div className="text-xs text-slate-500">{member.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            member.role === 'Propriétaire' ? 'bg-purple-100 text-purple-800' : 
                                            member.role === 'Assistante' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'
                                        }`}>
                                            {member.role === 'Propriétaire' && <IconShield className="w-3 h-3" />}
                                            {member.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            member.status === 'Actif' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'
                                        }`}>
                                            {member.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                        {member.lastActive}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button className="text-slate-400 hover:text-slate-600">
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
            <div className="space-y-6">
               <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                            <IconDollarSign className="w-4 h-4 text-slate-400" />
                            Catalogue des Actes
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">Configurez les tarifs et codes de vos prestations.</p>
                    </div>
                    <button 
                        onClick={() => openServiceModal()}
                        className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        <IconPlus className="w-4 h-4" /> Ajouter un acte
                    </button>
                </div>

                <div className="bg-white border border-slate-200 rounded-md overflow-hidden shadow-sm">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Libellé</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Code</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Durée (min)</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tarif (MAD)</th>
                                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {services.map((service) => (
                                <tr key={service.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{service.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">{service.code}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{service.duration}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">{service.price}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => openServiceModal(service)} className="text-slate-400 hover:text-blue-600 p-1"><IconEdit className="w-4 h-4" /></button>
                                            <button onClick={() => deleteService(service.id)} className="text-slate-400 hover:text-red-600 p-1"><IconTrash className="w-4 h-4" /></button>
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
              <div className="space-y-6 max-w-2xl">
                  <div>
                      <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                          <IconClock className="w-4 h-4 text-slate-400" />
                          Horaires d'ouverture
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                          Définissez vos plages de disponibilité.
                      </p>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100">
                      {schedule.map((day, idx) => (
                          <div key={day.day} className="flex items-center justify-between p-4">
                              <div className="flex items-center gap-4 w-32">
                                  <input 
                                    type="checkbox" 
                                    checked={day.active} 
                                    onChange={(e) => updateSchedule(idx, 'active', e.target.checked)}
                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className={`text-sm font-medium ${day.active ? 'text-slate-900' : 'text-slate-400'}`}>{day.day}</span>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                  {day.active ? (
                                      <>
                                          <input 
                                            type="time" 
                                            value={day.open} 
                                            onChange={(e) => updateSchedule(idx, 'open', e.target.value)}
                                            className="border border-slate-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                          />
                                          <span className="text-slate-400 text-sm">à</span>
                                          <input 
                                            type="time" 
                                            value={day.close} 
                                            onChange={(e) => updateSchedule(idx, 'close', e.target.value)}
                                            className="border border-slate-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                          />
                                      </>
                                  ) : (
                                      <span className="text-sm text-slate-400 italic px-2">Fermé</span>
                                  )}
                              </div>
                          </div>
                      ))}
                  </div>

                  <div className="flex justify-end pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handleSave}
                      className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                    >
                      Enregistrer
                    </button>
                  </div>
              </div>
          )}

          {/* --- BOOKING WIDGET TAB --- */}
          {activeTab === 'widget' && (
            <div className="space-y-8">
               <div>
                  <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                      <IconGlobe className="w-4 h-4 text-slate-400" />
                      Widget de Réservation
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">Personnalisez l'apparence de votre module de prise de RDV en ligne.</p>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Config Form */}
                  <div className="space-y-6">
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Titre du Widget</label>
                          <input 
                            type="text" 
                            value={widgetTitle}
                            onChange={(e) => setWidgetTitle(e.target.value)}
                            className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Couleur Principale</label>
                          <div className="flex gap-3">
                              {['#2563eb', '#10b981', '#7c3aed', '#db2777', '#ea580c'].map(color => (
                                  <button 
                                    key={color} 
                                    onClick={() => setWidgetColor(color)}
                                    className={`w-8 h-8 rounded-full border-2 transition-all ${widgetColor === color ? 'border-slate-900 scale-110' : 'border-transparent'}`}
                                    style={{ backgroundColor: color }}
                                  />
                              ))}
                          </div>
                      </div>
                      
                      <div className="bg-slate-50 p-4 rounded-md border border-slate-200 relative group">
                          <div className="flex justify-between items-center mb-2">
                              <h4 className="text-sm font-medium text-slate-900 flex items-center gap-2">
                                  <IconCode className="w-4 h-4 text-slate-500" /> Intégration
                              </h4>
                              <button 
                                onClick={copyWidgetCode}
                                className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800"
                              >
                                {copied ? <><IconCheck className="w-3 h-3" /> Copié</> : <><IconClipboard className="w-3 h-3" /> Copier</>}
                              </button>
                          </div>
                          <p className="text-xs text-slate-500 mb-3">Copiez ce code dans votre site web (WordPress, Wix...).</p>
                          <div className="bg-slate-900 text-slate-300 p-3 rounded font-mono text-xs overflow-x-auto">
                              {widgetCode}
                          </div>
                      </div>
                  </div>

                  {/* Preview */}
                  <div className="border border-slate-200 rounded-lg shadow-sm overflow-hidden flex flex-col h-96">
                      <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center gap-2">
                          <div className="flex gap-1.5">
                              <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
                              <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                          </div>
                          <div className="text-xs text-slate-400 bg-white px-2 rounded flex-1 text-center mx-4">medicom.ma/booking</div>
                      </div>
                      <div className="flex-1 bg-white p-6 flex flex-col items-center justify-center space-y-4">
                          <h4 className="text-lg font-bold" style={{ color: widgetColor }}>{widgetTitle}</h4>
                          <div className="w-full max-w-xs space-y-2">
                              <div className="h-10 bg-slate-50 rounded border border-slate-200 w-full"></div>
                              <div className="h-10 bg-slate-50 rounded border border-slate-200 w-full"></div>
                              <button 
                                className="w-full h-10 rounded text-white font-medium text-sm shadow-sm"
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
        </div>
      </div>
    </div>
  );
};
