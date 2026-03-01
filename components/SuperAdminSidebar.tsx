import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { User } from '../types';
import {
  IconActivity,
  IconDashboard,
  IconBriefcase,
  IconFileText,
  IconShield,
  IconMessage,
  IconSettings,
  IconChevronRight,
  IconChevronLeft,
  IconLogOut,
} from './Icons';

interface SASubItem {
  id: string; // the path or view query to navigate to
  label: string;
  badge?: number;
  badgeColor?: 'orange' | 'green';
}

interface SANavEntry {
  id: string; // The base URL route
  label: string;
  icon: React.FC<{ className?: string }>;
  sub?: SASubItem[];
  defaultOpen?: boolean;
}

const SA_NAV: SANavEntry[] = [
  { id: '/admin/dashboard', label: "Vue d'ensemble", icon: IconActivity },
  {
    id: '/admin/cabinets',
    label: 'Cabinets',
    icon: IconDashboard,
    sub: [
      { id: '/admin/cabinets', label: "Vue d'ensemble" },
      { id: '/admin/cabinets?filter=active', label: 'Actifs', badge: 14, badgeColor: 'green' },
      {
        id: '/admin/cabinets?filter=suspended',
        label: 'Suspendus',
        badge: 2,
        badgeColor: 'orange',
      },
    ],
  },
  {
    id: '/admin/crm',
    label: 'CRM & Growth',
    icon: IconBriefcase,
    sub: [
      { id: '/admin/crm', label: 'Leads' },
      { id: '/admin/crm?view=pipeline', label: 'Pipeline' },
    ],
  },
  { id: '/admin/administration', label: 'Administration', icon: IconShield },
  { id: '/admin/reports', label: 'Intelligence', icon: IconFileText },
  { id: '/admin/support', label: 'Support', icon: IconMessage },
  { id: '/admin/settings', label: 'Paramètres', icon: IconSettings },
];

interface SuperAdminSidebarProps {
  user: User;
  onLogout: () => void;
  isSidebarCollapsed: boolean;
  onToggleCollapse?: () => void;
}

const SA_FONT = { fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" } as const;

export const SuperAdminSidebar: React.FC<SuperAdminSidebarProps> = ({
  user,
  onLogout,
  isSidebarCollapsed,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname + location.search;

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    // Open group if current path matches its base path
    const defaults: Record<string, boolean> = {};
    SA_NAV.forEach((entry) => {
      if (entry.sub && location.pathname.startsWith(entry.id)) {
        defaults[entry.id] = true;
      }
    });
    return defaults;
  });

  const toggleGroup = (id: string) => setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));

  // Helper to determine if a route is currently active
  const entryActive = (entry: SANavEntry) => {
    return location.pathname.startsWith(entry.id);
  };

  const activeSubView = (subId: string) => {
    // A sub view is active if the full path with query matches exactly,
    // except for the base path which is active if no query exists.
    return (
      currentPath === subId || (subId === location.pathname && currentPath === location.pathname)
    );
  };

  return (
    <aside
      id="sa-sidebar-v4"
      className={`flex-shrink-0 flex flex-col z-30 transition-all duration-300 relative ${isSidebarCollapsed ? 'w-[70px]' : 'w-[260px]'}`}
      style={{ ...SA_FONT, backgroundColor: '#F8F8F6', borderRight: '1px solid #E5E7EB' }}
    >
      <div
        className={`flex items-center gap-3 px-5 pt-8 pb-6 ${isSidebarCollapsed ? 'justify-center' : ''}`}
      >
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '12px',
            backgroundColor: '#0f0f10',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span style={{ color: 'white', fontSize: '16px', fontWeight: 800 }}>M</span>
        </div>
        {!isSidebarCollapsed && (
          <div className="min-w-0">
            <p
              style={{
                fontSize: '14px',
                fontWeight: 700,
                color: '#0f0f10',
                margin: 0,
                letterSpacing: '-0.02em',
              }}
            >
              Medicom Admin
            </p>
            <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500, margin: 0 }}>
              Super Admin Portal
            </p>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-4 pb-6 space-y-1.5 scrollbar-hide">
        {SA_NAV.map((entry) => {
          const isActive = entryActive(entry);
          const isOpen = openGroups[entry.id];
          const hasSubNav = !!entry.sub;

          return (
            <div key={entry.id} className="w-full">
              <button
                onClick={() => (hasSubNav ? toggleGroup(entry.id) : navigate(entry.id))}
                className="w-full flex items-center gap-3 px-4 py-[11px] rounded-[30px] transition-all duration-300 ease-in-out cursor-pointer group hover:bg-black/[0.02]"
                style={{
                  backgroundColor: !hasSubNav && isActive ? '#FFFFFF' : 'transparent',
                  boxShadow: 'none',
                }}
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isActive ? '#0f0f10' : 'transparent',
                    color: isActive ? '#FFFFFF' : '#94a3b8',
                    transition: 'all 0.3s ease-in-out',
                  }}
                >
                  <entry.icon className="w-4.5 h-4.5" />
                </div>
                {!isSidebarCollapsed && (
                  <>
                    <span
                      style={{
                        flex: 1,
                        textAlign: 'left',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: isActive ? '#0f0f10' : '#64748b',
                        transition: 'color 0.3s ease-in-out',
                      }}
                    >
                      {entry.label}
                    </span>
                    {hasSubNav && (
                      <IconChevronRight
                        className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`}
                      />
                    )}
                  </>
                )}
              </button>

              {hasSubNav && isOpen && !isSidebarCollapsed && (
                <div className="ml-5 pl-4 mt-2 mb-2 border-l border-black/[0.06] overflow-hidden relative flex flex-col gap-1 animate-in slide-in-from-top-2 fade-in duration-300 ease-out">
                  {entry.sub?.map((sub) => {
                    const isSubActive = activeSubView(sub.id);
                    return (
                      <button
                        key={sub.id}
                        onClick={() => navigate(sub.id)}
                        className="w-full flex items-center gap-3 px-4 py-[9px] rounded-[30px] text-[13.5px] hover:bg-black/[0.02] transition-all duration-300 ease-in-out"
                        style={{ color: isSubActive ? '#0f0f10' : '#94a3b8', fontWeight: 600 }}
                      >
                        <span
                          style={{
                            width: '5px',
                            height: '5px',
                            borderRadius: '50%',
                            backgroundColor: isSubActive ? '#0f0f10' : 'rgba(0,0,0,0.1)',
                            transition: 'all 0.3s ease-in-out',
                          }}
                        />
                        <span className="flex-1 text-left">{sub.label}</span>
                        {sub.badge && (
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '30px',
                              backgroundColor: sub.badgeColor === 'green' ? '#ecfdf5' : '#fff7ed',
                              color: sub.badgeColor === 'green' ? '#059669' : '#d97706',
                            }}
                          >
                            {sub.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="px-4 pb-6 mt-auto">
        <div
          className={`flex items-center gap-3 p-3 rounded-[30px] transition-all duration-300 ease-in-out cursor-pointer hover:bg-black/[0.03] ${isSidebarCollapsed ? 'justify-center' : ''}`}
        >
          <img src={user.avatar} className="w-9 h-9 rounded-full border border-black/[0.05]" />
          {!isSidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f0f10', margin: 0 }}>
                Sami Atif
              </p>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0, fontWeight: 500 }}>
                Super Admin
              </p>
            </div>
          )}
          {!isSidebarCollapsed && (
            <button
              onClick={onLogout}
              className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all duration-300 ease-in-out"
            >
              <IconLogOut className="w-4.5 h-4.5" />
            </button>
          )}
        </div>
        {isSidebarCollapsed && (
          <button
            onClick={onLogout}
            className="mt-3 w-full flex justify-center p-2 text-slate-400 hover:text-rose-500 rounded-[30px] hover:bg-rose-50 transition-all duration-300 ease-in-out"
            title="Déconnexion"
          >
            <IconLogOut className="w-5 h-5" />
          </button>
        )}
      </div>
    </aside>
  );
};
