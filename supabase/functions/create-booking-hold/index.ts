import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

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
      tenant_slug: string;
      slot_start: string;   // ISO timestamp
      slot_end: string;     // ISO timestamp
      whatsapp_number: string;
      patient_name: string;
    };

    const { tenant_slug, slot_start, slot_end, whatsapp_number, patient_name } = body;

    if (!tenant_slug || !slot_start || !slot_end || !whatsapp_number || !patient_name) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Resolve tenant_id
    const { data: lpRow } = await supabase
      .from('tenant_landing_pages')
      .select('tenant_id, headline')
      .eq('slug', tenant_slug)
      .eq('is_published', true)
      .single();

    if (!lpRow) {
      return new Response(
        JSON.stringify({ error: 'Clinic not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check the slot is still available before creating a hold
    const { data: conflict } = await supabase
      .from('public_booking_holds')
      .select('id')
      .eq('tenant_id', lpRow.tenant_id)
      .eq('slot_start', slot_start)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (conflict) {
      return new Response(
        JSON.stringify({ error: 'Ce créneau vient d\'être réservé. Veuillez en choisir un autre.' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate OTP and hash it (SHA-256 — lightweight, no bcrypt in Deno edge)
    const otp = generateOTP();
    const otpHash = await hashOTP(otp);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    // Create hold
    const { data: hold, error: holdError } = await supabase
      .from('public_booking_holds')
      .insert({
        tenant_id: lpRow.tenant_id,
        slot_start,
        slot_end,
        whatsapp_number,
        patient_name,
        otp_hash: otpHash,
        expires_at: expiresAt,
      })
      .select('id, expires_at')
      .single();

    if (holdError || !hold) throw holdError ?? new Error('Failed to create hold');

    // Send OTP via WhatsApp (calls send-whatsapp edge function internally)
    const sendWaUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-whatsapp`;
    await fetch(sendWaUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({
        to: whatsapp_number,
        template_id: 'otp_verification',
        params: [otp],
        tenant_id: lpRow.tenant_id,
      }),
    });

    return new Response(
      JSON.stringify({ hold_id: hold.id, expires_at: hold.expires_at }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
