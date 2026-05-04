import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { User } from '../types';
import {
  IconActivity,
  IconDashboard,
  IconBriefcase,
  IconFileText,
  IconGlobe,
  IconShield,
  IconMessage,
  IconSettings,
  IconChevronRight,
  IconLogOut,
} from './Icons';

interface SASubItem {
  id: string;
  label: string;
  badge?: number;
  badgeColor?: 'orange' | 'green' | 'blue';
}

interface SANavEntry {
  id: string;
  label: string;
  icon: React.FC<{ className?: string }>;
  sub?: SASubItem[];
}

const SA_NAV: SANavEntry[] = [
  { id: '/admin/dashboard', label: "Vue d'ensemble", icon: IconActivity },
  {
    id: '/admin/cabinets',
    label: 'Cabinets',
    icon: IconDashboard,
    sub: [
      { id: '/admin/cabinets', label: 'Tous les cabinets' },
      { id: '/admin/cabinets?filter=active',    label: 'Actifs',    badge: 14, badgeColor: 'green' },
      { id: '/admin/cabinets?filter=trial',     label: 'En essai',  badge: 3,  badgeColor: 'blue' },
      { id: '/admin/cabinets?filter=suspended', label: 'Suspendus', badge: 2,  badgeColor: 'orange' },
      { id: '/admin/landing-pages',             label: 'Pages Web', badge: undefined },
    ],
  },
  {
    id: '/admin/crm',
    label: 'CRM & Growth',
    icon: IconBriefcase,
    sub: [
      { id: '/admin/crm', label: 'Leads & Onboarding' },
      { id: '/admin/crm?view=pipeline', label: 'Pipeline' },
    ],
  },
  { id: '/admin/administration', label: 'Administration', icon: IconShield },
  { id: '/admin/reports',        label: 'Intelligence',   icon: IconFileText },
  { id: '/admin/messaging',      label: 'Messagerie',     icon: IconMessage },
  { id: '/admin/support',        label: 'Support',        icon: IconGlobe },
  { id: '/admin/settings',       label: 'Paramètres',     icon: IconSettings },
];

/* ─────────────────────────────────────────────
   NavGroup — animated accordion nav item
───────────────────────────────────────────── */
interface NavGroupProps {
  entry: SANavEntry;
  isActive: boolean;
  isOpen: boolean;
  isSidebarCollapsed: boolean;
  onToggle: () => void;
  onNavigate: (path: string) => void;
  activeSubView: (id: string) => boolean;
}

const NavGroup: React.FC<NavGroupProps> = ({
  entry,
  isActive,
  isOpen,
  isSidebarCollapsed,
  onToggle,
  onNavigate,
  activeSubView,
}) => {
  const hasSubNav = !!entry.sub;
  const innerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  /* Measure inner content height whenever it changes */
  useEffect(() => {
    if (!innerRef.current) return;
    setHeight(innerRef.current.scrollHeight);
  }, [entry.sub]);

  return (
    <div className="w-full">
      {/* ── Row button ── */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-[11px] rounded-[30px] transition-all duration-300 ease-in-out cursor-pointer group hover:bg-black/[0.02]"
        style={{
          backgroundColor: !hasSubNav && isActive ? '#FFFFFF' : 'transparent',
          boxShadow: 'none',
        }}
      >
        {/* Icon pill */}
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
            transition: 'background-color 0.3s ease-in-out, color 0.3s ease-in-out',
            flexShrink: 0,
          }}
        >
          <entry.icon className="w-4 h-4" />
        </div>

        {!isSidebarCollapsed && (
          <>
            <span
              style={{
                flex: 1,
                textAlign: 'left',
                fontSize: '13.5px',
                fontWeight: 600,
                color: isActive ? '#0f0f10' : '#64748b',
                transition: 'color 0.3s ease-in-out',
                letterSpacing: '-0.01em',
              }}
            >
              {entry.label}
            </span>
            {hasSubNav && (
              <span
                style={{
                  display: 'flex',
                  transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                <IconChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </span>
            )}
          </>
        )}
      </button>

      {/* ── Smooth accordion sub-nav ── */}
      {hasSubNav && !isSidebarCollapsed && (
        <div
          style={{
            maxHeight: isOpen ? `${height}px` : '0px',
            opacity: isOpen ? 1 : 0,
            overflow: 'hidden',
            transition: 'max-height 0.28s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.22s ease',
          }}
        >
          <div
            ref={innerRef}
            className="ml-5 pl-4 pt-1.5 pb-2 border-l border-black/[0.06] flex flex-col gap-0.5"
          >
            {entry.sub?.map((sub) => {
              const isSubActive = activeSubView(sub.id);
              return (
                <button
                  key={sub.id}
                  onClick={() => onNavigate(sub.id)}
                  className="w-full flex items-center gap-3 px-4 py-[9px] rounded-[30px] text-[13px] hover:bg-black/[0.02] transition-colors duration-200"
                  style={{ color: isSubActive ? '#0f0f10' : '#94a3b8', fontWeight: 600 }}
                >
                  {/* Dot */}
                  <span
                    style={{
                      width: '5px',
                      height: '5px',
                      borderRadius: '50%',
                      flexShrink: 0,
                      backgroundColor: isSubActive ? '#0f0f10' : 'rgba(0,0,0,0.12)',
                      transition: 'background-color 0.25s ease',
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
                        backgroundColor: sub.badgeColor === 'green' ? '#ecfdf5' : sub.badgeColor === 'blue' ? '#eff6ff' : '#fff7ed',
                        color: sub.badgeColor === 'green' ? '#059669' : sub.badgeColor === 'blue' ? '#2563eb' : '#d97706',
                      }}
                    >
                      {sub.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────
   Props
───────────────────────────────────────────── */
interface SuperAdminSidebarProps {
  user: User;
  onLogout: () => void;
  isSidebarCollapsed: boolean;
  onToggleCollapse?: () => void;
}

const SA_FONT = { fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" } as const;

/* ─────────────────────────────────────────────
   Main Sidebar
───────────────────────────────────────────── */
export const SuperAdminSidebar: React.FC<SuperAdminSidebarProps> = ({
  user,
  onLogout,
  isSidebarCollapsed,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname + location.search;

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const defaults: Record<string, boolean> = {};
    SA_NAV.forEach((entry) => {
      if (entry.sub && location.pathname.startsWith(entry.id)) {
        defaults[entry.id] = true;
      }
    });
    return defaults;
  });

  const toggleGroup = (id: string) =>
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));

  const entryActive = (entry: SANavEntry) => location.pathname.startsWith(entry.id);

  const activeSubView = (subId: string) =>
    currentPath === subId || (subId === location.pathname && currentPath === location.pathname);

  return (
    <aside
      id="sa-sidebar-v5"
      className={`flex-shrink-0 flex flex-col z-30 transition-all duration-300 relative ${isSidebarCollapsed ? 'w-[70px]' : 'w-[260px]'
        }`}
      style={{ ...SA_FONT, backgroundColor: '#F8F8F6', borderRight: '1px solid #E5E7EB' }}
    >
      {/* ── Logo ── */}
      <div className={`flex items-center gap-3 px-5 pt-8 pb-6 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
        <div
          style={{
            width: '38px', height: '38px', borderRadius: '12px',
            backgroundColor: '#0f0f10', display: 'flex',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}
        >
          <span style={{ color: 'white', fontSize: '16px', fontWeight: 800 }}>M</span>
        </div>
        {!isSidebarCollapsed && (
          <div className="min-w-0">
            <p style={{ fontSize: '14px', fontWeight: 700, color: '#0f0f10', margin: 0, letterSpacing: '-0.02em' }}>
              Medicom Admin
            </p>
            <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500, margin: 0 }}>
              Super Admin Portal
            </p>
          </div>
        )}
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 overflow-y-auto px-4 pb-6 space-y-1 scrollbar-hide">
        {SA_NAV.map((entry) => (
          <NavGroup
            key={entry.id}
            entry={entry}
            isActive={entryActive(entry)}
            isOpen={!!openGroups[entry.id]}
            isSidebarCollapsed={isSidebarCollapsed}
            onToggle={() => (entry.sub ? toggleGroup(entry.id) : navigate(entry.id))}
            onNavigate={navigate}
            activeSubView={activeSubView}
          />
        ))}
      </nav>

      {/* ── User footer ── */}
      <div className="px-4 pb-6 mt-auto">
        <div
          className={`flex items-center gap-3 p-3 rounded-[30px] transition-all duration-300 ease-in-out cursor-pointer hover:bg-black/[0.03] ${isSidebarCollapsed ? 'justify-center' : ''
            }`}
        >
          <img src={user.avatar} className="w-9 h-9 rounded-full border border-black/[0.05]" alt="" />
          {!isSidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f0f10', margin: 0 }}>
                {user.name || 'Sami Atif'}
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
              <IconLogOut className="w-4 h-4" />
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
