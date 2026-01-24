
import React, { useState } from 'react';
import { IconSearch, IconPlus, IconTooth, IconTrash } from '../components/Icons';
import { MOCK_TREATMENTS, MOCK_PATIENTS, MOCK_SERVICES } from '../constants';
import { Treatment } from '../types';
import { SlideOver } from '../components/SlideOver';
import { Odontogram } from '../components/Odontogram';

type PlanPhase = {
    id: string;
    name: string;
    procedures: { id: string; name: string; price: number; }[];
};

export const Treatments = () => {
  const [activeTab, setActiveTab] = useState<'list' | 'chart'>('list');
  const [toothStatus, setToothStatus] = useState<Record<number, string>>({
      16: 'Caries', 36: 'Treated', 46: 'Missing'
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tous');
  const [treatments, setTreatments] = useState<Treatment[]>(MOCK_TREATMENTS);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  
  // Advanced Plan Creation State
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanPatientId, setNewPlanPatientId] = useState('');
  const [phases, setPhases] = useState<PlanPhase[]>([
      { id: 'ph-1', name: 'Phase 1: Assainissement', procedures: [] }
  ]);
  const [selectedServiceId, setSelectedServiceId] = useState('');

  // Tools for the chart view
  const [activeTool, setActiveTool] = useState('Caries');

  const handleToothClick = (number: number) => {
      const current = toothStatus[number];
      if (current === activeTool) {
          const newStatus = { ...toothStatus };
          delete newStatus[number];
          setToothStatus(newStatus);
      } else {
          setToothStatus({ ...toothStatus, [number]: activeTool });
      }
  };

  const addPhase = () => {
      setPhases([...phases, { 
          id: `ph-${Date.now()}`, 
          name: `Phase ${phases.length + 1}: Soins`, 
          procedures: [] 
      }]);
  };

  const addProcedureToPhase = (phaseId: string) => {
      const service = MOCK_SERVICES.find(s => s.id === selectedServiceId);
      if (!service) return;
      
      setPhases(phases.map(p => {
          if (p.id === phaseId) {
              return { ...p, procedures: [...p.procedures, { id: `proc-${Date.now()}`, name: service.name, price: service.price }] };
          }
          return p;
      }));
      setSelectedServiceId('');
  };

  const removeProcedureFromPhase = (phaseId: string, procId: string) => {
      setPhases(phases.map(p => {
          if (p.id === phaseId) {
              return { ...p, procedures: p.procedures.filter(proc => proc.id !== procId) };
          }
          return p;
      }));
  };

  const handleCreatePlan = (e: React.FormEvent) => {
      e.preventDefault();
      const patient = MOCK_PATIENTS.find(p => p.id === newPlanPatientId);
      if (!patient) return;

      const totalCost = phases.reduce((acc, phase) => acc + phase.procedures.reduce((pAcc, proc) => pAcc + proc.price, 0), 0);
      const totalProcedures = phases.reduce((acc, phase) => acc + phase.procedures.length, 0);

      const plan: Treatment = {
          id: `T-${Date.now()}`,
          name: newPlanName,
          patientName: `${patient.firstName} ${patient.lastName}`,
          totalSessions: phases.length, // Rough estimate: 1 phase = 1 session for simplicity
          completedSessions: 0,
          startDate: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
          status: 'Active',
          amount: totalCost
      };

      setTreatments([plan, ...treatments]);
      setIsCreateOpen(false);
      // Reset
      setNewPlanName('');
      setNewPlanPatientId('');
      setPhases([{ id: 'ph-1', name: 'Phase 1: Assainissement', procedures: [] }]);
  };

  const filteredTreatments = treatments.filter(t => {
      const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.patientName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = statusFilter === 'Tous' || 
                            (statusFilter === 'Actifs' && t.status === 'Active') || 
                            (statusFilter === 'Terminés' && t.status === 'Completed');
      return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Plans de Traitement</h2>
          <p className="text-sm text-slate-500 mt-1">Suivez l'avancement clinique et financier des soins longs.</p>
        </div>
        <div className="flex gap-3">
            <div className="bg-slate-100 p-1 rounded-md flex text-sm font-medium">
                <button 
                    onClick={() => setActiveTab('list')}
                    className={`px-3 py-1.5 rounded-sm transition-colors ${activeTab === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                >
                    Liste
                </button>
                <button 
                    onClick={() => setActiveTab('chart')}
                    className={`px-3 py-1.5 rounded-sm transition-colors ${activeTab === 'chart' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                >
                    Odontogramme
                </button>
            </div>
            <button 
                onClick={() => setIsCreateOpen(true)}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm"
            >
                <IconPlus className="w-4 h-4" />
                Nouveau Plan
            </button>
        </div>
      </div>

      {activeTab === 'chart' ? (
          <div className="bg-white rounded-md border border-slate-200 shadow-sm p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
                  <h3 className="text-lg font-semibold text-slate-800">État Initial (Karim Benali)</h3>
                  
                  {/* Tool Selector */}
                  <div className="flex bg-slate-100 p-1 rounded-lg">
                        {[
                            { id: 'Caries', label: 'Carie', color: 'text-red-600' },
                            { id: 'Treated', label: 'Soignée', color: 'text-blue-600' },
                            { id: 'Missing', label: 'Absente', color: 'text-slate-400' },
                            { id: 'Crown', label: 'Couronne', color: 'text-yellow-600' }
                        ].map(tool => (
                            <button
                                key={tool.id}
                                onClick={() => setActiveTool(tool.id)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-2 ${
                                    activeTool === tool.id 
                                    ? 'bg-white shadow-sm ring-1 ring-slate-200' 
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                <span className={`w-2 h-2 rounded-full ${tool.id === activeTool ? tool.color.replace('text', 'bg') : 'bg-slate-300'}`}></span>
                                {tool.label}
                            </button>
                        ))}
                    </div>
              </div>

              <div className="overflow-x-auto pb-4">
                  <Odontogram statusMap={toothStatus} onToothClick={handleToothClick} />
              </div>
              
              <div className="mt-8 border-t border-slate-100 pt-6">
                  <h4 className="text-sm font-bold text-slate-700 mb-3">Diagnostic Rapide</h4>
                  <div className="text-sm text-slate-600 bg-slate-50 p-4 rounded-md">
                      Patient présente des lésions carieuses sur les secteurs postérieurs. 46 absente non remplacée. Prévoir bilan parodontal.
                  </div>
              </div>
          </div>
      ) : (
        <>
            {/* Filters */}
            <div className="bg-white p-2 rounded-md border border-slate-200 shadow-sm flex items-center justify-between">
                <div className="relative flex-1 max-w-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <IconSearch className="h-4 w-4 text-slate-400" />
                </div>
                <input 
                    type="text" 
                    placeholder="Rechercher patient ou traitement..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-9 pr-3 py-1.5 border-none rounded-md leading-5 bg-transparent placeholder-slate-400 focus:outline-none focus:ring-0 text-sm" 
                />
                </div>
                <div className="flex items-center gap-2 px-2">
                    <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="text-xs font-medium text-slate-600 bg-slate-50 border-none rounded py-1.5 pl-2 pr-8 focus:ring-1 focus:ring-blue-500 cursor-pointer outline-none"
                    >
                        <option value="Tous">Tous les statuts</option>
                        <option value="Actifs">Actifs</option>
                        <option value="Terminés">Terminés</option>
                    </select>
                </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/50">
                    <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Traitement</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Progression</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Début</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Statut</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Montant</th>
                    <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                    {filteredTreatments.map((treatment) => (
                    <tr key={treatment.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                        <div className="flex items-center">
                            <div className="h-9 w-9 flex-shrink-0 bg-blue-50 text-blue-600 rounded-md flex items-center justify-center border border-blue-100">
                            <IconTooth className="w-5 h-5" />
                            </div>
                            <div className="ml-3">
                            <div className="text-sm font-medium text-slate-900">{treatment.name}</div>
                            <div className="text-xs text-slate-500">{treatment.patientName}</div>
                            </div>
                        </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap align-middle">
                        <div className="w-full max-w-[140px]">
                            <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                                <span>Séance {treatment.completedSessions}/{treatment.totalSessions}</span>
                                <span>{Math.round((treatment.completedSessions/treatment.totalSessions)*100)}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5">
                                <div className="bg-blue-600 h-1.5 rounded-full transition-all duration-500" style={{ width: `${(treatment.completedSessions/treatment.totalSessions)*100}%` }}></div>
                            </div>
                        </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {treatment.startDate}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${
                            treatment.status === 'Active' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                            treatment.status === 'Completed' ? 'bg-green-50 text-green-700 border-green-100' :
                            'bg-orange-50 text-orange-700 border-orange-100'
                        }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                                treatment.status === 'Active' ? 'bg-blue-500' :
                                treatment.status === 'Completed' ? 'bg-green-500' :
                                'bg-orange-500'
                            }`}></span>
                            {treatment.status === 'Active' ? 'En cours' : treatment.status === 'Completed' ? 'Terminé' : 'Suspendu'}
                        </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                        {treatment.amount.toLocaleString()} MAD
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onClick={() => alert(`Gérer le traitement: ${treatment.name}`)} className="text-blue-600 hover:text-blue-800 transition-colors">Gérer</button>
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
        </>
      )}

      {/* New Treatment Plan SlideOver */}
      <SlideOver
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Nouveau Plan de Traitement"
        subtitle="Définissez les étapes d'un soin complexe"
        width="xl"
      >
          <form onSubmit={handleCreatePlan} className="p-6 space-y-6 flex flex-col h-full">
              <div className="flex-none space-y-6">
                  <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Patient</label>
                      <select 
                        required
                        className="w-full border-slate-300 rounded-md p-2.5 text-sm border focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                        value={newPlanPatientId}
                        onChange={e => setNewPlanPatientId(e.target.value)}
                      >
                          <option value="">Sélectionner...</option>
                          {MOCK_PATIENTS.map(p => (
                              <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                          ))}
                      </select>
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Nom du plan</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Ex: Réhabilitation Globale"
                        className="w-full border-slate-300 rounded-md p-2 text-sm border focus:ring-2 focus:ring-blue-500 outline-none"
                        value={newPlanName}
                        onChange={e => setNewPlanName(e.target.value)}
                      />
                  </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                  <h4 className="font-bold text-sm text-slate-900 border-b border-slate-200 pb-2">Phases du traitement</h4>
                  {phases.map((phase, idx) => (
                      <div key={phase.id} className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                          <div className="flex justify-between items-center">
                              <input 
                                type="text" 
                                value={phase.name} 
                                onChange={(e) => {
                                    const newPhases = [...phases];
                                    newPhases[idx].name = e.target.value;
                                    setPhases(newPhases);
                                }}
                                className="bg-transparent font-medium text-sm text-slate-900 outline-none border-b border-transparent focus:border-slate-300 w-full"
                              />
                              <div className="text-xs font-bold text-slate-500">{phase.procedures.reduce((sum, p) => sum + p.price, 0)} MAD</div>
                          </div>
                          
                          <div className="space-y-2">
                              {phase.procedures.map((proc, pIdx) => (
                                  <div key={proc.id} className="flex justify-between items-center bg-white p-2 rounded border border-slate-200 text-sm">
                                      <span>{proc.name}</span>
                                      <div className="flex items-center gap-3">
                                          <span className="font-mono text-slate-600">{proc.price}</span>
                                          <button type="button" onClick={() => removeProcedureFromPhase(phase.id, proc.id)} className="text-red-400 hover:text-red-600"><IconTrash className="w-3 h-3" /></button>
                                      </div>
                                  </div>
                              ))}
                          </div>

                          <div className="flex gap-2 pt-2">
                              <select 
                                className="flex-1 text-xs border border-slate-300 rounded p-1.5"
                                value={selectedServiceId}
                                onChange={e => setSelectedServiceId(e.target.value)}
                              >
                                  <option value="">Ajouter un acte...</option>
                                  {MOCK_SERVICES.map(s => <option key={s.id} value={s.id}>{s.name} ({s.price} MAD)</option>)}
                              </select>
                              <button 
                                type="button" 
                                onClick={() => addProcedureToPhase(phase.id)}
                                className="px-3 py-1.5 bg-blue-100 text-blue-700 text-xs font-medium rounded hover:bg-blue-200"
                              >
                                  Ajouter
                              </button>
                          </div>
                      </div>
                  ))}
                  <button 
                    type="button" 
                    onClick={addPhase}
                    className="w-full py-2 border-2 border-dashed border-slate-200 rounded-lg text-slate-500 text-sm font-medium hover:border-slate-300 hover:bg-slate-50"
                  >
                      + Nouvelle Phase
                  </button>
              </div>

              <div className="flex-none pt-4 flex gap-3 border-t border-slate-100">
                  <div className="flex-1">
                      <div className="text-xs text-slate-500">Total Estimé</div>
                      <div className="text-lg font-bold text-slate-900">
                          {phases.reduce((acc, phase) => acc + phase.procedures.reduce((pAcc, proc) => pAcc + proc.price, 0), 0)} MAD
                      </div>
                  </div>
                  <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 shadow-sm">Valider le plan</button>
              </div>
          </form>
      </SlideOver>
    </div>
  );
};
