
import React, { ReactNode, useState, useRef, useEffect } from 'react';
import { User, SearchResult } from '../types';
import { 
  IconCalendar, IconUsers, IconActivity, IconSettings, IconLogOut, 
  IconDashboard, IconCreditCard, IconFileText, IconTooth, IconClipboard, 
  IconUserPlus, IconMessage, IconSearch, IconClock, IconBell, IconCheck, 
  IconFolder, IconChevronLeft, IconChevronRight, IconArchive, IconTruck,
  IconShield, IconPlus, IconCommand
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
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const quickActionRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) setIsSearchOpen(false);
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) setIsNotificationsOpen(false);
      if (quickActionRef.current && !quickActionRef.current.contains(event.target as Node)) setIsQuickActionOpen(false);
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
      setSearchResults([]);
      setIsSearchOpen(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
      if (result.type === 'Patient') onChangeView('patients');
      else if (result.type === 'RDV') onChangeView('calendar');
      else if (result.type === 'Traitement') onChangeView('treatments');
      setIsSearchOpen(false);
      setSearchQuery('');
  };

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const menuItems = isSuperAdmin ? [
    { id: 'saas-dashboard', label: 'Overview', icon: IconActivity },
    { id: 'cabinets', label: 'Cabinets', icon: IconDashboard },
    { id: 'saas-admin', label: 'Administration', icon: IconShield },
    { id: 'crm', label: 'CRM', icon: IconUserPlus },
    { id: 'reports', label: 'Rapports', icon: IconFileText },
    { id: 'support', label: 'Support', icon: IconMessage },
    { id: 'settings', label: 'Paramètres', icon: IconSettings },
  ] : [
    { id: 'dashboard', label: 'Tableau de bord', icon: IconDashboard },
    { id: 'calendar', label: 'Calendrier', icon: IconCalendar },
    { id: 'waiting-room', label: "File d'attente", icon: IconClock },
    { id: 'patients', label: 'Patients', icon: IconUsers },
    { id: 'treatments', label: 'Traitements', icon: IconTooth },
    { id: 'inventory', label: 'Stock', icon: IconArchive }, 
    { id: 'lab-orders', label: 'Prothèses', icon: IconTruck }, 
    { id: 'documents', label: 'Documents', icon: IconFolder },
    { id: 'records', label: 'Dossiers', icon: IconClipboard },
    { id: 'billing', label: 'Finance', icon: IconCreditCard },
    { id: 'reports', label: 'Rapports', icon: IconFileText },
    { id: 'support', label: 'Support', icon: IconMessage },
    { id: 'settings', label: 'Paramètres', icon: IconSettings },
  ];

  return (
    <div className="flex h-screen bg-slate-50/50 text-slate-900 overflow-hidden font-sans antialiased">
      {/* Sidebar */}
      <aside 
        className={`${isSidebarCollapsed ? 'w-[68px]' : 'w-[240px]'} bg-white border-r border-slate-200 flex flex-col z-20 transition-all duration-300 relative`}
      >
        {/* Brand */}
        <div className="h-14 flex items-center px-4 border-b border-slate-100/50">
          <div className={`flex items-center gap-3 w-full ${isSidebarCollapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 min-w-[2rem] bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">
              M
            </div>
            {!isSidebarCollapsed && (
              <span className="text-sm font-bold text-slate-900 tracking-tight transition-opacity duration-200">
                Medicom
              </span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto overflow-x-hidden scrollbar-hide">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-150 group relative ${
                currentView === item.id
                  ? 'bg-slate-100 text-slate-900 font-medium'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              } ${isSidebarCollapsed ? 'justify-center' : ''}`}
              title={isSidebarCollapsed ? item.label : ''}
            >
              <item.icon className={`w-4 h-4 min-w-[1rem] ${currentView === item.id ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'}`} />
              {!isSidebarCollapsed && (
                <span className="transition-opacity duration-200 whitespace-nowrap">
                  {item.label}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* User Profile */}
        <div className="p-2 border-t border-slate-100">
          <div className={`flex items-center gap-3 px-2 py-2 rounded-md hover:bg-slate-50 transition-colors cursor-pointer ${isSidebarCollapsed ? 'justify-center' : ''}`}>
            <img src={user.avatar} alt="User" className="w-8 h-8 rounded-full bg-slate-100 object-cover border border-slate-200" />
            {!isSidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{user.name}</p>
                <p className="text-[10px] text-slate-500 truncate">{user.clinicName || 'Super Admin'}</p>
              </div>
            )}
            {!isSidebarCollapsed && (
                <button onClick={onLogout} className="text-slate-400 hover:text-red-600 transition-colors">
                    <IconLogOut className="w-4 h-4" />
                </button>
            )}
          </div>
        </div>

        {/* Toggle */}
        <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="absolute -right-3 top-20 bg-white border border-slate-200 rounded-full p-1 text-slate-400 hover:text-slate-600 shadow-sm z-30 hidden md:flex items-center justify-center w-6 h-6 hover:ring-2 hover:ring-slate-100"
        >
            {isSidebarCollapsed ? <IconChevronRight className="w-3 h-3" /> : <IconChevronLeft className="w-3 h-3" />}
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50/30">
        {/* Header */}
        <header className="h-14 bg-white/80 backdrop-blur-sm border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-20">
          <div className="flex items-center gap-4 flex-1">
             {/* Breadcrumbs / Title */}
             <div className="flex items-center text-sm">
                <span className="text-slate-500 font-medium">App</span>
                <span className="text-slate-300 mx-2">/</span>
                <span className="font-semibold text-slate-900">{menuItems.find(i => i.id === currentView)?.label}</span>
             </div>

             {/* Search Bar */}
             {!isSuperAdmin && (
                 <div className="relative max-w-sm w-full ml-4" ref={searchRef}>
                    <div className="relative group">
                        <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-slate-600 transition-colors" />
                        <input 
                            type="text" 
                            value={searchQuery}
                            onChange={handleSearch}
                            onFocus={() => searchQuery.length > 0 && setIsSearchOpen(true)}
                            placeholder="Rechercher..." 
                            className="w-full pl-9 pr-12 py-1.5 text-sm bg-slate-100/50 border border-transparent rounded-md focus:bg-white focus:border-slate-300 focus:ring-2 focus:ring-slate-100 transition-all placeholder:text-slate-400"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none flex items-center">
                            <kbd className="hidden sm:inline-flex items-center h-5 px-1.5 text-[10px] font-medium text-slate-500 bg-white border border-slate-200 rounded shadow-sm font-sans">⌘K</kbd>
                        </div>
                    </div>

                    {isSearchOpen && searchResults.length > 0 && (
                        <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-lg border border-slate-200 shadow-xl ring-1 ring-black/5 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200 z-50">
                            <div className="py-2">
                                <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Résultats</div>
                                {searchResults.map((result) => (
                                    <button 
                                        key={result.id}
                                        onClick={() => handleResultClick(result)}
                                        className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center gap-3 group transition-colors"
                                    >
                                        <div className={`p-1.5 rounded-md ${
                                            result.type === 'Patient' ? 'bg-blue-50 text-blue-600' :
                                            result.type === 'RDV' ? 'bg-purple-50 text-purple-600' :
                                            'bg-orange-50 text-orange-600'
                                        }`}>
                                            {result.type === 'Patient' ? <IconUsers className="w-4 h-4" /> :
                                             result.type === 'RDV' ? <IconCalendar className="w-4 h-4" /> :
                                             <IconTooth className="w-4 h-4" />}
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-slate-900 group-hover:text-blue-600">{result.title}</div>
                                            <div className="text-xs text-slate-500">{result.subtitle}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                 </div>
             )}
          </div>

          <div className="flex items-center gap-3">
             {/* Quick Actions */}
             {!isSuperAdmin && (
                 <div className="relative" ref={quickActionRef}>
                     <button 
                        onClick={() => setIsQuickActionOpen(!isQuickActionOpen)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-all shadow-sm active:scale-95"
                     >
                         <IconPlus className="w-4 h-4" /> <span className="hidden sm:inline">Nouveau</span>
                     </button>
                     
                     {isQuickActionOpen && (
                         <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-xl ring-1 ring-black/5 py-1 z-50 animate-in fade-in slide-in-from-top-1">
                             <button onClick={() => onChangeView('patients')} className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2">
                                 <IconUserPlus className="w-4 h-4" /> Patient
                             </button>
                             <button onClick={() => onChangeView('calendar')} className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2">
                                 <IconCalendar className="w-4 h-4" /> Rendez-vous
                             </button>
                             <button onClick={() => onChangeView('billing')} className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2">
                                 <IconCreditCard className="w-4 h-4" /> Facture
                             </button>
                         </div>
                     )}
                 </div>
             )}

             {/* Notifications */}
             <div className="relative" ref={notifRef}>
                <button 
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors relative"
                >
                   <IconBell className="w-5 h-5" />
                   {unreadCount > 0 && (
                     <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
                   )}
                </button>

                {isNotificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl ring-1 ring-black/5 overflow-hidden z-50 animate-in fade-in slide-in-from-top-1">
                     <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <span className="text-xs font-semibold text-slate-900">NOTIFICATIONS</span>
                        {unreadCount > 0 && (
                          <button onClick={markAllRead} className="text-[10px] text-blue-600 hover:text-blue-700 font-medium">Tout lire</button>
                        )}
                     </div>
                     <div className="max-h-[320px] overflow-y-auto">
                        {notifications.length === 0 ? (
                           <div className="p-8 text-center text-sm text-slate-400">Aucune notification</div>
                        ) : (
                           notifications.map(notif => (
                              <div key={notif.id} className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors ${!notif.read ? 'bg-blue-50/30' : ''}`}>
                                 <div className="flex gap-3">
                                    <div className={`w-1.5 h-1.5 mt-2 rounded-full flex-shrink-0 ${
                                       notif.type === 'success' ? 'bg-green-500' :
                                       notif.type === 'warning' ? 'bg-orange-500' : 'bg-blue-500'
                                    }`}></div>
                                    <div>
                                       <p className={`text-sm ${!notif.read ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>{notif.title}</p>
                                       <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{notif.message}</p>
                                       <p className="text-[10px] text-slate-400 mt-1.5">{notif.time}</p>
                                    </div>
                                 </div>
                              </div>
                           ))
                        )}
                     </div>
                  </div>
                )}
             </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 md:p-8">
          <div className="max-w-[1600px] mx-auto h-full flex flex-col">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};
