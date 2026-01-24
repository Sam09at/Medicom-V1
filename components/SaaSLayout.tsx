
import React, { useState } from 'react';
import { 
  IconDashboard, IconUsers, IconSettings, IconActivity, IconShield, 
  IconGlobe, IconDatabase, IconMail, IconCreditCard, IconServer, 
  IconCode, IconLifeBuoy, IconSearch, IconBell, IconChevronRight,
  IconCommand, IconLogOut
} from './Icons';
import { User } from '../types';

interface SaaSLayoutProps {
  children: React.ReactNode;
  currentUser: User;
  currentView: string;
  onChangeView: (view: string) => void;
  onLogout: () => void;
}

type NavItem = {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

const NAVIGATION: NavGroup[] = [
  {
    title: "App Management",
    items: [
      { id: 'dashboard', label: 'Vue d\'ensemble', icon: IconDashboard },
      { id: 'tenants', label: 'Cabinets & Tenants', icon: IconGlobe, badge: '24' },
      { id: 'users', label: 'Utilisateurs SaaS', icon: IconUsers },
    ]
  },
  {
    title: "Opérations",
    items: [
      { id: 'finance', label: 'Finance & Plans', icon: IconCreditCard },
      { id: 'support', label: 'Support & Tickets', icon: IconLifeBuoy, badge: '5' },
      { id: 'content', label: 'Contenu & CMS', icon: IconMail },
    ]
  },
  {
    title: "Technical",
    items: [
      { id: 'health', label: 'System Health', icon: IconActivity },
      { id: 'developers', label: 'Developers', icon: IconCode },
      { id: 'security', label: 'Data & Sécurité', icon: IconShield },
    ]
  }
];

export const SaaSLayout: React.FC<SaaSLayoutProps> = ({ children, currentUser, currentView, onChangeView, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      {/* SIDEBAR */}
      <aside className={`flex-shrink-0 bg-white border-r border-slate-200 transition-all duration-300 flex flex-col ${isSidebarOpen ? 'w-[260px]' : 'w-[80px]'}`}>
        {/* Logo Area */}
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm shadow-blue-200">
            S
          </div>
          {isSidebarOpen && (
            <span className="ml-3 font-bold text-slate-900 tracking-tight">SaaS Admin</span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-8">
          {NAVIGATION.map((group, idx) => (
            <div key={idx}>
              {isSidebarOpen && (
                <h3 className="px-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  {group.title}
                </h3>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = currentView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onChangeView(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 group relative ${
                        isActive 
                          ? 'bg-slate-100 text-blue-600' 
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                      title={!isSidebarOpen ? item.label : ''}
                    >
                      <item.icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                      
                      {isSidebarOpen && (
                        <>
                          <span className="flex-1 text-left">{item.label}</span>
                          {item.badge && (
                            <span className="bg-blue-50 text-blue-600 text-[10px] px-2 py-0.5 rounded-full font-bold border border-blue-100">
                              {item.badge}
                            </span>
                          )}
                          {isActive && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-600 rounded-r-full"></div>
                          )}
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-slate-100">
          <div className={`flex items-center gap-3 ${!isSidebarOpen && 'justify-center'}`}>
            <img src={currentUser.avatar} alt="Profile" className="w-9 h-9 rounded-full border border-slate-200" />
            {isSidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{currentUser.name}</p>
                <p className="text-xs text-slate-500 truncate">Super Admin</p>
              </div>
            )}
            {isSidebarOpen && (
              <button onClick={onLogout} className="text-slate-400 hover:text-red-600 transition-colors">
                <IconLogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50/50">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm z-10">
          {/* Breadcrumb / Context */}
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="font-medium text-slate-900">Medicom SaaS</span>
            <IconChevronRight className="w-4 h-4 text-slate-300" />
            <span className="capitalize">{currentView.replace('-', ' ')}</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <div className="relative group">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Recherche globale..." 
                className="pl-9 pr-12 py-1.5 bg-slate-100 border-none rounded-md text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all w-64"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
                  <span className="text-[10px] text-slate-400 border border-slate-300 rounded px-1.5 bg-white shadow-sm">⌘K</span>
              </div>
            </div>
            <button className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
              <IconBell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};
