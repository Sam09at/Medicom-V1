import React, { useRef, useState } from 'react';
import type { PageSection } from '../../types';
import { getSectionMeta } from './sectionConfig';

interface SectionCanvasProps {
  sections: PageSection[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onReorder: (sections: PageSection[]) => void;
  onToggleVisible: (id: string) => void;
  onDelete: (id: string) => void;
}

function SectionIcon({ path, className }: { path: string; className?: string }) {
  return (
    <svg className={className ?? 'w-4 h-4'} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  );
}

export const SectionCanvas: React.FC<SectionCanvasProps> = ({
  sections, selectedId, onSelect, onReorder, onToggleVisible, onDelete,
}) => {
  const dragSrc = useRef<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  function handleDragStart(e: React.DragEvent, i: number) {
    dragSrc.current = i;
    e.dataTransfer.effectAllowed = 'move';
  }
  function handleDragOver(e: React.DragEvent, i: number) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIdx(i);
  }
  function handleDrop(e: React.DragEvent, i: number) {
    e.preventDefault();
    if (dragSrc.current === null || dragSrc.current === i) {
      setDragOverIdx(null);
      return;
    }
    const next = [...sections];
    const [moved] = next.splice(dragSrc.current, 1);
    next.splice(i, 0, moved);
    onReorder(next);
    dragSrc.current = null;
    setDragOverIdx(null);
  }
  function handleDragEnd() {
    dragSrc.current = null;
    setDragOverIdx(null);
  }

  if (sections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[320px] text-center px-8">
        <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
          <svg className="w-7 h-7 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-slate-500">Aucune section</p>
        <p className="text-xs text-slate-400 mt-1">Ajoutez des sections depuis le panneau de gauche.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-4">
      {sections.map((section, i) => {
        const meta = getSectionMeta(section.type);
        const isSelected = section.id === selectedId;
        const isDragOver = dragOverIdx === i;

        return (
          <div
            key={section.id}
            draggable
            onDragStart={(e) => handleDragStart(e, i)}
            onDragOver={(e) => handleDragOver(e, i)}
            onDrop={(e) => handleDrop(e, i)}
            onDragEnd={handleDragEnd}
            onClick={() => onSelect(section.id)}
            className={[
              'flex items-center gap-3 px-3 py-3 rounded-xl border cursor-pointer transition-all select-none',
              isSelected
                ? 'border-blue-400 bg-blue-50 shadow-sm shadow-blue-100'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60',
              isDragOver ? 'border-blue-300 bg-blue-50/60 scale-[1.01]' : '',
              !section.visible ? 'opacity-50' : '',
            ].join(' ')}
          >
            {/* Drag handle */}
            <div className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 shrink-0 px-0.5" title="Glisser pour réorganiser">
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M7 2a1 1 0 11-2 0 1 1 0 012 0zm5 0a1 1 0 11-2 0 1 1 0 012 0zM7 7a1 1 0 11-2 0 1 1 0 012 0zm5 0a1 1 0 11-2 0 1 1 0 012 0zM7 12a1 1 0 11-2 0 1 1 0 012 0zm5 0a1 1 0 11-2 0 1 1 0 012 0z" />
              </svg>
            </div>

            {/* Icon */}
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${meta.bg}`}>
              <SectionIcon path={meta.iconPath} className={`w-4 h-4 ${meta.accent}`} />
            </div>

            {/* Label + preview */}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-slate-900 leading-tight">{meta.label}</p>
              <p className="text-[11px] text-slate-400 truncate">
                {(section.content.headline as string) || (section.content.heading as string) || meta.description}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => onToggleVisible(section.id)}
                title={section.visible ? 'Masquer' : 'Afficher'}
                className={`p-1.5 rounded-lg transition-colors ${section.visible ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100' : 'text-slate-300 hover:text-slate-500 hover:bg-slate-100'}`}
              >
                {section.visible ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                )}
              </button>
              <button
                onClick={() => { if (window.confirm('Supprimer cette section ?')) onDelete(section.id); }}
                title="Supprimer"
                className="p-1.5 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
