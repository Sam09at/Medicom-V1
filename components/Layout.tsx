import React, { ReactNode } from 'react';
import { User } from '../types';
import { IconCalendar, IconUsers, IconActivity, IconSettings, IconLogOut, IconDashboard, IconCreditCard, IconFileText } from './Icons';

interface LayoutProps {
  children: ReactNode;
  user: User;
  onLogout: () => void;
  currentView: string;
  onChangeView: (view: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, currentView, onChangeView }) => {
  const isSuperAdmin = user.role === 'SUPER_ADMIN';

  const menuItems = isSuperAdmin ? [
    { id: 'saas-dashboard', label: 'Overview', icon: IconActivity },
    { id: 'cabinets', label: 'Cabinets', icon: IconDashboard },
    { id: 'reports', label: 'Rapports', icon: IconFileText },
    { id: 'settings', label: 'Paramètres', icon: IconSettings },
  ] : [
    { id: 'dashboard', label: 'Tableau de bord', icon: IconDashboard },
    { id: 'calendar', label: 'Calendrier', icon: IconCalendar },
    { id: 'patients', label: 'Patients', icon: IconUsers },
    { id: 'billing', label: 'Paiements', icon: IconCreditCard },
    { id: 'reports', label: 'Rapports', icon: IconFileText },
    { id: 'settings', label: 'Paramètres', icon: IconSettings },
  ];

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col z-20">
        <div className="h-14 flex items-center px-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center text-white font-bold text-sm">
              M
            </div>
            <span className="text-sm font-semibold text-slate-900 tracking-tight">Medicom</span>
            {isSuperAdmin && <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200 font-medium">SaaS</span>}
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-200 ${
                currentView === item.id
                  ? 'bg-slate-50 text-blue-700 font-medium'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <item.icon className={`w-4 h-4 ${currentView === item.id ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-100">
          <div className="flex items-center gap-3 px-2 py-2 mb-1">
            <img src={user.avatar} alt="User" className="w-8 h-8 rounded-full bg-slate-200 object-cover border border-slate-100" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate">{user.role === 'SUPER_ADMIN' ? 'Admin' : 'Dentiste'}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full mt-1 flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
          >
            <IconLogOut className="w-3.5 h-3.5" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-8">
          <h1 className="text-lg font-medium text-slate-800">
             {menuItems.find(i => i.id === currentView)?.label}
          </h1>
          <div className="flex items-center gap-4">
             <div className="text-xs font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
               {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8 bg-slate-50">
          <div className="max-w-7xl mx-auto h-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};