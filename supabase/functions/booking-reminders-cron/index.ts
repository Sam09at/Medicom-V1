import { createClient } from 'jsr:@supabase/supabase-js@2';

// Scheduled via Supabase pg_cron: runs daily at 08:00 Africa/Casablanca
// SQL: SELECT cron.schedule('booking-reminders', '0 8 * * *', $$SELECT net.http_post(...)$$);

Deno.serve(async (req) => {
  // Accept both cron trigger (service role) and manual invocation
  const authHeader = req.headers.get('Authorization') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  if (!authHeader.includes(serviceKey)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const sc = createClient(
    Deno.env.get('SUPABASE_URL')!,
    serviceKey
  );

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayStart = new Date(tomorrow); dayStart.setHours(0, 0, 0, 0);
  const dayEnd   = new Date(tomorrow); dayEnd.setHours(23, 59, 59, 999);

  const { data: appointments } = await sc
    .from('appointments')
    .select(`
      id, tenant_id, patient_id, start_time, duration_minutes,
      patients ( first_name, last_name, email, phone ),
      tenants  ( name, phone )
    `)
    .gte('start_time', dayStart.toISOString())
    .lte('start_time', dayEnd.toISOString())
    .not('status', 'in', '("cancelled","absent","completed")');

  let sent = 0;
  for (const appt of (appointments ?? [])) {
    const patient = Array.isArray(appt.patients) ? appt.patients[0] : appt.patients as any;
    const tenant  = Array.isArray(appt.tenants)  ? appt.tenants[0]  : appt.tenants  as any;

    if (!patient || !tenant) continue;

    const start    = new Date(appt.start_time);
    const dateStr  = start.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    const timeStr  = start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    const publicUrl  = Deno.env.get('PUBLIC_SITE_URL') ?? 'https://medicom.ma';

    // Fetch cancel token
    const { data: tokenRow } = await sc
      .from('appointments')
      .select('cancel_token')
      .eq('id', appt.id)
      .maybeSingle();
    const cancelUrl = `${publicUrl}/cancel/${tokenRow?.cancel_token}`;

    // WhatsApp reminder
    if (patient.phone) {
      await sc.functions.invoke('send-whatsapp', {
        body: {
          to: patient.phone,
          template_id: 'appointment_reminder_24h',
          params: [dateStr, timeStr, tenant.name],
          tenant_id: appt.tenant_id,
          appointment_id: appt.id,
        },
      });
    }

    // Email reminder
    if (patient.email) {
      await sc.functions.invoke('send-email', {
        body: {
          to: patient.email,
          type: 'appointment_reminder',
          tenant_id: appt.tenant_id,
          params: {
            patient_name: `${patient.first_name} ${patient.last_name}`,
            clinic_name:  tenant.name,
            date:         dateStr,
            time:         timeStr,
            cancel_url:   cancelUrl,
          },
        },
      });
    }

    sent++;
  }

  return new Response(JSON.stringify({ sent, total: appointments?.length ?? 0 }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
