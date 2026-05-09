import { createClient } from 'jsr:@supabase/supabase-js@2';

// This function is internal-only — called by other edge functions via service_role Bearer.
// It should never be exposed to the public browser.

const TEMPLATE_BODIES: Record<string, (...params: string[]) => string> = {
  otp_verification: (otp) =>
    `Votre code de confirmation Medicom : *${otp}*. Valable 5 minutes. Ne le partagez pas.`,
  appointment_confirmation: (clinic, date, time, ref) =>
    `Votre RDV chez *${clinic}* est confirmé pour le *${date}* à *${time}*. Référence : ${ref}`,
  appointment_reminder_24h: (date, time, clinic) =>
    `Rappel : vous avez un RDV demain *${date}* à *${time}* chez *${clinic}*. Répondez ANNULER pour annuler.`,
  appointment_cancellation: (clinic) =>
    `Votre RDV chez *${clinic}* a été annulé. Contactez-nous pour replanifier.`,
};

Deno.serve(async (req) => {
  // Only service_role callers allowed
  const authHeader = req.headers.get('Authorization') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  if (!authHeader.includes(serviceKey)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const body = await req.json() as {
      to: string;
      template_id: string;
      params: string[];
      tenant_id: string;
      appointment_id?: string;
    };

    const { to, template_id, params, tenant_id, appointment_id } = body;

    const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioFrom = Deno.env.get('TWILIO_WHATSAPP_FROM') ?? 'whatsapp:+14155238886';

    if (!twilioSid || !twilioToken) {
      console.warn('[send-whatsapp] Twilio credentials not set — skipping send');
      return new Response(JSON.stringify({ skipped: true }), { status: 200 });
    }

    const bodyTemplate = TEMPLATE_BODIES[template_id];
    const messageBody = bodyTemplate ? bodyTemplate(...params) : params.join(' ');

    // Call Twilio Messages API
    const formData = new URLSearchParams();
    formData.append('From', twilioFrom);
    formData.append('To', `whatsapp:${to}`);
    formData.append('Body', messageBody);

    const twilioRes = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${twilioSid}:${twilioToken}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      }
    );

    const twilioData = await twilioRes.json() as { sid?: string; status?: string; error_message?: string };

    // Log to whatsapp_messages table
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      serviceKey,
    );

    await supabase.from('whatsapp_messages').insert({
      tenant_id,
      appointment_id: appointment_id ?? null,
      direction: 'outbound',
      template_name: template_id,
      phone_to: to,
      message_body: messageBody,
      status: twilioRes.ok ? (twilioData.status ?? 'sent') : 'failed',
      external_message_id: twilioData.sid ?? null,
      error_message: twilioRes.ok ? null : (twilioData.error_message ?? 'Twilio error'),
      sent_at: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({ message_sid: twilioData.sid }),
      { status: twilioRes.ok ? 200 : 502, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
