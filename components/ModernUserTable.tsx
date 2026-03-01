import React, { useState } from 'react';
import {
  IconSearch,
  IconFilter,
  IconMoreHorizontal,
  IconLock,
  IconCheck,
  IconMail,
  IconShield,
} from './Icons';
import { SaaSUser } from '../types';

interface ModernUserTableProps {
  users: SaaSUser[];
  onToggleStatus: (id: string) => void;
}

export const ModernUserTable: React.FC<ModernUserTableProps> = ({ users, onToggleStatus }) => {
  const [filter, setFilter] = useState('');

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(filter.toLowerCase()) ||
      u.email.toLowerCase().includes(filter.toLowerCase()) ||
      u.clinic.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="bg-white border border-slate-200/60 rounded-[20px]  flex flex-col h-full overflow-hidden">
      {/* Table Header / Toolbar */}
      <div className="px-6 py-5 border-b border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white">
        <div>
          <h3 className="text-[16px] font-semibold text-slate-900 tracking-tight">
            Utilisateurs Actifs
          </h3>
          <p className="text-[13px] text-slate-500 mt-1">
            Gérez les accès administrateurs et les comptes staff
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Filtrer..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-[13px] text-slate-900 placeholder:text-slate-400 border border-slate-200/60 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500  w-full sm:w-64 transition-all"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200/60 rounded-[6px] text-[13px] font-medium text-slate-700 hover:bg-slate-50  transition-colors cursor-pointer">
            <IconFilter className="w-4 h-4" /> Filtres
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto flex-1">
        <table className="min-w-full divide-y divide-slate-100/80">
          <thead className="bg-[#FAFAFA]">
            <tr>
              <th
                scope="col"
                className="px-6 py-3.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider"
              >
                Utilisateur
              </th>
              <th
                scope="col"
                className="px-6 py-3.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider"
              >
                Rôle & Cabinet
              </th>
              <th
                scope="col"
                className="px-6 py-3.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider"
              >
                Statut
              </th>
              <th
                scope="col"
                className="px-6 py-3.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider"
              >
                Dernière activité
              </th>
              <th scope="col" className="relative px-6 py-3.5">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100/80">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-[12px] font-semibold text-slate-700 border border-slate-200/60 ">
                      {user.name.charAt(0)}
                    </div>
                    <div className="ml-4">
                      <div className="text-[13px] font-medium text-slate-900">{user.name}</div>
                      <div className="text-[12px] text-slate-500 flex items-center gap-1">
                        <IconMail className="w-3 h-3" /> {user.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-[13px] font-medium text-slate-900">{user.clinic}</div>
                  <div className="text-[12px] text-slate-500 flex items-center gap-1 mt-0.5">
                    <IconShield className="w-3 h-3 text-blue-500" /> {user.role}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-[4px] text-[11px] font-bold border ${
                      user.status === 'Active'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100/50'
                        : 'bg-red-50 text-red-700 border-red-100/50'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${user.status === 'Active' ? 'bg-emerald-500' : 'bg-red-500'}`}
                    ></span>
                    {user.status === 'Active' ? 'Actif' : 'Bloqué'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono text-xs">
                  {user.lastLogin}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onToggleStatus(user.id)}
                      className={`p-1.5 rounded-[6px] border  transition-colors cursor-pointer ${
                        user.status === 'Active'
                          ? 'bg-white text-slate-600 border-slate-200/60 hover:text-red-600 hover:border-red-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                      }`}
                      title={user.status === 'Active' ? 'Suspendre' : 'Activer'}
                    >
                      {user.status === 'Active' ? (
                        <IconLock className="w-4 h-4" />
                      ) : (
                        <IconCheck className="w-4 h-4" />
                      )}
                    </button>
                    <button className="p-1.5 rounded-[6px] bg-white text-slate-600 border border-slate-200/60 hover:border-slate-300  transition-colors cursor-pointer">
                      <IconMoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="px-6 py-4 border-t border-slate-200/60 bg-[#FAFAFA] flex items-center justify-between rounded-b-[12px]">
        <div className="text-[12px] font-medium text-slate-500">
          Affichage de <span className="font-bold text-slate-900">{filteredUsers.length}</span>{' '}
          utilisateurs
        </div>
        <div className="flex gap-2">
          <button
            className="px-3 py-1.5 text-[12px] font-bold text-slate-700 border border-slate-200/60 bg-white rounded-[6px] hover:bg-slate-50 disabled:opacity-50 transition-colors  cursor-pointer disabled:cursor-not-allowed"
            disabled
          >
            Précédent
          </button>
          <button className="px-3 py-1.5 text-[12px] font-bold text-slate-700 border border-slate-200/60 bg-white rounded-[6px] hover:bg-slate-50 transition-colors  cursor-pointer">
            Suivant
          </button>
        </div>
      </div>
    </div>
  );
};
