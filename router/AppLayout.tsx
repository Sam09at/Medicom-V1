import React, { useState, useRef, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useMedicomStore } from '../store';
import { SearchResult, ModuleConfiguration } from '../types';
import { MOCK_PATIENTS, MOCK_NOTIFICATIONS } from '../constants';
import { CommandPalette } from '../components/CommandPalette';
import { useWaitingRoom } from '../hooks/useWaitingRoom';

import {
  IconCalendar,
  IconUsers,
  IconSettings,
  IconLogOut,
  IconDashboard,
  IconCreditCard,
  IconFileText,
  IconStethoscope,
  IconClipboard,
  IconMessage,
  IconSearch,
  IconBell,
  IconFolder,
  IconBox,
  IconTruck,
  IconActivity,
  IconPlus,
  IconMenu,
} from '../components/Icons';

export const AppLayout: React.FC = () => {
  const currentUser = useMedicomStore((s) => s.currentUser);
  const navigate = useNavigate();
  const location = useLocation();

  // We mock/use waiting room hook
  const { waitingPatients } = useWaitingRoom();
  const waitingCount = waitingPatients?.length || 0;

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!currentUser) return null;

  const modules = currentUser.enabledModules || ({} as ModuleConfiguration);

  type MenuItem = {
    path: string;
    label: string;
    icon: React.FC<{ className?: string }>;
    module: string | null;
    badge?: number;
  };

  const menuGroups: { label: string; items: MenuItem[] }[] = [
    {
      label: 'PRINCIPAL',
      items: [
        {
          path: '/app/dashboard',
          label: 'Tableau de bord',
          icon: IconDashboard,
          module: 'dashboard',
        },
        {
          path: '/app/waiting-room',
          label: "Salle d'attente",
          icon: IconUsers,
          module: null,
          badge: waitingCount,
        },
        { path: '/app/calendar', label: 'Calendrier', icon: IconCalendar, module: 'calendar' },
        { path: '/app/patients', label: 'Patients', icon: IconUsers, module: 'patients' },
      ],
    },
    {
      label: 'CLINIQUE',
      items: [
        {
          path: '/app/treatments',
          label: 'Traitements',
          icon: IconStethoscope,
          module: 'treatments',
        },
        { path: '/app/consultations', label: 'Consultations', icon: IconClipboard, module: null },
        { path: '/app/records', label: 'Dossiers', icon: IconFolder, module: 'records' },
        { path: '/app/documents', label: 'Documents', icon: IconFileText, module: 'documents' },
      ],
    },
    {
      label: 'GESTION',
      items: [
        { path: '/app/billing', label: 'Facturation', icon: IconCreditCard, module: 'billing' },
        { path: '/app/inventory', label: 'Inventaire', icon: IconBox, module: 'inventory' },
        { path: '/app/lab-orders', label: 'Ordres Labo', icon: IconTruck, module: 'labOrders' },
        { path: '/app/reports', label: 'Rapports', icon: IconActivity, module: 'reports' },
      ],
    },
    {
      label: 'SUPPORT',
      items: [
        { path: '/app/support', label: 'Support', icon: IconMessage, module: 'support' },
        { path: '/app/settings', label: 'Paramètres', icon: IconSettings, module: null },
      ],
    },
  ];

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.trim().length > 0) {
      const lowerQuery = query.toLowerCase();
      const results: SearchResult[] = [];
      MOCK_PATIENTS.forEach((p) => {
        if (
          p.firstName.toLowerCase().includes(lowerQuery) ||
          p.lastName.toLowerCase().includes(lowerQuery)
        ) {
          results.push({
            id: p.id,
            type: 'Patient',
            title: `${p.firstName} ${p.lastName}`,
            subtitle: p.phone,
          });
        }
      });
      setSearchResults(results.slice(0, 10));
      setIsSearchOpen(true);
    } else {
      setIsSearchOpen(false);
    }
  };

  const markAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const handleLogout = () => {
    useMedicomStore.getState().setCurrentUser(null);
    useMedicomStore.getState().setCurrentTenant(null);
    navigate('/');
  };

  const pathParts = location.pathname.split('/').filter(Boolean);
  const currentSectionName =
    pathParts.length > 1
      ? pathParts[1].charAt(0).toUpperCase() + pathParts[1].slice(1)
      : 'Dashboard';

  return (
    <>
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />

      <div className="flex bg-white font-sans text-slate-900 antialiased h-screen overflow-hidden">
        <aside
          className={`flex-shrink-0 bg-white border-r border-slate-100 transition-all duration-150 flex flex-col z-30 ${isSidebarCollapsed ? 'w-[64px]' : 'w-[220px]'}`}
        >
          <div className="h-12 flex items-center px-4 border-b border-slate-100 shrink-0">
            <img
              src="/logo.png"
              alt="Medicom Logo"
              className="w-6 h-6 object-contain shrink-0 cursor-pointer"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            />
            {!isSidebarCollapsed && (
              <span className="ml-2 text-[14px] font-bold text-slate-900 truncate tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>Medicom</span>
            )}
          </div>

          <nav className="flex-1 overflow-y-auto py-4 space-y-6 scrollbar-hide">
            {menuGroups.map((group, idx) => {
              const availableItems = group.items.filter(
                (item) => item.module === null || (modules as any)[item.module]
              );
              if (availableItems.length === 0) return null;

              return (
                <div key={idx}>
                  {!isSidebarCollapsed && (
                    <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 px-3 pt-5 pb-1.5">
                      {group.label}
                    </div>
                  )}
                  <div className="space-y-0.5">
                    {availableItems.map((item) => (
                      <button
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        className={`w-full flex items-center justify-between h-10 px-4 mx-2 rounded-[30px] text-[14px] transition-all duration-300 ease-out group relative ${isActive(item.path)
                          ? 'bg-[#0F0F0F] text-white font-medium'
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                        style={{ width: 'calc(100% - 16px)' }}
                        title={isSidebarCollapsed ? item.label : ''}
                      >
                        <div
                          className={`flex items-center gap-2.5 ${isSidebarCollapsed ? 'mx-auto' : ''}`}
                        >
                          <item.icon className="w-[16px] h-[16px] text-inherit" />
                          {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                        </div>

                        {!isSidebarCollapsed && item.badge !== undefined && item.badge > 0 && (
                          <span className={`${isActive(item.path) ? 'bg-white text-[#0F0F0F]' : 'bg-slate-900 text-white'} rounded-[30px] px-1.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] ml-auto shrink-0 font-medium`}>
                            {item.badge}
                          </span>
                        )}
                        {isSidebarCollapsed && item.badge !== undefined && item.badge > 0 && (
                          <span className={`absolute top-1 right-2 w-2 h-2 ${isActive(item.path) ? 'bg-white' : 'bg-slate-900'} rounded-full`}></span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </nav>

          <div className="p-3 border-t border-slate-100 shrink-0">
            <div
              className={`flex items-center gap-2 ${isSidebarCollapsed ? 'justify-center' : ''}`}
            >
              <img
                src={currentUser.avatar}
                alt=""
                className="w-[26px] h-[26px] rounded-full shrink-0 object-cover"
              />
              {!isSidebarCollapsed && (
                <>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-[13px] font-semibold text-slate-900 truncate">{currentUser.name}</p>
                  </div>
                  <button onClick={handleLogout} className="btn-ghost !px-1.5 hover:text-rose-500 rounded-[30px]" title="Logout">
                    <IconLogOut className="w-[15px] h-[15px]" />
                  </button>
                </>
              )}
            </div>
          </div>
        </aside>

        <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white relative">
          <header className="h-14 bg-white/80 backdrop-blur-sm sticky top-0 z-40 px-8 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-gray-900">
                {currentSectionName.replace('-', ' ')}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div
                onClick={() => setIsCommandPaletteOpen(true)}
                className="h-7 w-40 rounded bg-gray-50 border border-gray-200 text-xs text-gray-400 px-2 flex items-center gap-1 cursor-pointer transition-colors duration-150 hover:border-gray-300"
              >
                <IconSearch className="w-3.5 h-3.5" />
                <span className="flex-1">Recherche...</span>
                <kbd className="font-medium text-[10px] text-gray-400">⌘K</kbd>
              </div>

              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="btn-ghost relative px-1 flex items-center justify-center -mr-1"
                >
                  <IconBell className="w-[15px] h-[15px]" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-gray-900 rounded-full border border-white"></span>
                  )}
                </button>

                {isNotificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white/90 backdrop-blur-sm rounded-md shadow-[0_4px_16px_rgba(0,0,0,0.08)] ring-1 ring-gray-100 overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                      <span className="text-xs font-semibold text-gray-900 uppercase tracking-wider">
                        Notifications{' '}
                        <span className="bg-gray-200 text-gray-600 px-1.5 rounded ml-1">
                          {unreadCount}
                        </span>
                      </span>
                      <button
                        onClick={markAllRead}
                        className="text-[10px] text-blue-600 hover:text-blue-700 font-medium uppercase tracking-wide"
                      >
                        Tout lire
                      </button>
                    </div>
                    <div className="max-h-[320px] overflow-y-auto">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          className="p-4 border-b border-gray-50 last:border-0 hover:bg-gray-50/80 transition-colors cursor-pointer flex gap-3"
                        >
                          <div
                            className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.read ? 'bg-gray-200' : 'bg-gray-900'}`}
                          ></div>
                          <div className="flex-1">
                            <div
                              className={`text-sm ${n.read ? 'text-gray-600' : 'font-semibold text-gray-900'}`}
                            >
                              {n.title}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">{n.message}</div>
                            <div className="text-[10px] text-gray-400 mt-1.5 font-medium uppercase">
                              {n.time}
                            </div>
                          </div>
                        </div>
                      ))}
                      {notifications.length === 0 && (
                        <div className="p-6 text-center text-gray-500 text-sm font-medium">
                          Aucune notification
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <img
                src={currentUser.avatar}
                alt=""
                className="w-7 h-7 rounded-full bg-gray-200 object-cover border border-gray-100"
              />
            </div>
          </header>

          <div className="flex-1 overflow-auto bg-white">
            <div className="max-w-[1700px] w-full mx-auto px-8 py-4 animate-[fadeIn_0.2s_ease-out]">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </>
  );
};
