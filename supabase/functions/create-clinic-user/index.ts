import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  clinic_name: string;
  plan: 'starter' | 'pro' | 'premium';
  admin_email: string;
  admin_password: string;
  admin_name: string;
  admin_role: 'clinic_admin' | 'doctor' | 'staff';
  phone?: string;
  location?: string;
  region?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Only super_admin callers — verify via the caller's JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Admin client (service_role) — needed to create auth users
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Verify the caller is a super_admin
    const callerToken = authHeader.replace('Bearer ', '');
    const { data: { user: caller }, error: callerErr } = await admin.auth.getUser(callerToken);
    if (callerErr || !caller) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: callerProfile } = await admin
      .from('users')
      .select('role')
      .eq('id', caller.id)
      .single();

    if (callerProfile?.role !== 'super_admin') {
      return new Response(JSON.stringify({ error: 'Forbidden: super_admin only' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body: RequestBody = await req.json();
    const { clinic_name, plan, admin_email, admin_password, admin_name, admin_role, phone, location, region } = body;

    if (!clinic_name || !admin_email || !admin_password || !admin_name) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── 1. Create tenant ────────────────────────────────────────────────────
    // Try live-DB column names first, fall back to migration-file names
    const tenantInsert: Record<string, unknown> = {
      name: clinic_name,
      status: 'active',
    };

    // Detect schema by checking which column exists
    const { data: tenantCols } = await admin.rpc('column_exists', {
      p_table: 'tenants', p_column: 'plan'
    }).single().catch(() => ({ data: null }));

    if (tenantCols !== false) {
      // live-DB schema
      tenantInsert.plan = plan ?? 'starter';
    } else {
      // migration-file schema
      tenantInsert.plan_tier = plan ?? 'starter';
    }

    if (phone) tenantInsert.phone = phone;
    if (location) tenantInsert.location = location;
    if (region) tenantInsert.region = region;

    const { data: tenant, error: tenantErr } = await admin
      .from('tenants')
      .insert(tenantInsert)
      .select('id, name')
      .single();

    if (tenantErr || !tenant) {
      throw new Error(`Failed to create tenant: ${tenantErr?.message}`);
    }

    // ── 2. Create auth user ──────────────────────────────────────────────────
    const { data: authData, error: authErr } = await admin.auth.admin.createUser({
      email: admin_email,
      password: admin_password,
      email_confirm: true, // skip confirmation email
      user_metadata: {
        tenant_id: tenant.id,
        role: admin_role ?? 'clinic_admin',
      },
    });

    if (authErr || !authData.user) {
      // Rollback tenant
      await admin.from('tenants').delete().eq('id', tenant.id);
      throw new Error(`Failed to create auth user: ${authErr?.message}`);
    }

    // ── 3. Create public.users profile ──────────────────────────────────────
    const userInsert: Record<string, unknown> = {
      id: authData.user.id,
      tenant_id: tenant.id,
      role: admin_role ?? 'clinic_admin',
      email: admin_email,
      status: 'active',
    };

    // Detect which name columns exist
    const hasNameCol = true; // assume live-DB schema; graceful on conflict
    if (hasNameCol) {
      userInsert.name = admin_name;
      userInsert.full_name = admin_name;
      userInsert.clinic_name = clinic_name;
    } else {
      const parts = admin_name.trim().split(' ');
      userInsert.first_name = parts[0];
      userInsert.last_name = parts.slice(1).join(' ') || '';
      userInsert.is_active = true;
    }

    const { error: profileErr } = await admin
      .from('users')
      .insert(userInsert);

    if (profileErr) {
      // Try with migration-file columns if live-DB insert failed
      const fallback: Record<string, unknown> = {
        id: authData.user.id,
        tenant_id: tenant.id,
        role: admin_role ?? 'clinic_admin',
        email: admin_email,
        is_active: true,
      };
      const parts = admin_name.trim().split(' ');
      fallback.first_name = parts[0];
      fallback.last_name = parts.slice(1).join(' ') || '';
      await admin.from('users').insert(fallback);
    }

    return new Response(
      JSON.stringify({
        success: true,
        tenant_id: tenant.id,
        tenant_name: tenant.name,
        user_id: authData.user.id,
        email: admin_email,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('[create-clinic-user]', err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
