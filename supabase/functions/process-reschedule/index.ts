import { createClient } from 'jsr:@supabase/supabase-js@2';

// Public endpoint — no auth required, validated by reschedule_token

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'content-type' },
    });
  }

  try {
    const { token, new_start_time } = await req.json() as {
      token: string;
      new_start_time: string; // ISO string
    };

    const sc = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Look up appointment by token
    const { data: appt, error: lookupErr } = await sc
      .from('appointments')
      .select('id, tenant_id, patient_id, start_time, duration_minutes, status, reschedule_token')
      .eq('reschedule_token', token)
      .maybeSingle();

    if (lookupErr || !appt) {
      return new Response(JSON.stringify({ error: 'Lien invalide ou expiré.' }), { status: 404 });
    }

    if (['cancelled', 'completed', 'absent'].includes(appt.status)) {
      return new Response(JSON.stringify({ error: 'Ce rendez-vous ne peut plus être modifié.' }), { status: 422 });
    }

    const newStart = new Date(new_start_time);
    if (isNaN(newStart.getTime()) || newStart < new Date()) {
      return new Response(JSON.stringify({ error: 'Date invalide.' }), { status: 400 });
    }

    const newEnd = new Date(newStart.getTime() + appt.duration_minutes * 60_000);

    // Check for conflicts (exclude this appointment)
    const { data: conflicts } = await sc
      .from('appointments')
      .select('id')
      .eq('tenant_id', appt.tenant_id)
      .neq('id', appt.id)
      .not('status', 'in', '("cancelled","absent")')
      .lt('start_time', newEnd.toISOString())
      .gt('end_time', newStart.toISOString());

    if (conflicts && conflicts.length > 0) {
      return new Response(JSON.stringify({ error: 'Ce créneau est déjà pris. Veuillez choisir un autre.' }), { status: 409 });
    }

    // Apply reschedule — invalidate token after use
    const newToken = crypto.randomUUID().replace(/-/g, '');
    const { error: updateErr } = await sc
      .from('appointments')
      .update({
        start_time: newStart.toISOString(),
        status: 'rescheduled',
        reschedule_token: newToken, // rotate token
      })
      .eq('id', appt.id);

    if (updateErr) throw updateErr;

    // Fetch patient email for confirmation
    const { data: patient } = await sc
      .from('patients')
      .select('first_name, last_name, email')
      .eq('id', appt.patient_id)
      .maybeSingle();

    // Fetch tenant name
    const { data: tenant } = await sc
      .from('tenants')
      .select('name')
      .eq('id', appt.tenant_id)
      .maybeSingle();

    // Send WhatsApp + email confirmation asynchronously
    const baseUrl = Deno.env.get('PUBLIC_SITE_URL') ?? 'https://medicom.ma';
    if (patient?.email) {
      await sc.functions.invoke('send-email', {
        body: {
          to: patient.email,
          type: 'appointment_reschedule',
          tenant_id: appt.tenant_id,
          params: {
            patient_name: `${patient.first_name} ${patient.last_name}`,
            clinic_name: tenant?.name ?? 'votre cabinet',
            new_date: newStart.toLocaleDateString('fr-FR'),
            new_time: newStart.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          },
        },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      new_start_time: newStart.toISOString(),
    }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err) {
    console.error('[process-reschedule] error:', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
