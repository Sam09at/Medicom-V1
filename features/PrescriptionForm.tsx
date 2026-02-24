import React, { useState } from 'react';
import { Drug } from '../types';
import { IconPrinter, IconPlus, IconTrash, IconPill } from '../components/Icons';
import '../lib/pdf/printStyles.css';

interface PrescriptionFormProps {
  drugs: Drug[];
  setDrugs: (drugs: Drug[]) => void;
  patientName: string;
  doctorName: string;
}

export const PrescriptionForm: React.FC<PrescriptionFormProps> = ({
  drugs,
  setDrugs,
  patientName,
  doctorName,
}) => {
  const [newDrug, setNewDrug] = useState<Omit<Drug, 'id'>>({
    name: '',
    dosage: '',
    frequency: '',
    duration: '',
    notes: '',
  });

  const addDrug = () => {
    if (newDrug.name && newDrug.dosage) {
      setDrugs([...drugs, { ...newDrug }]);
      setNewDrug({ name: '', dosage: '', frequency: '', duration: '', notes: '' });
    }
  };

  const removeDrug = (index: number) => {
    setDrugs(drugs.filter((_, i) => i !== index));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
            <IconPill className="w-5 h-5" />
          </div>
          Ordonnance
        </h3>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition-colors border border-slate-200/50 shadow-sm"
        >
          <IconPrinter className="w-4 h-4" /> Imprimer
        </button>
      </div>

      {/* Input Form */}
      <div className="bg-slate-50/50 p-6 rounded-3xl border border-transparent shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            placeholder="Médicament (ex: Amoxicilline 1g)"
            value={newDrug.name}
            onChange={(e) => setNewDrug({ ...newDrug, name: e.target.value })}
            className="w-full px-5 py-3.5 bg-white border border-slate-100/80 rounded-2xl text-[0.875rem] font-bold text-slate-900 transition-all outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/20 shadow-sm"
          />
          <input
            placeholder="Posologie (ex: 1 comprimé)"
            value={newDrug.dosage}
            onChange={(e) => setNewDrug({ ...newDrug, dosage: e.target.value })}
            className="w-full px-5 py-3.5 bg-white border border-slate-100/80 rounded-2xl text-[0.875rem] font-bold text-slate-900 transition-all outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/20 shadow-sm"
          />
          <input
            placeholder="Fréquence (ex: 2 fois par jour)"
            value={newDrug.frequency}
            onChange={(e) => setNewDrug({ ...newDrug, frequency: e.target.value })}
            className="w-full px-5 py-3.5 bg-white border border-slate-100/80 rounded-2xl text-[0.875rem] font-bold text-slate-900 transition-all outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/20 shadow-sm"
          />
          <input
            placeholder="Durée (ex: 7 jours)"
            value={newDrug.duration}
            onChange={(e) => setNewDrug({ ...newDrug, duration: e.target.value })}
            className="w-full px-5 py-3.5 bg-white border border-slate-100/80 rounded-2xl text-[0.875rem] font-bold text-slate-900 transition-all outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/20 shadow-sm"
          />
        </div>
        <button
          onClick={addDrug}
          disabled={!newDrug.name}
          className="w-full btn-primary py-3.5 rounded-2xl text-[0.875rem] font-bold shadow-sm"
        >
          Ajouter le médicament
        </button>
      </div>

      {/* List */}
      <div className="space-y-3">
        {drugs.map((drug, i) => (
          <div
            key={i}
            className="flex justify-between items-center p-4 bg-white border border-slate-100/80 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] group hover:border-slate-200 transition-all"
          >
            <div>
              <div className="text-[0.875rem] font-bold text-slate-900 tracking-tight">
                {drug.name}
              </div>
              <div className="text-[0.75rem] font-medium text-slate-500 mt-0.5">
                {drug.dosage} • {drug.frequency} • {drug.duration}
              </div>
            </div>
            <button
              onClick={() => removeDrug(i)}
              className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
            >
              <IconTrash className="w-5 h-5" />
            </button>
          </div>
        ))}
        {drugs.length === 0 && (
          <div className="text-center text-[0.875rem] text-slate-400 italic font-medium py-8 bg-slate-50/30 rounded-2xl border border-dashed border-slate-200">
            Aucun médicament prescrit
          </div>
        )}
      </div>

      {/* Hidden Print Template */}
      <div className="print-container">
        <div className="p-12 font-serif text-gray-900 h-full flex flex-col">
          <div className="text-center border-b-2 border-gray-900 pb-6 mb-8">
            <h1 className="text-2xl font-bold uppercase tracking-widest">
              {doctorName || 'Dr. Médecin'}
            </h1>
            <p className="text-sm mt-1">Chirurgien Dentiste</p>
            <p className="text-xs text-gray-500 mt-1">
              123 Bd Zerktouni, Casablanca • +212 522 123 456
            </p>
          </div>

          <div className="flex justify-between items-end mb-12">
            <div className="text-sm">
              <span className="font-bold">Patient:</span> {patientName}
            </div>
            <div className="text-sm">
              <span className="font-bold">Le:</span> {new Date().toLocaleDateString('fr-FR')}
            </div>
          </div>

          <div className="space-y-6 flex-1">
            <h2 className="text-center text-xl font-bold underline mb-8">ORDONNANCE</h2>
            {drugs.map((drug, i) => (
              <div key={i} className="pl-4 border-l-4 border-gray-900 mb-6">
                <div className="font-bold text-lg">{drug.name}</div>
                <div className="text-base mt-1">
                  {drug.dosage}, {drug.frequency}
                </div>
                <div className="text-sm italic text-gray-600">Pendant {drug.duration}</div>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-8 flex justify-end">
            <div className="text-center w-48">
              <p className="text-xs font-bold mb-12">Signature & Cachet</p>
              <div className="h-0.5 bg-gray-900 w-full"></div>
            </div>
          </div>

          <div className="text-center text-[10px] text-gray-400 mt-8 border-t border-gray-100 pt-2">
            Document généré par Medicom SaaS le {new Date().toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
};
