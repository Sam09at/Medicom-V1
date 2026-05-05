import React from 'react';
import type { PageSection } from '../../types';
import type {
  HeroContent, AboutContent, ServicesContent, DoctorsContent,
  BookingContent, BookingWidgetContent, TestimonialsContent, FAQContent, ContactContent, HoursContent,
  ServicesItem, DoctorsItem, TestimonialsItem, FAQItem,
} from './sectionConfig';

interface Props {
  section: PageSection | null;
  onChange: (id: string, content: Record<string, unknown>) => void;
}

// ─── Shared field components ──────────────────────────────────────────────────

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest">{label}</label>
    {children}
  </div>
);

const inputCls = 'w-full px-3 py-2 text-sm border border-[#3a3a3a] rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-[#252525] text-slate-200 placeholder:text-slate-600 transition-shadow';
const textareaCls = `${inputCls} resize-none`;

function Input({ value, onChange, placeholder, type = 'text' }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return <input type={type} className={inputCls} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />;
}

function Textarea({ value, onChange, placeholder, rows = 3 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return <textarea className={textareaCls} rows={rows} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />;
}

function SectionHeading({ label }: { label: string }) {
  return <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pb-3 border-b border-[#2a2a2a]">{label}</h3>;
}

function AddBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full py-2 border-2 border-dashed border-[#3a3a3a] rounded-lg text-[12px] font-semibold text-slate-500 hover:border-blue-500 hover:text-blue-400 transition-colors">
      + {label}
    </button>
  );
}

function ItemCard({ children, onDelete }: { children: React.ReactNode; onDelete: () => void }) {
  return (
    <div className="relative group bg-[#1e1e1e] border border-[#333] rounded-xl p-3 space-y-2">
      {children}
      <button
        onClick={onDelete}
        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#2a2a2a] border border-[#3a3a3a] text-slate-500 hover:text-rose-400 hover:border-rose-500/30 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
    </div>
  );
}

// ─── Hero editor ──────────────────────────────────────────────────────────────

function HeroEditor({ section, update }: { section: PageSection; update: (c: Partial<HeroContent>) => void }) {
  const c = section.content as unknown as HeroContent;
  return (
    <div className="space-y-4">
      <SectionHeading label="Bannière principale" />
      <Field label="Titre principal"><Input value={c.headline} onChange={v => update({ headline: v })} placeholder="Cabinet Dentaire Excellence" /></Field>
      <Field label="Sous-titre"><Textarea value={c.subheadline} onChange={v => update({ subheadline: v })} placeholder="Des soins de qualité..." rows={2} /></Field>
      <Field label="Texte du bouton CTA"><Input value={c.ctaText} onChange={v => update({ ctaText: v })} placeholder="Prendre rendez-vous" /></Field>
      <Field label="Image de fond (URL)"><Input value={c.backgroundImage} onChange={v => update({ backgroundImage: v })} placeholder="https://..." type="url" /></Field>
      <Field label={`Opacité de l'overlay : ${c.overlayOpacity ?? 50}%`}>
        <input type="range" min={0} max={90} step={5} value={c.overlayOpacity ?? 50} onChange={e => update({ overlayOpacity: Number(e.target.value) })} className="w-full accent-blue-600" />
      </Field>
    </div>
  );
}

// ─── About editor ─────────────────────────────────────────────────────────────

function AboutEditor({ section, update }: { section: PageSection; update: (c: Partial<AboutContent>) => void }) {
  const c = section.content as unknown as AboutContent;
  return (
    <div className="space-y-4">
      <SectionHeading label="À propos" />
      <Field label="Titre de section"><Input value={c.heading} onChange={v => update({ heading: v })} placeholder="Notre Cabinet" /></Field>
      <Field label="Texte"><Textarea value={c.body} onChange={v => update({ body: v })} placeholder="Présentation du cabinet..." rows={5} /></Field>
      <Field label="Photo (URL)"><Input value={c.imageUrl} onChange={v => update({ imageUrl: v })} placeholder="https://..." type="url" /></Field>
      <Field label="Position de l'image">
        <select className={inputCls} value={c.imagePosition ?? 'right'} onChange={e => update({ imagePosition: e.target.value as 'left' | 'right' })}>
          <option value="right">À droite</option>
          <option value="left">À gauche</option>
        </select>
      </Field>
    </div>
  );
}

// ─── Services editor ──────────────────────────────────────────────────────────

function ServicesEditor({ section, update }: { section: PageSection; update: (c: Partial<ServicesContent>) => void }) {
  const c = section.content as unknown as ServicesContent;
  const items = c.items ?? [];
  function updateItem(id: string, patch: Partial<ServicesItem>) {
    update({ items: items.map(it => it.id === id ? { ...it, ...patch } : it) });
  }
  function addItem() {
    update({ items: [...items, { id: `s${Date.now()}`, icon: '🦷', title: 'Nouveau soin', description: '' }] });
  }
  return (
    <div className="space-y-4">
      <SectionHeading label="Services" />
      <Field label="Titre de section"><Input value={c.heading} onChange={v => update({ heading: v })} placeholder="Nos Services" /></Field>
      <div className="space-y-3">
        {items.map(item => (
          <ItemCard key={item.id} onDelete={() => update({ items: items.filter(i => i.id !== item.id) })}>
            <div className="flex gap-2">
              <Input value={item.icon} onChange={v => updateItem(item.id, { icon: v })} placeholder="🦷" />
              <Input value={item.title} onChange={v => updateItem(item.id, { title: v })} placeholder="Nom du soin" />
            </div>
            <Input value={item.description} onChange={v => updateItem(item.id, { description: v })} placeholder="Courte description" />
          </ItemCard>
        ))}
        <AddBtn label="Ajouter un service" onClick={addItem} />
      </div>
    </div>
  );
}

// ─── Doctors editor ───────────────────────────────────────────────────────────

function DoctorsEditor({ section, update }: { section: PageSection; update: (c: Partial<DoctorsContent>) => void }) {
  const c = section.content as unknown as DoctorsContent;
  const items = c.items ?? [];
  function updateItem(id: string, patch: Partial<DoctorsItem>) {
    update({ items: items.map(it => it.id === id ? { ...it, ...patch } : it) });
  }
  function addItem() {
    update({ items: [...items, { id: `d${Date.now()}`, name: 'Dr. Nouveau', title: 'Chirurgien-dentiste', photoUrl: '', bio: '' }] });
  }
  return (
    <div className="space-y-4">
      <SectionHeading label="Équipe médicale" />
      <Field label="Titre de section"><Input value={c.heading} onChange={v => update({ heading: v })} placeholder="Notre Équipe" /></Field>
      <div className="space-y-3">
        {items.map(item => (
          <ItemCard key={item.id} onDelete={() => update({ items: items.filter(i => i.id !== item.id) })}>
            <Input value={item.name} onChange={v => updateItem(item.id, { name: v })} placeholder="Nom complet" />
            <Input value={item.title} onChange={v => updateItem(item.id, { title: v })} placeholder="Spécialité" />
            <Input value={item.photoUrl} onChange={v => updateItem(item.id, { photoUrl: v })} placeholder="URL photo" type="url" />
            <Textarea value={item.bio} onChange={v => updateItem(item.id, { bio: v })} placeholder="Courte biographie..." rows={2} />
          </ItemCard>
        ))}
        <AddBtn label="Ajouter un praticien" onClick={addItem} />
      </div>
    </div>
  );
}

// ─── Booking editor ───────────────────────────────────────────────────────────

function BookingEditor({ section, update }: { section: PageSection; update: (c: Partial<BookingContent>) => void }) {
  const c = section.content as unknown as BookingContent;
  return (
    <div className="space-y-4">
      <SectionHeading label="Prise de rendez-vous" />
      <Field label="Titre"><Input value={c.heading} onChange={v => update({ heading: v })} placeholder="Prenez rendez-vous" /></Field>
      <Field label="Texte"><Textarea value={c.body} onChange={v => update({ body: v })} placeholder="Disponible du lundi au samedi..." rows={2} /></Field>
      <Field label="Texte du bouton"><Input value={c.buttonText} onChange={v => update({ buttonText: v })} placeholder="Appeler maintenant" /></Field>
      <Field label="Téléphone"><Input value={c.phone} onChange={v => update({ phone: v })} placeholder="+212 6XX XXX XXX" type="tel" /></Field>
    </div>
  );
}

// ─── Booking widget editor ────────────────────────────────────────────────────

function BookingWidgetEditor({ section, update }: { section: PageSection; update: (c: Partial<BookingWidgetContent>) => void }) {
  const c = section.content as unknown as BookingWidgetContent;
  return (
    <div className="space-y-4">
      <SectionHeading label="Widget de réservation en ligne" />
      <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-4 py-3">
        <p className="text-xs font-semibold text-indigo-300 mb-1">📅 Formulaire de RDV intégré</p>
        <p className="text-[11px] text-indigo-400/80 leading-relaxed">Ce bloc affiche un calendrier interactif et un formulaire de réservation directement dans la page, sans ouvrir de popup.</p>
      </div>
      <Field label="Titre"><Input value={c.heading} onChange={v => update({ heading: v })} placeholder="Prendre rendez-vous en ligne" /></Field>
      <Field label="Sous-titre"><Textarea value={c.body} onChange={v => update({ body: v })} placeholder="Sélectionnez un créneau disponible..." rows={2} /></Field>
    </div>
  );
}

// ─── Testimonials editor ──────────────────────────────────────────────────────

function TestimonialsEditor({ section, update }: { section: PageSection; update: (c: Partial<TestimonialsContent>) => void }) {
  const c = section.content as unknown as TestimonialsContent;
  const items = c.items ?? [];
  function updateItem(id: string, patch: Partial<TestimonialsItem>) {
    update({ items: items.map(it => it.id === id ? { ...it, ...patch } : it) });
  }
  function addItem() {
    update({ items: [...items, { id: `t${Date.now()}`, author: 'Nouveau Patient', role: '', text: '', rating: 5 }] });
  }
  return (
    <div className="space-y-4">
      <SectionHeading label="Avis patients" />
      <Field label="Titre de section"><Input value={c.heading} onChange={v => update({ heading: v })} placeholder="Ce que disent nos patients" /></Field>
      <div className="space-y-3">
        {items.map(item => (
          <ItemCard key={item.id} onDelete={() => update({ items: items.filter(i => i.id !== item.id) })}>
            <div className="flex gap-2">
              <Input value={item.author} onChange={v => updateItem(item.id, { author: v })} placeholder="Nom" />
              <Input value={item.role} onChange={v => updateItem(item.id, { role: v })} placeholder="Rôle (optionnel)" />
            </div>
            <Textarea value={item.text} onChange={v => updateItem(item.id, { text: v })} placeholder="Témoignage..." rows={2} />
            <Field label={`Note : ${'⭐'.repeat(item.rating)}`}>
              <input type="range" min={1} max={5} step={1} value={item.rating} onChange={e => updateItem(item.id, { rating: Number(e.target.value) })} className="w-full accent-amber-500" />
            </Field>
          </ItemCard>
        ))}
        <AddBtn label="Ajouter un avis" onClick={addItem} />
      </div>
    </div>
  );
}

// ─── FAQ editor ───────────────────────────────────────────────────────────────

function FAQEditor({ section, update }: { section: PageSection; update: (c: Partial<FAQContent>) => void }) {
  const c = section.content as unknown as FAQContent;
  const items = c.items ?? [];
  function updateItem(id: string, patch: Partial<FAQItem>) {
    update({ items: items.map(it => it.id === id ? { ...it, ...patch } : it) });
  }
  function addItem() {
    update({ items: [...items, { id: `f${Date.now()}`, question: 'Nouvelle question ?', answer: '' }] });
  }
  return (
    <div className="space-y-4">
      <SectionHeading label="FAQ" />
      <Field label="Titre de section"><Input value={c.heading} onChange={v => update({ heading: v })} placeholder="Questions fréquentes" /></Field>
      <div className="space-y-3">
        {items.map(item => (
          <ItemCard key={item.id} onDelete={() => update({ items: items.filter(i => i.id !== item.id) })}>
            <Input value={item.question} onChange={v => updateItem(item.id, { question: v })} placeholder="Question ?" />
            <Textarea value={item.answer} onChange={v => updateItem(item.id, { answer: v })} placeholder="Réponse..." rows={2} />
          </ItemCard>
        ))}
        <AddBtn label="Ajouter une question" onClick={addItem} />
      </div>
    </div>
  );
}

// ─── Contact editor ───────────────────────────────────────────────────────────

function ContactEditor({ section, update }: { section: PageSection; update: (c: Partial<ContactContent>) => void }) {
  const c = section.content as unknown as ContactContent;
  return (
    <div className="space-y-4">
      <SectionHeading label="Contact" />
      <Field label="Titre de section"><Input value={c.heading} onChange={v => update({ heading: v })} placeholder="Nous contacter" /></Field>
      <Field label="Téléphone"><Input value={c.phone} onChange={v => update({ phone: v })} placeholder="+212 6XX XXX XXX" type="tel" /></Field>
      <Field label="Email"><Input value={c.email} onChange={v => update({ email: v })} placeholder="contact@cabinet.ma" type="email" /></Field>
      <Field label="Adresse"><Textarea value={c.address} onChange={v => update({ address: v })} placeholder="123 Rue Mohammed V..." rows={2} /></Field>
      <Field label="Lien Google Maps"><Input value={c.googleMapsUrl} onChange={v => update({ googleMapsUrl: v })} placeholder="https://maps.google.com/..." type="url" /></Field>
    </div>
  );
}

// ─── Hours editor ─────────────────────────────────────────────────────────────

function HoursEditor({ section, update }: { section: PageSection; update: (c: Partial<HoursContent>) => void }) {
  const c = section.content as unknown as HoursContent;
  const schedule = c.schedule ?? [];
  function updateRow(id: string, patch: Partial<typeof schedule[0]>) {
    update({ schedule: schedule.map(r => r.id === id ? { ...r, ...patch } : r) });
  }
  return (
    <div className="space-y-4">
      <SectionHeading label="Horaires" />
      <Field label="Titre de section"><Input value={c.heading} onChange={v => update({ heading: v })} placeholder="Nos Horaires" /></Field>
      <div className="space-y-2">
        {schedule.map(row => (
          <div key={row.id} className="flex items-center gap-2">
            <span className="text-[12px] font-semibold text-slate-400 w-24 shrink-0">{row.day}</span>
            <label className="flex items-center gap-1 text-[11px] text-slate-500 shrink-0 cursor-pointer">
              <input type="checkbox" checked={row.closed} onChange={e => updateRow(row.id, { closed: e.target.checked })} className="rounded" />
              Fermé
            </label>
            {!row.closed && (
              <input
                type="text"
                className="flex-1 px-2 py-1 text-[12px] border border-[#3a3a3a] rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#252525] text-slate-200 placeholder:text-slate-600"
                value={row.hours}
                onChange={e => updateRow(row.id, { hours: e.target.value })}
                placeholder="09:00 – 18:00"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export const SectionEditorPanel: React.FC<Props> = ({ section, onChange }) => {
  if (!section) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-8">
        <div className="w-12 h-12 bg-[#222] rounded-xl flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-slate-400">Sélectionnez une section</p>
        <p className="text-xs text-slate-600 mt-1 max-w-[16rem]">Cliquez sur une section dans le canvas pour éditer son contenu.</p>
      </div>
    );
  }

  function update(partial: Record<string, unknown>) {
    onChange(section!.id, { ...section!.content, ...partial });
  }

  const editorProps = { section, update: update as any };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto p-5 space-y-4">
        {section.type === 'hero'         && <HeroEditor         {...editorProps} />}
        {section.type === 'about'        && <AboutEditor        {...editorProps} />}
        {section.type === 'services'     && <ServicesEditor     {...editorProps} />}
        {section.type === 'doctors'      && <DoctorsEditor      {...editorProps} />}
        {section.type === 'booking'        && <BookingEditor       {...editorProps} />}
        {section.type === 'booking_widget' && <BookingWidgetEditor {...editorProps} />}
        {section.type === 'testimonials' && <TestimonialsEditor {...editorProps} />}
        {section.type === 'faq'          && <FAQEditor          {...editorProps} />}
        {section.type === 'contact'      && <ContactEditor      {...editorProps} />}
        {section.type === 'hours'        && <HoursEditor        {...editorProps} />}
      </div>
    </div>
  );
};
