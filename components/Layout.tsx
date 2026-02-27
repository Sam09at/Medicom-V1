import React, { ReactNode, useState, useRef, useEffect } from 'react';
import { User, SearchResult, ModuleConfiguration } from '../types';
import {
  IconCalendar,
  IconUsers,
  IconActivity,
  IconSettings,
  IconLogOut,
  IconDashboard,
  IconCreditCard,
  IconFileText,
  IconTooth,
  IconClipboard,
  IconUserPlus,
  IconMessage,
  IconSearch,
  IconClock,
  IconBell,
  IconCheck,
  IconFolder,
  IconChevronLeft,
  IconChevronRight,
  IconArchive,
  IconTruck,
  IconShield,
  IconPlus,
  IconMenu,
  IconBriefcase,
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

export const Layout: React.FC<LayoutProps> = ({
  children,
  user,
  onLogout,
  currentView,
  onChangeView,
  onSearch,
}) => {
  if (!user) return null;

  const isSuperAdmin = user.role === 'super_admin';
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node))
        setIsSearchOpen(false);
      if (notifRef.current && !notifRef.current.contains(event.target as Node))
        setIsNotificationsOpen(false);
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
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const getFilteredMenuItems = () => {
    if (isSuperAdmin) {
      return [
        { id: 'saas-dashboard', label: "Vue d'ensemble", icon: IconActivity, module: null },
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

    return doctorItems.filter((item) => item.module === null || (modules as any)[item.module]);
  };

  const menuItems = getFilteredMenuItems();

  return (
    <div className="flex h-screen bg-[#FAFAFA] font-sans text-slate-900 antialiased overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`flex-shrink-0 bg-[#FAFAFA] border-r border-slate-200/60 transition-all duration-200 flex flex-col z-30 ${isSidebarCollapsed ? 'w-[72px]' : 'w-[240px]'}`}
      >
        <div className="h-14 flex items-center px-5 border-b border-slate-200/60">
          <img src="/logo.png" alt="Medicom Logo" className="w-8 h-8 object-contain" />
          {!isSidebarCollapsed && (
            <span className="ml-3 font-semibold text-slate-900 text-[14px] tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>Medicom</span>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-[13px] font-medium rounded-[6px] transition-all duration-200 ease-out group relative ${currentView === item.id
                ? 'bg-white text-gray-900 shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-slate-200/60'
                : 'text-gray-500 hover:text-gray-900 hover:bg-slate-200/40 border border-transparent'
                } ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
              title={isSidebarCollapsed ? item.label : ''}
            >
              <item.icon
                className={`w-[16px] h-[16px] ${currentView === item.id ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-700'}`}
              />
              {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-200/60">
          <div
            className={`flex items-center gap-3 p-2 rounded-[8px] hover:bg-white border border-transparent hover:border-slate-200/60 hover:shadow-[0_1px_3px_rgba(0,0,0,0.05)] transition-all cursor-pointer ${isSidebarCollapsed ? 'justify-center' : ''}`}
          >
            <img src={user.avatar} alt="" className="w-8 h-8 rounded-full border border-slate-200" />
            {!isSidebarCollapsed && (
              <div className="flex-1 min-w-0 text-left">
                <p className="text-[13px] font-semibold text-slate-900 truncate">{user.name}</p>
                <p className="text-[11px] font-medium text-slate-500 truncate">
                  {user.clinicName || 'Super Admin'}
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white rounded-tl-[12px] border-l border-t border-slate-200/60 shadow-[-4px_0_24px_rgba(0,0,0,0.02)] relative z-40">
        <header className="h-14 bg-white border-b border-slate-200/60 flex items-center justify-between px-6 sticky top-0 z-20">
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-[6px] transition-colors"
            >
              <IconMenu className="w-5 h-5" />
            </button>
            <div className="h-4 w-px bg-slate-200"></div>
            <div className="relative max-w-sm w-full" ref={searchRef}>
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearch}
                placeholder="Recherche..."
                className="w-full pl-9 pr-4 py-1.5 text-[13px] font-medium bg-white border border-slate-200/60 shadow-[0_1px_2px_rgba(0,0,0,0.03)] rounded-[6px] focus:outline-none focus:ring-1 focus:ring-gray-300 transition-all cursor-pointer placeholder:font-normal"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {!isSuperAdmin && (
              <button className="btn-primary">
                <IconPlus className="w-4 h-4" /> Nouveau Patient
              </button>
            )}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="p-2 text-gray-400 hover:text-gray-900 hover:bg-slate-50 rounded-[6px] transition-colors relative"
              >
                <IconBell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-blue-600 rounded-full ring-2 ring-white"></span>
                )}
              </button>

              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-[8px] shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-1">
                  <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-white">
                    <span className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">
                      Notifications
                    </span>
                    <button
                      onClick={markAllRead}
                      className="text-[12px] text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Tout lire
                    </button>
                  </div>
                  <div className="max-h-[320px] overflow-y-auto">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className="p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 cursor-pointer"
                      >
                        <div className="text-[13px] font-medium text-slate-900">{n.title}</div>
                        <div className="text-[13px] text-slate-500 mt-0.5">{n.message}</div>
                        <div className="text-[11px] text-slate-400 mt-2 uppercase tracking-wide">{n.time}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button onClick={onLogout} className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-[6px] transition-colors">
              <IconLogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-10 relative">
          <div className="max-w-[1700px] w-full mx-auto animate-in fade-in duration-300">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};
