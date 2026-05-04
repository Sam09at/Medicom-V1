import { supabase } from '../supabase';
import { WhatsAppMessage } from '../../types';

interface WhatsAppMessageRow {
  id: string;
  tenant_id: string;
  appointment_id: string | null;
  direction: 'outbound' | 'inbound';
  template_name: string | null;
  phone_to: string;
  message_body: string | null;
  status: 'queued' | 'sent' | 'delivered' | 'read' | 'failed';
  external_message_id: string | null;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
}

function toWhatsAppMessage(row: WhatsAppMessageRow): WhatsAppMessage {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    appointmentId: row.appointment_id ?? undefined,
    direction: row.direction,
    templateName: row.template_name ?? undefined,
    phoneTo: row.phone_to,
    messageBody: row.message_body ?? undefined,
    status: row.status,
    externalMessageId: row.external_message_id ?? undefined,
    errorMessage: row.error_message ?? undefined,
    sentAt: row.sent_at ?? undefined,
    createdAt: row.created_at,
  };
}

const MOCK_MESSAGES: WhatsAppMessage[] = [
  {
    id: 'wa-001',
    tenantId: 'mock',
    appointmentId: 'apt-1',
    direction: 'outbound',
    templateName: 'appointment_reminder_24h',
    phoneTo: '+212661****23',
    status: 'delivered',
    sentAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: 'wa-002',
    tenantId: 'mock',
    appointmentId: 'apt-2',
    direction: 'outbound',
    templateName: 'appointment_confirmation',
    phoneTo: '+212662****87',
    status: 'read',
    sentAt: new Date(Date.now() - 5 * 3600000).toISOString(),
    createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
  },
  {
    id: 'wa-003',
    tenantId: 'mock',
    appointmentId: 'apt-3',
    direction: 'outbound',
    templateName: 'appointment_reminder_24h',
    phoneTo: '+212663****54',
    status: 'failed',
    errorMessage: 'Numéro non enregistré sur WhatsApp',
    sentAt: new Date(Date.now() - 26 * 3600000).toISOString(),
    createdAt: new Date(Date.now() - 26 * 3600000).toISOString(),
  },
  {
    id: 'wa-004',
    tenantId: 'mock',
    direction: 'outbound',
    templateName: 'appointment_reminder_24h',
    phoneTo: '+212664****11',
    status: 'sent',
    sentAt: new Date(Date.now() - 28 * 3600000).toISOString(),
    createdAt: new Date(Date.now() - 28 * 3600000).toISOString(),
  },
  {
    id: 'wa-005',
    tenantId: 'mock',
    appointmentId: 'apt-5',
    direction: 'outbound',
    templateName: 'booking_confirmation',
    phoneTo: '+212665****99',
    status: 'delivered',
    sentAt: new Date(Date.now() - 50 * 3600000).toISOString(),
    createdAt: new Date(Date.now() - 50 * 3600000).toISOString(),
  },
];

export async function getWhatsAppMessages(
  tenantId: string,
  limit = 50
): Promise<WhatsAppMessage[]> {
  if (!supabase) return MOCK_MESSAGES;

  const { data } = await supabase
    .from('whatsapp_messages')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(limit);

  return (data ?? []).map((row) => toWhatsAppMessage(row as WhatsAppMessageRow));
}
