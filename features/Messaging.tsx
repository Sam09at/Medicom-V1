import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  IconSearch, IconPlus, IconX, IconSend, IconPaperclip, IconBell,
  IconMoreHorizontal, IconMessageSquare, IconCheck, IconCheckCircle,
  IconAlertTriangle, IconZap, IconBriefcase, IconActivity, IconShield,
  IconUsers, IconPhone, IconFileText, IconDollarSign, IconSettings,
} from '../components/Icons';

/* ────────────────────────────────────────────────────────────── */
/*  Types                                                          */
/* ────────────────────────────────────────────────────────────── */

interface Channel {
  id: string;
  name: string;
  description: string;
  type: 'channel' | 'dm';
  unread: number;
  isPrivate?: boolean;
  dmUser?: { name: string; color: string; online: boolean; initials: string };
}

interface Reaction {
  emoji: string;
  count: number;
  mine: boolean;
}

interface Attachment {
  name: string;
  size: string;
  type: 'pdf' | 'csv' | 'image' | 'doc';
}

interface Message {
  id: string;
  channelId: string;
  authorId: string;
  authorName: string;
  authorColor: string;
  content: string;
  timestamp: Date;
  isBot: boolean;
  botType?: 'crm' | 'support' | 'ops' | 'onboarding' | 'system';
  reactions: Reaction[];
  replyCount: number;
  attachments?: Attachment[];
  isPinned?: boolean;
  edited?: boolean;
}

/* ────────────────────────────────────────────────────────────── */
/*  Constants                                                      */
/* ────────────────────────────────────────────────────────────── */

const ME = { id: 'sami', name: 'Sami Atif', color: '#0f0f10', initials: 'SA' };

const CHANNELS: Channel[] = [
  { id: 'general',    name: 'general',    description: 'Annonces et discussion générale de l\'équipe', type: 'channel', unread: 0 },
  { id: 'sales',      name: 'sales',      description: 'Pipeline, deals, activité CRM en temps réel', type: 'channel', unread: 3 },
  { id: 'support',    name: 'support',    description: 'Tickets clients, incidents, résolutions', type: 'channel', unread: 5, isPrivate: false },
  { id: 'ops',        name: 'ops',        description: 'Paiements, infrastructure, monitoring système', type: 'channel', unread: 1 },
  { id: 'onboarding', name: 'onboarding', description: 'Suivi go-live et formation des nouveaux clients', type: 'channel', unread: 0 },
  { id: 'product',    name: 'product',    description: 'Roadmap, bugs, feature requests', type: 'channel', unread: 2 },
];

const DMS: Channel[] = [
  { id: 'dm-youssef', name: 'Youssef', description: 'Sales Lead', type: 'dm', unread: 2, dmUser: { name: 'Youssef', color: 'bg-blue-600',   online: true,  initials: 'YO' } },
  { id: 'dm-samia',   name: 'Samia',   description: 'Sales',      type: 'dm', unread: 1, dmUser: { name: 'Samia',   color: 'bg-violet-600', online: true,  initials: 'SA' } },
  { id: 'dm-amine',   name: 'Amine',   description: 'Tech',       type: 'dm', unread: 0, dmUser: { name: 'Amine',   color: 'bg-emerald-600',online: false, initials: 'AM' } },
  { id: 'dm-laila',   name: 'Laila',   description: 'Customer Success', type: 'dm', unread: 0, dmUser: { name: 'Laila', color: 'bg-amber-500', online: true, initials: 'LA' } },
];

const d = (daysAgo: number, hour = 10, min = 0) => {
  const t = new Date();
  t.setDate(t.getDate() - daysAgo);
  t.setHours(hour, min, 0, 0);
  return t;
};

const INITIAL_MESSAGES: Message[] = [
  /* ── #general ─────────────────────────────────────────────── */
  { id: 'g1', channelId: 'general', authorId: 'sami', authorName: 'Sami Atif', authorColor: '#0f0f10', content: "Bonjour l'équipe! On est à 70% de notre objectif MRR pour mai — bonne trajectoire. Continuez sur cette lancée.", timestamp: d(2, 9, 5), isBot: false, reactions: [{ emoji: '👍', count: 4, mine: false }], replyCount: 0, isPinned: true },
  { id: 'g2', channelId: 'general', authorId: 'youssef', authorName: 'Youssef', authorColor: 'bg-blue-600', content: "Démo avec Polyclinique Marrakech vendredi à 15h — compte important, 6 médecins. Qui peut m'accompagner en distanciel?", timestamp: d(2, 9, 30), isBot: false, reactions: [{ emoji: '👀', count: 2, mine: false }], replyCount: 3 },
  { id: 'g3', channelId: 'general', authorId: 'samia', authorName: 'Samia', authorColor: 'bg-violet-600', content: "J'ai reçu une demande inbound de Tanger — premier prospect dans la région! Cabinet de gynécologie, 2 médecins.", timestamp: d(1, 11, 15), isBot: false, reactions: [{ emoji: '🔥', count: 3, mine: false }, { emoji: '👏', count: 2, mine: true }], replyCount: 1 },
  { id: 'g4', channelId: 'general', authorId: 'laila', authorName: 'Laila', authorColor: 'bg-amber-500', content: "Cabinet Saada est go-live depuis ce matin — tout s'est bien passé. Je reste disponible pour eux cette semaine.", timestamp: d(0, 10, 0), isBot: false, reactions: [{ emoji: '🎉', count: 5, mine: true }], replyCount: 2 },
  { id: 'g5', channelId: 'general', authorId: 'sami', authorName: 'Sami Atif', authorColor: '#0f0f10', content: "Bravo Laila! @Youssef pense à mettre à jour le pipeline — Saada passe en Converti.", timestamp: d(0, 10, 10), isBot: false, reactions: [], replyCount: 0 },

  /* ── #sales ────────────────────────────────────────────────── */
  { id: 's1', channelId: 'sales', authorId: 'bot-crm', authorName: 'CRM Bot', authorColor: 'bg-emerald-600', content: "Cabinet El Mansouri a accepté le Plan Pro — 999 MAD/mois\n→ Contrat signé · Pipeline: Converti · Onboarding à démarrer", timestamp: d(3, 8, 30), isBot: true, botType: 'crm', reactions: [{ emoji: '🎉', count: 3, mine: false }], replyCount: 1 },
  { id: 's2', channelId: 'sales', authorId: 'youssef', authorName: 'Youssef', authorColor: 'bg-blue-600', content: "Excellent! El Mansouri c'est 6 mois de relances. La persévérance paie.", timestamp: d(3, 8, 45), isBot: false, reactions: [], replyCount: 0 },
  { id: 's3', channelId: 'sales', authorId: 'bot-crm', authorName: 'CRM Bot', authorColor: 'bg-emerald-600', content: "Nouvelle démo programmée — Cabinet Benali\n→ Type: Demo · Vendredi 10h · Owner: Youssef · 30 min", timestamp: d(2, 9, 0), isBot: true, botType: 'crm', reactions: [], replyCount: 0 },
  { id: 's4', channelId: 'sales', authorId: 'bot-crm', authorName: 'CRM Bot', authorColor: 'bg-emerald-600', content: "Proposition envoyée — Clinique Atlas\n→ Plan Premium · 1 499 MAD/mois · Expire le 13 mai · Vue le 01/05", timestamp: d(2, 14, 0), isBot: true, botType: 'crm', reactions: [], replyCount: 0 },
  { id: 's5', channelId: 'sales', authorId: 'samia', authorName: 'Samia', authorColor: 'bg-violet-600', content: "Clinique Atlas a vu la prop hier. Dr. Tazi a demandé un délai — closing meeting programmé mardi.", timestamp: d(1, 9, 15), isBot: false, reactions: [{ emoji: '👍', count: 2, mine: false }], replyCount: 0 },
  { id: 's6', channelId: 'sales', authorId: 'bot-crm', authorName: 'CRM Bot', authorColor: 'bg-emerald-600', content: "Alerte: 2 propositions expirent dans 3 jours\n→ Centre Santé Plus (999 MAD) · Clinique Atlas (1 499 MAD)\nAction requise: relancer avant expiration", timestamp: d(0, 8, 0), isBot: true, botType: 'crm', reactions: [], replyCount: 0 },
  { id: 's7', channelId: 'sales', authorId: 'youssef', authorName: 'Youssef', authorColor: 'bg-blue-600', content: "Je prends Centre Santé Plus. @Samia tu peux relancer Atlas?", timestamp: d(0, 8, 30), isBot: false, reactions: [], replyCount: 1 },
  { id: 's8', channelId: 'sales', authorId: 'samia', authorName: 'Samia', authorColor: 'bg-violet-600', content: "On it. J'ai un call avec Tazi à 14h.", timestamp: d(0, 8, 45), isBot: false, reactions: [{ emoji: '👍', count: 1, mine: true }], replyCount: 0 },

  /* ── #support ──────────────────────────────────────────────── */
  { id: 'su1', channelId: 'support', authorId: 'bot-support', authorName: 'Support Bot', authorColor: 'bg-red-500', content: "URGENT — Ticket #T-089 ouvert\n→ Cabinet: Clinique Atlas · Contact: Dr. Tazi\n→ Problème: Impossible de se connecter — 3 tentatives échouées\n→ Impact: Bloqué depuis ce matin", timestamp: d(1, 8, 15), isBot: true, botType: 'support', reactions: [], replyCount: 0 },
  { id: 'su2', channelId: 'support', authorId: 'amine', authorName: 'Amine', authorColor: 'bg-emerald-600', content: "Je prends ce ticket. Vérifions les logs d'auth.", timestamp: d(1, 8, 20), isBot: false, reactions: [], replyCount: 0 },
  { id: 'su3', channelId: 'support', authorId: 'amine', authorName: 'Amine', authorColor: 'bg-emerald-600', content: "Trouvé — IP bloquée suite à trop de tentatives. Reset fait. Dr. Tazi peut se connecter.", timestamp: d(1, 9, 5), isBot: false, reactions: [{ emoji: '✅', count: 2, mine: false }], replyCount: 0 },
  { id: 'su4', channelId: 'support', authorId: 'bot-support', authorName: 'Support Bot', authorColor: 'bg-red-500', content: "Ticket #T-089 résolu — Durée: 50 min · Agent: Amine\n→ CSAT envoyé automatiquement à Dr. Tazi", timestamp: d(1, 9, 10), isBot: true, botType: 'support', reactions: [], replyCount: 0 },
  { id: 'su5', channelId: 'support', authorId: 'laila', authorName: 'Laila', authorColor: 'bg-amber-500', content: "Besoin d'une procédure documentée pour les reset de mot de passe — c'est le 4ème ticket ce mois. @Amine on peut automatiser ça?", timestamp: d(0, 10, 30), isBot: false, reactions: [{ emoji: '💡', count: 2, mine: false }], replyCount: 4 },
  { id: 'su6', channelId: 'support', authorId: 'amine', authorName: 'Amine', authorColor: 'bg-emerald-600', content: "Bonne idée. Je vais ajouter un self-service reset dans le login. 2-3 jours de dev.", timestamp: d(0, 10, 45), isBot: false, reactions: [{ emoji: '👍', count: 3, mine: true }], replyCount: 0 },
  { id: 'su7', channelId: 'support', authorId: 'bot-support', authorName: 'Support Bot', authorColor: 'bg-red-500', content: "2 nouveaux tickets ouverts aujourd'hui\n→ T-090: Cabinet Radi — Problème d'impression ordonnances\n→ T-091: Cabinet Bensouda — Synchronisation agenda manquante\nStatut: Non assignés", timestamp: d(0, 11, 0), isBot: true, botType: 'support', reactions: [], replyCount: 0 },

  /* ── #ops ──────────────────────────────────────────────────── */
  { id: 'o1', channelId: 'ops', authorId: 'bot-ops', authorName: 'Ops Bot', authorColor: 'bg-amber-500', content: "Rapport système matinal — Lundi 04 mai 2026\n→ Uptime: 99.98% (7j)\n→ Cabinets actifs: 14\n→ Connexions aujourd'hui: 47\n→ Aucun incident signalé", timestamp: d(0, 7, 0), isBot: true, botType: 'ops', reactions: [], replyCount: 0 },
  { id: 'o2', channelId: 'ops', authorId: 'bot-ops', authorName: 'Ops Bot', authorColor: 'bg-amber-500', content: "Paiement échoué — Cabinet Dr. Radi\n→ Montant: 499 MAD · Plan Essentiel\n→ Raison: Carte expirée\n→ Retry automatique dans 24h · Email envoyé au client", timestamp: d(0, 8, 30), isBot: true, botType: 'ops', reactions: [], replyCount: 1 },
  { id: 'o3', channelId: 'ops', authorId: 'sami', authorName: 'Sami Atif', authorColor: '#0f0f10', content: "Je vais appeler Dr. Radi directement pour régulariser. Ce cabinet a un bon MRR, pas question de les perdre pour ça.", timestamp: d(0, 9, 0), isBot: false, reactions: [], replyCount: 0 },
  { id: 'o4', channelId: 'ops', authorId: 'bot-ops', authorName: 'Ops Bot', authorColor: 'bg-amber-500', content: "Nouvelle souscription Stripe confirmée\n→ Cabinet Benali · Plan Pro · 999 MAD/mois\n→ MRR total: 24 500 MAD (+999 MAD)", timestamp: d(0, 10, 0), isBot: true, botType: 'ops', reactions: [{ emoji: '💰', count: 2, mine: false }], replyCount: 0 },
  { id: 'o5', channelId: 'ops', authorId: 'sami', authorName: 'Sami Atif', authorColor: '#0f0f10', content: "Backup hebdomadaire vérifié — tout OK. Base de données: 2.3 GB · Temps de restauration testé: 4 min.", timestamp: d(1, 17, 0), isBot: false, reactions: [{ emoji: '✅', count: 1, mine: false }], replyCount: 0 },

  /* ── #onboarding ───────────────────────────────────────────── */
  { id: 'on1', channelId: 'onboarding', authorId: 'bot-onboarding', authorName: 'Onboarding Bot', authorColor: 'bg-blue-600', content: "Cabinet Saada — Mise à jour progression\n→ Étape: Formation completée (4/5)\n→ Prochaine étape: Go-live\n→ Data importée: 127 patients · 45 RDV", timestamp: d(2, 14, 0), isBot: true, botType: 'onboarding', reactions: [], replyCount: 0 },
  { id: 'on2', channelId: 'onboarding', authorId: 'laila', authorName: 'Laila', authorColor: 'bg-amber-500', content: "Formation faite avec Dr. Saada — très réceptif, surtout pour la facturation en ligne. Il a tout de suite commencé à créer des ordonnances.", timestamp: d(2, 15, 30), isBot: false, reactions: [{ emoji: '👍', count: 2, mine: false }], replyCount: 0 },
  { id: 'on3', channelId: 'onboarding', authorId: 'bot-onboarding', authorName: 'Onboarding Bot', authorColor: 'bg-blue-600', content: "Cabinet Saada — GO-LIVE confirmé\n→ Date: aujourd'hui à 09:00\n→ Premier RDV créé dans le système: 09:15\n→ Statut: ACTIF", timestamp: d(0, 9, 30), isBot: true, botType: 'onboarding', reactions: [{ emoji: '🎉', count: 4, mine: true }], replyCount: 2 },
  { id: 'on4', channelId: 'onboarding', authorId: 'laila', authorName: 'Laila', authorColor: 'bg-amber-500', content: "Cabinet Idrissi commence l'import de données cette semaine. @Amine tu peux préparer le template CSV?", timestamp: d(0, 11, 0), isBot: false, reactions: [], replyCount: 1 },
  { id: 'on5', channelId: 'onboarding', authorId: 'amine', authorName: 'Amine', authorColor: 'bg-emerald-600', content: "Je prépare le template et la doc d'import. Disponible demain matin.", timestamp: d(0, 11, 15), isBot: false, reactions: [{ emoji: '✅', count: 1, mine: false }], replyCount: 0 },

  /* ── #product ──────────────────────────────────────────────── */
  { id: 'p1', channelId: 'product', authorId: 'sami', authorName: 'Sami Atif', authorColor: '#0f0f10', content: "Priorités Q2:\n1. WhatsApp reminders automatiques pour RDV\n2. Page publique cabinet (landing page)\n3. Module ordonnances amélioré\n4. Portail patient (MVP)\n\nOn commence par WhatsApp — plus d'impact terrain.", timestamp: d(3, 9, 0), isBot: false, reactions: [{ emoji: '👍', count: 3, mine: false }], replyCount: 5, isPinned: true },
  { id: 'p2', channelId: 'product', authorId: 'amine', authorName: 'Amine', authorColor: 'bg-emerald-600', content: "Bug trouvé et reproductible: les acomptes ne s'affichent pas correctement dans le récapitulatif de facturation si le montant est en décimales (ex: 150.50 MAD).", timestamp: d(1, 14, 30), isBot: false, reactions: [], replyCount: 2, attachments: [{ name: 'bug-screenshot.png', size: '142 KB', type: 'image' }] },
  { id: 'p3', channelId: 'product', authorId: 'youssef', authorName: 'Youssef', authorColor: 'bg-blue-600', content: "Retour terrain important: les médecins veulent une vue semaine dans le calendrier, pas seulement la vue journée. C'est la demande #1 pendant les démos.", timestamp: d(0, 10, 0), isBot: false, reactions: [{ emoji: '💡', count: 3, mine: true }, { emoji: '👍', count: 2, mine: false }], replyCount: 3 },
  { id: 'p4', channelId: 'product', authorId: 'samia', authorName: 'Samia', authorColor: 'bg-violet-600', content: "Feature request récurrent: export CSV des patients pour migration depuis d'autres logiciels. On perd des prospects à cause de ça — ils ont peur de ne pas pouvoir exporter leurs données plus tard.", timestamp: d(0, 10, 30), isBot: false, reactions: [{ emoji: '👆', count: 4, mine: false }], replyCount: 1 },

  /* ── DMs ───────────────────────────────────────────────────── */
  { id: 'dm-y1', channelId: 'dm-youssef', authorId: 'youssef', authorName: 'Youssef', authorColor: 'bg-blue-600', content: "Sami, tu peux valider la proposition pour Clinique Atlas avant demain? Dr. Tazi attend notre confirmation sur le prix.", timestamp: d(0, 9, 0), isBot: false, reactions: [], replyCount: 0 },
  { id: 'dm-y2', channelId: 'dm-youssef', authorId: 'sami', authorName: 'Sami Atif', authorColor: '#0f0f10', content: "Je regarde maintenant. On peut faire -5% si ils s'engagent sur 12 mois. Prépare un avenant.", timestamp: d(0, 9, 15), isBot: false, reactions: [{ emoji: '👍', count: 1, mine: false }], replyCount: 0 },
  { id: 'dm-s1', channelId: 'dm-samia', authorId: 'samia', authorName: 'Samia', authorColor: 'bg-violet-600', content: "J'ai un contact à la CNIA (assurance) — ils cherchent une solution pour digitaliser les remboursements avec les cabinets partenaires. Partenariat potentiel?", timestamp: d(1, 16, 0), isBot: false, reactions: [], replyCount: 0 },
  { id: 'dm-s2', channelId: 'dm-samia', authorId: 'sami', authorName: 'Sami Atif', authorColor: '#0f0f10', content: "Très intéressant. Organise un call exploratoire — je veux être dedans. On pourrait avoir un module dédié mutuelles d'ici Q3.", timestamp: d(1, 16, 30), isBot: false, reactions: [{ emoji: '🔥', count: 1, mine: false }], replyCount: 0 },
  { id: 'dm-a1', channelId: 'dm-amine', authorId: 'amine', authorName: 'Amine', authorColor: 'bg-emerald-600', content: "Fix déployé pour le bug ticket #127 (acomptes facturation). Deploy en prod à 16h ce soir.", timestamp: d(0, 15, 0), isBot: false, reactions: [], replyCount: 0 },
  { id: 'dm-l1', channelId: 'dm-laila', authorId: 'laila', authorName: 'Laila', authorColor: 'bg-amber-500', content: "Réunion onboarding à Marrakech — je pensais la semaine du 12 mai pour rencontrer les 2 nouveaux cabinets en personne. Budget déplacement OK?", timestamp: d(0, 14, 0), isBot: false, reactions: [], replyCount: 0 },
];

/* ────────────────────────────────────────────────────────────── */
/*  Helpers                                                        */
/* ────────────────────────────────────────────────────────────── */

const BOT_CONFIG: Record<string, { label: string; icon: React.FC<{ className?: string }>; color: string; bg: string; border: string }> = {
  crm:        { label: 'CRM',        icon: IconBriefcase,  color: 'text-emerald-700', bg: 'bg-emerald-50',  border: 'border-emerald-200' },
  support:    { label: 'Support',    icon: IconAlertTriangle, color: 'text-red-700',  bg: 'bg-red-50',      border: 'border-red-200' },
  ops:        { label: 'Ops',        icon: IconZap,        color: 'text-amber-700',   bg: 'bg-amber-50',    border: 'border-amber-200' },
  onboarding: { label: 'Onboarding', icon: IconCheckCircle,color: 'text-blue-700',    bg: 'bg-blue-50',     border: 'border-blue-200' },
  system:     { label: 'Système',    icon: IconSettings,   color: 'text-slate-700',   bg: 'bg-slate-50',    border: 'border-slate-200' },
};

const formatTime = (d: Date) =>
  d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

const formatDay = (d: Date) => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Aujourd'hui";
  if (d.toDateString() === yesterday.toDateString()) return 'Hier';
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
};

const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

const QUICK_REACTIONS = ['👍', '✅', '👀', '🎉', '💡', '🔥'];

/* ────────────────────────────────────────────────────────────── */
/*  Avatar component                                               */
/* ────────────────────────────────────────────────────────────── */

const Avatar = ({ name, color, size = 7 }: { name: string; color: string; size?: number }) => {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const isHex = color.startsWith('#');
  return (
    <div
      className={`w-${size} h-${size} rounded-[8px] flex items-center justify-center text-white font-bold shrink-0 ${isHex ? '' : color}`}
      style={isHex ? { backgroundColor: color, fontSize: size <= 7 ? '11px' : '13px' } : { fontSize: size <= 7 ? '11px' : '13px' }}
    >
      {initials}
    </div>
  );
};

/* ────────────────────────────────────────────────────────────── */
/*  MessageItem                                                    */
/* ────────────────────────────────────────────────────────────── */

interface MessageItemProps {
  msg: Message;
  prevMsg: Message | null;
  onReact: (msgId: string, emoji: string) => void;
  onReply: (msg: Message) => void;
}

const MessageItem: React.FC<MessageItemProps> = ({ msg, prevMsg, onReact, onReply }) => {
  const [showReactions, setShowReactions] = useState(false);
  const isConsecutive =
    prevMsg &&
    prevMsg.authorId === msg.authorId &&
    !msg.isBot &&
    !prevMsg.isBot &&
    (msg.timestamp.getTime() - prevMsg.timestamp.getTime()) < 5 * 60 * 1000;

  if (msg.isBot && msg.botType) {
    const cfg = BOT_CONFIG[msg.botType] || BOT_CONFIG.system;
    const BotIcon = cfg.icon;
    return (
      <div className={`mx-4 my-1.5 rounded-[10px] border ${cfg.border} ${cfg.bg} px-4 py-3`}>
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-5 h-5 rounded-[5px] flex items-center justify-center ${cfg.bg} border ${cfg.border}`}>
            <BotIcon className={`w-3 h-3 ${cfg.color}`} />
          </div>
          <span className={`text-[11px] font-bold uppercase tracking-widest ${cfg.color}`}>{cfg.label}</span>
          <span className="text-[11px] text-slate-400 ml-auto">{formatTime(msg.timestamp)}</span>
        </div>
        <p className="text-[13px] text-slate-800 font-medium whitespace-pre-line leading-relaxed">{msg.content}</p>
        {msg.reactions.length > 0 && (
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {msg.reactions.map(r => (
              <button
                key={r.emoji}
                onClick={() => onReact(msg.id, r.emoji)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] border transition-colors ${r.mine ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}
              >
                <span>{r.emoji}</span>
                <span className="font-semibold">{r.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="px-4 group hover:bg-slate-50/50 transition-colors"
      onMouseEnter={() => setShowReactions(true)}
      onMouseLeave={() => setShowReactions(false)}
    >
      <div className={`flex gap-3 ${isConsecutive ? 'pt-0.5' : 'pt-3'}`}>
        {/* Avatar or time spacer */}
        {isConsecutive ? (
          <div className="w-7 shrink-0 flex items-start justify-end">
            <span className="text-[10px] text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">
              {formatTime(msg.timestamp)}
            </span>
          </div>
        ) : (
          <Avatar name={msg.authorName} color={msg.authorColor} size={7} />
        )}

        <div className="flex-1 min-w-0">
          {/* Header — only for first message in group */}
          {!isConsecutive && (
            <div className="flex items-baseline gap-2 mb-0.5">
              <span className="text-[13px] font-semibold text-slate-900">{msg.authorName}</span>
              {msg.authorId === 'sami' && (
                <span className="text-[9px] font-bold bg-slate-900 text-white px-1.5 py-0.5 rounded-full uppercase tracking-wide">Admin</span>
              )}
              <span className="text-[11px] text-slate-400">{formatTime(msg.timestamp)}</span>
              {msg.isPinned && (
                <span className="text-[9px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full uppercase tracking-wide">Epinglé</span>
              )}
            </div>
          )}

          {/* Content */}
          <p className="text-[13.5px] text-slate-800 leading-[1.6] whitespace-pre-line">{msg.content}</p>

          {/* Attachments */}
          {msg.attachments?.map(att => (
            <div key={att.name} className="mt-2 inline-flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-[8px] hover:border-slate-300 transition-colors cursor-pointer">
              <IconFileText className="w-4 h-4 text-slate-400" />
              <div>
                <p className="text-[12px] font-semibold text-slate-700">{att.name}</p>
                <p className="text-[10px] text-slate-400">{att.size}</p>
              </div>
            </div>
          ))}

          {/* Reactions */}
          {(msg.reactions.length > 0 || msg.replyCount > 0) && (
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              {msg.reactions.map(r => (
                <button
                  key={r.emoji}
                  onClick={() => onReact(msg.id, r.emoji)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] border transition-colors ${r.mine ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-100 text-slate-600 hover:border-slate-200'}`}
                >
                  <span>{r.emoji}</span>
                  <span className="font-semibold">{r.count}</span>
                </button>
              ))}
              {msg.replyCount > 0 && (
                <button
                  onClick={() => onReply(msg)}
                  className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 hover:underline px-1"
                >
                  <IconMessageSquare className="w-3 h-3" />
                  {msg.replyCount} réponse{msg.replyCount > 1 ? 's' : ''}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Hover action bar */}
        <div className={`flex items-center gap-0.5 shrink-0 transition-opacity ${showReactions ? 'opacity-100' : 'opacity-0'}`}>
          {QUICK_REACTIONS.slice(0, 3).map(emoji => (
            <button
              key={emoji}
              onClick={() => onReact(msg.id, emoji)}
              className="w-7 h-7 flex items-center justify-center rounded-[6px] hover:bg-slate-100 text-[14px] transition-colors"
            >
              {emoji}
            </button>
          ))}
          <button
            onClick={() => onReply(msg)}
            className="w-7 h-7 flex items-center justify-center rounded-[6px] hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            title="Répondre"
          >
            <IconMessageSquare className="w-3.5 h-3.5" />
          </button>
          <button className="w-7 h-7 flex items-center justify-center rounded-[6px] hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <IconMoreHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

/* ────────────────────────────────────────────────────────────── */
/*  Thread panel                                                   */
/* ────────────────────────────────────────────────────────────── */

interface ThreadPanelProps {
  msg: Message;
  onClose: () => void;
  onReact: (id: string, emoji: string) => void;
}

const ThreadPanel: React.FC<ThreadPanelProps> = ({ msg, onClose, onReact }) => {
  const [reply, setReply] = useState('');

  return (
    <div className="w-[340px] shrink-0 border-l border-slate-100 flex flex-col bg-white">
      <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <p className="text-[13px] font-semibold text-slate-900">Fil de discussion</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{msg.replyCount} réponse{msg.replyCount !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-[6px] hover:bg-slate-100 text-slate-400 transition-colors">
          <IconX className="w-4 h-4" />
        </button>
      </div>

      {/* Original message */}
      <div className="px-4 py-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex gap-2.5">
          <Avatar name={msg.authorName} color={msg.authorColor} size={7} />
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-[12px] font-semibold text-slate-900">{msg.authorName}</span>
              <span className="text-[10px] text-slate-400">{formatTime(msg.timestamp)}</span>
            </div>
            <p className="text-[12px] text-slate-700 mt-0.5 leading-relaxed whitespace-pre-line line-clamp-4">{msg.content}</p>
          </div>
        </div>
      </div>

      {/* Placeholder replies */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {Array.from({ length: Math.min(msg.replyCount, 3) }, (_, i) => {
          const authors = [
            { name: 'Youssef', color: 'bg-blue-600' },
            { name: 'Samia', color: 'bg-violet-600' },
            { name: 'Amine', color: 'bg-emerald-600' },
          ];
          const a = authors[i % 3];
          return (
            <div key={i} className="flex gap-2.5">
              <Avatar name={a.name} color={a.color} size={6} />
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-[12px] font-semibold text-slate-900">{a.name}</span>
                  <span className="text-[10px] text-slate-400">{formatTime(new Date(msg.timestamp.getTime() + (i + 1) * 300000))}</span>
                </div>
                <p className="text-[12px] text-slate-700 mt-0.5 leading-relaxed">
                  {i === 0 ? "Je prends ça en charge dès maintenant." : i === 1 ? "Bonne idée, je suis disponible pour appuyer." : "Confirmé — c'est noté."}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reply input */}
      <div className="p-3 border-t border-slate-100">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-[10px] px-3 py-2">
          <input
            className="flex-1 bg-transparent text-[13px] placeholder:text-slate-400 focus:outline-none"
            placeholder="Répondre…"
            value={reply}
            onChange={e => setReply(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); setReply(''); } }}
          />
          <button
            onClick={() => setReply('')}
            disabled={!reply.trim()}
            className="text-slate-400 hover:text-slate-700 disabled:opacity-30 transition-colors"
          >
            <IconSend className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

/* ────────────────────────────────────────────────────────────── */
/*  Main Component                                                 */
/* ────────────────────────────────────────────────────────────── */

export const Messaging: React.FC = () => {
  const [channels] = useState<Channel[]>([...CHANNELS, ...DMS]);
  const [activeChannelId, setActiveChannelId] = useState('general');
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [threadMsg, setThreadMsg] = useState<Message | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [unread, setUnread] = useState<Record<string, number>>(
    Object.fromEntries([...CHANNELS, ...DMS].map(c => [c.id, c.unread]))
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const activeChannel = channels.find(c => c.id === activeChannelId)!;

  const channelMessages = messages
    .filter(m => m.channelId === activeChannelId)
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  const filteredMessages = searchQuery
    ? channelMessages.filter(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : channelMessages;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChannelId, messages.length]);

  const handleChannelChange = (id: string) => {
    setActiveChannelId(id);
    setThreadMsg(null);
    setSearchQuery('');
    setUnread(prev => ({ ...prev, [id]: 0 }));
  };

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      channelId: activeChannelId,
      authorId: ME.id,
      authorName: ME.name,
      authorColor: ME.color,
      content: text,
      timestamp: new Date(),
      isBot: false,
      reactions: [],
      replyCount: 0,
    };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    inputRef.current?.focus();
  }, [input, activeChannelId]);

  const handleReact = (msgId: string, emoji: string) => {
    setMessages(prev => prev.map(m => {
      if (m.id !== msgId) return m;
      const existing = m.reactions.find(r => r.emoji === emoji);
      if (existing) {
        const updated = existing.mine
          ? m.reactions.filter(r => r.emoji !== emoji)
          : m.reactions.map(r => r.emoji === emoji ? { ...r, count: r.count + 1, mine: true } : r);
        return { ...m, reactions: updated };
      }
      return { ...m, reactions: [...m.reactions, { emoji, count: 1, mine: true }] };
    }));
  };

  const totalUnread = Object.values(unread).reduce((a, b) => a + b, 0);

  /* ── Channel sidebar ──────────────────────────────────────── */
  const renderChannelList = (items: Channel[], label: string) => (
    <div className="mb-4">
      <div className="px-3 mb-1 flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
        <button className="w-5 h-5 flex items-center justify-center rounded text-slate-400 hover:text-slate-600 hover:bg-black/[0.04] transition-colors">
          <IconPlus className="w-3.5 h-3.5" />
        </button>
      </div>
      {items.map(ch => {
        const isActive = ch.id === activeChannelId;
        const u = unread[ch.id] || 0;
        return (
          <button
            key={ch.id}
            onClick={() => handleChannelChange(ch.id)}
            className={`w-full flex items-center gap-2 px-3 py-[7px] rounded-[8px] transition-colors group ${isActive ? 'bg-black/[0.07] text-slate-900' : 'text-slate-500 hover:bg-black/[0.03] hover:text-slate-700'}`}
          >
            {ch.type === 'dm' ? (
              <div className="relative shrink-0">
                <div className={`w-5 h-5 rounded-[4px] ${ch.dmUser?.color} flex items-center justify-center text-white`} style={{ fontSize: '9px', fontWeight: 700 }}>
                  {ch.dmUser?.initials}
                </div>
                <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#F8F8F6] ${ch.dmUser?.online ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              </div>
            ) : (
              <span className={`text-[13px] font-semibold transition-colors ${isActive ? 'text-slate-700' : 'text-slate-400 group-hover:text-slate-500'}`}>#</span>
            )}
            <span className={`flex-1 text-left text-[13px] truncate ${isActive ? 'font-semibold' : 'font-medium'}`}>
              {ch.name}
            </span>
            {u > 0 && (
              <span className="shrink-0 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-slate-900 text-white text-[10px] font-bold px-1">
                {u}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );

  /* ── Main render ──────────────────────────────────────────── */
  return (
    <div className="flex h-full min-h-0 overflow-hidden" style={{ fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}>

      {/* ── Channel sidebar ───────────────────────────────────── */}
      <aside className="w-[240px] shrink-0 flex flex-col border-r border-slate-100 overflow-hidden" style={{ backgroundColor: '#F8F8F6' }}>
        {/* Workspace header */}
        <div className="px-4 py-4 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-[8px] bg-[#0f0f10] flex items-center justify-center text-white font-bold text-[12px]">M</div>
              <div>
                <p className="text-[13px] font-semibold text-slate-900 leading-none">Medicom HQ</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] text-slate-400 font-medium">5 en ligne</span>
                </div>
              </div>
            </div>
            {totalUnread > 0 && (
              <span className="min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1">
                {totalUnread}
              </span>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="px-3 py-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2 bg-black/[0.04] rounded-[8px] px-2.5 h-7">
            <IconSearch className="w-3 h-3 text-slate-400 shrink-0" />
            <input
              className="flex-1 bg-transparent text-[12px] placeholder:text-slate-400 focus:outline-none text-slate-700"
              placeholder="Rechercher…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-1 scrollbar-hide">
          {renderChannelList(CHANNELS, 'Canaux')}
          <div className="mx-3 mb-3 border-t border-slate-100" />
          {renderChannelList(DMS, 'Messages directs')}
        </nav>

        {/* Me status */}
        <div className="px-3 pb-4 mt-auto border-t border-slate-100 pt-3">
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-[8px] hover:bg-black/[0.04] cursor-pointer transition-colors">
            <div className="relative shrink-0">
              <div className="w-6 h-6 rounded-[5px] bg-[#0f0f10] flex items-center justify-center text-white font-bold text-[9px]">SA</div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-[#F8F8F6]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-slate-900 truncate">Sami Atif</p>
              <p className="text-[10px] text-slate-400">Super Admin</p>
            </div>
            <IconSettings className="w-3.5 h-3.5 text-slate-400" />
          </div>
        </div>
      </aside>

      {/* ── Message area ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white">

        {/* Channel header */}
        <header className="h-[52px] shrink-0 flex items-center justify-between px-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            {activeChannel.type === 'channel' ? (
              <div className="flex items-center gap-2">
                <span className="text-[16px] font-semibold text-slate-400">#</span>
                <span className="text-[14px] font-semibold text-slate-900">{activeChannel.name}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-[6px] ${activeChannel.dmUser?.color} flex items-center justify-center text-white font-bold text-[10px]`}>
                  {activeChannel.dmUser?.initials}
                </div>
                <span className="text-[14px] font-semibold text-slate-900">{activeChannel.name}</span>
                {activeChannel.dmUser?.online && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                )}
              </div>
            )}
            {activeChannel.description && (
              <span className="hidden lg:block text-[12px] text-slate-400 border-l border-slate-200 pl-3">{activeChannel.description}</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <div className="relative">
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-[8px] px-2.5 h-7 mr-2">
                <IconSearch className="w-3 h-3 text-slate-400" />
                <input
                  className="w-32 bg-transparent text-[12px] placeholder:text-slate-400 focus:outline-none"
                  placeholder="Chercher dans ce canal…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600">
                    <IconX className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
            <button className="w-7 h-7 flex items-center justify-center rounded-[6px] text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
              <IconBell className="w-4 h-4" />
            </button>
            <button className="w-7 h-7 flex items-center justify-center rounded-[6px] text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
              <IconUsers className="w-4 h-4" />
            </button>
            <button className="w-7 h-7 flex items-center justify-center rounded-[6px] text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
              <IconMoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto py-3 scrollbar-hide" id="msg-container">
          {filteredMessages.length === 0 && searchQuery && (
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <IconSearch className="w-8 h-8 text-slate-200" />
              <p className="text-[13px] text-slate-400">Aucun message trouvé pour "{searchQuery}"</p>
            </div>
          )}
          {filteredMessages.length === 0 && !searchQuery && (
            <div className="flex flex-col items-center justify-center h-full gap-3 px-8 text-center">
              <div className="w-12 h-12 rounded-[12px] bg-slate-100 flex items-center justify-center">
                <span className="text-[18px] font-semibold text-slate-400">#</span>
              </div>
              <div>
                <p className="text-[15px] font-semibold text-slate-900">Début de #{activeChannel.name}</p>
                <p className="text-[12px] text-slate-400 mt-0.5">{activeChannel.description}</p>
              </div>
            </div>
          )}

          {filteredMessages.map((msg, idx) => {
            const prev = idx > 0 ? filteredMessages[idx - 1] : null;
            const showSep = !prev || !isSameDay(prev.timestamp, msg.timestamp);
            return (
              <React.Fragment key={msg.id}>
                {showSep && (
                  <div className="flex items-center gap-3 px-5 my-4">
                    <div className="flex-1 h-px bg-slate-100" />
                    <span className="text-[11px] font-semibold text-slate-400 shrink-0">{formatDay(msg.timestamp)}</span>
                    <div className="flex-1 h-px bg-slate-100" />
                  </div>
                )}
                <MessageItem
                  msg={msg}
                  prevMsg={prev}
                  onReact={handleReact}
                  onReply={m => setThreadMsg(m === threadMsg ? null : m)}
                />
              </React.Fragment>
            );
          })}
          <div ref={messagesEndRef} className="h-3" />
        </div>

        {/* Input area */}
        <div className="shrink-0 px-4 pb-4 pt-2">
          {showEmojiPicker && (
            <div className="mb-2 bg-white border border-slate-200 rounded-[10px] p-3 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Réaction rapide</p>
              <div className="flex gap-2 flex-wrap">
                {QUICK_REACTIONS.map(e => (
                  <button
                    key={e}
                    onClick={() => { setInput(i => i + e); setShowEmojiPicker(false); inputRef.current?.focus(); }}
                    className="text-[20px] hover:scale-125 transition-transform"
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="border border-slate-200 rounded-[12px] overflow-hidden focus-within:border-slate-400 transition-colors">
            {/* Format bar */}
            <div className="flex items-center gap-0.5 px-3 pt-2.5 pb-1">
              <button className="w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 text-[12px] font-bold transition-colors">B</button>
              <button className="w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 text-[12px] italic transition-colors">I</button>
              <button className="w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 text-[11px] font-mono transition-colors">`</button>
              <div className="w-px h-4 bg-slate-200 mx-1" />
              <button
                onClick={() => setShowEmojiPicker(s => !s)}
                className="w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 text-[13px] transition-colors"
              >
                :)
              </button>
              <button className="w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                <IconPaperclip className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] text-slate-300 ml-1">@mention avec @</span>
            </div>
            {/* Textarea */}
            <textarea
              ref={inputRef}
              rows={2}
              className="w-full px-3 py-1.5 pb-2.5 text-[13.5px] placeholder:text-slate-400 text-slate-900 resize-none focus:outline-none bg-white"
              placeholder={`Message ${activeChannel.type === 'channel' ? '#' : ''}${activeChannel.name}…`}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            {/* Footer */}
            <div className="flex items-center justify-between px-3 pb-2.5">
              <span className="text-[10px] text-slate-300">Entrée pour envoyer · Maj+Entrée pour nouvelle ligne</span>
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0f0f10] text-white text-[12px] font-semibold rounded-[8px] hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <IconSend className="w-3.5 h-3.5" />
                Envoyer
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Thread panel ──────────────────────────────────────── */}
      {threadMsg && (
        <ThreadPanel
          msg={threadMsg}
          onClose={() => setThreadMsg(null)}
          onReact={handleReact}
        />
      )}
    </div>
  );
};
