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
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col h-full">
      {/* Table Header / Toolbar */}
      <div className="px-5 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-t-lg">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Utilisateurs Actifs</h3>
          <p className="text-sm text-gray-500">
            Gérez les accès administrateurs et les comptes staff.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Filtrer..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm w-full sm:w-64"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm">
            <IconFilter className="w-4 h-4" /> Filtres
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto flex-1">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
              >
                Utilisateur
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
              >
                Rôle & Cabinet
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
              >
                Statut
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
              >
                Dernière activité
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50/80 transition-colors group">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 border border-gray-200 shadow-sm">
                      {user.name.charAt(0)}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <IconMail className="w-3 h-3" /> {user.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{user.clinic}</div>
                  <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                    <IconShield className="w-3 h-3 text-indigo-400" /> {user.role}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      user.status === 'Active'
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-red-50 text-red-700 border-red-200'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${user.status === 'Active' ? 'bg-green-500' : 'bg-red-500'}`}
                    ></span>
                    {user.status === 'Active' ? 'Actif' : 'Bloqué'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono text-xs">
                  {user.lastLogin}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onToggleStatus(user.id)}
                      className={`p-1.5 rounded border shadow-sm transition-colors ${
                        user.status === 'Active'
                          ? 'bg-white text-gray-600 border-gray-200 hover:text-red-600 hover:border-red-200'
                          : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                      }`}
                      title={user.status === 'Active' ? 'Suspendre' : 'Activer'}
                    >
                      {user.status === 'Active' ? (
                        <IconLock className="w-4 h-4" />
                      ) : (
                        <IconCheck className="w-4 h-4" />
                      )}
                    </button>
                    <button className="p-1.5 rounded bg-white text-gray-600 border border-gray-200 hover:border-indigo-300 hover:text-indigo-600 shadow-sm transition-colors">
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
      <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between rounded-b-lg">
        <div className="text-xs text-gray-500">
          Affichage de <span className="font-medium text-gray-900">{filteredUsers.length}</span>{' '}
          utilisateurs
        </div>
        <div className="flex gap-2">
          <button
            className="px-3 py-1 text-xs border border-gray-300 bg-white rounded hover:bg-gray-50 disabled:opacity-50"
            disabled
          >
            Précédent
          </button>
          <button className="px-3 py-1 text-xs border border-gray-300 bg-white rounded hover:bg-gray-50">
            Suivant
          </button>
        </div>
      </div>
    </div>
  );
};
