# CRM Guided Sales Playbook Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task.

**Goal:** Reduce friction by providing 1-click execution for high-velocity outbound calls and emails. Inject dynamic Objection Handling scripts directly into the Lead detail SlideOver.

**Files:** `features/CRM.tsx`, `hooks/useCRM.ts`.

---

### Task 1: Enhance `useCRM` Hooks & Mocks for Phone/Email

**Files:**
- Modify: `hooks/useCRM.ts`

**Step 1:** Add robust `phone` and `email` properties to the `FALLBACK_PROSPECTS` to ensure the mock data allows trying out the `mailto:` and `tel:` links.

```ts
// Update FALLBACK_PROSPECTS in hooks/useCRM.ts
// E.g.
  {
    id: '1',
    clinicName: 'Cabinet Dentaire Targa',
    // ...
    email: 'contact@targa.ma',
    phone: '+212600112233',
  },
// Do for a few prospects
```

**Step 2:** Ensure type safety.

---

### Task 2: Enhance Rapid Logging Actions with Protocol Links

**Files:**
- Modify: `features/CRM.tsx`

**Step 1:** Modify the `logRapidAction` function.

```tsx
  const logRapidAction = async (type: 'call' | 'email' | 'meeting') => {
    if (!selectedProspect) return;
    try {
      // Trigger execution protocol
      if (type === 'call' && selectedProspect.phone) {
        window.open(`tel:${selectedProspect.phone}`, '_self');
      } else if (type === 'email' && selectedProspect.email) {
        const subject = encodeURIComponent('Medicom - Votre cabinet digital');
        const body = encodeURIComponent(`Bonjour ${selectedProspect.contactName},\n\nJ'aimerais discuter de la plateforme Medicom SaaS avec vous...`);
        window.open(`mailto:${selectedProspect.email}?subject=${subject}&body=${body}`, '_blank');
      }
      
      // Keep existing logic
      await logActivity(selectedProspect.id, type, `Rapid action logged: ${type}`);
      // ... same status forwarding and metrics
```

**Step 2:** Ensure UI buttons check for existence.
Update the button rendering to handle disabled state if `phone` or `email` are missing, or at least show a toast if missing. (Can wrap inside `logRapidAction`).

```tsx
      if (type === 'call' && !selectedProspect.phone) {
          alert("Pas de numéro de téléphone renseigné !");
          return;
      }
```

---

### Task 3: Build Script Playbook UI

**Files:**
- Modify: `features/CRM.tsx`

**Step 1:** Add state for the active script tab.
Inside the CRM module (or inline within the SlideOver rendering):
```tsx
const [activeScript, setActiveScript] = useState<'pitch' | 'price' | 'timing'>('pitch');
```

**Step 2:** Add the Script component rendering inside the `<SlideOver>` below the Rapid Logging section.

```tsx
          {/* Below the Rapid Logging Box */}
          <div className="bg-white border-b border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                 <h3 className="text-[13px] font-bold text-slate-900 tracking-tight">Guided Playbook</h3>
                 <div className="flex bg-slate-100 rounded-[6px] p-1">
                    <button 
                      onClick={() => setActiveScript('pitch')}
                      className={`text-[12px] px-3 py-1 rounded-[4px] font-medium transition-colors ${activeScript === 'pitch' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Elevator Pitch
                    </button>
                    <button 
                      onClick={() => setActiveScript('price')}
                      className={`text-[12px] px-3 py-1 rounded-[4px] font-medium transition-colors ${activeScript === 'price' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Objection: Prix
                    </button>
                    <button 
                      onClick={() => setActiveScript('timing')}
                      className={`text-[12px] px-3 py-1 rounded-[4px] font-medium transition-colors ${activeScript === 'timing' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Objection: Pas le temps
                    </button>
                 </div>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-[8px] p-4 font-mono text-[13px] text-slate-700 leading-relaxed whitespace-pre-wrap">
                 {activeScript === 'pitch' && `Bonjour ${selectedProspect.contactName},\n\nJe suis de Medicom. J'appelle car nous aidons les cabinets à Targa à digitaliser leur gestion sans changer la manière dont le médecin travaille.\n\nEtes-vous la bonne personne pour parler d'une plateforme qui gère les dossiers et RDV automatiquement ?`}

                 {activeScript === 'price' && `Je comprends. Si on regarde le temps gagné sur les RDV manqués et la paperasse, le système s'autofinance en récupérant 2 consultations par mois.\n\nSeriez-vous ouvert à une démo de 10 min juste pour voir si ça s'applique à votre cabinet ?`}

                 {activeScript === 'timing' && `Justement, la raison de mon appel est de vous faire GAGNER du temps. Je sais que vous êtes occupé. \n\nEst-ce que je peux vous bloquer 10 min mardi prochain à 14h ? Si à 14h10 vous n'êtes pas convaincu, on s'arrête là.`}
              </div>
          </div>
```

**Step 3:** Commit the changes.
