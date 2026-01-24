
import React, { ReactNode, useState, useRef, useEffect } from 'react';
import { User, SearchResult, ModuleConfiguration } from '../types';
import { 
  IconCalendar, IconUsers, IconActivity, IconSettings, IconLogOut, 
  IconDashboard, IconCreditCard, IconFileText, IconTooth, IconClipboard, 
  IconUserPlus, IconMessage, IconSearch, IconClock, IconBell, IconCheck, 
  IconFolder, IconChevronLeft, IconChevronRight, IconArchive, IconTruck,
  IconShield, IconPlus, IconMenu, IconBriefcase
} from './Icons';
import { MOCK_NOTIFICATIONS } from '../constants';

interface LayoutProps {
  children: ReactNode;
  user: User;
  onLogout: () => void;
  currentView: string;
  onChangeView: (view: string) => void;
  onSearch?: (query: string) => SearchResult[];
}

export const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, currentView, onChangeView, onSearch }) => {
  if (!user) return null;

  const isSuperAdmin = user.role === 'SUPER_ADMIN';
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) setIsSearchOpen(false);
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) setIsNotificationsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.trim().length > 0 && onSearch) {
      setSearchResults(onSearch(query));
      setIsSearchOpen(true);
    } else {
      setIsSearchOpen(false);
    }
  };

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const getFilteredMenuItems = () => {
    if (isSuperAdmin) {
      return [
        { id: 'saas-dashboard', label: 'Vue d\'ensemble', icon: IconActivity, module: null },
        { id: 'cabinets', label: 'Cabinets', icon: IconDashboard, module: null },
        { id: 'crm', label: 'CRM & Growth', icon: IconBriefcase, module: null },
        { id: 'saas-admin', label: 'Administration', icon: IconShield, module: null },
        { id: 'reports', label: 'Intelligence', icon: IconFileText, module: null },
        { id: 'support', label: 'Support', icon: IconMessage, module: null },
        { id: 'settings', label: 'Settings', icon: IconSettings, module: null },
      ];
    }

    const modules = user.enabledModules || ({} as ModuleConfiguration);
    
    const doctorItems = [
      { id: 'dashboard', label: 'Tableau de bord', icon: IconDashboard, module: 'dashboard' },
      { id: 'calendar', label: 'Calendrier', icon: IconCalendar, module: 'calendar' },
      { id: 'patients', label: 'Patients', icon: IconUsers, module: 'patients' },
      { id: 'treatments', label: 'Traitements', icon: IconTooth, module: 'treatments' },
      { id: 'inventory', label: 'Stock', icon: IconArchive, module: 'inventory' }, 
      { id: 'lab-orders', label: 'Prothèses', icon: IconTruck, module: 'labOrders' }, 
      { id: 'documents', label: 'Documents', icon: IconFolder, module: 'documents' },
      { id: 'records', label: 'Dossiers', icon: IconClipboard, module: 'records' },
      { id: 'billing', label: 'Finance', icon: IconCreditCard, module: 'billing' },
      { id: 'reports', label: 'Rapports', icon: IconFileText, module: 'reports' },
      { id: 'support', label: 'Support', icon: IconMessage, module: 'support' },
      { id: 'settings', label: 'Paramètres', icon: IconSettings, module: null },
    ];

    return doctorItems.filter(item => item.module === null || (modules as any)[item.module]);
  };

  const menuItems = getFilteredMenuItems();

  return (
    <div className="flex h-screen bg-white font-sans text-slate-900 antialiased overflow-hidden">
      {/* Sidebar */}
      <aside className={`flex-shrink-0 bg-white border-r border-slate-200 transition-all duration-200 flex flex-col z-30 ${isSidebarCollapsed ? 'w-[72px]' : 'w-[240px]'}`}>
        <div className="h-14 flex items-center px-5 border-b border-slate-200">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-sm">
            M
          </div>
          {!isSidebarCollapsed && (
            <span className="ml-3 font-bold text-slate-900 text-sm tracking-tight">Medicom</span>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all duration-150 group relative ${
                currentView === item.id
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              } ${isSidebarCollapsed ? 'justify-center' : ''}`}
              title={isSidebarCollapsed ? item.label : ''}
            >
              <item.icon className={`w-[18px] h-[18px] ${currentView === item.id ? 'text-blue-600' : 'text-slate-400'}`} />
              {!isSidebarCollapsed && (
                <span className="truncate">{item.label}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-200">
          <div className={`flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer ${isSidebarCollapsed ? 'justify-center' : ''}`}>
            <img src={user.avatar} alt="" className="w-8 h-8 rounded-full border border-slate-200" />
            {!isSidebarCollapsed && (
              <div className="flex-1 min-w-0 text-left">
                <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                <p className="text-[10px] text-slate-500 truncate">{user.clinicName || 'Super Admin'}</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#F9FAFB]">
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-20">
          <div className="flex items-center gap-4 flex-1">
             <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md">
                <IconMenu className="w-5 h-5" />
             </button>
             <div className="h-4 w-px bg-slate-200"></div>
             <div className="relative max-w-sm w-full" ref={searchRef}>
                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={handleSearch}
                  placeholder="Global Search..." 
                  className="w-full pl-9 pr-4 py-1.5 text-[13px] bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                />
             </div>
          </div>

          <div className="flex items-center gap-4">
             {!isSuperAdmin && (
                 <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-[13px] font-bold shadow-sm transition-all active:scale-95">
                    <IconPlus className="w-4 h-4" /> New Patient
                 </button>
             )}
             <div className="relative" ref={notifRef}>
                <button onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} className="p-2 text-slate-400 hover:text-slate-600 transition-colors relative">
                   <IconBell className="w-5 h-5" />
                   {unreadCount > 0 && (
                     <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-blue-600 rounded-full ring-2 ring-white"></span>
                   )}
                </button>

                {isNotificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl ring-1 ring-black/5 overflow-hidden z-50 animate-in fade-in slide-in-from-top-1">
                     <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <span className="text-xs font-semibold text-slate-900 uppercase">Notifications</span>
                        <button onClick={markAllRead} className="text-[10px] text-blue-600 hover:text-blue-700 font-bold">Tout lire</button>
                     </div>
                     <div className="max-h-[320px] overflow-y-auto">
                        {notifications.map(n => (
                            <div key={n.id} className="p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50">
                                <div className="text-xs font-bold text-slate-900">{n.title}</div>
                                <div className="text-[11px] text-slate-500 mt-1">{n.message}</div>
                                <div className="text-[9px] text-slate-400 mt-2 uppercase">{n.time}</div>
                            </div>
                        ))}
                     </div>
                  </div>
                )}
             </div>
             <button onClick={onLogout} className="p-2 text-slate-400 hover:text-red-500">
                <IconLogOut className="w-5 h-5" />
             </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-10">
          <div className="max-w-[1500px] mx-auto animate-in fade-in duration-300">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};
