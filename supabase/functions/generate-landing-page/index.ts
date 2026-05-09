import Anthropic from 'npm:@anthropic-ai/sdk@0.30';
import { createClient } from 'jsr:@supabase/supabase-js@2';

interface LandingPageIntake {
  clinicName: string;
  specialty: string;
  city: string;
  neighborhood?: string;
  mainServices: string[];
  doctorName: string;
  doctorTitle: string;
  doctorYears: number;
  differentiator: string;
  phone?: string;
  address?: string;
}

interface GeneratedSection {
  type: string;
  content: Record<string, unknown>;
}

const client = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') });

const SYSTEM_PROMPT = `Tu es un expert en marketing médical au Maroc, spécialisé dans la création de sites web pour cliniques.
Génère le contenu JSON pour une page de destination de cabinet médical.
Réponds UNIQUEMENT avec un objet JSON valide, sans texte avant ni après.
Le contenu doit être en français, professionnel, chaleureux et optimisé pour le SEO local marocain.
Utilise des formulations authentiques et évite le jargon marketing trop agressif.`;

function buildPrompt(intake: LandingPageIntake): string {
  return `Génère une landing page complète pour :
Cabinet : ${intake.clinicName}
Spécialité : ${intake.specialty}
Ville : ${intake.city}${intake.neighborhood ? `, ${intake.neighborhood}` : ''}
Services : ${intake.mainServices.join(', ')}
Médecin : ${intake.doctorTitle} ${intake.doctorName} (${intake.doctorYears} ans d'expérience)
Argument clé : ${intake.differentiator}
${intake.phone ? `Téléphone : ${intake.phone}` : ''}
${intake.address ? `Adresse : ${intake.address}` : ''}

Génère un JSON avec cette structure exacte :
{
  "hero": {
    "headline": "...",
    "subheadline": "...",
    "cta_primary": "Prendre rendez-vous",
    "cta_secondary": "Découvrir nos soins",
    "badge": "..."
  },
  "about": {
    "title": "...",
    "text": "...",
    "highlights": ["...", "...", "..."]
  },
  "services": {
    "title": "Nos soins & services",
    "items": [
      { "name": "...", "description": "...", "icon": "tooth" },
      { "name": "...", "description": "...", "icon": "shield" }
    ]
  },
  "doctors": {
    "title": "Notre équipe",
    "items": [
      {
        "name": "${intake.doctorTitle} ${intake.doctorName}",
        "title": "${intake.doctorTitle}",
        "bio": "...",
        "years_experience": ${intake.doctorYears}
      }
    ]
  },
  "testimonials": {
    "title": "Ce que disent nos patients",
    "items": [
      { "name": "Patiente satisfaite", "text": "...", "rating": 5 },
      { "name": "Patient régulier", "text": "...", "rating": 5 },
      { "name": "Nouveau patient", "text": "...", "rating": 5 }
    ]
  },
  "faq": {
    "title": "Questions fréquentes",
    "items": [
      { "question": "...", "answer": "..." },
      { "question": "...", "answer": "..." },
      { "question": "...", "answer": "..." }
    ]
  },
  "contact": {
    "title": "Nous contacter",
    "address": "${intake.address ?? ''}",
    "phone": "${intake.phone ?? ''}",
    "hours": "Lundi–Vendredi 9h–18h, Samedi 9h–13h"
  },
  "seo": {
    "title": "...",
    "description": "...",
    "keywords": ["...", "...", "..."]
  }
}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' },
    });
  }

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await anonClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { intake, tenant_id, landing_page_id } = await req.json() as {
      intake: LandingPageIntake;
      tenant_id: string;
      landing_page_id: string;
    };

    // Generate content via Claude Opus 4.7
    const message = await client.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildPrompt(intake) }],
    });

    const rawText = (message.content[0] as { type: string; text: string }).text;

    // Parse JSON — strip any markdown fences if present
    const jsonStr = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    const generated = JSON.parse(jsonStr) as Record<string, unknown>;

    // Map generated sections to page_sections rows
    const SECTION_ORDER: Record<string, number> = {
      hero: 0, about: 1, services: 2, doctors: 3,
      booking: 4, testimonials: 5, faq: 6, contact: 7,
    };

    const sc = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const sections: GeneratedSection[] = Object.entries(generated)
      .filter(([k]) => k !== 'seo')
      .map(([type, content]) => ({ type, content: content as Record<string, unknown> }));

    // Delete existing sections for this page, then insert new ones
    await sc.from('page_sections').delete().eq('landing_page_id', landing_page_id);

    const rows = sections.map((s) => ({
      landing_page_id,
      type: s.type,
      content: s.content,
      position: SECTION_ORDER[s.type] ?? 99,
      visible: true,
    }));

    const { error: insertErr } = await sc.from('page_sections').insert(rows);
    if (insertErr) throw insertErr;

    // Update landing page SEO from generated.seo
    const seo = generated.seo as Record<string, string> | undefined;
    if (seo) {
      await sc.from('landing_pages').update({
        seo_title:       seo.title,
        seo_description: seo.description,
      }).eq('id', landing_page_id);
    }

    return new Response(JSON.stringify({ sections: rows, seo }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err) {
    console.error('[generate-landing-page] error:', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
