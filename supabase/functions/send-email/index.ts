import { createClient } from 'jsr:@supabase/supabase-js@2';

const SENDGRID_API_URL = 'https://api.sendgrid.com/v3/mail/send';

// ── Email templates ───────────────────────────────────────────────────────────

type EmailType =
  | 'appointment_confirmation'
  | 'appointment_reminder'
  | 'appointment_cancellation'
  | 'appointment_reschedule'
  | 'welcome';

function buildEmailContent(type: EmailType, params: Record<string, string>): {
  subject: string;
  html: string;
} {
  switch (type) {
    case 'appointment_confirmation':
      return {
        subject: `Confirmation de votre RDV chez ${params.clinic_name}`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
            <h2 style="color:#1e293b">Votre rendez-vous est confirmé ✓</h2>
            <p>Bonjour ${params.patient_name},</p>
            <p>Votre rendez-vous chez <strong>${params.clinic_name}</strong> est bien enregistré :</p>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:16px 0">
              <p style="margin:4px 0">📅 <strong>${params.date}</strong> à <strong>${params.time}</strong></p>
              <p style="margin:4px 0">🔖 Référence : <code>${params.ref}</code></p>
            </div>
            <p>
              <a href="${params.reschedule_url}" style="color:#2563eb">Modifier le rendez-vous</a> &nbsp;|&nbsp;
              <a href="${params.cancel_url}" style="color:#dc2626">Annuler</a>
            </p>
            <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0"/>
            <p style="font-size:12px;color:#94a3b8">Medicom — logiciel de gestion de cabinet médical</p>
          </div>`,
      };
    case 'appointment_reminder':
      return {
        subject: `Rappel : RDV demain chez ${params.clinic_name}`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
            <h2 style="color:#1e293b">Rappel de rendez-vous ⏰</h2>
            <p>Bonjour ${params.patient_name},</p>
            <p>Vous avez un rendez-vous demain chez <strong>${params.clinic_name}</strong> :</p>
            <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px;margin:16px 0">
              <p style="margin:4px 0">📅 <strong>${params.date}</strong> à <strong>${params.time}</strong></p>
            </div>
            <p><a href="${params.cancel_url}" style="color:#dc2626">Annuler si vous ne pouvez pas venir</a></p>
          </div>`,
      };
    case 'appointment_cancellation':
      return {
        subject: `Annulation de votre RDV chez ${params.clinic_name}`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
            <h2 style="color:#1e293b">Rendez-vous annulé</h2>
            <p>Bonjour ${params.patient_name},</p>
            <p>Votre rendez-vous chez <strong>${params.clinic_name}</strong> a été annulé.</p>
            <p>Contactez-nous pour reprendre un nouveau créneau.</p>
          </div>`,
      };
    case 'appointment_reschedule':
      return {
        subject: `Votre RDV a été reprogrammé — ${params.clinic_name}`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
            <h2 style="color:#1e293b">Rendez-vous reprogrammé ✓</h2>
            <p>Bonjour ${params.patient_name},</p>
            <p>Votre rendez-vous chez <strong>${params.clinic_name}</strong> a été reprogrammé :</p>
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:16px 0">
              <p style="margin:4px 0">📅 Nouveau créneau : <strong>${params.new_date}</strong> à <strong>${params.new_time}</strong></p>
            </div>
          </div>`,
      };
    case 'welcome':
      return {
        subject: `Bienvenue sur Medicom, ${params.clinic_name} !`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
            <h2 style="color:#1e293b">Bienvenue sur Medicom 🎉</h2>
            <p>Bonjour ${params.contact_name},</p>
            <p>Votre cabinet <strong>${params.clinic_name}</strong> est maintenant actif sur Medicom.</p>
            <p><a href="${params.app_url}" style="background:#2563eb;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:8px">Accéder au tableau de bord</a></p>
          </div>`,
      };
  }
}

// ── Handler ───────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' },
    });
  }

  try {
    const body = await req.json() as {
      to: string;
      type: EmailType;
      params: Record<string, string>;
      tenant_id?: string;
    };

    const apiKey = Deno.env.get('SENDGRID_API_KEY');
    const fromEmail = Deno.env.get('SENDGRID_FROM_EMAIL') ?? 'noreply@medicom.ma';
    const fromName  = Deno.env.get('SENDGRID_FROM_NAME') ?? 'Medicom';

    if (!apiKey) {
      console.warn('[send-email] SENDGRID_API_KEY not set — skipping send');
      return new Response(JSON.stringify({ skipped: true }), { status: 200 });
    }

    const { subject, html } = buildEmailContent(body.type, body.params);

    const sgRes = await fetch(SENDGRID_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: body.to }] }],
        from: { email: fromEmail, name: fromName },
        subject,
        content: [{ type: 'text/html', value: html }],
      }),
    });

    if (!sgRes.ok) {
      const text = await sgRes.text();
      console.error('[send-email] SendGrid error:', text);
      return new Response(JSON.stringify({ error: text }), { status: 500 });
    }

    // Log to audit_logs
    if (body.tenant_id) {
      const sc = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );
      await sc.from('audit_logs').insert({
        tenant_id: body.tenant_id,
        action: `email.${body.type}`,
        resource_type: 'email',
        metadata: { to: body.to },
      });
    }

    return new Response(JSON.stringify({ sent: true }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err) {
    console.error('[send-email] error:', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
