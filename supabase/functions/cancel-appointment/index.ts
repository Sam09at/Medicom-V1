import { createClient } from 'jsr:@supabase/supabase-js@2';

// Public endpoint — validated by cancel_token only (no auth)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'content-type' },
    });
  }

  try {
    const { token } = await req.json() as { token: string };

    const sc = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: appt, error: lookupErr } = await sc
      .from('appointments')
      .select('id, tenant_id, patient_id, start_time, status, cancel_token')
      .eq('cancel_token', token)
      .maybeSingle();

    if (lookupErr || !appt) {
      return new Response(JSON.stringify({ error: 'Lien invalide ou expiré.' }), { status: 404 });
    }

    if (['cancelled', 'completed', 'absent'].includes(appt.status)) {
      return new Response(JSON.stringify({ error: 'Ce rendez-vous est déjà annulé ou terminé.' }), { status: 422 });
    }

    // Block cancellations less than 2 hours before the appointment
    const start = new Date(appt.start_time);
    const hoursUntil = (start.getTime() - Date.now()) / 3_600_000;
    if (hoursUntil < 2) {
      return new Response(
        JSON.stringify({ error: 'Annulation impossible moins de 2h avant le rendez-vous. Appelez directement la clinique.' }),
        { status: 422 }
      );
    }

    // Cancel — nullify token so it can't be reused
    const { error: updateErr } = await sc
      .from('appointments')
      .update({ status: 'cancelled', cancel_token: null })
      .eq('id', appt.id);

    if (updateErr) throw updateErr;

    // Notify patient and clinic
    const { data: patient } = await sc
      .from('patients')
      .select('first_name, last_name, email, phone')
      .eq('id', appt.patient_id)
      .maybeSingle();

    const { data: tenant } = await sc
      .from('tenants')
      .select('name, phone')
      .eq('id', appt.tenant_id)
      .maybeSingle();

    if (patient?.email) {
      await sc.functions.invoke('send-email', {
        body: {
          to: patient.email,
          type: 'appointment_cancellation',
          tenant_id: appt.tenant_id,
          params: {
            patient_name: `${patient.first_name} ${patient.last_name}`,
            clinic_name: tenant?.name ?? 'votre cabinet',
          },
        },
      });
    }

    // Notify clinic via WhatsApp
    if (tenant?.phone) {
      await sc.functions.invoke('send-whatsapp', {
        body: {
          to: tenant.phone,
          template_id: 'appointment_cancellation',
          params: [tenant.name ?? 'Cabinet'],
          tenant_id: appt.tenant_id,
          appointment_id: appt.id,
        },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err) {
    console.error('[cancel-appointment] error:', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
