import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  IconSearch, IconPlus, IconTicket, IconCheck, IconX, IconMessage, IconSend,
  IconLock, IconClock, IconAlertTriangle, IconChevronLeft, IconLifeBuoy,
  IconActivity, IconZap, IconTag, IconChevronDown, IconRefresh, IconEdit,
  IconTrendingUp,
} from '../components/Icons';
import { Ticket, TicketMessage, TicketStatus, TicketPriority, TicketCategory, User } from '../types';
import { getTickets, createTicket, addMessage, updateTicketStatus } from '../lib/api/support';
import { useMedicomStore } from '../store';

// ══════════════════════════════════════════════════════════════════
//  CONSTANTS
// ══════════════════════════════════════════════════════════════════

const STATUS_CFG: Record<TicketStatus, { label: string; dot: string; badge: string }> = {
  'Open':        { label: 'Ouvert',     dot: 'bg-blue-500',    badge: 'bg-blue-50 text-blue-700' },
  'In Progress': { label: 'En cours',   dot: 'bg-amber-500',   badge: 'bg-amber-50 text-amber-700' },
  'Waiting':     { label: 'En attente', dot: 'bg-purple-500',  badge: 'bg-purple-50 text-purple-700' },
  'Resolved':    { label: 'Résolu',     dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700' },
  'Closed':      { label: 'Fermé',      dot: 'bg-slate-400',   badge: 'bg-slate-100 text-slate-600' },
};

const PRIORITY_CFG: Record<TicketPriority, { label: string; badge: string; slaH: number }> = {
  'Urgent': { label: 'Urgente',  badge: 'bg-red-50 text-red-700',      slaH: 1 },
  'High':   { label: 'Haute',    badge: 'bg-orange-50 text-orange-700', slaH: 4 },
  'Normal': { label: 'Normale',  badge: 'bg-blue-50 text-blue-600',    slaH: 8 },
  'Low':    { label: 'Basse',    badge: 'bg-slate-100 text-slate-500', slaH: 24 },
};

const CATEGORY_LABELS: Record<TicketCategory, string> = {
  Technical: 'Technique', Billing: 'Facturation', Feature: 'Suggestion', Bug: 'Bug',
};

// Canned responses used by SA team
const CANNED_RESPONSES = [
  { label: 'Demande d\'infos',   text: 'Merci pour votre message. Pourriez-vous me fournir plus de détails sur le problème observé, notamment : les étapes pour le reproduire, le message d\'erreur exact et la version de votre navigateur ?' },
  { label: 'En investigation',   text: 'Nous avons bien reçu votre ticket et notre équipe technique est en train d\'analyser le problème. Nous vous revenons avec une solution sous 2h.' },
  { label: 'Solution trouvée',   text: 'Bonne nouvelle ! Nous avons identifié et corrigé le problème. Veuillez rafraîchir la page et retenter l\'opération. N\'hésitez pas à nous confirmer que tout fonctionne correctement.' },
  { label: 'Feature roadmap',    text: 'Merci pour cette suggestion ! Nous l\'avons transmise à notre équipe produit. Cette fonctionnalité est déjà dans notre feuille de route et sera disponible dans une prochaine mise à jour.' },
  { label: 'En attente client',  text: 'Suite à notre échange, nous attendons votre retour pour finaliser la résolution. Sans réponse de votre part sous 7 jours, ce ticket sera fermé automatiquement.' },
  { label: 'Clôture standard',   text: 'Votre demande est maintenant résolue. N\'hésitez pas à ouvrir un nouveau ticket si vous rencontrez d\'autres difficultés. Bonne continuation !' },
];

// Macro actions: one click → status + message
const MACROS = [
  { label: 'Résoudre',           status: 'Resolved' as TicketStatus, cannedIdx: 5, color: 'text-emerald-600 hover:bg-emerald-50' },
  { label: 'Attente client',     status: 'Waiting'  as TicketStatus, cannedIdx: 4, color: 'text-purple-600 hover:bg-purple-50' },
];

// Mock SA team agents
const SA_AGENTS = [
  { id: 'sa1', name: 'Sami Atif',      avatar: 'https://ui-avatars.com/api/?name=Sami+Atif&background=0f0f10&color=fff' },
  { id: 'sa2', name: 'Yasmine Alaoui', avatar: 'https://ui-avatars.com/api/?name=Yasmine+Alaoui&background=3b82f6&color=fff' },
  { id: 'sa3', name: 'Karim Bennis',   avatar: 'https://ui-avatars.com/api/?name=Karim+Bennis&background=8b5cf6&color=fff' },
];

// ══════════════════════════════════════════════════════════════════
//  UTILITY FUNCTIONS
// ══════════════════════════════════════════════════════════════════

function relTime(iso: string) {
  const d = Date.now() - new Date(iso).getTime();
  const m = Math.floor(d / 60000);
  if (m < 1) return 'à l\'instant';
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}j`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

/** Compute SLA status vs. First Response Time target */
function getSLA(ticket: Ticket): { label: string; urgent: boolean; breached: boolean } {
  const ageH = (Date.now() - new Date(ticket.createdAt).getTime()) / 3600000;
  const targetH = PRIORITY_CFG[ticket.priority].slaH;
  const pct = ageH / targetH;
  const remainH = Math.max(0, targetH - ageH);
  if (pct >= 1) return { label: `SLA dépassé +${Math.round(ageH - targetH)}h`, urgent: true, breached: true };
  if (pct >= 0.75) return { label: `${Math.round(remainH)}h restant`, urgent: true, breached: false };
  return { label: `${Math.round(remainH)}h restant`, urgent: false, breached: false };
}

/** True when the last public message was sent by the customer (SA needs to reply) */
function needsReply(ticket: Ticket): boolean {
  const last = ticket.messages.filter((m) => !m.isInternal).at(-1);
  return !!last && last.senderId !== 'sa-admin' && last.senderId !== 'sa1' && last.senderId !== 'sa2' && last.senderId !== 'sa3';
}

// ══════════════════════════════════════════════════════════════════
//  SHARED ATOMS
// ══════════════════════════════════════════════════════════════════

const StatusBadge = ({ status }: { status: TicketStatus }) => {
  const cfg = STATUS_CFG[status];
  return (
    <span className={`flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

const PriorityBadge = ({ priority }: { priority: TicketPriority }) => (
  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${PRIORITY_CFG[priority].badge}`}>
    {PRIORITY_CFG[priority].label}
  </span>
);

const SlaBadge = ({ ticket }: { ticket: Ticket }) => {
  if (ticket.status === 'Resolved' || ticket.status === 'Closed') return null;
  const sla = getSLA(ticket);
  if (!sla.urgent) return null;
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1 ${sla.breached ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
      <IconAlertTriangle className="w-2.5 h-2.5" />
      {sla.label}
    </span>
  );
};

// ── Message bubble ────────────────────────────────────────────────

const MessageBubble = ({
  msg, currentUserId, showInternal,
}: {
  msg: TicketMessage; currentUserId: string; showInternal: boolean;
}) => {
  if (msg.isInternal && !showInternal) return null;
  const isMine = msg.senderId === currentUserId ||
    (currentUserId === 'sa-admin' && (msg.senderId === 'sa1' || msg.senderId === 'sa2' || msg.senderId === 'sa3' || msg.senderId === 'sa-admin'));

  return (
    <div className={`flex gap-3 ${isMine ? 'flex-row-reverse' : ''} mb-4`}>
      <img
        src={msg.senderAvatar}
        className="w-8 h-8 rounded-full border border-slate-100 object-cover flex-shrink-0 mt-0.5"
        alt=""
      />
      <div className={`max-w-[72%] flex flex-col gap-1 ${isMine ? 'items-end' : 'items-start'}`}>
        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-semibold ${isMine ? 'text-blue-600' : 'text-slate-500'}`}>
            {msg.senderName}
          </span>
          {msg.isInternal && (
            <span className="flex items-center gap-1 text-[10px] font-semibold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-full">
              <IconLock className="w-2.5 h-2.5" /> Note interne
            </span>
          )}
          <span className="text-[10px] text-slate-400">{relTime(msg.createdAt)}</span>
        </div>
        <div
          className={`px-4 py-3 rounded-[16px] text-[13px] leading-relaxed ${
            msg.isInternal
              ? 'bg-amber-50 text-amber-900 border border-amber-200'
              : isMine
              ? 'bg-blue-600 text-white'
              : 'bg-slate-100 text-slate-800'
          }`}
        >
          {msg.content}
        </div>
      </div>
    </div>
  );
};

// ── CSAT star widget ──────────────────────────────────────────────

const CSATWidget = ({ onRate }: { onRate: (n: number) => void }) => {
  const [hover, setHover] = useState(0);
  const LABELS = ['', 'Très insatisfait', 'Insatisfait', 'Neutre', 'Satisfait', 'Très satisfait'];
  return (
    <div className="bg-white rounded-[16px] border border-slate-100 p-5 text-center">
      <p className="text-[14px] font-semibold text-slate-900 mb-1">Votre ticket est résolu !</p>
      <p className="text-[12px] text-slate-500 mb-4">Comment s'est passée votre expérience avec notre support ?</p>
      <div className="flex items-center justify-center gap-2 mb-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => onRate(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            className={`text-3xl transition-transform hover:scale-110 ${(hover || 0) >= n ? 'opacity-100' : 'opacity-30'}`}
            style={{ filter: (hover || 0) >= n ? 'none' : 'grayscale(1)' }}
          >
            ★
          </button>
        ))}
      </div>
      {hover > 0 && (
        <p className="text-[12px] text-slate-500">{LABELS[hover]}</p>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════
//  USER SUPPORT (cabinet admin / doctor / assistant)
// ══════════════════════════════════════════════════════════════════

const UserSupport = ({ user }: { user: User }) => {
  const currentTenant = useMedicomStore((s) => s.currentTenant);
  const [view, setView] = useState<'list' | 'detail' | 'new'>('list');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [active, setActive] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<TicketStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [csatScores, setCsatScores] = useState<Record<string, number>>({});

  // New ticket
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<TicketCategory>('Technical');
  const [priority, setPriority] = useState<TicketPriority>('Normal');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Reply
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getTickets(currentTenant?.id);
    setTickets(data);
    setLoading(false);
  }, [currentTenant]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [active?.messages.length]);

  const filtered = useMemo(() => tickets.filter((t) => {
    const matchStatus = filterStatus === 'all' || t.status === filterStatus;
    const q = search.toLowerCase();
    return matchStatus && (!q || t.subject.toLowerCase().includes(q) || t.id.toLowerCase().includes(q));
  }), [tickets, filterStatus, search]);

  const handleCreate = async () => {
    if (!subject.trim() || !description.trim() || !currentTenant) return;
    setSubmitting(true);
    const t = await createTicket(currentTenant.id, {
      subject: subject.trim(), category, priority,
      description: description.trim(),
      userId: user.id, userName: user.name, userAvatar: user.avatar, userRole: user.role,
      clinicName: user.clinicName ?? currentTenant.name, plan: currentTenant.plan ?? '',
    });
    if (t) { setTickets((p) => [t, ...p]); setActive(t); setView('detail'); }
    setSubject(''); setCategory('Technical'); setPriority('Normal'); setDescription('');
    setSubmitting(false);
  };

  const handleReply = async () => {
    if (!active || !replyText.trim()) return;
    setReplying(true);
    const msg = await addMessage(active.id, {
      senderId: user.id, senderName: user.name,
      senderAvatar: user.avatar, senderRole: user.role,
      content: replyText.trim(), isInternal: false,
    });
    if (msg) {
      const updated = { ...active, messages: [...active.messages, msg], lastUpdate: 'à l\'instant' };
      setActive(updated);
      setTickets((p) => p.map((t) => t.id === active.id ? updated : t));
    }
    setReplyText(''); setReplying(false);
  };

  const handleReopen = async () => {
    if (!active) return;
    await updateTicketStatus(active.id, 'Open');
    const updated = { ...active, status: 'Open' as TicketStatus };
    setActive(updated);
    setTickets((p) => p.map((t) => t.id === active.id ? updated : t));
  };

  const FILTER_TABS: { key: TicketStatus | 'all'; label: string }[] = [
    { key: 'all', label: 'Tous' },
    { key: 'Open', label: 'Ouverts' },
    { key: 'In Progress', label: 'En cours' },
    { key: 'Resolved', label: 'Résolus' },
  ];

  // ── New ticket ──
  if (view === 'new') {
    return (
      <div className="h-full bg-[#FAFAFA] overflow-y-auto p-6">
        <button onClick={() => setView('list')} className="flex items-center gap-1.5 text-[13px] font-medium text-slate-500 hover:text-slate-800 mb-6 transition-colors">
          <IconChevronLeft className="w-4 h-4" /> Retour
        </button>
        <div className="max-w-xl">
          <h2 className="text-[22px] font-semibold text-slate-900 tracking-tight mb-1">Nouveau ticket</h2>
          <p className="text-[13px] text-slate-500 mb-6">Décrivez votre problème avec précision pour une résolution rapide.</p>

          <div className="bg-white rounded-[20px] border border-slate-100 p-6 space-y-5">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Sujet *</label>
              <input
                className="w-full border border-slate-200 rounded-[12px] px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                placeholder="Ex: Erreur lors de l'impression d'une ordonnance"
                value={subject} onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Catégorie</label>
                <select className="w-full border border-slate-200 rounded-[12px] px-3 py-2.5 text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition" value={category} onChange={(e) => setCategory(e.target.value as TicketCategory)}>
                  <option value="Technical">Technique</option>
                  <option value="Bug">Bug</option>
                  <option value="Billing">Facturation</option>
                  <option value="Feature">Suggestion</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Urgence</label>
                <select className="w-full border border-slate-200 rounded-[12px] px-3 py-2.5 text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition" value={priority} onChange={(e) => setPriority(e.target.value as TicketPriority)}>
                  <option value="Low">Basse — information</option>
                  <option value="Normal">Normale — gênant</option>
                  <option value="High">Haute — bloquant</option>
                  <option value="Urgent">Urgente — cabinet arrêté</option>
                </select>
              </div>
            </div>

            {/* SLA expectation */}
            <div className={`flex items-center gap-2 px-3 py-2.5 rounded-[10px] text-[12px] font-medium ${
              priority === 'Urgent' ? 'bg-red-50 text-red-700' :
              priority === 'High'   ? 'bg-orange-50 text-orange-700' :
              'bg-blue-50 text-blue-700'
            }`}>
              <IconClock className="w-3.5 h-3.5 flex-shrink-0" />
              Temps de réponse cible : {PRIORITY_CFG[priority].slaH}h &nbsp;•&nbsp; Priorité {PRIORITY_CFG[priority].label.toLowerCase()}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Description *</label>
              <textarea
                rows={5}
                className="w-full border border-slate-200 rounded-[12px] px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
                placeholder="Décrivez les étapes pour reproduire le problème, les messages d'erreur observés..."
                value={description} onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setView('list')} className="px-4 py-2 rounded-[30px] text-[13px] font-semibold text-slate-600 hover:bg-slate-100 transition-colors">Annuler</button>
              <button
                onClick={handleCreate}
                disabled={!subject.trim() || !description.trim() || submitting}
                className="px-5 py-2 rounded-[30px] text-[13px] font-semibold bg-[#0f0f10] text-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? 'Envoi…' : 'Envoyer le ticket'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Detail view ──
  if (view === 'detail' && active) {
    const visible = active.messages.filter((m) => !m.isInternal);
    const isResolved = active.status === 'Resolved' || active.status === 'Closed';
    const sla = getSLA(active);
    const rated = csatScores[active.id];

    return (
      <div className="flex flex-col h-full bg-[#FAFAFA] overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 bg-white border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3 mb-1">
            <button onClick={() => setView('list')} className="p-1.5 rounded-[10px] hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
              <IconChevronLeft className="w-4 h-4" />
            </button>
            <h2 className="text-[15px] font-semibold text-slate-900 flex-1 min-w-0 truncate">{active.subject}</h2>
            <StatusBadge status={active.status} />
          </div>
          <div className="flex items-center gap-3 ml-10 flex-wrap">
            <span className="font-mono text-[11px] text-slate-400">#{active.id}</span>
            <span className="text-slate-300">•</span>
            <span className="text-[11px] text-slate-400">{CATEGORY_LABELS[active.category]}</span>
            <PriorityBadge priority={active.priority} />
            {!isResolved && <SlaBadge ticket={active} />}
            <span className="text-[11px] text-slate-400 ml-auto">Ouvert {relTime(active.createdAt)}</span>
          </div>
          {/* SLA target banner */}
          {!isResolved && (
            <div className={`mt-3 ml-10 flex items-center gap-2 text-[11px] font-medium px-3 py-1.5 rounded-[8px] w-fit ${sla.breached ? 'bg-red-50 text-red-700' : sla.urgent ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
              <IconClock className="w-3.5 h-3.5" />
              {sla.breached ? 'SLA dépassé — escalade en cours' : `Réponse attendue d'ici ${sla.label}`}
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {visible.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} currentUserId={user.id} showInternal={false} />
          ))}

          {/* CSAT widget for resolved tickets */}
          {isResolved && !rated && (
            <div className="mt-4">
              <CSATWidget onRate={(n) => setCsatScores((p) => ({ ...p, [active.id]: n }))} />
            </div>
          )}
          {isResolved && rated && (
            <div className="mt-4 bg-emerald-50 rounded-[16px] border border-emerald-100 p-4 text-center">
              <p className="text-[13px] font-semibold text-emerald-800">Merci pour votre retour ! {'★'.repeat(rated)}</p>
              <p className="text-[12px] text-emerald-600 mt-0.5">Votre avis nous aide à améliorer le support.</p>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 bg-white border-t border-slate-100 px-6 py-4">
          {isResolved ? (
            <div className="flex items-center justify-between">
              <p className="text-[12px] text-slate-400 flex items-center gap-2">
                <IconCheck className="w-4 h-4 text-emerald-500" />
                Ticket {active.status === 'Resolved' ? 'résolu' : 'fermé'}
              </p>
              <button onClick={handleReopen} className="flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-[12px] font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors">
                <IconRefresh className="w-3.5 h-3.5" /> Réouvrir
              </button>
            </div>
          ) : (
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <textarea
                  rows={2}
                  placeholder="Votre réponse… (Entrée pour envoyer, Maj+Entrée pour nouvelle ligne)"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(); } }}
                  className="w-full border border-slate-200 rounded-[14px] px-4 py-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition"
                />
              </div>
              <button onClick={handleReply} disabled={!replyText.trim() || replying} className="p-3 bg-blue-600 text-white rounded-[14px] hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0">
                <IconSend className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── List view ──
  const open = tickets.filter((t) => t.status === 'Open' || t.status === 'In Progress').length;
  const resolved = tickets.filter((t) => t.status === 'Resolved' || t.status === 'Closed').length;

  return (
    <div className="h-full bg-[#FAFAFA] overflow-y-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-[22px] font-semibold text-slate-900 tracking-tight">Centre d'aide</h2>
          <p className="text-[13px] text-slate-500 mt-0.5">Temps de réponse moyen : &lt; 2h</p>
        </div>
        <button onClick={() => setView('new')} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-[30px] text-[13px] font-semibold transition-colors">
          <IconPlus className="w-4 h-4" /> Nouveau ticket
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          {/* Filter + search */}
          <div className="flex items-center gap-3">
            <div className="flex gap-1 bg-white border border-slate-200 rounded-[30px] p-1">
              {FILTER_TABS.map((tab) => (
                <button key={tab.key} onClick={() => setFilterStatus(tab.key)} className={`px-3 py-1 rounded-[30px] text-[12px] font-semibold transition-colors ${filterStatus === tab.key ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-700'}`}>
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="relative flex-1">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-[30px] text-[12px] focus:outline-none focus:ring-2 focus:ring-blue-500 transition" placeholder="Rechercher…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-[20px] border border-slate-100">
              <IconTicket className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-[13px] font-semibold text-slate-600">Aucun ticket trouvé</p>
              <p className="text-[12px] text-slate-400 mt-1">Créez un nouveau ticket ou modifiez votre filtre.</p>
            </div>
          ) : (
            filtered.map((ticket) => {
              const sla = getSLA(ticket);
              const lastMsg = ticket.messages.filter((m) => !m.isInternal).at(-1);
              return (
                <button
                  key={ticket.id}
                  onClick={() => { setActive(ticket); setView('detail'); }}
                  className="w-full text-left bg-white rounded-[20px] border border-slate-100 hover:border-blue-300 hover:shadow-sm p-4 transition-all group"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <p className="text-[14px] font-semibold text-slate-900 group-hover:text-blue-700 transition-colors line-clamp-1 flex-1">
                      {ticket.subject}
                    </p>
                    <StatusBadge status={ticket.status} />
                  </div>
                  <p className="text-[12px] text-slate-500 line-clamp-2 mb-3">
                    {lastMsg?.content ?? ''}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      <PriorityBadge priority={ticket.priority} />
                      <span className="text-[11px] text-slate-400 font-mono">#{ticket.id}</span>
                      {sla.urgent && ticket.status !== 'Resolved' && ticket.status !== 'Closed' && (
                        <SlaBadge ticket={ticket} />
                      )}
                    </div>
                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                      <IconClock className="w-3 h-3" /> {ticket.lastUpdate}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-slate-900 to-slate-700 rounded-[20px] p-5 text-white">
            <div className="w-9 h-9 rounded-[10px] bg-white/10 flex items-center justify-center mb-3">
              <IconLifeBuoy className="w-5 h-5" />
            </div>
            <h3 className="text-[14px] font-semibold mb-1">Réponse rapide</h3>
            <p className="text-[12px] text-slate-300 mb-4">Notre base de connaissances répond à la plupart des questions.</p>
            <div className="relative">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input placeholder="Rechercher un guide…" className="w-full pl-9 pr-3 py-2 rounded-[10px] bg-white/10 text-[12px] text-white placeholder:text-slate-400 focus:outline-none focus:bg-white/20 transition" />
            </div>
          </div>

          <div className="bg-white rounded-[20px] border border-slate-100 p-4">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Articles populaires</p>
            <ul className="space-y-2.5">
              {['Configurer mon imprimante', 'Ajouter un utilisateur', 'Exporter la comptabilité', 'Problème de connexion', 'Importer des patients Excel'].map((a) => (
                <li key={a}><button className="text-[12px] text-slate-600 hover:text-blue-600 flex items-center gap-2 text-left transition-colors w-full"><span className="w-1.5 h-1.5 bg-slate-300 rounded-full flex-shrink-0" />{a}</button></li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-[20px] border border-slate-100 p-4">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Vos tickets</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between"><span className="text-[12px] text-slate-600">En cours</span><span className="text-[15px] font-bold text-blue-600">{open}</span></div>
              <div className="flex items-center justify-between"><span className="text-[12px] text-slate-600">Résolus</span><span className="text-[15px] font-bold text-emerald-600">{resolved}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════
//  SUPER ADMIN SUPPORT — full queue management
// ══════════════════════════════════════════════════════════════════

const SuperAdminSupport = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<TicketStatus | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<TicketPriority | 'all'>('all');
  const [search, setSearch] = useState('');
  const [replyText, setReplyText] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [replying, setReplying] = useState(false);
  const [showCanned, setShowCanned] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [csatScores] = useState<Record<string, number>>({ 'T-1002': 5, 'T-1004': 4 });
  const bottomRef = useRef<HTMLDivElement>(null);
  const cannedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    getTickets().then((data) => {
      setTickets(data);
      setSelected(data[0] ?? null);
      setLoading(false);
    });
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [selected?.messages.length]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (cannedRef.current && !cannedRef.current.contains(e.target as Node)) setShowCanned(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = useMemo(() => tickets.filter((t) => {
    const matchStatus = filterStatus === 'all' || t.status === filterStatus;
    const matchPriority = filterPriority === 'all' || t.priority === filterPriority;
    const q = search.toLowerCase();
    return matchStatus && matchPriority && (!q || t.subject.toLowerCase().includes(q) || t.user.clinicName.toLowerCase().includes(q) || t.id.toLowerCase().includes(q));
  }), [tickets, filterStatus, filterPriority, search]);

  // Sorted: SLA breached first, then by priority, then by date
  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    const slaA = getSLA(a).breached ? 0 : 1;
    const slaB = getSLA(b).breached ? 0 : 1;
    if (slaA !== slaB) return slaA - slaB;
    const pOrder: Record<TicketPriority, number> = { Urgent: 0, High: 1, Normal: 2, Low: 3 };
    return pOrder[a.priority] - pOrder[b.priority];
  }), [filtered]);

  const allOpen = tickets.filter((t) => t.status !== 'Resolved' && t.status !== 'Closed');
  const slaBreached = allOpen.filter((t) => getSLA(t).breached);
  const avgCsat = Object.values(csatScores).length > 0
    ? (Object.values(csatScores).reduce((s, v) => s + v, 0) / Object.values(csatScores).length).toFixed(1)
    : '—';

  const kpis = [
    { label: 'File d\'attente',   value: String(allOpen.length),      color: 'text-blue-600',    bg: 'bg-blue-50',    icon: <IconTicket className="w-4 h-4 text-blue-500" /> },
    { label: 'Violation SLA',     value: String(slaBreached.length),  color: slaBreached.length ? 'text-red-600' : 'text-slate-600', bg: slaBreached.length ? 'bg-red-50' : 'bg-slate-50', icon: <IconAlertTriangle className={`w-4 h-4 ${slaBreached.length ? 'text-red-500' : 'text-slate-400'}`} /> },
    { label: 'Taux résolution',   value: `${tickets.length ? Math.round((tickets.filter((t) => t.status === 'Resolved' || t.status === 'Closed').length / tickets.length) * 100) : 0}%`, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: <IconTrendingUp className="w-4 h-4 text-emerald-500" /> },
    { label: 'CSAT moyen',        value: `${avgCsat}★`,               color: 'text-amber-600',   bg: 'bg-amber-50',   icon: <IconZap className="w-4 h-4 text-amber-500" /> },
  ];

  const handleStatusChange = async (status: TicketStatus) => {
    if (!selected) return;
    await updateTicketStatus(selected.id, status);
    const updated = { ...selected, status, lastUpdate: 'à l\'instant' };
    setSelected(updated);
    setTickets((p) => p.map((t) => t.id === selected.id ? updated : t));
  };

  const handleAssign = (agent: typeof SA_AGENTS[0] | null) => {
    if (!selected) return;
    const updated = { ...selected, assignedTo: agent ? { id: agent.id, name: agent.name, avatar: agent.avatar } : undefined };
    setSelected(updated);
    setTickets((p) => p.map((t) => t.id === selected.id ? updated : t));
    setShowAssign(false);
  };

  const handleSendReply = async (overrideText?: string, overrideStatus?: TicketStatus) => {
    if (!selected) return;
    const text = (overrideText ?? replyText).trim();
    if (!text) return;
    setReplying(true);
    const msg = await addMessage(selected.id, {
      senderId: 'sa-admin', senderName: 'Support Medicom',
      senderAvatar: 'https://ui-avatars.com/api/?name=Support&background=0f0f10&color=fff',
      senderRole: 'super_admin', content: text, isInternal,
    });
    const newStatus = overrideStatus ?? (selected.status === 'Open' ? 'In Progress' : selected.status);
    if (msg) {
      const updated = { ...selected, messages: [...selected.messages, msg], status: newStatus as TicketStatus, lastUpdate: 'à l\'instant' };
      setSelected(updated);
      setTickets((p) => p.map((t) => t.id === selected.id ? updated : t));
    }
    setReplyText(''); setReplying(false); setIsInternal(false); setShowCanned(false);
  };

  const handleMacro = async (macro: typeof MACROS[0]) => {
    await handleStatusChange(macro.status);
    await handleSendReply(CANNED_RESPONSES[macro.cannedIdx].text, macro.status);
  };

  const FILTER_TABS: { key: TicketStatus | 'all'; label: string }[] = [
    { key: 'all', label: `Tous (${tickets.length})` },
    { key: 'Open', label: `Ouverts (${tickets.filter((t) => t.status === 'Open').length})` },
    { key: 'In Progress', label: 'En cours' },
    { key: 'Waiting', label: 'Attente' },
    { key: 'Resolved', label: 'Résolus' },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* KPI strip */}
      <div className="flex-shrink-0 px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-[22px] font-semibold text-slate-900 tracking-tight">Support</h1>
            <p className="text-[13px] text-slate-500">File d'attente en temps réel • Objectif FRT &lt; 2h</p>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="bg-white border border-slate-100 rounded-[12px] p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-[10px] ${kpi.bg} flex items-center justify-center flex-shrink-0`}>{kpi.icon}</div>
              <div>
                <p className={`text-[22px] font-semibold tracking-tight leading-none ${kpi.color}`}>{kpi.value}</p>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mt-0.5">{kpi.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Master-detail */}
      <div className="flex flex-1 min-h-0 mx-6 mb-6 bg-white border border-slate-100 rounded-[12px] overflow-hidden">

        {/* ── Left panel ── */}
        <div className="w-[300px] flex-shrink-0 border-r border-slate-100 flex flex-col">
          {/* Search + priority filter */}
          <div className="p-3 border-b border-slate-100 space-y-2">
            <div className="relative">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-[10px] text-[12px] focus:outline-none focus:ring-2 focus:ring-blue-500 transition" placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="flex gap-1">
              {(['all', 'Urgent', 'High'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setFilterPriority(p)}
                  className={`flex-1 text-[10px] font-bold py-1 rounded-[6px] transition-colors ${filterPriority === p ? (p === 'Urgent' ? 'bg-red-500 text-white' : p === 'High' ? 'bg-orange-500 text-white' : 'bg-slate-900 text-white') : 'text-slate-500 hover:bg-slate-100'}`}
                >
                  {p === 'all' ? 'Toutes' : p === 'Urgent' ? '🔴 Urgente' : '🟠 Haute'}
                </button>
              ))}
            </div>
          </div>

          {/* Status tabs */}
          <div className="border-b border-slate-100 overflow-x-auto scrollbar-hide">
            <div className="flex gap-0 px-2 py-2 min-w-max">
              {FILTER_TABS.map((tab) => (
                <button key={tab.key} onClick={() => setFilterStatus(tab.key)} className={`px-2.5 py-1 rounded-[8px] text-[11px] font-semibold whitespace-nowrap transition-colors ${filterStatus === tab.key ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Ticket list — sorted by SLA breach then priority */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="space-y-0">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="px-3 py-3 border-b border-slate-50 animate-pulse">
                    <div className="h-3 bg-slate-100 rounded w-3/4 mb-2" />
                    <div className="h-2.5 bg-slate-100 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : sorted.length === 0 ? (
              <div className="text-center py-8 px-4"><p className="text-[12px] text-slate-400">Aucun ticket</p></div>
            ) : (
              sorted.map((ticket) => {
                const sla = getSLA(ticket);
                const cfg = STATUS_CFG[ticket.status];
                const isActive = selected?.id === ticket.id;
                const unread = needsReply(ticket) && ticket.status !== 'Resolved' && ticket.status !== 'Closed';
                return (
                  <button
                    key={ticket.id}
                    onClick={() => setSelected(ticket)}
                    className={`w-full text-left px-3 py-3 border-b border-slate-50 transition-colors relative ${isActive ? 'bg-blue-50 border-l-2 border-l-blue-500' : 'hover:bg-slate-50'}`}
                  >
                    {/* SLA breached stripe */}
                    {sla.breached && ticket.status !== 'Resolved' && ticket.status !== 'Closed' && (
                      <div className="absolute top-0 right-0 w-1 h-full bg-red-400 rounded-r" />
                    )}
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className={`text-[12px] leading-snug line-clamp-2 flex-1 ${isActive ? 'text-blue-700 font-semibold' : unread ? 'text-slate-900 font-bold' : 'text-slate-700 font-medium'}`}>
                        {unread && <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5 mb-0.5 align-middle" />}
                        {ticket.subject}
                      </p>
                      {(ticket.priority === 'Urgent' || ticket.priority === 'High') && (
                        <IconAlertTriangle className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${ticket.priority === 'Urgent' ? 'text-red-500' : 'text-orange-500'}`} />
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 truncate mb-2">{ticket.user.clinicName}</p>
                    <div className="flex items-center justify-between">
                      <span className={`flex items-center gap-1 text-[10px] font-semibold`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {sla.urgent && ticket.status !== 'Resolved' && ticket.status !== 'Closed' && (
                          <span className={`text-[9px] font-bold px-1 py-0.5 rounded ${sla.breached ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                            {sla.breached ? '🔴' : '🟡'} {sla.label}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400">{ticket.lastUpdate}</span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ── Right panel ── */}
        {selected ? (
          <div className="flex-1 flex flex-col min-w-0">
            {/* Ticket header */}
            <div className="flex-shrink-0 px-5 py-4 border-b border-slate-100">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="min-w-0">
                  <h2 className="text-[15px] font-semibold text-slate-900 leading-snug mb-1.5">{selected.subject}</h2>
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="font-mono text-[10px] text-slate-400">#{selected.id}</span>
                    <StatusBadge status={selected.status} />
                    <PriorityBadge priority={selected.priority} />
                    <span className="text-[11px] text-slate-400">{CATEGORY_LABELS[selected.category]}</span>
                    {selected.status !== 'Resolved' && selected.status !== 'Closed' && <SlaBadge ticket={selected} />}
                    {csatScores[selected.id] && (
                      <span className="text-[11px] font-semibold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
                        {'★'.repeat(csatScores[selected.id])} CSAT {csatScores[selected.id]}/5
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Status selector */}
                  <select
                    value={selected.status}
                    onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
                    className="border border-slate-200 rounded-[10px] px-2.5 py-1.5 text-[12px] font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  >
                    <option value="Open">Ouvert</option>
                    <option value="In Progress">En cours</option>
                    <option value="Waiting">En attente</option>
                    <option value="Resolved">Résolu</option>
                    <option value="Closed">Fermé</option>
                  </select>

                  {/* Assign dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setShowAssign(!showAssign)}
                      className="flex items-center gap-1.5 border border-slate-200 rounded-[10px] px-2.5 py-1.5 text-[12px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      {selected.assignedTo
                        ? <><img src={selected.assignedTo.avatar} className="w-4 h-4 rounded-full" alt="" /> {selected.assignedTo.name.split(' ')[0]}</>
                        : <><IconEdit className="w-3.5 h-3.5" /> Assigner</>
                      }
                      <IconChevronDown className="w-3 h-3" />
                    </button>
                    {showAssign && (
                      <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-[12px] shadow-lg z-20 min-w-[160px] py-1">
                        <button onClick={() => handleAssign(null)} className="w-full text-left px-3 py-2 text-[12px] text-slate-500 hover:bg-slate-50">Non assigné</button>
                        {SA_AGENTS.map((agent) => (
                          <button key={agent.id} onClick={() => handleAssign(agent)} className="w-full text-left px-3 py-2 text-[12px] text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                            <img src={agent.avatar} className="w-5 h-5 rounded-full" alt="" />
                            {agent.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Cabinet info + tags */}
              <div className="flex items-center gap-3 pt-3 border-t border-slate-50 flex-wrap">
                <img src={selected.user.avatar} className="w-7 h-7 rounded-full border border-slate-100 object-cover" alt="" />
                <div>
                  <p className="text-[12px] font-semibold text-slate-700">{selected.user.name}</p>
                  <p className="text-[11px] text-slate-400">{selected.user.clinicName} • Plan {selected.user.plan}</p>
                </div>
                <div className="ml-auto flex items-center gap-2 flex-wrap">
                  {selected.tags?.map((tag) => (
                    <span key={tag} className="flex items-center gap-1 text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                      <IconTag className="w-2.5 h-2.5" />{tag}
                    </span>
                  ))}
                  <span className="text-[11px] text-slate-400">{fmtDate(selected.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {selected.messages.map((msg) => (
                <MessageBubble key={msg.id} msg={msg} currentUserId="sa-admin" showInternal={true} />
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Macro actions */}
            {selected.status !== 'Resolved' && selected.status !== 'Closed' && (
              <div className="flex-shrink-0 px-5 py-2 border-t border-slate-50 flex items-center gap-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Actions rapides</span>
                {MACROS.map((m) => (
                  <button key={m.label} onClick={() => handleMacro(m)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[11px] font-semibold transition-colors ${m.color}`}>
                    <IconZap className="w-3 h-3" />
                    {m.label}
                  </button>
                ))}
              </div>
            )}

            {/* Reply composer */}
            <div className="flex-shrink-0 border-t border-slate-100 px-5 py-4">
              {/* Mode toggle */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex gap-1">
                  <button onClick={() => setIsInternal(false)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12px] font-semibold transition-colors ${!isInternal ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}>
                    <IconMessage className="w-3.5 h-3.5" /> Réponse client
                  </button>
                  <button onClick={() => setIsInternal(true)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12px] font-semibold transition-colors ${isInternal ? 'bg-amber-50 text-amber-700' : 'text-slate-500 hover:bg-slate-50'}`}>
                    <IconLock className="w-3.5 h-3.5" /> Note interne
                  </button>
                </div>

                {/* Canned responses */}
                <div className="relative" ref={cannedRef}>
                  <button
                    onClick={() => setShowCanned(!showCanned)}
                    className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 hover:text-slate-700 px-2.5 py-1.5 rounded-[8px] hover:bg-slate-50 transition-colors"
                  >
                    <IconActivity className="w-3.5 h-3.5" />
                    Réponses types
                    <IconChevronDown className={`w-3 h-3 transition-transform ${showCanned ? 'rotate-180' : ''}`} />
                  </button>
                  {showCanned && (
                    <div className="absolute right-0 bottom-full mb-2 bg-white border border-slate-200 rounded-[12px] shadow-xl z-20 w-[280px] py-1">
                      <p className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Réponses types</p>
                      {CANNED_RESPONSES.map((r, i) => (
                        <button
                          key={i}
                          onClick={() => { setReplyText(r.text); setShowCanned(false); }}
                          className="w-full text-left px-3 py-2.5 hover:bg-slate-50 transition-colors"
                        >
                          <p className="text-[12px] font-semibold text-slate-800">{r.label}</p>
                          <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{r.text}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className={`flex items-end gap-3 rounded-[12px] border p-3 transition-colors ${isInternal ? 'border-amber-200 bg-amber-50/40' : 'border-slate-200 bg-white'}`}>
                <textarea
                  rows={3}
                  placeholder={isInternal ? 'Note interne (invisible au client)…' : 'Répondre au client… (Entrée pour envoyer)'}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply(); } }}
                  className="flex-1 bg-transparent text-[13px] focus:outline-none resize-none text-slate-800 placeholder:text-slate-400"
                />
                <button
                  onClick={() => handleSendReply()}
                  disabled={!replyText.trim() || replying}
                  className={`p-2.5 rounded-[10px] flex-shrink-0 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${isInternal ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                >
                  <IconSend className="w-4 h-4" />
                </button>
              </div>

              {isInternal && (
                <p className="flex items-center gap-1.5 text-[11px] text-amber-600 mt-2">
                  <IconLock className="w-3 h-3" /> Note visible uniquement par l'équipe support
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center p-8">
            <div>
              <div className="w-14 h-14 rounded-[14px] bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <IconMessage className="w-7 h-7 text-slate-300" />
              </div>
              <p className="text-[14px] font-semibold text-slate-600">Sélectionnez un ticket</p>
              <p className="text-[12px] text-slate-400 mt-1">Choisissez un ticket dans la liste pour démarrer.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════
//  ROOT EXPORT
// ══════════════════════════════════════════════════════════════════

interface SupportProps { user?: User; }

export const Support: React.FC<SupportProps> = ({ user }) => {
  if (!user) return null;
  return user.role === 'super_admin' ? <SuperAdminSupport /> : <UserSupport user={user} />;
};
