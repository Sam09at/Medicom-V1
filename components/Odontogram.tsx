import React, { useState } from 'react';
import { ToothStatus, ToothSurface } from '../types';

const TEETH_NUMBERS = [
  // Upper Right (18-11)
  [18, 17, 16, 15, 14, 13, 12, 11],
  // Upper Left (21-28)
  [21, 22, 23, 24, 25, 26, 27, 28],
  // Lower Right (48-41)
  [48, 47, 46, 45, 44, 43, 42, 41],
  // Lower Left (31-38)
  [31, 32, 33, 34, 35, 36, 37, 38],
];

interface ToothData {
  status: ToothStatus;
  surfaces: ToothSurface[];
  notes?: string;
}

interface ToothProps {
  number: number;
  data?: ToothData;
  onClick: (e: React.MouseEvent) => void;
  onContextMenu: (e: React.MouseEvent) => void;
  isSelected: boolean;
}

const Tooth: React.FC<ToothProps> = ({ number, data, onClick, onContextMenu, isSelected }) => {
  const status = data?.status || 'Healthy';
  const surfaces = data?.surfaces || [];

  // Visual mapping
  let baseClasses = 'bg-white border-slate-200/60 text-slate-500 hover:border-blue-400 shadow-sm';
  let content = null;

  if (status === 'Caries') baseClasses = 'bg-red-50/50 border-red-200 text-red-600';
  if (status === 'Treated') baseClasses = 'bg-blue-50/50 border-blue-200 text-blue-600';
  if (status === 'Missing')
    baseClasses = 'bg-slate-50 border-slate-200/50 text-slate-300 opacity-60';
  if (status === 'Crown') baseClasses = 'bg-amber-50/50 border-amber-200 text-amber-700';
  if (status === 'RootCanal') baseClasses = 'bg-purple-50/50 border-purple-200 text-purple-700';
  if (status === 'Implant') baseClasses = 'bg-indigo-50/50 border-indigo-200 text-indigo-700';
  if (status === 'ExtractionNeeded')
    baseClasses = 'bg-red-50 border-red-400 text-red-800 animate-pulse';
  if (status === 'Planned')
    baseClasses = 'bg-emerald-50/50 border-emerald-200 text-emerald-600 border-dashed';

  if (isSelected) baseClasses += ' ring-2 ring-blue-500 shadow-md ring-offset-2';

  const hasSurface = (s: ToothSurface) => surfaces.includes(s);

  return (
    <div
      onClick={onClick}
      onContextMenu={onContextMenu}
      className={`relative w-9 h-12 flex flex-col items-center justify-center border-2 rounded-xl cursor-pointer transition-all duration-200 active:scale-95 ${baseClasses}`}
      title={`Dent ${number} - ${status}`}
    >
      <span className="text-[10px] font-bold select-none z-10">{number}</span>

      {/* Status Indicators */}
      {status === 'Caries' && (
        <div className="absolute w-2.5 h-2.5 rounded-full bg-red-400 top-1 right-1 shadow-sm"></div>
      )}
      {status === 'Crown' && (
        <div className="absolute inset-x-0 top-0 h-1.5 bg-amber-400 rounded-t-xl opacity-80"></div>
      )}
      {status === 'RootCanal' && (
        <div className="absolute w-1 h-3/4 bg-purple-400 bottom-0 rounded-full opacity-80"></div>
      )}
      {status === 'Implant' && (
        <div className="absolute w-2 h-2 border-2 border-indigo-500 rounded-full bottom-1"></div>
      )}
      {status === 'Missing' && (
        <div className="absolute inset-0 flex items-center justify-center text-slate-300 text-lg font-bold">
          ✕
        </div>
      )}

      {/* Surfaces Overlays (Simple Visuals) */}
      {hasSurface('Occlusal') && (
        <div className="absolute w-3 h-3 bg-current opacity-20 rounded-full"></div>
      )}
      {hasSurface('Mesial') && (
        <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-current opacity-20 rounded-r-full"></div>
      )}
      {hasSurface('Distal') && (
        <div className="absolute right-0 top-1/4 bottom-1/4 w-1 bg-current opacity-20 rounded-l-full"></div>
      )}
    </div>
  );
};

interface OdontogramProps {
  statusMap: Record<number, ToothData>;
  onToothUpdate?: (number: number, data: ToothData) => void;
  readOnly?: boolean;
}

export const Odontogram: React.FC<OdontogramProps> = ({
  statusMap,
  onToothUpdate,
  readOnly = false,
}) => {
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [popoverPos, setPopoverPos] = useState({ x: 0, y: 0 });

  const handleToothClick = (e: React.MouseEvent, number: number) => {
    if (readOnly) return;
    e.preventDefault();
    e.stopPropagation();

    if (selectedTooth === number) {
      setSelectedTooth(null);
    } else {
      setSelectedTooth(number);
      // Calculate position relative to viewport/container is tricky, using simple offset
      // Ideally use a library like floating-ui, but keeping it simple
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setPopoverPos({ x: rect.left + window.scrollX - 60, y: rect.bottom + window.scrollY + 10 });
    }
  };

  const updateTooth = (updates: Partial<ToothData>) => {
    if (!selectedTooth || !onToothUpdate) return;
    const current = statusMap[selectedTooth] || { status: 'Healthy', surfaces: [] };
    onToothUpdate(selectedTooth, { ...current, ...updates });
  };

  const toggleSurface = (surface: ToothSurface) => {
    if (!selectedTooth) return;
    const current = statusMap[selectedTooth] || { status: 'Healthy', surfaces: [] };
    const surfaces = current.surfaces.includes(surface)
      ? current.surfaces.filter((s) => s !== surface)
      : [...current.surfaces, surface];
    updateTooth({ surfaces });
  };

  return (
    <div
      className="relative max-w-4xl mx-auto py-4 select-none"
      onClick={() => setSelectedTooth(null)}
    >
      {/* Upper Arch */}
      <div className="flex justify-center gap-2 md:gap-3 pb-8 border-b border-slate-100/80 relative">
        <div className="flex gap-1 md:gap-1 flex-row-reverse">
          {TEETH_NUMBERS[0].map((n) => (
            <Tooth
              key={n}
              number={n}
              data={statusMap[n]}
              onClick={(e) => handleToothClick(e, n)}
              onContextMenu={(e) => handleToothClick(e, n)}
              isSelected={selectedTooth === n}
            />
          ))}
        </div>
        <div className="w-px bg-slate-200/60 h-16 self-end mx-2"></div>
        <div className="flex gap-1 md:gap-1">
          {TEETH_NUMBERS[1].map((n) => (
            <Tooth
              key={n}
              number={n}
              data={statusMap[n]}
              onClick={(e) => handleToothClick(e, n)}
              onContextMenu={(e) => handleToothClick(e, n)}
              isSelected={selectedTooth === n}
            />
          ))}
        </div>
        <div className="absolute -right-6 top-0 text-[0.65rem] text-slate-300 font-bold uppercase tracking-[0.1em] rotate-90 origin-top-left mt-2">
          Haut
        </div>
      </div>

      {/* Lower Arch */}
      <div className="flex justify-center gap-2 md:gap-3 pt-8 relative">
        <div className="flex gap-1 md:gap-1 flex-row-reverse">
          {TEETH_NUMBERS[2].map((n) => (
            <Tooth
              key={n}
              number={n}
              data={statusMap[n]}
              onClick={(e) => handleToothClick(e, n)}
              onContextMenu={(e) => handleToothClick(e, n)}
              isSelected={selectedTooth === n}
            />
          ))}
        </div>
        <div className="w-px bg-slate-200/60 h-16 self-start mx-2"></div>
        <div className="flex gap-1 md:gap-1">
          {TEETH_NUMBERS[3].map((n) => (
            <Tooth
              key={n}
              number={n}
              data={statusMap[n]}
              onClick={(e) => handleToothClick(e, n)}
              onContextMenu={(e) => handleToothClick(e, n)}
              isSelected={selectedTooth === n}
            />
          ))}
        </div>
        <div className="absolute -right-6 bottom-0 text-[0.65rem] text-slate-300 font-bold uppercase tracking-[0.1em] rotate-90 origin-bottom-left mb-2">
          Bas
        </div>
      </div>

      {/* Context Popover */}
      {selectedTooth && !readOnly && (
        <div
          className="absolute z-50 bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.1)] border border-slate-100/80 p-5 w-72 animate-in fade-in zoom-in-95 duration-200"
          style={{ left: popoverPos.x, top: popoverPos.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4">
            <span className="font-bold text-[0.875rem] text-slate-900 tracking-tight">
              Dent #{selectedTooth}
            </span>
            <button
              onClick={() => setSelectedTooth(null)}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 mb-4">
            <div className="space-y-2">
              <label className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-widest">
                Statut
              </label>
              <select
                className="w-full text-xs border border-slate-200/60 rounded-xl px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 bg-slate-50 hover:bg-white transition-all font-medium text-slate-700"
                value={statusMap[selectedTooth]?.status || 'Healthy'}
                onChange={(e) => updateTooth({ status: e.target.value as ToothStatus })}
              >
                <option value="Healthy">Saine</option>
                <option value="Caries">Carie</option>
                <option value="Treated">Soignée</option>
                <option value="Missing">Absente</option>
                <option value="Crown">Couronne</option>
                <option value="RootCanal">Dévitalisée</option>
                <option value="Implant">Implant</option>
                <option value="Appliance">Appareil</option>
                <option value="ExtractionNeeded">A extraire</option>
                <option value="Planned">Prévu</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-widest">
                Faces
              </label>
              <div className="flex flex-wrap gap-1.5">
                {['Mesial', 'Distal', 'Occlusal', 'Lingual', 'Vestibular'].map((s) => (
                  <button
                    key={s}
                    onClick={() => toggleSurface(s as ToothSurface)}
                    className={`w-8 h-8 text-[0.65rem] rounded-xl flex items-center justify-center border transition-all ${statusMap[selectedTooth]?.surfaces.includes(s as ToothSurface) ? 'bg-blue-50 border-blue-200 text-blue-700 font-bold shadow-sm' : 'bg-slate-50 border-slate-200/50 text-slate-500 hover:bg-white hover:border-slate-300'}`}
                    title={s}
                  >
                    {s[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-widest">
              Note
            </label>
            <textarea
              className="w-full text-xs border border-slate-200/60 rounded-xl px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 bg-slate-50 hover:bg-white transition-all h-16 resize-none font-medium text-slate-700"
              placeholder="Ajouter une note..."
              value={statusMap[selectedTooth]?.notes || ''}
              onChange={(e) => updateTooth({ notes: e.target.value })}
            />
          </div>
        </div>
      )}
    </div>
  );
};
