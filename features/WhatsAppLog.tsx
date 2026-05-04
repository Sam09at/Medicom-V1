import React, { useState, useEffect, useCallback } from 'react';
import { useMedicomStore } from '../store';
import { getWhatsAppMessages } from '../lib/api/whatsapp';
import { WhatsAppMessage } from '../types';
import { IconRefresh, IconAlertTriangle, IconCheck } from '../components/Icons';

const STATUS_CONFIG: Record<
  WhatsAppMessage['status'],
  { label: string; className: string }
> = {
  queued:    { label: 'En file',    className: 'bg-slate-100 text-slate-600' },
  sent:      { label: 'Envoyé',     className: 'bg-blue-50 text-blue-700' },
  delivered: { label: 'Livré',      className: 'bg-emerald-50 text-emerald-700' },
  read:      { label: 'Lu',         className: 'bg-purple-50 text-purple-700' },
  failed:    { label: 'Échoué',     className: 'bg-red-50 text-red-700' },
};

const TEMPLATE_LABELS: Record<string, string> = {
  appointment_reminder_24h:  'Rappel 24h',
  appointment_reminder_2h:   'Rappel 2h',
  appointment_confirmation:  'Confirmation RDV',
  booking_confirmation:      'Confirmation réservation',
  appointment_cancelled:     'RDV annulé',
  appointment_rescheduled:   'RDV reprogrammé',
};

function maskPhone(phone: string): string {
  if (phone.includes('*')) return phone;
  if (phone.length < 6) return phone;
  const visible = 4;
  return phone.slice(0, phone.length - visible - 2) + '****' + phone.slice(-visible);
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h}h`;
  const d = Math.floor(h / 24);
  return `il y a ${d}j`;
}

export const WhatsAppLog: React.FC = () => {
  const currentTenant = useMedicomStore((s) => s.currentTenant);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!currentTenant) return;
    setLoading(true);
    const data = await getWhatsAppMessages(currentTenant.id);
    setMessages(data);
    setLoading(false);
  }, [currentTenant]);

  useEffect(() => { load(); }, [load]);

  const delivered = messages.filter((m) => m.status === 'delivered' || m.status === 'read').length;
  const failed = messages.filter((m) => m.status === 'failed').length;
  const total = messages.length;

  return (
    <div className="mt-6">
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-[12px] font-bold text-slate-500 uppercase tracking-widest">
          Journal WhatsApp
        </p>
        <button
          onClick={load}
          className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 hover:text-slate-600 transition-colors"
        >
          <IconRefresh className="w-3.5 h-3.5" />
          Actualiser
        </button>
      </div>

      {/* Summary strip */}
      {total > 0 && (
        <div className="flex gap-3 mb-4">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-slate-50 text-[11px] font-semibold text-slate-600">
            <span className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[9px] font-bold">{total}</span>
            Total
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-emerald-50 text-[11px] font-semibold text-emerald-700">
            <IconCheck className="w-3.5 h-3.5" />
            {delivered} livrés
          </div>
          {failed > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-red-50 text-[11px] font-semibold text-red-700">
              <IconAlertTriangle className="w-3.5 h-3.5" />
              {failed} échecs
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-slate-100 rounded-[10px] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-[13px] text-slate-400">Aucun message envoyé pour l'instant.</p>
            <p className="text-[11px] text-slate-300 mt-1">Les messages apparaîtront ici dès que WhatsApp sera activé.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Envoyé</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Destinataire</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Template</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Statut</th>
              </tr>
            </thead>
            <tbody>
              {messages.map((msg) => {
                const cfg = STATUS_CONFIG[msg.status];
                const templateLabel = msg.templateName
                  ? (TEMPLATE_LABELS[msg.templateName] ?? msg.templateName)
                  : '—';
                return (
                  <tr
                    key={msg.id}
                    className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors"
                    title={msg.errorMessage ?? undefined}
                  >
                    <td className="px-4 py-3 text-[12px] text-slate-500 whitespace-nowrap">
                      {msg.sentAt ? relativeTime(msg.sentAt) : '—'}
                    </td>
                    <td className="px-4 py-3 font-mono text-[12px] text-slate-700">
                      {maskPhone(msg.phoneTo)}
                    </td>
                    <td className="px-4 py-3 text-[12px] text-slate-600">{templateLabel}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${cfg.className}`}>
                        {cfg.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
