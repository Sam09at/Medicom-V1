import { supabase } from '../supabase';
import type { WhatsAppMessage } from '../../types';

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

export async function getMessageLog(
  tenantId: string,
  limit = 50
): Promise<WhatsAppMessage[]> {
  if (!supabase) return [];

  const { data } = await supabase
    .from('whatsapp_messages')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (!data) return [];
  return (data as WhatsAppMessageRow[]).map(toWhatsAppMessage);
}
