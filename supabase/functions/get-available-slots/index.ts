import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const tenantSlug = url.searchParams.get('tenant');
    const date = url.searchParams.get('date');        // YYYY-MM-DD
    const doctorId = url.searchParams.get('doctor');  // optional UUID

    if (!tenantSlug || !date) {
      return new Response(
        JSON.stringify({ error: 'Missing required params: tenant, date' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Resolve tenant_id from slug via landing page table
    const { data: lpRow } = await supabase
      .from('tenant_landing_pages')
      .select('tenant_id')
      .eq('slug', tenantSlug)
      .eq('is_published', true)
      .single();

    if (!lpRow) {
      return new Response(
        JSON.stringify({ error: 'Clinic not found or page not published' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: slots, error } = await supabase.rpc('get_available_slots', {
      p_tenant_id: lpRow.tenant_id,
      p_date: date,
      ...(doctorId ? { p_doctor_id: doctorId } : {}),
    });

    if (error) throw error;

    return new Response(
      JSON.stringify({ slots: slots ?? [] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
