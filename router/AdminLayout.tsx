import React, { useState, useRef, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useMedicomStore } from '../store';
import { CommandPalette } from '../components/CommandPalette';
import { MOCK_NOTIFICATIONS } from '../constants';
import {
  IconActivity,
  IconSettings,
  IconLogOut,
  IconDashboard,
  IconFileText,
  IconShield,
  IconMessage,
  IconSearch,
  IconBell,
  IconMenu,
  IconBriefcase,
  IconLifeBuoy,
} from '../components/Icons';

export const AdminLayout: React.FC = () => {
  const currentUser = useMedicomStore((s) => s.currentUser);
  const navigate = useNavigate();
  const location = useLocation();

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
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

  const menuItems = [
    { path: '/admin/dashboard', label: "Vue d'ensemble", icon: IconActivity },
    { path: '/admin/cabinets', label: 'Cabinets', icon: IconDashboard },
    { path: '/admin/crm', label: 'CRM & Growth', icon: IconBriefcase },
    { path: '/admin/administration', label: 'Administration', icon: IconShield },
    { path: '/admin/reports', label: 'Intelligence', icon: IconFileText },
    { path: '/admin/support', label: 'Support', icon: IconLifeBuoy },
    { path: '/admin/settings', label: 'Paramètres', icon: IconSettings },
  ];

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

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
      : "Vue d'ensemble";

  return (
    <>
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />

      <div className="flex h-screen bg-gray-50 font-sans text-gray-800 antialiased overflow-hidden">
        <aside
          className={`flex-shrink-0 bg-gray-50 border-r border-gray-100/60 transition-all duration-200 flex flex-col z-30 ${isSidebarCollapsed ? 'w-[64px]' : 'w-[240px]'}`}
        >
          <div className="h-16 flex items-center px-4 pt-2 shrink-0">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0">
              M
            </div>
            {!isSidebarCollapsed && (
              <div className="ml-3 flex flex-col min-w-0">
                <span className="font-semibold text-gray-900 text-sm tracking-tight truncate">
                  Medicom Admin
                </span>
                <span className="text-xs text-gray-500 truncate">Super Admin Portal</span>
              </div>
            )}
          </div>

          <nav className="flex-1 overflow-y-auto py-6 space-y-1 scrollbar-hide">
            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-2.5 px-3 h-11 mx-2 rounded-xl text-sm font-bold transition-all group relative ${
                  isActive(item.path)
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200/50'
                    : 'text-gray-600 hover:bg-white hover:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.02)] hover:text-gray-900 border border-transparent hover:border-gray-100/50'
                }`}
                style={{ width: 'calc(100% - 16px)' }}
                title={isSidebarCollapsed ? item.label : ''}
              >
                <div className={`flex items-center gap-2.5 ${isSidebarCollapsed ? 'mx-auto' : ''}`}>
                  <item.icon
                    className={`w-[18px] h-[18px] ${isActive(item.path) ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'}`}
                  />
                  {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                </div>
              </button>
            ))}
          </nav>

          <div className="p-3 border-t border-gray-200 shrink-0">
            <div
              className={`flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 cursor-pointer ${isSidebarCollapsed ? 'justify-center' : ''}`}
            >
              <img
                src={currentUser.avatar}
                alt=""
                className="w-8 h-8 rounded-full border border-gray-200 shrink-0 bg-white"
              />
              {!isSidebarCollapsed && (
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-semibold text-gray-900 truncate">{currentUser.name}</p>
                  <p className="text-xs text-gray-500 truncate">Super Admin</p>
                </div>
              )}
              {!isSidebarCollapsed && (
                <button
                  onClick={handleLogout}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md transition-colors"
                >
                  <IconLogOut className="w-4 h-4" />
                </button>
              )}
            </div>
            {isSidebarCollapsed && (
              <button
                onClick={handleLogout}
                className="mt-2 w-full flex justify-center p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
                title="Logout"
              >
                <IconLogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </aside>

        <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-gray-50">
          <header className="h-16 glass-header flex items-center justify-between px-8 shrink-0 z-20">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="p-1.5 -ml-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
              >
                <IconMenu className="w-5 h-5" />
              </button>

              {/* Breadcrumb */}
              <div className="flex items-center text-sm">
                <span className="text-gray-400 hidden sm:inline">Admin</span>
                <span className="text-gray-300 mx-2 hidden sm:inline">/</span>
                <span className="text-gray-600 font-semibold">
                  {currentSectionName.replace('-', ' ')}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsCommandPaletteOpen(true)}
                className="hidden md:flex items-center gap-2 border border-gray-300 rounded-lg bg-gray-50 px-3 h-8 text-xs text-gray-500 hover:bg-gray-100 transition-colors"
              >
                <IconSearch className="w-3.5 h-3.5" />
                <span>Recherche Admin...</span>
                <kbd className="hidden sm:inline-flex bg-white border border-gray-200 rounded px-1.5 text-[10px] uppercase font-semibold">
                  ⌘K
                </kbd>
              </button>

              <button
                onClick={() => setIsCommandPaletteOpen(true)}
                className="md:hidden p-2 text-gray-400 hover:text-gray-600"
              >
                <IconSearch className="w-5 h-5" />
              </button>

              <div className="w-px h-5 bg-gray-200 mx-1 hidden md:block"></div>

              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors relative rounded-md hover:bg-gray-50"
                >
                  <IconBell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-indigo-600 rounded-full border-2 border-white"></span>
                  )}
                </button>
                {isNotificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg ring-1 ring-gray-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-1">
                    <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                      <span className="text-xs font-semibold text-gray-900 uppercase tracking-wider">
                        Notifications{' '}
                        <span className="bg-gray-200 text-gray-600 px-1.5 rounded-full ml-1">
                          {unreadCount}
                        </span>
                      </span>
                      <button
                        onClick={markAllRead}
                        className="text-[10px] text-indigo-600 hover:text-indigo-700 font-bold uppercase tracking-wide"
                      >
                        Tout lire
                      </button>
                    </div>
                    <div className="max-h-[320px] overflow-y-auto">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          className="p-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors cursor-pointer flex gap-3"
                        >
                          <div
                            className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.read ? 'bg-gray-200' : 'bg-indigo-600'}`}
                          ></div>
                          <div className="flex-1">
                            <div
                              className={`text-sm ${n.read ? 'font-medium text-gray-700' : 'font-semibold text-gray-900'}`}
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
                        <div className="p-6 text-center text-gray-500 text-sm">
                          Aucune notification
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button className="h-8 w-8 rounded-full border border-gray-200 overflow-hidden ml-1 hover:ring-2 hover:ring-indigo-100 focus:outline-none transition-all shrink-0">
                <img src={currentUser.avatar} alt="" className="w-full h-full object-cover" />
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-auto bg-gray-50">
            <div className="max-w-7xl mx-auto p-8 animate-in fade-in duration-300">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </>
  );
};
