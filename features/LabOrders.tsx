import React, { useState, useEffect } from 'react';
import {
  IconSearch,
  IconPlus,
  IconTruck,
  IconClock,
  IconCheckCircle,
  IconTooth,
  IconX,
  IconFileText,
  IconCheck,
} from '../components/Icons';
import { useMedicomStore } from '../store';
import { usePatients } from '../hooks/usePatients';
import {
  getLabOrders,
  createLabOrder,
  updateLabOrderStatus,
  getLabContacts,
} from '../lib/api/labOrders';
import { LabOrder, LabContact } from '../types';
import { SlideOver } from '../components/SlideOver';

export const LabOrders = () => {
  const { currentTenant, showToast } = useMedicomStore();
  const { patients } = usePatients(100);

  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [labs, setLabs] = useState<LabContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<LabOrder | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // New Order State
  const [newOrder, setNewOrder] = useState({
    patientId: '',
    labContactId: '',
    type: 'Couronne Céramique',
    tooth: '',
    shade: 'A2',
    dueDate: '',
    notes: '',
  });

  const loadData = async () => {
    if (!currentTenant) return;
    setLoading(true);
    try {
      const [fetchedOrders, fetchedLabs] = await Promise.all([
        getLabOrders(currentTenant.id),
        getLabContacts(currentTenant.id),
      ]);
      setOrders(fetchedOrders);
      setLabs(fetchedLabs);
    } catch (error) {
      console.error('Error loading lab data', error);
      showToast({ type: 'error', message: 'Erreur de chargement des données labo' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentTenant]);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrder.patientId || !newOrder.labContactId || !currentTenant) return;

    try {
      await createLabOrder({
        tenantId: currentTenant.id,
        patientId: newOrder.patientId,
        labContactId: newOrder.labContactId,
        type: `${newOrder.type}`, // Keeping simple string for now, could be structured
        toothNumbers: newOrder.tooth.split(',').map((s) => s.trim()),
        shade: newOrder.shade,
        dueDate: newOrder.dueDate,
        description: newOrder.notes,
        cost: 0, // Default
      });

      showToast({ type: 'success', message: 'Commande créée avec succès' });
      setIsCreateOpen(false);
      setNewOrder({
        patientId: '',
        labContactId: '',
        type: 'Couronne Céramique',
        tooth: '',
        shade: 'A2',
        dueDate: '',
        notes: '',
      });
      loadData();
    } catch (error) {
      console.error('Create order error', error);
      showToast({ type: 'error', message: 'Erreur lors de la création' });
    }
  };

  const handleStatusUpdate = async (order: LabOrder, newStatus: string) => {
    try {
      await updateLabOrderStatus(order.id, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: newStatus as any } : o))
      );
      if (selectedOrder && selectedOrder.id === order.id) {
        setSelectedOrder({ ...selectedOrder, status: newStatus as any });
      }
      showToast({ type: 'success', message: 'Statut mis à jour' });
    } catch (error) {
      console.error('Update status error', error);
      showToast({ type: 'error', message: 'Erreur de mise à jour' });
    }
  };

  const STATUS_STEPS = ['Sent', 'In Progress', 'Received', 'Fitted'];

  if (loading && orders.length === 0) {
    return <div className="p-8 text-center text-slate-500">Chargement des commandes...</div>;
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Suivi de Laboratoire</h2>
          <p className="text-sm text-slate-500 mt-1">
            Gérez vos commandes de prothèses et travaux externes.
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-[7px] text-sm font-medium transition-colors shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]"
        >
          <IconPlus className="w-4 h-4" />
          Nouvelle Commande
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATUS_STEPS.map((status) => {
          const count = orders.filter((o) => o.status === status).length;
          return (
            <div
              key={status}
              className="bg-white p-4 rounded-[7px] border border-slate-200 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] flex items-center justify-between"
            >
              <div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  {status === 'Sent'
                    ? 'Envoyés'
                    : status === 'In Progress'
                      ? 'En Cours'
                      : status === 'Received'
                        ? 'Reçus'
                        : 'Posés'}
                </div>
                <div className="text-2xl font-bold text-slate-900 mt-1">{count}</div>
              </div>
              <div
                className={`p-2 rounded-full ${
                  status === 'Sent'
                    ? 'bg-blue-50 text-blue-600'
                    : status === 'In Progress'
                      ? 'bg-orange-50 text-orange-600'
                      : status === 'Received'
                        ? 'bg-purple-50 text-purple-600'
                        : 'bg-green-50 text-green-600'
                }`}
              >
                <IconTruck className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-[7px] border border-slate-200 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] overflow-hidden">
        <table className="min-w-full divide-y divide-gray-100">
          <thead>
            <tr className="bg-slate-50">
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                Patient
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                Laboratoire
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                Travail
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                Envoyé le
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                Pour le
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                Statut
              </th>
              <th className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-500 text-sm">
                  Aucune commande en cours.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr
                  key={order.id}
                  className="hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => setSelectedOrder(order)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                    {order.patientName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    {order.labName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    {order.type}
                    {order.toothNumbers && order.toothNumbers.length > 0 && (
                      <span className="text-slate-400 ml-1">({order.toothNumbers.join(', ')})</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {new Date(order.orderDate).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-medium">
                    {order.dueDate ? new Date(order.dueDate).toLocaleDateString('fr-FR') : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        order.status === 'Sent'
                          ? 'bg-blue-50 text-blue-700 border-blue-100'
                          : order.status === 'In Progress'
                            ? 'bg-orange-50 text-orange-700 border-orange-100'
                            : order.status === 'Received'
                              ? 'bg-purple-50 text-purple-700 border-purple-100'
                              : 'bg-green-50 text-green-700 border-green-100'
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 text-xs">Détails</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <SlideOver
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title="Détail Commande"
        subtitle={selectedOrder?.id}
        width="md"
      >
        {selectedOrder && (
          <div className="p-6 space-y-8">
            {/* Timeline */}
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200"></div>
              <div className="space-y-6">
                {STATUS_STEPS.map((step, idx) => {
                  const currentStepIdx = STATUS_STEPS.indexOf(selectedOrder.status);
                  const isComplete = idx <= currentStepIdx;
                  return (
                    <div key={step} className="relative pl-10 flex items-center">
                      <div
                        className={`absolute left-2.5 -translate-x-1/2 w-3 h-3 rounded-full border-2 ${isComplete ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'}`}
                      ></div>
                      <div>
                        <div
                          className={`text-sm font-medium ${isComplete ? 'text-slate-900' : 'text-slate-400'}`}
                        >
                          {step === 'Sent'
                            ? 'Envoyé au Labo'
                            : step === 'In Progress'
                              ? 'En Fabrication'
                              : step === 'Received'
                                ? 'Reçu au Cabinet'
                                : 'Posé sur Patient'}
                        </div>
                        {step === 'Sent' && (
                          <div className="text-xs text-slate-500">
                            {new Date(selectedOrder.orderDate).toLocaleDateString('fr-FR')}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-[7px] border border-slate-200 space-y-2">
              <h4 className="font-bold text-sm text-slate-900 mb-2">Informations</h4>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Labo</span> <span>{selectedOrder.labName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Patient</span>{' '}
                <span>{selectedOrder.patientName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Travail</span> <span>{selectedOrder.type}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Teinte</span> <span>{selectedOrder.shade}</span>
              </div>
              {selectedOrder.toothNumbers && selectedOrder.toothNumbers.length > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Dents</span>{' '}
                  <span>{selectedOrder.toothNumbers.join(', ')}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Coût</span> <span>{selectedOrder.cost} MAD</span>
              </div>
            </div>

            {selectedOrder.description && (
              <div>
                <h4 className="font-bold text-sm text-slate-900 mb-2">Notes</h4>
                <p className="text-sm text-slate-600 bg-white p-3 rounded border border-slate-200">
                  {selectedOrder.description}
                </p>
              </div>
            )}

            {selectedOrder.status !== 'Fitted' && (
              <div className="pt-4 border-t border-slate-100">
                <button
                  className="w-full bg-blue-600 text-white py-2 rounded-[7px] font-medium text-sm hover:bg-blue-700 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]"
                  onClick={() => {
                    const nextIdx = STATUS_STEPS.indexOf(selectedOrder.status) + 1;
                    if (nextIdx < STATUS_STEPS.length) {
                      const nextStatus = STATUS_STEPS[nextIdx];
                      handleStatusUpdate(selectedOrder, nextStatus);
                    }
                  }}
                >
                  Passer à l'étape suivante
                </button>
              </div>
            )}
          </div>
        )}
      </SlideOver>

      <SlideOver
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Nouvelle Commande Laboratoire"
        subtitle="Envoyer un travail prothétique"
      >
        <form onSubmit={handleCreateOrder} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Patient</label>
            <select
              required
              className="w-full border-slate-300 rounded-[7px] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] p-2 text-sm border focus:ring-2 focus:ring-blue-500 outline-none"
              value={newOrder.patientId}
              onChange={(e) => setNewOrder({ ...newOrder, patientId: e.target.value })}
            >
              <option value="">Sélectionner...</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Laboratoire</label>
              <select
                required
                className="w-full border-slate-300 rounded-[7px] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] p-2 text-sm border focus:ring-2 focus:ring-blue-500 outline-none"
                value={newOrder.labContactId}
                onChange={(e) => setNewOrder({ ...newOrder, labContactId: e.target.value })}
              >
                <option value="">Sélectionner...</option>
                {labs.map((lab) => (
                  <option key={lab.id} value={lab.id}>
                    {lab.name}
                  </option>
                ))}
              </select>
              {labs.length === 0 && (
                <p className="text-xs text-red-500 mt-1">Aucun laboratoire actif.</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date limite</label>
              <input
                type="date"
                required
                className="w-full border-slate-300 rounded-[7px] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] p-2 text-sm border focus:ring-2 focus:ring-blue-500 outline-none"
                value={newOrder.dueDate}
                onChange={(e) => setNewOrder({ ...newOrder, dueDate: e.target.value })}
              />
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-[7px] space-y-4">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <IconTooth className="w-4 h-4 text-slate-500" /> Détails du travail
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Type de travail
                </label>
                <select
                  className="w-full border-slate-300 rounded-[7px] p-2 text-sm border bg-white outline-none"
                  value={newOrder.type}
                  onChange={(e) => setNewOrder({ ...newOrder, type: e.target.value })}
                >
                  <option>Couronne Céramique</option>
                  <option>Couronne Zircone</option>
                  <option>Bridge (3 éléments)</option>
                  <option>Inlay / Onlay</option>
                  <option>Appareil Résine</option>
                  <option>Gouttière</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Dents (N°)</label>
                <input
                  type="text"
                  placeholder="Ex: 16, 26"
                  className="w-full border-slate-300 rounded-[7px] p-2 text-sm border bg-white outline-none"
                  value={newOrder.tooth}
                  onChange={(e) => setNewOrder({ ...newOrder, tooth: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Teinte</label>
              <div className="flex gap-2 flex-wrap">
                {['A1', 'A2', 'A3', 'B1', 'B2', 'C1'].map((shade) => (
                  <button
                    key={shade}
                    type="button"
                    onClick={() => setNewOrder({ ...newOrder, shade })}
                    className={`px-2 py-1 text-xs rounded border ${newOrder.shade === shade ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200'}`}
                  >
                    {shade}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Notes / Instructions
            </label>
            <textarea
              rows={3}
              className="w-full border-slate-300 rounded-[7px] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] p-2 text-sm border focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Instructions particulières pour le prothésiste..."
              value={newOrder.notes}
              onChange={(e) => setNewOrder({ ...newOrder, notes: e.target.value })}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="flex-1 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-[7px] hover:bg-slate-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 py-2 text-sm font-medium text-white bg-blue-600 rounded-[7px] hover:bg-blue-700 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]"
            >
              Créer la commande
            </button>
          </div>
        </form>
      </SlideOver>
    </div>
  );
};
