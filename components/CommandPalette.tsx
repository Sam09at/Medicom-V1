
import React, { useState, useEffect, useRef } from 'react';
import { IconSearch, IconCalendar, IconUsers, IconCreditCard, IconSettings, IconPlus, IconCommand, IconArrowLeft } from './Icons';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string) => void;
}

type CommandItem = {
  id: string;
  label: string;
  icon: React.ElementType;
  type: 'action' | 'navigation';
  view?: string;
  shortcut?: string;
};

const COMMANDS: CommandItem[] = [
  { id: 'new-rdv', label: 'Nouveau Rendez-vous', icon: IconCalendar, type: 'action', shortcut: 'N' },
  { id: 'new-patient', label: 'Nouveau Patient', icon: IconUsers, type: 'action', shortcut: 'P' },
  { id: 'new-invoice', label: 'Nouvelle Facture', icon: IconCreditCard, type: 'action', shortcut: 'F' },
  { id: 'nav-dashboard', label: 'Aller au Dashboard', icon: IconArrowLeft, type: 'navigation', view: 'dashboard' },
  { id: 'nav-calendar', label: 'Aller au Calendrier', icon: IconCalendar, type: 'navigation', view: 'calendar' },
  { id: 'nav-patients', label: 'Aller aux Patients', icon: IconUsers, type: 'navigation', view: 'patients' },
  { id: 'nav-settings', label: 'Aller aux Paramètres', icon: IconSettings, type: 'navigation', view: 'settings' },
];

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onNavigate }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredCommands = COMMANDS.filter(cmd => 
    cmd.label.toLowerCase().includes(query.toLowerCase())
  );

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
        setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          executeCommand(filteredCommands[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands]);

  const executeCommand = (cmd: CommandItem) => {
    if (cmd.type === 'navigation' && cmd.view) {
      onNavigate(cmd.view);
    } else {
      // Mock action execution
      console.log(`Action executed: ${cmd.label}`);
      // In a real app, this would trigger specific modals via a global state context
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto p-4 sm:p-6 md:p-20">
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="mx-auto max-w-xl transform divide-y divide-slate-100 overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-black/5 transition-all">
        <div className="relative">
          <IconSearch className="pointer-events-none absolute top-3.5 left-4 h-5 w-5 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            className="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-slate-900 placeholder:text-slate-400 focus:ring-0 sm:text-sm"
            placeholder="Que voulez-vous faire ?"
            value={query}
            onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
          />
        </div>

        {filteredCommands.length > 0 && (
          <ul className="max-h-96 scroll-py-3 overflow-y-auto p-3">
            {filteredCommands.map((command, index) => (
              <li
                key={command.id}
                className={`group flex cursor-pointer select-none items-center rounded-md px-3 py-2.5 ${
                  index === selectedIndex ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100'
                }`}
                onClick={() => executeCommand(command)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className={`flex h-8 w-8 flex-none items-center justify-center rounded-md ${
                    index === selectedIndex ? 'bg-white/20 text-white' : 'bg-slate-50 text-slate-500 border border-slate-200'
                }`}>
                  <command.icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <span className="ml-3 flex-auto truncate text-sm font-medium">{command.label}</span>
                {command.shortcut && (
                  <span className={`ml-3 flex-none text-xs font-semibold ${
                      index === selectedIndex ? 'text-blue-100' : 'text-slate-400'
                  }`}>
                    <kbd className="font-sans">⌘</kbd>{command.shortcut}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}

        {filteredCommands.length === 0 && (
          <div className="py-14 px-6 text-center text-sm sm:px-14">
            <IconCommand className="mx-auto h-6 w-6 text-slate-400" />
            <p className="mt-4 font-semibold text-slate-900">Aucune commande trouvée</p>
            <p className="mt-2 text-slate-500">Essayez de chercher "Nouveau" ou "Aller à".</p>
          </div>
        )}
        
        <div className="bg-slate-50 px-4 py-2.5 text-xs text-slate-500 border-t border-slate-100 flex justify-between">
            <span>Utilisez les flèches pour naviguer</span>
            <span>ESC pour fermer</span>
        </div>
      </div>
    </div>
  );
};
