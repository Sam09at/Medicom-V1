import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IconSearch,
  IconCalendar,
  IconUsers,
  IconCreditCard,
  IconSettings,
  IconPlus,
  IconCommand,
  IconArrowLeft,
} from './Icons';
import { getPatients } from '../lib/api/patients';
import { useMedicomStore } from '../store';
import { Patient } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

type CommandItem = {
  id: string;
  label: string;
  icon: React.ElementType;
  type: 'action' | 'navigation' | 'patient';
  route?: string;
  shortcut?: string;
  description?: string;
};

const COMMANDS: CommandItem[] = [
  {
    id: 'new-rdv',
    label: 'Nouveau Rendez-vous',
    icon: IconCalendar,
    type: 'action',
    shortcut: 'N',
  },
  { id: 'new-patient', label: 'Nouveau Patient', icon: IconUsers, type: 'action', shortcut: 'P' },
  {
    id: 'new-invoice',
    label: 'Nouvelle Facture',
    icon: IconCreditCard,
    type: 'action',
    shortcut: 'F',
  },
  {
    id: 'nav-dashboard',
    label: 'Aller au Dashboard',
    icon: IconArrowLeft,
    type: 'navigation',
    route: '/app/dashboard',
  },
  {
    id: 'nav-calendar',
    label: 'Aller au Calendrier',
    icon: IconCalendar,
    type: 'navigation',
    route: '/app/calendar',
  },
  {
    id: 'nav-patients',
    label: 'Aller aux Patients',
    icon: IconUsers,
    type: 'navigation',
    route: '/app/patients',
  },
  {
    id: 'nav-settings',
    label: 'Aller aux Paramètres',
    icon: IconSettings,
    type: 'navigation',
    route: '/app/settings',
  },
];

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const currentTenant = useMedicomStore((s) => s.currentTenant);
  const [patientResults, setPatientResults] = useState<CommandItem[]>([]);

  const filteredCommands = COMMANDS.filter((cmd) =>
    cmd.label.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (query.length < 2 || !currentTenant) {
      setPatientResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await getPatients(
          currentTenant.id,
          { search: query },
          { page: 1, pageSize: 5 }
        );
        setPatientResults(
          res.data.map((p) => ({
            id: `p-${p.id}`,
            label: `${p.firstName} ${p.lastName}`,
            icon: IconUsers,
            type: 'patient',
            route: `/app/patients/${p.id}`,
            description: `${p.age} ans • ${p.phone}`,
          }))
        );
      } catch (e) {
        console.error(e);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, currentTenant]);

  const allItems = [...filteredCommands, ...patientResults];

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % allItems.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + allItems.length) % allItems.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (allItems[selectedIndex]) {
          executeCommand(allItems[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, allItems]);

  const executeCommand = (cmd: CommandItem) => {
    if ((cmd.type === 'navigation' || cmd.type === 'patient') && cmd.route) {
      navigate(cmd.route);
    } else {
      // Mock action execution — will trigger modals in future phases
      console.log(`Action executed: ${cmd.label}`);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto p-4 sm:p-6 md:p-20">
      <div
        className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="mx-auto max-w-xl transform divide-y divide-gray-100 overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-black/5 transition-all">
        <div className="relative">
          <IconSearch className="pointer-events-none absolute top-3.5 left-4 h-5 w-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            className="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm"
            placeholder="Que voulez-vous faire ?"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
          />
        </div>

        {allItems.length > 0 && (
          <ul className="max-h-96 scroll-py-3 overflow-y-auto p-3">
            {allItems.map((command, index) => (
              <li
                key={command.id}
                className={`group flex cursor-pointer select-none items-center rounded-md px-3 py-2.5 ${
                  index === selectedIndex
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => executeCommand(command)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div
                  className={`flex h-8 w-8 flex-none items-center justify-center rounded-md ${
                    index === selectedIndex
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-50 text-gray-500 border border-gray-200'
                  }`}
                >
                  <command.icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <div className="ml-3 flex-auto truncate">
                  <span className="text-sm font-medium block">{command.label}</span>
                  {command.description && (
                    <span className="text-xs text-gray-400 block">{command.description}</span>
                  )}
                </div>
                {command.shortcut && (
                  <span
                    className={`ml-3 flex-none text-xs font-semibold ${
                      index === selectedIndex ? 'text-blue-100' : 'text-gray-400'
                    }`}
                  >
                    <kbd className="font-sans">⌘</kbd>
                    {command.shortcut}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}

        {allItems.length === 0 && (
          <div className="py-14 px-6 text-center text-sm sm:px-14">
            <IconCommand className="mx-auto h-6 w-6 text-gray-400" />
            <p className="mt-4 font-semibold text-gray-900">Aucune commande trouvée</p>
            <p className="mt-2 text-gray-500">Essayez de chercher "Nouveau" ou "Aller à".</p>
          </div>
        )}

        <div className="bg-gray-50 px-4 py-2.5 text-xs text-gray-500 border-t border-gray-100 flex justify-between">
          <span>Utilisez les flèches pour naviguer</span>
          <span>ESC pour fermer</span>
        </div>
      </div>
    </div>
  );
};
