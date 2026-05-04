import React from 'react';
import type { LandingPage } from '../../types';

interface PageContentFormProps {
  page: LandingPage;
  onChange: (updates: Partial<LandingPage>) => void;
}

const inputClass =
  'w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow';

const labelClass = 'block text-sm font-medium text-slate-700 mb-1.5';

export const PageContentForm: React.FC<PageContentFormProps> = ({ page, onChange }) => {
  return (
    <div className="space-y-5">
      <div>
        <label className={labelClass}>Titre principal</label>
        <input
          type="text"
          className={inputClass}
          defaultValue={page.headline ?? ''}
          onBlur={(e) => onChange({ headline: e.target.value || null })}
          placeholder="Cabinet Dentaire Benali"
        />
      </div>

      <div>
        <label className={labelClass}>Description</label>
        <textarea
          className={inputClass}
          rows={4}
          defaultValue={page.description ?? ''}
          onBlur={(e) => onChange({ description: e.target.value || null })}
          placeholder="Soins dentaires de qualité à Casablanca…"
        />
      </div>

      <div>
        <label className={labelClass}>URL Image hero</label>
        <input
          type="url"
          className={inputClass}
          defaultValue={page.heroImageUrl ?? ''}
          onBlur={(e) => onChange({ heroImageUrl: e.target.value || null })}
          placeholder="https://…"
        />
        {page.heroImageUrl && (
          <div className="mt-2 rounded-lg overflow-hidden border border-slate-200 h-24 bg-slate-50">
            <img
              src={page.heroImageUrl}
              alt="Aperçu hero"
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
        )}
      </div>

      <div>
        <label className={labelClass}>Adresse</label>
        <input
          type="text"
          className={inputClass}
          defaultValue={page.addressDisplay ?? ''}
          onBlur={(e) => onChange({ addressDisplay: e.target.value || null })}
          placeholder="123 Rue Mohammed V, Casablanca"
        />
      </div>

      <div>
        <label className={labelClass}>Ville</label>
        <input
          type="text"
          className={inputClass}
          defaultValue={page.city ?? ''}
          onBlur={(e) => onChange({ city: e.target.value || null })}
          placeholder="Casablanca"
        />
      </div>

      <div>
        <label className={labelClass}>URL Google Maps</label>
        <input
          type="url"
          className={inputClass}
          defaultValue={page.googleMapsUrl ?? ''}
          onBlur={(e) => onChange({ googleMapsUrl: e.target.value || null })}
          placeholder="https://maps.google.com/…"
        />
      </div>
    </div>
  );
};
