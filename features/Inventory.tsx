import React, { useState } from 'react';
import {
  IconSearch,
  IconPlus,
  IconArchive,
  IconAlertTriangle,
  IconCheckCircle,
  IconX,
  IconCheck,
} from '../components/Icons';
import { MOCK_INVENTORY } from '../constants';
import { InventoryItem } from '../types';
import { SlideOver } from '../components/SlideOver';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type Order = {
  id: string;
  items: { name: string; quantity: number }[];
  supplier: string;
  date: string;
  status: 'Pending' | 'Received' | 'Cancelled';
};

const CONSUMPTION_DATA = [
  { name: 'Gants', used: 120 },
  { name: 'Masques', used: 85 },
  { name: 'Anesthésique', used: 45 },
  { name: 'Composite', used: 12 },
  { name: 'Bavettes', used: 200 },
];

export const Inventory = () => {
  const [activeTab, setActiveTab] = useState<'stock' | 'orders'>('stock');
  const [items, setItems] = useState<InventoryItem[]>(MOCK_INVENTORY);
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Create Item State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    category: 'Consumable',
    quantity: '',
    minThreshold: '',
    unit: 'Boîtes',
    supplier: '',
  });

  // Order State
  const [orders, setOrders] = useState<Order[]>([
    {
      id: 'CMD-001',
      items: [{ name: 'Gants Latex (M)', quantity: 20 }],
      supplier: 'MedicalExpress',
      date: '2024-01-24',
      status: 'Pending',
    },
  ]);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedItemForOrder, setSelectedItemForOrder] = useState<string>('');
  const [orderQuantity, setOrderQuantity] = useState(1);

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'All' || item.category === filter;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (qty: number, min: number) => {
    if (qty === 0) return 'text-red-600 bg-red-50 border-red-200';
    if (qty <= min) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    const item: InventoryItem = {
      id: `i-${Date.now()}`,
      name: newItem.name,
      category: newItem.category as any,
      quantity: parseInt(newItem.quantity) || 0,
      minThreshold: parseInt(newItem.minThreshold) || 5,
      unit: newItem.unit,
      supplier: newItem.supplier,
      lastRestock: new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
    };
    setItems([item, ...items]);
    setIsCreateOpen(false);
    setNewItem({
      name: '',
      category: 'Consumable',
      quantity: '',
      minThreshold: '',
      unit: 'Boîtes',
      supplier: '',
    });
  };

  const openOrderModal = (itemName: string) => {
    setSelectedItemForOrder(itemName);
    setOrderQuantity(10); // default bulk
    setIsOrderModalOpen(true);
  };

  const submitOrder = () => {
    if (!selectedItemForOrder) return;
    const newOrder: Order = {
      id: `CMD-${Math.floor(Math.random() * 1000)}`,
      items: [{ name: selectedItemForOrder, quantity: orderQuantity }],
      supplier: items.find((i) => i.name === selectedItemForOrder)?.supplier || 'Divers',
      date: new Date().toISOString().split('T')[0],
      status: 'Pending',
    };
    setOrders([newOrder, ...orders]);
    setIsOrderModalOpen(false);
    setActiveTab('orders'); // Switch to view result
  };

  return (
    <div className="space-y-6 font-sans relative">
      {/* Order Creation Modal */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setIsOrderModalOpen(false)}
          ></div>
          <div className="bg-white rounded-[7px] shadow-xl w-full max-w-sm relative z-10 p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900">Commander Article</h3>
              <button onClick={() => setIsOrderModalOpen(false)}>
                <IconX className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Article</label>
              <input
                type="text"
                value={selectedItemForOrder}
                disabled
                className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-sm text-slate-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Quantité</label>
              <input
                type="number"
                value={orderQuantity}
                onChange={(e) => setOrderQuantity(parseInt(e.target.value))}
                className="w-full border border-slate-300 rounded p-2 text-sm"
                min="1"
              />
            </div>
            <button
              onClick={submitOrder}
              className="w-full bg-blue-600 text-white py-2 rounded-[7px] font-medium hover:bg-blue-700"
            >
              Confirmer la commande
            </button>
          </div>
        </div>
      )}

      {/* New Item SlideOver */}
      <SlideOver
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Ajouter un Produit"
        subtitle="Référencer un nouveau consommable ou équipement"
      >
        <form onSubmit={handleCreateItem} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nom du produit</label>
            <input
              type="text"
              required
              className="w-full border border-slate-300 rounded-[7px] p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Ex: Anesthésique Septanest"
              value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Catégorie</label>
              <select
                className="w-full border border-slate-300 rounded-[7px] p-2 text-sm bg-white outline-none"
                value={newItem.category}
                onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
              >
                <option value="Consumable">Consommable</option>
                <option value="Instrument">Instrument</option>
                <option value="Equipment">Équipement</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fournisseur</label>
              <input
                type="text"
                className="w-full border border-slate-300 rounded-[7px] p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Ex: DentalPro"
                value={newItem.supplier}
                onChange={(e) => setNewItem({ ...newItem, supplier: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Qté Initiale</label>
              <input
                type="number"
                min="0"
                className="w-full border border-slate-300 rounded-[7px] p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={newItem.quantity}
                onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Seuil Alerte</label>
              <input
                type="number"
                min="1"
                className="w-full border border-slate-300 rounded-[7px] p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={newItem.minThreshold}
                onChange={(e) => setNewItem({ ...newItem, minThreshold: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Unité</label>
              <select
                className="w-full border border-slate-300 rounded-[7px] p-2 text-sm bg-white outline-none"
                value={newItem.unit}
                onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
              >
                <option>Boîtes</option>
                <option>Unités</option>
                <option>Seringues</option>
                <option>Litres</option>
                <option>Paires</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="flex-1 py-2 border border-slate-300 rounded-[7px] text-slate-700 font-medium hover:bg-slate-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 py-2 bg-blue-600 text-white rounded-[7px] font-medium hover:bg-blue-700 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]"
            >
              Créer Référence
            </button>
          </div>
        </form>
      </SlideOver>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Gestion de Stock</h2>
          <p className="text-sm text-slate-500 mt-1">Suivi des consommables et réassorts.</p>
        </div>
        <div className="flex gap-3">
          <div className="flex bg-slate-100 p-1 rounded-[7px]">
            <button
              onClick={() => setActiveTab('stock')}
              className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-all ${activeTab === 'stock' ? 'bg-white text-slate-900 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]' : 'text-slate-500'}`}
            >
              Inventaire
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-all ${activeTab === 'orders' ? 'bg-white text-slate-900 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]' : 'text-slate-500'}`}
            >
              Commandes
            </button>
          </div>
          {activeTab === 'stock' && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-[7px] text-sm font-medium transition-colors shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]"
            >
              <IconPlus className="w-4 h-4" />
              Ajouter Article
            </button>
          )}
        </div>
      </div>

      {activeTab === 'stock' ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="bg-white p-5 rounded-[7px] border border-slate-200 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]">
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <IconArchive className="w-4 h-4 text-blue-500" /> Consommation (30j)
              </h3>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={CONSUMPTION_DATA}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10 }}
                    />
                    <Tooltip contentStyle={{ borderRadius: '4px', border: '1px solid #e2e8f0' }} />
                    <Bar dataKey="used" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-5 rounded-[7px] border border-slate-200 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] flex flex-col">
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <IconAlertTriangle className="w-4 h-4 text-orange-500" /> Alertes Stock
              </h3>
              <div className="space-y-3 flex-1 overflow-auto">
                {items.filter((i) => i.quantity <= i.minThreshold).length === 0 ? (
                  <div className="text-center text-slate-400 text-sm py-4">Tout va bien.</div>
                ) : (
                  items
                    .filter((i) => i.quantity <= i.minThreshold)
                    .map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center p-2 bg-red-50 rounded border border-red-100"
                      >
                        <div className="text-xs font-medium text-slate-700">{item.name}</div>
                        <button
                          onClick={() => openOrderModal(item.name)}
                          className="text-xs bg-white text-red-600 border border-red-200 px-2 py-1 rounded hover:bg-red-50"
                        >
                          Commander
                        </button>
                      </div>
                    ))
                )}
              </div>
            </div>

            <div className="bg-white p-5 rounded-[7px] border border-slate-200 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] flex flex-col justify-center items-center text-center">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center text-green-600 mb-3">
                <IconCheckCircle className="w-8 h-8" />
              </div>
              <div className="text-3xl font-bold text-slate-900">98%</div>
              <div className="text-sm text-slate-500">Taux de disponibilité</div>
            </div>
          </div>

          <div className="bg-white rounded-[7px] border border-slate-200 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
              <div className="flex gap-2">
                {['All', 'Consumable', 'Instrument'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilter(cat)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${filter === cat ? 'bg-white text-slate-900 border-slate-300 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]' : 'text-slate-500 border-transparent hover:bg-slate-100'}`}
                  >
                    {cat === 'All' ? 'Tout' : cat === 'Consumable' ? 'Consommables' : 'Instruments'}
                  </button>
                ))}
              </div>
              <div className="relative w-64">
                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-300 rounded-[7px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <table className="min-w-full divide-y divide-gray-100">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                    Article
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                    Catégorie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                    Fournisseur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                    Dernier Réassort
                  </th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-sm text-slate-900">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                      {item.category === 'Consumable' ? 'Consommable' : 'Instrument'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${item.quantity <= item.minThreshold ? 'bg-orange-500' : 'bg-green-500'}`}
                            style={{
                              width: `${Math.min((item.quantity / (item.minThreshold * 2)) * 100, 100)}%`,
                            }}
                          ></div>
                        </div>
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded border ${getStatusColor(item.quantity, item.minThreshold)}`}
                        >
                          {item.quantity} {item.unit}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {item.supplier}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {item.lastRestock}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openOrderModal(item.name)}
                        className="text-blue-600 hover:text-blue-900 text-xs font-medium"
                      >
                        Commander
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-[7px] border border-slate-200 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] overflow-hidden">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                  Référence
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                  Fournisseur
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                  Détails
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                  Date
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
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">{order.id}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{order.supplier}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {order.items.map((i, idx) => (
                      <div key={idx}>
                        {i.quantity}x {i.name}
                      </div>
                    ))}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{order.date}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${
                        order.status === 'Pending'
                          ? 'bg-orange-50 text-orange-700 border-orange-200'
                          : order.status === 'Received'
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                      }`}
                    >
                      {order.status === 'Pending'
                        ? 'En attente'
                        : order.status === 'Received'
                          ? 'Reçue'
                          : 'Annulée'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {order.status === 'Pending' && (
                      <button
                        onClick={() =>
                          setOrders(
                            orders.map((o) =>
                              o.id === order.id ? { ...o, status: 'Received' } : o
                            )
                          )
                        }
                        className="text-green-600 hover:text-green-800 text-xs font-bold flex items-center justify-end gap-1"
                      >
                        <IconCheck className="w-3 h-3" /> Réceptionner
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {orders.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-sm">Aucune commande en cours.</div>
          )}
        </div>
      )}
    </div>
  );
};
