import React, { useState } from 'react';
import { IconMessage, IconCheck } from '../components/Icons';

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('notifications');
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [reminderTime, setReminderTime] = useState('24');
  const [messageTemplate, setMessageTemplate] = useState("Bonjour {patient}, ceci est un rappel pour votre rendez-vous chez {cabinet} le {date} à {heure}. Répondez STOP pour ne plus recevoir de SMS.");

  const handleSave = () => {
    alert("Paramètres enregistrés avec succès !");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h2 className="text-xl font-semibold text-slate-800">Paramètres du Cabinet</h2>
      
      <div className="bg-white rounded-md border border-slate-200 overflow-hidden min-h-[600px] flex shadow-sm">
        {/* Settings Sidebar */}
        <div className="w-56 border-r border-slate-200 bg-slate-50 p-4">
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('general')}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'general' ? 'bg-white text-blue-700 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'}`}
            >
              Général
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'notifications' ? 'bg-white text-blue-700 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'}`}
            >
              Notifications & SMS
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'users' ? 'bg-white text-blue-700 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'}`}
            >
              Utilisateurs
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 p-10 bg-white">
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

          {activeTab === 'general' && (
            <div className="flex items-center justify-center h-full text-slate-400 text-sm">Paramètres généraux non implémentés dans cette démo.</div>
          )}
          {activeTab === 'users' && (
            <div className="flex items-center justify-center h-full text-slate-400 text-sm">Gestion des utilisateurs non implémentée dans cette démo.</div>
          )}
        </div>
      </div>
    </div>
  );
};