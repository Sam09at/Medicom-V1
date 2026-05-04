import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllLandingPages } from '../../lib/api/landingPages';
import type { LandingPage } from '../../types';

const SkeletonRow = () => (
  <tr className="animate-pulse">
    {[1, 2, 3, 4].map((i) => (
      <td key={i} className="px-6 py-4">
        <div className="h-4 bg-slate-100 rounded w-3/4" />
      </td>
    ))}
    <td className="px-6 py-4">
      <div className="h-7 bg-slate-100 rounded w-24" />
    </td>
  </tr>
);

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('fr-MA', { day: '2-digit', month: 'short', year: 'numeric' }).format(
    new Date(iso)
  );
}

export const LandingPageList: React.FC = () => {
  const navigate = useNavigate();
  const [pages, setPages] = useState<LandingPage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllLandingPages().then((data) => {
      setPages(data);
      setLoading(false);
    });
  }, []);

  const published = pages.filter(p => p.isPublished).length;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Pages Web</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Gérez les pages publiques de chaque cabinet.
          </p>
        </div>
        {!loading && pages.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">
              <span className="text-green-600 font-bold">{published}</span> en ligne · {pages.length} total
            </span>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60">
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Cabinet
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Slug URL
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Statut
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Mis à jour
              </th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading && [1, 2, 3].map((i) => <SkeletonRow key={i} />)}

            {!loading && pages.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-slate-600">Aucune page configurée</p>
                    <p className="text-xs text-slate-400">
                      Les pages apparaîtront ici après la création des cabinets.
                    </p>
                  </div>
                </td>
              </tr>
            )}

            {!loading && pages.map((page) => (
              <tr key={page.id} className="hover:bg-slate-50/50 transition-colors">
                {/* Cabinet name */}
                <td className="px-6 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-white text-xs font-bold"
                      style={{ backgroundColor: page.accentColor || '#136cfb' }}
                    >
                      {(page.tenantName ?? page.slug).charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-slate-900 text-sm">
                      {page.tenantName ?? <span className="font-mono text-xs text-slate-400">{page.tenantId.slice(0, 8)}…</span>}
                    </span>
                  </div>
                </td>

                {/* Slug */}
                <td className="px-6 py-3.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500 font-mono text-xs">/c/{page.slug}</span>
                    {page.isPublished && (
                      <a
                        href={`/c/${page.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-300 hover:text-blue-500 transition-colors"
                        title="Voir la page publique"
                        onClick={e => e.stopPropagation()}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    )}
                  </div>
                </td>

                {/* Status */}
                <td className="px-6 py-3.5">
                  {page.isPublished ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-green-50 text-green-700 text-xs font-semibold rounded-full">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                      En ligne
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-slate-100 text-slate-500 text-xs font-semibold rounded-full">
                      <span className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
                      Brouillon
                    </span>
                  )}
                </td>

                {/* Date */}
                <td className="px-6 py-3.5 text-slate-400 text-xs">
                  {formatDate(page.updatedAt)}
                </td>

                {/* Actions */}
                <td className="px-6 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {page.sectionsJson && page.sectionsJson.length > 0 && (
                      <span className="text-[11px] text-slate-400 font-medium">
                        {page.sectionsJson.length} section{page.sectionsJson.length !== 1 ? 's' : ''}
                      </span>
                    )}
                    <button
                      onClick={() => navigate(`/admin/landing-pages/${page.tenantId}`)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Simple
                    </button>
                    <button
                      onClick={() => navigate(`/builder/${page.tenantId}`)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-700 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                      </svg>
                      Full Builder
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer hint */}
      {!loading && pages.length > 0 && (
        <p className="text-xs text-slate-400 mt-3 text-center">
          <strong>Full Builder</strong> — éditeur immersif Shopify-like · <strong>Simple</strong> — éditeur rapide
        </p>
      )}
    </div>
  );
};
