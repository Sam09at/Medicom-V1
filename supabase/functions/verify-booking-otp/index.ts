import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function hashOTP(otp: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(otp);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json() as {
      hold_id: string;
      otp: string;
      patient_name: string;
      service_id?: string;
    };

    const { hold_id, otp, patient_name, service_id } = body;

    if (!hold_id || !otp || !patient_name) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Fetch hold
    const { data: hold } = await supabase
      .from('public_booking_holds')
      .select('*')
      .eq('id', hold_id)
      .maybeSingle();

    if (!hold) {
      return new Response(
        JSON.stringify({ error: 'Code expiré ou introuvable. Veuillez recommencer.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check expiry
    if (new Date(hold.expires_at) < new Date()) {
      await supabase.from('public_booking_holds').delete().eq('id', hold_id);
      return new Response(
        JSON.stringify({ error: 'Le code a expiré. Veuillez recommencer depuis le début.' }),
        { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check attempt limit
    if ((hold.otp_attempts ?? 0) >= 3) {
      return new Response(
        JSON.stringify({ error: 'Trop de tentatives. Veuillez contacter la clinique directement.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify OTP hash
    const inputHash = await hashOTP(otp.trim());
    if (inputHash !== hold.otp_hash) {
      // Increment attempt counter
      await supabase
        .from('public_booking_holds')
        .update({ otp_attempts: (hold.otp_attempts ?? 0) + 1 })
        .eq('id', hold_id);

      const remaining = 3 - ((hold.otp_attempts ?? 0) + 1);
      return new Response(
        JSON.stringify({ error: `Code incorrect. ${remaining} tentative(s) restante(s).` }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // OTP valid — find or create patient, then create appointment
    // 1. Find the clinic's default doctor
    const { data: doctor } = await supabase
      .from('users')
      .select('id')
      .eq('tenant_id', hold.tenant_id)
      .eq('role', 'doctor')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    // 2. Create or upsert patient (by whatsapp number)
    const nameParts = patient_name.trim().split(' ');
    const firstName = nameParts[0] ?? patient_name;
    const lastName = nameParts.slice(1).join(' ') || '-';

    const { data: existingPatient } = await supabase
      .from('patients')
      .select('id')
      .eq('tenant_id', hold.tenant_id)
      .eq('phone', hold.whatsapp_number)
      .maybeSingle();

    let patientId: string;

    if (existingPatient) {
      patientId = existingPatient.id;
    } else {
      const { data: newPatient, error: patientError } = await supabase
        .from('patients')
        .insert({
          tenant_id: hold.tenant_id,
          first_name: firstName,
          last_name: lastName,
          phone: hold.whatsapp_number,
          source: 'public_booking',
        })
        .select('id')
        .single();

      if (patientError || !newPatient) throw patientError ?? new Error('Failed to create patient');
      patientId = newPatient.id;
    }

    // 3. Create appointment
    const { data: appointment, error: apptError } = await supabase
      .from('appointments')
      .insert({
        tenant_id: hold.tenant_id,
        patient_id: patientId,
        doctor_id: doctor?.id,
        start_time: hold.slot_start,
        end_time: hold.slot_end,
        status: 'pending',
        source: 'public_booking',
        title: `RDV ${patient_name}`,
        ...(service_id ? { service_id } : {}),
      })
      .select('id, start_time, end_time')
      .single();

    if (apptError || !appointment) throw apptError ?? new Error('Failed to create appointment');

    // 4. Delete the hold
    await supabase.from('public_booking_holds').delete().eq('id', hold_id);

    // 5. Send confirmation WhatsApp
    const { data: tenant } = await supabase
      .from('tenants')
      .select('name')
      .eq('id', hold.tenant_id)
      .single();

    const slotDate = new Date(hold.slot_start).toLocaleDateString('fr-MA', {
      weekday: 'long', day: 'numeric', month: 'long',
    });
    const slotTime = new Date(hold.slot_start).toLocaleTimeString('fr-MA', {
      hour: '2-digit', minute: '2-digit',
    });

    const sendWaUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-whatsapp`;
    await fetch(sendWaUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({
        to: hold.whatsapp_number,
        template_id: 'appointment_confirmation',
        params: [tenant?.name ?? 'notre cabinet', slotDate, slotTime, appointment.id.slice(0, 8).toUpperCase()],
        tenant_id: hold.tenant_id,
        appointment_id: appointment.id,
      }),
    });

    return new Response(
      JSON.stringify({
        appointment_id: appointment.id,
        slot_start: appointment.start_time,
        slot_end: appointment.end_time,
        clinic_name: tenant?.name,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
