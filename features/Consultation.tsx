
import React, { useState, useEffect } from 'react';
import { IconCheck, IconPill, IconActivity, IconFileText, IconChevronRight, IconPrinter, IconWand, IconTooth, IconList, IconTrash, IconPlus, IconDollarSign, IconX, IconMessage } from '../components/Icons';
import { Patient, Appointment } from '../types';
import { Odontogram } from '../components/Odontogram';
import { MOCK_SERVICES, MOCK_INVENTORY } from '../constants';

interface ConsultationProps {
  patient: Patient;
  appointment: Appointment;
  onFinish: () => void;
}

const TABS = [
  { id: 'vitals', label: 'Constantes', icon: IconActivity },
  { id: 'chart', label: 'Schéma', icon: IconTooth },
  { id: 'procedures', label: 'Actes', icon: IconList },
  { id: 'rx', label: 'Ordonnance', icon: IconPill },
  { id: 'notes', label: 'Notes', icon: IconFileText },
];

export const Consultation: React.FC<ConsultationProps> = ({ patient, appointment, onFinish }) => {
  const [activeTab, setActiveTab] = useState('vitals');
  
  // Data State
  const [vitals, setVitals] = useState({ bp: '', weight: '', temp: '37' });
  const [notes, setNotes] = useState('');
  const [prescription, setPrescription] = useState<{name: string, dose: string}[]>([]);
  const [toothStatus, setToothStatus] = useState<Record<number, string>>({});
  const [selectedProcedures, setSelectedProcedures] = useState<{id: string, name: string, price: number, teeth: string}[]>([]);
  const [usedConsumables, setUsedConsumables] = useState<{id: string, name: string, quantity: number}[]>([]);
  
  // Input State
  const [newDrug, setNewDrug] = useState({ name: '', dose: '' });
  const [selectedActId, setSelectedActId] = useState('');
  const [selectedTeethForAct, setSelectedTeethForAct] = useState('');
  const [activeToothTool, setActiveToothTool] = useState('Caries');
  
  const [selectedConsumableId, setSelectedConsumableId] = useState('');
  
  const [showAiModal, setShowAiModal] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Voice Dictation
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  useEffect(() => {
      let interval: any;
      if (isRecording) {
          interval = setInterval(() => {
              setRecordingTime(prev => prev + 1);
          }, 1000);
      } else {
          setRecordingTime(0);
      }
      return () => clearInterval(interval);
  }, [isRecording]);

  // Handlers
  const addDrug = () => {
    if (newDrug.name) {
      setPrescription([...prescription, newDrug]);
      setNewDrug({ name: '', dose: '' });
    }
  };

  const handleToothClick = (number: number) => {
      // Toggle logic for the odontogram
      const current = toothStatus[number];
      if (current === activeToothTool) {
          const newStatus = { ...toothStatus };
          delete newStatus[number];
          setToothStatus(newStatus);
      } else {
          setToothStatus({ ...toothStatus, [number]: activeToothTool });
      }
  };

  const addProcedure = () => {
      const act = MOCK_SERVICES.find(s => s.id === selectedActId);
      if (act) {
          setSelectedProcedures([...selectedProcedures, {
              id: Math.random().toString(),
              name: act.name,
              price: act.price,
              teeth: selectedTeethForAct
          }]);
          setSelectedTeethForAct('');
          setSelectedActId('');
      }
  };

  const addConsumable = () => {
      const item = MOCK_INVENTORY.find(i => i.id === selectedConsumableId);
      if (item) {
          const existing = usedConsumables.find(c => c.id === item.id);
          if(existing) {
              setUsedConsumables(usedConsumables.map(c => c.id === item.id ? {...c, quantity: c.quantity + 1} : c));
          } else {
              setUsedConsumables([...usedConsumables, { id: item.id, name: item.name, quantity: 1 }]);
          }
          setSelectedConsumableId('');
      }
  };

  const removeProcedure = (id: string) => {
      setSelectedProcedures(selectedProcedures.filter(p => p.id !== id));
  };

  const removeConsumable = (id: string) => {
      setUsedConsumables(usedConsumables.filter(c => c.id !== id));
  };

  const generateAiLetter = () => {
      setNotes(prev => prev + `\n\n[Généré par IA]:\nPatient: ${patient.firstName} ${patient.lastName}\nMotif: ${appointment.type}\nConstantes: TA ${vitals.bp || '-'}, T° ${vitals.temp}°C\n\nObservations:\nExamen clinique sans particularité notable. Préconisation de soins conservateurs sur 36 et 46.`);
      setShowAiModal(false);
  };

  const toggleRecording = () => {
      if (isRecording) {
          // Stop recording simulation
          setNotes(prev => prev + "\n[Dictée]: Le patient signale une sensibilité accrue au froid sur la 26. Aucun signe de fracture visible.");
          setIsRecording(false);
      } else {
          setIsRecording(true);
      }
  };

  const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalCost = selectedProcedures.reduce((sum, p) => sum + p.price, 0);

  return (
    <div className="flex flex-col h-full bg-white relative font-sans">
      {/* AI Modal */}
      {showAiModal && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-50 flex items-center justify-center p-8">
              <div className="bg-white border border-slate-200 shadow-2xl rounded-lg max-w-lg w-full p-6 text-center animate-in zoom-in-95 duration-200">
                  <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <IconWand className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Assistant Clinique IA</h3>
                  <p className="text-sm text-slate-500 mb-6">Générez du contenu basé sur les données saisies (constantes, actes, schéma).</p>
                  <div className="grid grid-cols-1 gap-3">
                      <button onClick={generateAiLetter} className="p-3 border border-slate-200 rounded-md hover:border-purple-500 hover:bg-purple-50 text-sm font-medium text-slate-700 transition-colors">
                          Compte-rendu de consultation
                      </button>
                      <button onClick={generateAiLetter} className="p-3 border border-slate-200 rounded-md hover:border-purple-500 hover:bg-purple-50 text-sm font-medium text-slate-700 transition-colors">
                          Lettre d'adressage (Confrère)
                      </button>
                  </div>
                  <button onClick={() => setShowAiModal(false)} className="mt-6 text-sm text-slate-400 hover:text-slate-600">Annuler</button>
              </div>
          </div>
      )}

      {/* Print Preview Modal */}
      {isPrintModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <div className="bg-white w-full max-w-2xl h-[80vh] flex flex-col rounded-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                      <h3 className="font-bold text-slate-900">Aperçu Ordonnance</h3>
                      <div className="flex gap-2">
                          <button onClick={() => window.print()} className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                              <IconPrinter className="w-4 h-4" /> Imprimer
                          </button>
                          <button onClick={() => setIsPrintModalOpen(false)} className="p-1.5 text-slate-500 hover:bg-slate-200 rounded">
                              <IconX className="w-5 h-5" />
                          </button>
                      </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-12 bg-slate-50">
                      <div className="bg-white shadow-sm p-8 min-h-[600px] border border-slate-100 mx-auto max-w-[21cm] text-slate-900 font-serif">
                          {/* Rx Header */}
                          <div className="text-center border-b-2 border-slate-900 pb-6 mb-8">
                              <h2 className="text-2xl font-bold uppercase tracking-widest">Dr. Amina El Amrani</h2>
                              <p className="text-sm mt-1">Chirurgien Dentiste</p>
                              <p className="text-xs text-slate-500 mt-1">123 Bd Zerktouni, Casablanca • +212 522 123 456</p>
                          </div>
                          
                          {/* Patient Info */}
                          <div className="flex justify-between items-end mb-12">
                              <div className="text-sm">
                                  <span className="font-bold">Patient:</span> {patient.firstName} {patient.lastName} ({patient.age} ans)
                              </div>
                              <div className="text-sm">
                                  <span className="font-bold">Date:</span> {new Date().toLocaleDateString('fr-FR')}
                              </div>
                          </div>

                          {/* Drugs List */}
                          <div className="space-y-6 min-h-[300px]">
                              {prescription.map((drug, i) => (
                                  <div key={i} className="pl-4 border-l-4 border-slate-900">
                                      <div className="font-bold text-lg">{drug.name}</div>
                                      <div className="text-sm italic mt-1">{drug.dose}</div>
                                  </div>
                              ))}
                              {prescription.length === 0 && <p className="text-center text-slate-300 italic py-10">Aucun médicament prescrit.</p>}
                          </div>

                          {/* Footer */}
                          <div className="mt-12 pt-8 flex justify-end">
                              <div className="text-center w-48">
                                  <p className="text-xs font-bold mb-8">Signature & Cachet</p>
                                  <div className="h-0.5 bg-slate-900 w-full"></div>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Header Stepper */}
      <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-2 bg-slate-50/50 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-100' 
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
        <div className="flex-1"></div>
        <div className="text-right mr-4 hidden sm:block">
            <div className="text-xs text-slate-500">Total estimé</div>
            <div className="text-sm font-bold text-slate-900">{totalCost} MAD</div>
        </div>
        <button 
          onClick={onFinish}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-bold shadow-sm flex items-center gap-2 transition-colors"
        >
          <IconCheck className="w-4 h-4" /> Terminer
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8">
        
        {/* Vitals Step */}
        {activeTab === 'vitals' && (
          <div className="max-w-xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
             <div>
               <h3 className="text-lg font-semibold text-slate-900">Constantes Vitales</h3>
               <p className="text-slate-500 text-sm">Saisissez les mesures du patient pour le dossier.</p>
             </div>
             
             <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                   <label className="text-sm font-medium text-slate-700">Tension Artérielle</label>
                   <div className="relative">
                     <input 
                        type="text" 
                        value={vitals.bp} 
                        onChange={e => setVitals({...vitals, bp: e.target.value})}
                        placeholder="12/8" 
                        className="w-full p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" 
                     />
                     <div className="absolute right-3 top-3 text-slate-400 text-xs font-bold">mmHg</div>
                   </div>
                </div>
                <div className="space-y-2">
                   <label className="text-sm font-medium text-slate-700">Poids</label>
                   <div className="relative">
                     <input 
                        type="number" 
                        value={vitals.weight} 
                        onChange={e => setVitals({...vitals, weight: e.target.value})}
                        placeholder="70" 
                        className="w-full p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" 
                     />
                     <div className="absolute right-3 top-3 text-slate-400 text-xs font-bold">kg</div>
                   </div>
                </div>
                <div className="space-y-2">
                   <label className="text-sm font-medium text-slate-700">Température</label>
                   <div className="relative">
                     <input 
                        type="number" 
                        value={vitals.temp} 
                        onChange={e => setVitals({...vitals, temp: e.target.value})}
                        placeholder="37" 
                        className="w-full p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" 
                     />
                     <div className="absolute right-3 top-3 text-slate-400 text-xs font-bold">°C</div>
                   </div>
                </div>
             </div>
             <div className="flex justify-end pt-4">
                <button onClick={() => setActiveTab('chart')} className="flex items-center gap-1 text-blue-600 font-medium hover:text-blue-800 transition-colors">
                   Suivant <IconChevronRight className="w-4 h-4" />
                </button>
             </div>
          </div>
        )}

        {/* Chart Step */}
        {activeTab === 'chart' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900">Schéma Dentaire</h3>
                        <p className="text-slate-500 text-sm">Cliquez sur les dents pour marquer leur état.</p>
                    </div>
                    
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                        {[
                            { id: 'Caries', label: 'Carie', color: 'text-red-600' },
                            { id: 'Treated', label: 'Soignée', color: 'text-blue-600' },
                            { id: 'Missing', label: 'Absente', color: 'text-slate-400' },
                            { id: 'Crown', label: 'Couronne', color: 'text-yellow-600' },
                            { id: 'RootCanal', label: 'Racine', color: 'text-purple-600' }
                        ].map(tool => (
                            <button
                                key={tool.id}
                                onClick={() => setActiveToothTool(tool.id)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-2 ${
                                    activeToothTool === tool.id 
                                    ? 'bg-white shadow-sm ring-1 ring-slate-200' 
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                <span className={`w-2 h-2 rounded-full ${tool.id === activeToothTool ? tool.color.replace('text', 'bg') : 'bg-slate-300'}`}></span>
                                {tool.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-8 overflow-x-auto">
                    <Odontogram 
                        statusMap={toothStatus}
                        onToothClick={handleToothClick}
                    />
                </div>

                <div className="flex justify-end">
                    <button onClick={() => setActiveTab('procedures')} className="flex items-center gap-1 text-blue-600 font-medium hover:text-blue-800 transition-colors">
                        Suivant <IconChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        )}

        {/* Procedures Step */}
        {activeTab === 'procedures' && (
            <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div>
                    <h3 className="text-lg font-semibold text-slate-900">Actes & Honoraires</h3>
                    <p className="text-slate-500 text-sm">Ajoutez les actes et consommables utilisés durant cette séance.</p>
                </div>

                {/* Procedure Input */}
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                        <div className="sm:col-span-6">
                            <label className="block text-xs font-medium text-slate-500 mb-1">Acte</label>
                            <select 
                                className="w-full p-2 text-sm border border-slate-300 rounded-md outline-none focus:border-blue-500"
                                value={selectedActId}
                                onChange={e => setSelectedActId(e.target.value)}
                            >
                                <option value="">Sélectionner un acte...</option>
                                {MOCK_SERVICES.map(s => (
                                    <option key={s.id} value={s.id}>{s.name} ({s.price} MAD)</option>
                                ))}
                            </select>
                        </div>
                        <div className="sm:col-span-3">
                            <label className="block text-xs font-medium text-slate-500 mb-1">Dents (opt)</label>
                            <input 
                                type="text" 
                                placeholder="Ex: 16, 26"
                                className="w-full p-2 text-sm border border-slate-300 rounded-md outline-none focus:border-blue-500"
                                value={selectedTeethForAct}
                                onChange={e => setSelectedTeethForAct(e.target.value)}
                            />
                        </div>
                        <div className="sm:col-span-3 flex items-end">
                            <button 
                                onClick={addProcedure}
                                disabled={!selectedActId}
                                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Ajouter
                            </button>
                        </div>
                    </div>
                </div>

                {/* Consumables Input */}
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4">
                    <div className="flex gap-3 items-end">
                        <div className="flex-1">
                            <label className="block text-xs font-medium text-slate-500 mb-1">Consommables utilisés</label>
                            <select 
                                className="w-full p-2 text-sm border border-slate-300 rounded-md outline-none focus:border-blue-500"
                                value={selectedConsumableId}
                                onChange={e => setSelectedConsumableId(e.target.value)}
                            >
                                <option value="">Sélectionner matériel...</option>
                                {MOCK_INVENTORY.map(item => (
                                    <option key={item.id} value={item.id}>{item.name} (Stock: {item.quantity})</option>
                                ))}
                            </select>
                        </div>
                        <button 
                            onClick={addConsumable}
                            disabled={!selectedConsumableId}
                            className="bg-slate-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Ajouter Stock
                        </button>
                    </div>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-slate-100">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Description</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Détails</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Prix</th>
                                <th className="w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {selectedProcedures.length === 0 && usedConsumables.length === 0 ? (
                                <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-400 italic">Aucun acte ou matériel ajouté</td></tr>
                            ) : (
                                <>
                                    {selectedProcedures.map((proc) => (
                                        <tr key={proc.id}>
                                            <td className="px-4 py-3 text-sm font-medium text-slate-900">{proc.name}</td>
                                            <td className="px-4 py-3 text-sm text-slate-500">Dents: {proc.teeth || '-'}</td>
                                            <td className="px-4 py-3 text-sm font-bold text-slate-900 text-right">{proc.price}</td>
                                            <td className="px-4 py-3 text-right">
                                                <button onClick={() => removeProcedure(proc.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                                                    <IconTrash className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {usedConsumables.map((item) => (
                                        <tr key={item.id} className="bg-slate-50/50">
                                            <td className="px-4 py-3 text-sm font-medium text-slate-700 italic">{item.name}</td>
                                            <td className="px-4 py-3 text-sm text-slate-500 italic">Qté: {item.quantity} (Stock déduit)</td>
                                            <td className="px-4 py-3 text-sm text-slate-400 text-right italic">-</td>
                                            <td className="px-4 py-3 text-right">
                                                <button onClick={() => removeConsumable(item.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                                                    <IconTrash className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </>
                            )}
                        </tbody>
                        <tfoot className="bg-slate-50">
                            <tr>
                                <td colSpan={2} className="px-4 py-3 text-sm font-bold text-slate-700 text-right">Total Séance</td>
                                <td className="px-4 py-3 text-sm font-bold text-blue-700 text-right">{totalCost} MAD</td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <div className="flex justify-end">
                    <button onClick={() => setActiveTab('rx')} className="flex items-center gap-1 text-blue-600 font-medium hover:text-blue-800 transition-colors">
                        Suivant <IconChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        )}

        {/* Rx Step */}
        {activeTab === 'rx' && (
           <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex justify-between items-start">
                 <div>
                   <h3 className="text-lg font-semibold text-slate-900">Ordonnance</h3>
                   <p className="text-slate-500 text-sm">Ajoutez des médicaments à la prescription.</p>
                 </div>
                 <button 
                    onClick={() => setIsPrintModalOpen(true)}
                    className="flex items-center gap-2 text-slate-600 hover:text-blue-600 px-3 py-2 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
                 >
                    <IconPrinter className="w-4 h-4" /> Imprimer
                 </button>
             </div>

             <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4">
                <div className="flex flex-col sm:flex-row gap-2">
                   <input 
                      type="text" 
                      placeholder="Nom du médicament (ex: Amoxicilline)" 
                      value={newDrug.name}
                      onChange={e => setNewDrug({...newDrug, name: e.target.value})}
                      className="flex-1 p-2 text-sm border border-slate-300 rounded-md outline-none focus:border-blue-500"
                   />
                   <input 
                      type="text" 
                      placeholder="Posologie (ex: 1g matin et soir)" 
                      value={newDrug.dose}
                      onChange={e => setNewDrug({...newDrug, dose: e.target.value})}
                      className="flex-1 p-2 text-sm border border-slate-300 rounded-md outline-none focus:border-blue-500"
                   />
                   <button 
                      onClick={addDrug}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                   >
                      Ajouter
                   </button>
                </div>
             </div>

             <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-slate-100">
                   <thead className="bg-slate-50">
                      <tr>
                         <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Médicament</th>
                         <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Posologie</th>
                         <th className="w-10"></th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100 bg-white">
                      {prescription.length === 0 ? (
                         <tr><td colSpan={3} className="px-4 py-8 text-center text-sm text-slate-400 italic">Aucun médicament ajouté</td></tr>
                      ) : (
                         prescription.map((drug, i) => (
                            <tr key={i}>
                               <td className="px-4 py-3 text-sm font-medium text-slate-900">{drug.name}</td>
                               <td className="px-4 py-3 text-sm text-slate-500">{drug.dose}</td>
                               <td className="px-4 py-3 text-right">
                                  <button onClick={() => setPrescription(prescription.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600 text-xs transition-colors">
                                      <IconTrash className="w-4 h-4" />
                                  </button>
                               </td>
                            </tr>
                         ))
                      )}
                   </tbody>
                </table>
             </div>
             
             <div className="flex justify-end">
                <button onClick={() => setActiveTab('notes')} className="flex items-center gap-1 text-blue-600 font-medium hover:text-blue-800 transition-colors">
                   Suivant <IconChevronRight className="w-4 h-4" />
                </button>
             </div>
           </div>
        )}

        {/* Notes Step */}
        {activeTab === 'notes' && (
           <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex justify-between items-start">
               <div>
                 <h3 className="text-lg font-semibold text-slate-900">Notes & Observations</h3>
                 <p className="text-slate-500 text-sm">Détails cliniques et compte-rendu.</p>
               </div>
               <div className="flex gap-2">
                   <button 
                      onClick={toggleRecording}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all shadow-sm ${
                          isRecording 
                          ? 'bg-red-50 text-red-600 border border-red-200 animate-pulse' 
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                       <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-600' : 'bg-slate-400'}`}></div>
                       {isRecording ? `Enregistrement ${formatTime(recordingTime)}` : 'Dictée Vocale'}
                   </button>
                   <button 
                      onClick={() => setShowAiModal(true)}
                      className="flex items-center gap-2 bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1.5 rounded-md text-xs font-bold hover:bg-purple-100 transition-colors shadow-sm"
                    >
                       <IconWand className="w-3.5 h-3.5" /> Assistant IA
                   </button>
               </div>
             </div>
             
             <div>
                <textarea 
                  rows={10} 
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm leading-relaxed outline-none"
                  placeholder="Observations cliniques, diagnostic..."
                />
             </div>
           </div>
        )}

      </div>
    </div>
  );
};
