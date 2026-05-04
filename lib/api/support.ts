import { supabase } from '../supabase';
import { Ticket, TicketMessage, TicketStatus, TicketPriority, TicketCategory } from '../../types';

// ── Row types ──────────────────────────────────────────────────────

interface TicketRow {
  id: string;
  tenant_id: string | null;
  subject: string;
  category: string;
  priority: string;
  status: string;
  created_by_id: string;
  created_by_name: string;
  created_by_role: string;
  created_by_avatar: string | null;
  clinic_name: string | null;
  plan: string | null;
  assigned_to_id: string | null;
  assigned_to_name: string | null;
  assigned_to_avatar: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  ticket_messages?: MessageRow[];
}

interface MessageRow {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: string;
  sender_avatar: string | null;
  content: string;
  is_internal: boolean;
  created_at: string;
}

// ── Mappers ────────────────────────────────────────────────────────

function toMessage(row: MessageRow): TicketMessage {
  return {
    id: row.id,
    ticketId: row.ticket_id,
    senderId: row.sender_id,
    senderName: row.sender_name,
    senderAvatar: row.sender_avatar ?? 'https://ui-avatars.com/api/?name=' + encodeURIComponent(row.sender_name),
    content: row.content,
    createdAt: row.created_at,
    isInternal: row.is_internal,
  };
}

function toTicket(row: TicketRow): Ticket {
  const elapsed = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60) return `${m} min`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    return `${Math.floor(h / 24)}j`;
  };

  return {
    id: row.id,
    subject: row.subject,
    category: row.category as TicketCategory,
    priority: row.priority as TicketPriority,
    status: row.status as TicketStatus,
    user: {
      id: row.created_by_id,
      name: row.created_by_name,
      clinicName: row.clinic_name ?? '',
      plan: row.plan ?? '',
      avatar: row.created_by_avatar ?? 'https://ui-avatars.com/api/?name=' + encodeURIComponent(row.created_by_name),
    },
    assignedTo: row.assigned_to_id
      ? {
          id: row.assigned_to_id,
          name: row.assigned_to_name ?? '',
          avatar: row.assigned_to_avatar ?? 'https://ui-avatars.com/api/?name=' + encodeURIComponent(row.assigned_to_name ?? 'SA'),
        }
      : undefined,
    lastUpdate: elapsed(row.updated_at),
    createdAt: row.created_at,
    messages: (row.ticket_messages ?? []).map(toMessage),
    tags: row.tags ?? [],
  };
}

// ── Mock data ──────────────────────────────────────────────────────

const MOCK_MESSAGES: Record<string, TicketMessage[]> = {
  'T-1001': [
    { id: 'ma1', ticketId: 'T-1001', senderId: 'u1', senderName: 'Dr. Amina Belhaj', senderAvatar: 'https://ui-avatars.com/api/?name=Amina+Belhaj&background=3b82f6&color=fff', content: "Bonjour, je n'arrive pas à générer la facture de M. Benali. Le bouton reste grisé même après avoir saisi tous les champs.", createdAt: new Date(Date.now() - 7200000).toISOString(), isInternal: false },
    { id: 'ma2', ticketId: 'T-1001', senderId: 'sa1', senderName: 'Support Medicom', senderAvatar: 'https://ui-avatars.com/api/?name=Support&background=0f0f10&color=fff', content: "Bonjour Dr. Amina, je regarde ça tout de suite. Pouvez-vous me confirmer le plan de votre cabinet et si le module Facturation est activé dans les paramètres ?", createdAt: new Date(Date.now() - 6900000).toISOString(), isInternal: false },
    { id: 'ma3', ticketId: 'T-1001', senderId: 'sa1', senderName: 'Support Medicom', senderAvatar: 'https://ui-avatars.com/api/?name=Support&background=0f0f10&color=fff', content: 'Note interne : vérifier les logs PDF generation. Probablement un bug de la mise à jour 0.14.2.', createdAt: new Date(Date.now() - 6850000).toISOString(), isInternal: true },
  ],
  'T-1002': [
    { id: 'mb1', ticketId: 'T-1002', senderId: 'u2', senderName: 'Dr. Khalil Tazi', senderAvatar: 'https://ui-avatars.com/api/?name=Khalil+Tazi&background=8b5cf6&color=fff', content: 'Comment puis-je importer ma base patients depuis un fichier Excel ? Je vois une option mais elle ne semble pas fonctionner.', createdAt: new Date(Date.now() - 86400000).toISOString(), isInternal: false },
    { id: 'mb2', ticketId: 'T-1002', senderId: 'sa1', senderName: 'Support Medicom', senderAvatar: 'https://ui-avatars.com/api/?name=Support&background=0f0f10&color=fff', content: "Bonjour Dr. Tazi ! La fonctionnalité d'import Excel est disponible depuis Patients > Import. Le fichier doit être au format .xlsx avec les colonnes Prénom, Nom, Téléphone, Date de naissance. Je vous envoie un modèle.", createdAt: new Date(Date.now() - 82800000).toISOString(), isInternal: false },
  ],
  'T-1003': [
    { id: 'mc1', ticketId: 'T-1003', senderId: 'u3', senderName: 'Mme. Bennani', senderAvatar: 'https://ui-avatars.com/api/?name=Bennani&background=f59e0b&color=fff', content: "La synchronisation avec Google Agenda ne fonctionne plus depuis hier soir. Les rendez-vous n'apparaissent plus côté Google.", createdAt: new Date(Date.now() - 3600000).toISOString(), isInternal: false },
  ],
  'T-1004': [
    { id: 'md1', ticketId: 'T-1004', senderId: 'u4', senderName: 'Dr. Sara Idrissi', senderAvatar: 'https://ui-avatars.com/api/?name=Sara+Idrissi&background=10b981&color=fff', content: "Serait-il possible d'ajouter une option pour envoyer les ordonnances directement par email au patient depuis la consultation ?", createdAt: new Date(Date.now() - 172800000).toISOString(), isInternal: false },
    { id: 'md2', ticketId: 'T-1004', senderId: 'sa1', senderName: 'Support Medicom', senderAvatar: 'https://ui-avatars.com/api/?name=Support&background=0f0f10&color=fff', content: "Bonne suggestion, Dr. Idrissi ! Nous avons transmis votre demande à notre équipe produit. Cette fonctionnalité est dans notre feuille de route pour le prochain trimestre.", createdAt: new Date(Date.now() - 169200000).toISOString(), isInternal: false },
    { id: 'md3', ticketId: 'T-1004', senderId: 'u4', senderName: 'Dr. Sara Idrissi', senderAvatar: 'https://ui-avatars.com/api/?name=Sara+Idrissi&background=10b981&color=fff', content: "Merci beaucoup ! J'attends avec impatience.", createdAt: new Date(Date.now() - 165600000).toISOString(), isInternal: false },
  ],
};

const MOCK_TICKETS: Ticket[] = [
  { id: 'T-1001', subject: 'Erreur lors de la génération PDF facture', category: 'Bug', priority: 'High', status: 'Open', user: { id: 'u1', name: 'Dr. Amina Belhaj', clinicName: 'Cabinet Dentaire Amina', plan: 'Premium', avatar: 'https://ui-avatars.com/api/?name=Amina+Belhaj&background=3b82f6&color=fff' }, assignedTo: { id: 'sa1', name: 'Sami', avatar: 'https://ui-avatars.com/api/?name=Sami&background=0f0f10&color=fff' }, lastUpdate: '10 min', createdAt: new Date(Date.now() - 7200000).toISOString(), messages: MOCK_MESSAGES['T-1001'], tags: ['PDF', 'Facturation'] },
  { id: 'T-1002', subject: 'Question sur l\'import patients Excel', category: 'Technical', priority: 'Normal', status: 'Resolved', user: { id: 'u2', name: 'Dr. Khalil Tazi', clinicName: 'Cabinet Sourire', plan: 'Pro', avatar: 'https://ui-avatars.com/api/?name=Khalil+Tazi&background=8b5cf6&color=fff' }, lastUpdate: '5h', createdAt: new Date(Date.now() - 86400000).toISOString(), messages: MOCK_MESSAGES['T-1002'], tags: ['Import'] },
  { id: 'T-1003', subject: 'Synchronisation Google Agenda interrompue', category: 'Bug', priority: 'Urgent', status: 'In Progress', user: { id: 'u3', name: 'Mme. Bennani', clinicName: 'Ortho Plus', plan: 'Pro', avatar: 'https://ui-avatars.com/api/?name=Bennani&background=f59e0b&color=fff' }, lastUpdate: '1h', createdAt: new Date(Date.now() - 3600000).toISOString(), messages: MOCK_MESSAGES['T-1003'], tags: ['Agenda', 'Sync'] },
  { id: 'T-1004', subject: 'Suggestion : envoi ordonnance par email', category: 'Feature', priority: 'Low', status: 'Waiting', user: { id: 'u4', name: 'Dr. Sara Idrissi', clinicName: 'Cabinet Sara', plan: 'Starter', avatar: 'https://ui-avatars.com/api/?name=Sara+Idrissi&background=10b981&color=fff' }, lastUpdate: '2j', createdAt: new Date(Date.now() - 172800000).toISOString(), messages: MOCK_MESSAGES['T-1004'], tags: ['Feature', 'Email'] },
];

// ── API functions ──────────────────────────────────────────────────

export async function getTickets(tenantId?: string): Promise<Ticket[]> {
  if (!supabase) {
    if (tenantId) return MOCK_TICKETS.filter((t) => t.user.id !== 'u1' ? false : true).slice(0, 2);
    return MOCK_TICKETS;
  }

  let query = supabase
    .from('support_tickets')
    .select('*, ticket_messages(*)')
    .order('updated_at', { ascending: false });

  if (tenantId) {
    query = query.eq('tenant_id', tenantId);
  }

  const { data } = await query;
  return (data ?? []).map((row) => toTicket(row as TicketRow));
}

export async function createTicket(
  tenantId: string,
  input: {
    subject: string;
    category: TicketCategory;
    priority: TicketPriority;
    description: string;
    userId: string;
    userName: string;
    userAvatar: string;
    userRole: string;
    clinicName: string;
    plan: string;
  }
): Promise<Ticket | null> {
  if (!supabase) {
    const t: Ticket = {
      id: `T-${Date.now()}`,
      subject: input.subject,
      category: input.category,
      priority: input.priority,
      status: 'Open',
      user: { id: input.userId, name: input.userName, clinicName: input.clinicName, plan: input.plan, avatar: input.userAvatar },
      lastUpdate: 'à l\'instant',
      createdAt: new Date().toISOString(),
      messages: [{
        id: `m-${Date.now()}`,
        ticketId: `T-${Date.now()}`,
        senderId: input.userId,
        senderName: input.userName,
        senderAvatar: input.userAvatar,
        content: input.description,
        createdAt: new Date().toISOString(),
        isInternal: false,
      }],
      tags: [],
    };
    return t;
  }

  const { data: ticketData, error } = await supabase
    .from('support_tickets')
    .insert({
      tenant_id: tenantId,
      subject: input.subject,
      category: input.category,
      priority: input.priority,
      status: 'Open',
      created_by_id: input.userId,
      created_by_name: input.userName,
      created_by_role: input.userRole,
      created_by_avatar: input.userAvatar,
      clinic_name: input.clinicName,
      plan: input.plan,
    })
    .select()
    .single();

  if (error || !ticketData) return null;

  await supabase.from('ticket_messages').insert({
    ticket_id: ticketData.id,
    sender_id: input.userId,
    sender_name: input.userName,
    sender_role: input.userRole,
    sender_avatar: input.userAvatar,
    content: input.description,
    is_internal: false,
  });

  const { data: full } = await supabase
    .from('support_tickets')
    .select('*, ticket_messages(*)')
    .eq('id', ticketData.id)
    .single();

  return full ? toTicket(full as TicketRow) : null;
}

export async function addMessage(
  ticketId: string,
  input: {
    senderId: string;
    senderName: string;
    senderAvatar: string;
    senderRole: string;
    content: string;
    isInternal: boolean;
  }
): Promise<TicketMessage | null> {
  if (!supabase) {
    return {
      id: `m-${Date.now()}`,
      ticketId,
      senderId: input.senderId,
      senderName: input.senderName,
      senderAvatar: input.senderAvatar,
      content: input.content,
      createdAt: new Date().toISOString(),
      isInternal: input.isInternal,
    };
  }

  const { data, error } = await supabase
    .from('ticket_messages')
    .insert({
      ticket_id: ticketId,
      sender_id: input.senderId,
      sender_name: input.senderName,
      sender_role: input.senderRole,
      sender_avatar: input.senderAvatar,
      content: input.content,
      is_internal: input.isInternal,
    })
    .select()
    .single();

  if (error || !data) return null;
  return toMessage(data as MessageRow);
}

export async function updateTicketStatus(
  ticketId: string,
  status: TicketStatus
): Promise<boolean> {
  if (!supabase) return true;
  const { error } = await supabase
    .from('support_tickets')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', ticketId);
  return !error;
}

export async function assignTicket(
  ticketId: string,
  assignee: { id: string; name: string; avatar: string } | null
): Promise<boolean> {
  if (!supabase) return true;
  const { error } = await supabase
    .from('support_tickets')
    .update({
      assigned_to_id: assignee?.id ?? null,
      assigned_to_name: assignee?.name ?? null,
      assigned_to_avatar: assignee?.avatar ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', ticketId);
  return !error;
}

export { MOCK_TICKETS };
