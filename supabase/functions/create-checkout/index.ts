import Stripe from 'npm:stripe@14';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!);

const PRICE_IDS: Record<string, string> = {
  essentiel: Deno.env.get('STRIPE_PRICE_ESSENTIEL') ?? '',
  pro:        Deno.env.get('STRIPE_PRICE_PRO') ?? '',
  premium:    Deno.env.get('STRIPE_PRICE_PREMIUM') ?? '',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    });
  }

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { tenant_id, plan_tier } = await req.json() as { tenant_id: string; plan_tier: string };

    if (!PRICE_IDS[plan_tier]) {
      return new Response(JSON.stringify({ error: 'Invalid plan_tier' }), { status: 400 });
    }

    // Get or create Stripe customer for this tenant
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: tenant } = await serviceClient
      .from('tenants')
      .select('stripe_customer_id, billing_email, name')
      .eq('id', tenant_id)
      .single();

    let customerId = tenant?.stripe_customer_id as string | undefined;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: tenant?.billing_email ?? user.email,
        name: tenant?.name,
        metadata: { tenant_id, supabase_user_id: user.id },
      });
      customerId = customer.id;
      await serviceClient
        .from('tenants')
        .update({ stripe_customer_id: customerId })
        .eq('id', tenant_id);
    }

    const appUrl = Deno.env.get('APP_URL') ?? 'https://app.medicom.ma';
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: PRICE_IDS[plan_tier], quantity: 1 }],
      success_url: `${appUrl}/app/settings?tab=subscription&success=true`,
      cancel_url: `${appUrl}/app/settings?tab=subscription`,
      subscription_data: {
        metadata: { tenant_id, plan_tier },
      },
      allow_promotion_codes: true,
    });

    return new Response(JSON.stringify({ checkout_url: session.url }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err) {
    console.error('create-checkout error:', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
