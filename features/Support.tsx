import React, { useState } from 'react';
import {
  IconSearch,
  IconPlus,
  IconTicket,
  IconCheck,
  IconX,
  IconMessage,
  IconSend,
  IconPaperclip,
  IconLock,
  IconClock,
  IconArrowLeft,
  IconTag,
  IconAlertTriangle,
  IconUserPlus,
} from '../components/Icons';
import { Ticket, User, TicketMessage, TicketStatus, TicketPriority } from '../types';

interface SupportProps {
  user?: User;
}

const MOCK_MESSAGES: Record<string, TicketMessage[]> = {
  'T-1023': [
    {
      id: 'm1',
      ticketId: 'T-1023',
      senderId: 'u1',
      senderName: 'Dr. Amina',
      senderAvatar: 'https://picsum.photos/id/64/100/100',
      content:
        "Bonjour, je n'arrive pas à télécharger la facture de M. Benali. Le bouton semble inactif.",
      createdAt: '2024-01-24T10:00:00',
      isInternal: false,
    },
    {
      id: 'm2',
      ticketId: 'T-1023',
      senderId: 'u99',
      senderName: 'Sami (Support)',
      senderAvatar: 'https://picsum.photos/id/1005/100/100',
      content: "Bonjour Dr. Amina, je regarde ça tout de suite. Avez-vous un message d'erreur ?",
      createdAt: '2024-01-24T10:15:00',
      isInternal: false,
    },
    {
      id: 'm3',
      ticketId: 'T-1023',
      senderId: 'u99',
      senderName: 'Sami (Support)',
      senderAvatar: 'https://picsum.photos/id/1005/100/100',
      content: 'Note interne: Vérifier les logs du service PDF generation à 10h.',
      createdAt: '2024-01-24T10:16:00',
      isInternal: true,
    },
  ],
  'T-1022': [
    {
      id: 'm4',
      ticketId: 'T-1022',
      senderId: 'u1',
      senderName: 'Dr. Amina',
      senderAvatar: 'https://picsum.photos/id/64/100/100',
      content: 'Comment puis-je importer ma base patient Excel ?',
      createdAt: '2024-01-23T14:00:00',
      isInternal: false,
    },
  ],
};

const MOCK_TICKETS: Ticket[] = [
  {
    id: 'T-1023',
    subject: 'Erreur lors de la génération PDF facture',
    category: 'Bug',
    priority: 'High',
    status: 'Open',
    user: {
      id: 'u1',
      name: 'Dr. Amina',
      clinicName: 'Cabinet Dentaire Amina',
      plan: 'Premium',
      avatar: 'https://picsum.photos/id/64/100/100',
    },
    assignedTo: { id: 'u99', name: 'Sami', avatar: 'https://picsum.photos/id/1005/100/100' },
    lastUpdate: '10 min',
    createdAt: '2024-01-24T10:00:00',
    messages: MOCK_MESSAGES['T-1023'],
    tags: ['PDF', 'Facturation'],
  },
  {
    id: 'T-1022',
    subject: 'Question sur les imports patients',
    category: 'Feature',
    priority: 'Normal',
    status: 'In Progress',
    user: {
      id: 'u1',
      name: 'Dr. Amina',
      clinicName: 'Cabinet Dentaire Amina',
      plan: 'Premium',
      avatar: 'https://picsum.photos/id/64/100/100',
    },
    lastUpdate: '5h',
    createdAt: '2024-01-23T14:00:00',
    messages: MOCK_MESSAGES['T-1022'],
    tags: ['Import', 'Excel'],
  },
];

const StatusBadge = ({ status }: { status: TicketStatus }) => {
  const styles = {
    Open: 'bg-blue-100 text-blue-700 border-blue-200',
    'In Progress': 'bg-orange-100 text-orange-700 border-orange-200',
    Waiting: 'bg-purple-100 text-purple-700 border-purple-200',
    Resolved: 'bg-green-100 text-green-700 border-green-200',
    Closed: 'bg-gray-100 text-gray-600 border-gray-200',
  };
  return (
    <span
      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${styles[status]}`}
    >
      {status}
    </span>
  );
};

const PriorityBadge = ({ priority }: { priority: TicketPriority }) => {
  const isUrgent = priority === 'Urgent' || priority === 'High';
  return (
    <span
      className={`flex items-center gap-1 text-xs font-medium ${isUrgent ? 'text-red-600' : 'text-gray-500'}`}
    >
      {isUrgent && <IconAlertTriangle className="w-3 h-3" />}
      {priority}
    </span>
  );
};

// --- USER VIEW ---

const UserSupport = ({ user }: { user: User }) => {
  const [view, setView] = useState<'list' | 'detail' | 'new'>('list');
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>(
    MOCK_TICKETS.filter((t) => t.user.id === user.id)
  );

  const [newSubject, setNewSubject] = useState('');
  const [newCategory, setNewCategory] = useState<string>('Technical');
  const [newPriority, setNewPriority] = useState<string>('Normal');
  const [newDesc, setNewDesc] = useState('');
  const [replyText, setReplyText] = useState('');

  const handleCreateTicket = () => {
    const newTicket: Ticket = {
      id: `T-${Math.floor(Math.random() * 10000)}`,
      subject: newSubject,
      category: newCategory as any,
      priority: newPriority as any,
      status: 'Open',
      user: {
        id: user.id,
        name: user.name,
        clinicName: user.clinicName || '',
        plan: 'Premium',
        avatar: user.avatar,
      },
      lastUpdate: 'Just now',
      createdAt: new Date().toISOString(),
      messages: [
        {
          id: `m-${Date.now()}`,
          ticketId: 'temp',
          senderId: user.id,
          senderName: user.name,
          senderAvatar: user.avatar,
          content: newDesc,
          createdAt: new Date().toISOString(),
          isInternal: false,
        },
      ],
      tags: [],
    };

    setTickets([newTicket, ...tickets]);
    setView('list');
    setNewSubject('');
    setNewDesc('');
  };

  const handleSendReply = () => {
    if (!activeTicket || !replyText.trim()) return;
    const newMessage: TicketMessage = {
      id: `m-${Date.now()}`,
      ticketId: activeTicket.id,
      senderId: user.id,
      senderName: user.name,
      senderAvatar: user.avatar,
      content: replyText,
      createdAt: new Date().toISOString(),
      isInternal: false,
    };

    const updatedTicket = {
      ...activeTicket,
      messages: [...activeTicket.messages, newMessage],
      lastUpdate: 'Just now',
    };
    setTickets(tickets.map((t) => (t.id === activeTicket.id ? updatedTicket : t)));
    setActiveTicket(updatedTicket);
    setReplyText('');
  };

  if (view === 'new') {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-[20px] border border-gray-200  p-8 font-sans">
        <button
          onClick={() => setView('list')}
          className="flex items-center text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
        >
          <IconArrowLeft className="w-4 h-4 mr-1" /> Retour à la liste
        </button>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Ouvrir un nouveau ticket</h2>
        <p className="text-sm text-gray-500 mb-8">
          Décrivez votre problème avec précision pour une résolution rapide.
        </p>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sujet</label>
            <input
              type="text"
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              placeholder="Ex: Problème d'impression..."
              className="w-full border-gray-300 rounded-[20px]  focus:border-blue-500 focus:ring-blue-500 p-2.5 border"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full border-gray-300 rounded-[20px]  focus:border-blue-500 focus:ring-blue-500 p-2.5 border"
              >
                <option value="Technical">Technique</option>
                <option value="Billing">Facturation</option>
                <option value="Feature">Suggestion</option>
                <option value="Bug">Bug</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Urgence</label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value)}
                className="w-full border-gray-300 rounded-[20px]  focus:border-blue-500 focus:ring-blue-500 p-2.5 border"
              >
                <option value="Low">Basse (Information)</option>
                <option value="Normal">Normale (Gênant)</option>
                <option value="High">Haute (Bloquant)</option>
                <option value="Urgent">Critique (Urgence Cabinet)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description détaillée
            </label>
            <textarea
              rows={6}
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Décrivez les étapes pour reproduire le problème..."
              className="w-full border-gray-300 rounded-[20px]  focus:border-blue-500 focus:ring-blue-500 p-3 border"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3">
            <button
              onClick={() => setView('list')}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-[20px] transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleCreateTicket}
              disabled={!newSubject || !newDesc}
              className="px-4 py-2 text-sm font-medium text-white bg-[#0f0f10] hover:bg-black rounded-[20px] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Envoyer le ticket
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'detail' && activeTicket) {
    return (
      <div className="flex flex-col h-[calc(100vh-140px)] bg-white rounded-[20px] border border-gray-200  overflow-hidden font-sans">
        <div className="h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-gray-50/50">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setView('list')}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <IconArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-base font-bold text-gray-900">{activeTicket.subject}</h2>
              <div className="text-xs text-gray-500 flex items-center gap-2">
                Ticket #{activeTicket.id} <StatusBadge status={activeTicket.status} />
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTicket.messages
            .filter((m) => !m.isInternal)
            .map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-4 ${msg.senderId === user.id ? 'flex-row-reverse' : ''}`}
              >
                <img
                  src={msg.senderAvatar}
                  className="w-8 h-8 rounded-full border border-gray-100  object-cover"
                  alt=""
                />
                <div
                  className={`max-w-[70%] ${msg.senderId === user.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'} p-4 rounded-[20px]  text-sm`}
                >
                  <div
                    className={`font-bold text-xs mb-1 ${msg.senderId === user.id ? 'text-blue-100' : 'text-gray-500'}`}
                  >
                    {msg.senderName}
                  </div>
                  {msg.content}
                </div>
              </div>
            ))}
        </div>
        <div className="p-4 bg-white border-t border-gray-200">
          <div className="relative">
            <input
              type="text"
              placeholder="Répondre..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
              className="w-full pl-4 pr-12 py-3 border border-gray-200 rounded-full bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all  outline-none"
            />
            <button
              onClick={handleSendReply}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors "
            >
              <IconSend className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Centre d'aide</h2>
          <p className="text-sm text-gray-500 mt-1">
            Consultez vos tickets ou posez une nouvelle question.
          </p>
        </div>
        <button
          onClick={() => setView('new')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-[20px] text-sm font-medium  transition-colors"
        >
          <IconPlus className="w-4 h-4" /> Nouveau Ticket
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {tickets.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-[20px] border border-gray-200 border-dashed">
              <IconTicket className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900">Aucun ticket</h3>
              <p className="text-gray-500">Vous n'avez pas encore de demande de support.</p>
            </div>
          ) : (
            tickets.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => {
                  setActiveTicket(ticket);
                  setView('detail');
                }}
                className="bg-white p-4 rounded-[20px] border border-gray-200 hover:border-blue-300 hover: cursor-pointer transition-all group"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                    {ticket.subject}
                  </div>
                  <StatusBadge status={ticket.status} />
                </div>
                <div className="text-sm text-gray-600 line-clamp-2 mb-3">
                  {ticket.messages[ticket.messages.length - 1]?.content}
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>
                    #{ticket.id} • {ticket.category}
                  </span>
                  <span className="flex items-center gap-1">
                    <IconClock className="w-3 h-3" /> Mise à jour: {ticket.lastUpdate}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[20px] p-6 text-white ">
            <h3 className="font-bold text-lg mb-2">Besoin d'une réponse rapide ?</h3>
            <p className="text-indigo-100 text-sm mb-4">
              Notre base de connaissances contient des guides détaillés pour la plupart des
              questions.
            </p>
            <div className="relative">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Comment changer mon mot de passe ?"
                className="w-full pl-9 pr-4 py-2 rounded text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none "
              />
            </div>
          </div>

          <div className="bg-white rounded-[20px] border border-gray-200 p-5 ">
            <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide">
              Articles populaires
            </h3>
            <ul className="space-y-3">
              {[
                'Configurer mon imprimante',
                'Ajouter un nouvel utilisateur',
                'Exporter la comptabilité',
                'Problème de connexion',
              ].map((article, i) => (
                <li key={i}>
                  <a
                    href="#"
                    className="text-sm text-gray-600 hover:text-blue-600 hover:underline flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span>
                    {article}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- SUPER ADMIN VIEW ---

const SuperAdminSupport = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'open' | 'urgent'>('all');

  return (
    <div className="space-y-12 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold text-slate-900 tracking-tight">
            Support Center
          </h1>
          <p className="text-[13px] text-slate-500 mt-0.5">
            Gérez les tickets clients et suivez la résolution.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Chercher un ticket..."
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-[30px] text-[13px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-64 transition-all"
            />
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-5 h-full flex flex-col justify-between group">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-[14px] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-slate-100 transition-colors duration-300 ease-in-out">
              <IconTicket className="w-5 h-5" />
            </div>
            <div className="badge badge-gray gap-1 font-semibold rounded-[30px] px-2.5 py-1">
              <span>Total Open</span>
            </div>
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-widest">
              Tickets Ouverts
            </div>
            <div className="text-[26px] font-semibold text-slate-900 tracking-tight leading-none">
              24
            </div>
          </div>
        </div>

        <div className="card p-5 h-full flex flex-col justify-between group">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-[14px] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-slate-100 transition-colors duration-300 ease-in-out">
              <IconAlertTriangle className="w-5 h-5 text-rose-500" />
            </div>
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-widest">
              Priorité Haute
            </div>
            <div className="text-[26px] font-semibold text-rose-600 tracking-tight leading-none">
              3
            </div>
          </div>
        </div>

        <div className="card p-5 h-full flex flex-col justify-between group">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-[14px] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-slate-100 transition-colors duration-300 ease-in-out">
              <IconClock className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-widest">
              Temps Réponse Moy.
            </div>
            <div className="text-[26px] font-semibold text-slate-900 tracking-tight leading-none">
              1.2h
            </div>
          </div>
        </div>

        <div className="card p-5 h-full flex flex-col justify-between group">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-[14px] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-slate-100 transition-colors duration-300 ease-in-out">
              <IconCheck className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-widest">
              Résolus (Aujourd'hui)
            </div>
            <div className="text-[26px] font-semibold text-emerald-600 tracking-tight leading-none">
              12
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 flex items-center gap-2 border-b border-slate-100">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-[30px] text-[12px] font-semibold transition-colors ${activeTab === 'all' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Tous les tickets
          </button>
          <button
            onClick={() => setActiveTab('open')}
            className={`px-3 py-1.5 rounded-[30px] text-[12px] font-semibold transition-colors ${activeTab === 'open' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
          >
            En attente
          </button>
          <button
            onClick={() => setActiveTab('urgent')}
            className={`px-3 py-1.5 rounded-[30px] text-[12px] font-semibold transition-colors ${activeTab === 'urgent' ? 'bg-rose-50 text-rose-700' : 'text-rose-600/70 hover:text-rose-700'}`}
          >
            Urgents
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-[#FAFAFA]">
              <tr>
                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  Ticket
                </th>
                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  Statut
                </th>
                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  Client
                </th>
                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  Assigné
                </th>
                <th className="px-6 py-4 text-right text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  Dernière MAJ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {MOCK_TICKETS.map((ticket) => (
                <tr
                  key={ticket.id}
                  className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                >
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 text-[13px] group-hover:text-blue-600 transition-colors">
                          {ticket.subject}
                        </span>
                        {ticket.priority === 'High' && (
                          <IconAlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                        )}
                      </div>
                      <div className="text-[12px] text-slate-500 flex items-center gap-2">
                        <span className="font-mono text-[10px] text-slate-400">{ticket.id}</span>
                        <span>•</span>
                        <span>{ticket.category}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={ticket.status} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={ticket.user.avatar}
                        className="w-7 h-7 rounded-full bg-slate-100"
                        alt=""
                      />
                      <div>
                        <div className="text-[13px] font-medium text-slate-900">
                          {ticket.user.name}
                        </div>
                        <div className="text-[11px] text-slate-500">{ticket.user.clinicName}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {ticket.assignedTo ? (
                      <div className="flex items-center gap-2">
                        <img
                          src={ticket.assignedTo.avatar}
                          className="w-6 h-6 rounded-full"
                          alt=""
                        />
                        <span className="text-[12px] font-medium text-slate-700">
                          {ticket.assignedTo.name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[12px] text-slate-400 italic">Non assigné</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right text-[12px] text-slate-500">
                    <div className="flex items-center justify-end gap-1.5">
                      <IconClock className="w-3.5 h-3.5 text-slate-400" />
                      {ticket.lastUpdate}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export const Support: React.FC<SupportProps> = ({ user }) => {
  if (!user) return null;
  return user.role === 'super_admin' ? <SuperAdminSupport /> : <UserSupport user={user} />;
};
