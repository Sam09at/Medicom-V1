import React from 'react';
import type { LandingPage } from '../../types';

interface PageMetaFormProps {
  page: LandingPage;
  onChange: (updates: Partial<LandingPage>) => void;
}

const inputClass =
  'w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow';

const labelClass = 'block text-sm font-medium text-slate-700 mb-1.5';

export const PageMetaForm: React.FC<PageMetaFormProps> = ({ page, onChange }) => {
  return (
    <div className="space-y-5">
      <div>
        <label className={labelClass}>Slug URL</label>
        <input
          type="text"
          className={inputClass}
          defaultValue={page.slug}
          onBlur={(e) => onChange({ slug: e.target.value.trim().toLowerCase().replace(/\s+/g, '-') })}
          placeholder="cabinet-benali"
        />
        <p className="mt-1.5 text-xs text-slate-400">
          URL publique : <span className="font-mono">medicom.ma/{page.slug || '…'}</span>
        </p>
      </div>

      <div>
        <label className={labelClass}>Couleur d'accent</label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            className="w-10 h-10 rounded-lg border border-slate-300 cursor-pointer p-0.5"
            defaultValue={page.accentColor || '#136cfb'}
            onBlur={(e) => onChange({ accentColor: e.target.value })}
          />
          <span className="text-sm text-slate-500 font-mono">{page.accentColor || '#136cfb'}</span>
        </div>
      </div>

      <div>
        <label className={labelClass}>Email de contact</label>
        <input
          type="email"
          className={inputClass}
          defaultValue={page.contactEmail ?? ''}
          onBlur={(e) => onChange({ contactEmail: e.target.value || null })}
          placeholder="contact@cabinet.ma"
        />
      </div>

      <div>
        <label className={labelClass}>Téléphone</label>
        <input
          type="tel"
          className={inputClass}
          defaultValue={page.contactPhone ?? ''}
          onBlur={(e) => onChange({ contactPhone: e.target.value || null })}
          placeholder="+212 6XX XXX XXX"
        />
      </div>
    </div>
  );
};
