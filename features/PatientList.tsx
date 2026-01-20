import React from 'react';
import { Patient } from '../types';
import { IconSearch } from '../components/Icons';

interface PatientListProps {
  patients: Patient[];
}

export const PatientList: React.FC<PatientListProps> = ({ patients }) => {
  return (
    <div className="bg-white rounded-md border border-slate-200 flex flex-col h-full shadow-sm">
      <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-white rounded-t-md">
        <h2 className="text-sm font-semibold text-slate-800">Dossiers Patients</h2>
        <div className="relative w-64">
           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
             <IconSearch className="h-3.5 w-3.5 text-slate-400" />
           </div>
           <input 
             type="text" 
             placeholder="Rechercher..." 
             className="block w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm transition-shadow shadow-sm"
           />
        </div>
      </div>
      
      <div className="flex-1 overflow-auto">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50/80 sticky top-0">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Patient</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Assurance</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Dernière Visite</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {patients.map((patient) => (
              <tr key={patient.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-6 py-3.5 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-8 w-8 flex-shrink-0 bg-gradient-to-br from-blue-50 to-blue-100 rounded-md flex items-center justify-center text-blue-600 font-bold text-xs border border-blue-200">
                      {patient.firstName[0]}{patient.lastName[0]}
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-slate-900">{patient.firstName} {patient.lastName}</div>
                      <div className="text-xs text-slate-500">{patient.age} ans • {patient.gender}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-3.5 whitespace-nowrap">
                  <div className="text-sm text-slate-600">{patient.phone}</div>
                </td>
                <td className="px-6 py-3.5 whitespace-nowrap">
                  <span className={`px-2 py-0.5 inline-flex text-xs leading-4 font-medium rounded border ${
                    patient.insuranceType === 'CNOPS' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                    patient.insuranceType === 'CNSS' ? 'bg-green-50 text-green-700 border-green-100' :
                    patient.insuranceType === 'None' ? 'bg-slate-50 text-slate-600 border-slate-200' : 'bg-blue-50 text-blue-700 border-blue-100'
                  }`}>
                    {patient.insuranceType}
                  </span>
                </td>
                <td className="px-6 py-3.5 whitespace-nowrap text-sm text-slate-500">
                  {patient.lastVisit || '—'}
                </td>
                <td className="px-6 py-3.5 whitespace-nowrap text-right text-sm font-medium">
                  <button className="text-slate-400 hover:text-blue-600 mr-3 transition-colors">Dossier</button>
                  <button className="text-slate-400 hover:text-blue-600 transition-colors">RDV</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};