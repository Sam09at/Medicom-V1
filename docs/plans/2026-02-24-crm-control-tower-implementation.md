# CRM Control Tower Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task.

**Goal:** Transform the passive CRM Kanban board into an active, input-driven "Hormozi-style" Control Tower focused on high-velocity sales actions.

**Architecture:** We will extend the existing `lib/api/saas/crm.ts` API to fetch daily activity metrics and refactor the primary UI of `features/CRM.tsx` to display a Scoreboard, an Action Queue, and a Quick-Log mechanism. The existing Kanban board will be retained as a secondary view behind a segmented control.

**Tech Stack:** React, Tailwind CSS v4, Supabase, `recharts` (if we add a sparkline later), Lucide React.

---

### Task 1: Update API Sub-layer for Scoreboard metrics

**Files:**
- Modify: `lib/api/saas/crm.ts`

**Step 1: Write the failing test**
(Skipping explicit test file as project relies heavily on E2E/manual UI testing for now per `MEDICOM_STATE.md`, but we mock the expected hook response).

**Step 2: Add `getDailyActivityMetrics` function**
Modify `lib/api/saas/crm.ts` to add a new export:

```typescript
export const getDailyActivityMetrics = async (userId?: string): Promise<{calls: number; emails: number; meetings: number}> => {
  if (!supabase) throw new Error('Supabase client not initialized');

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  let query = supabase
    .from('lead_activities')
    .select('type')
    .gte('created_at', startOfDay.toISOString());

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;
  if (error) throw error;

  const metrics = { calls: 0, emails: 0, meetings: 0 };
  
  data.forEach((activity: { type: string }) => {
    if (activity.type === 'call') metrics.calls++;
    if (activity.type === 'email') metrics.emails++;
    if (activity.type === 'meeting') metrics.meetings++;
  });

  return metrics;
};
```

**Step 3: Commit**
```bash
git add lib/api/saas/crm.ts
git commit -m "feat(crm): add getDailyActivityMetrics to api layer"
```

---

### Task 2: Create Action Queue Component

**Files:**
- Create: `features/CRM/ActionQueue.tsx` (We will just build it inline inside `features/CRM.tsx` to keep with the single-file feature architecture currently used).
- Modify: `features/CRM.tsx`

**Step 1: Define the `ActionQueue` sub-component inside `CRM.tsx`**

```tsx
const ActionQueue = ({ leads, onLogAction }: { leads: Prospect[], onLogAction: (lead: Prospect) => void }) => {
  // Sort leads: New first, then Attempted Contact, etc.
  // We want to surface leads that need attention NOW.
  const actionLeads = leads
    .filter(l => ['New', 'Contacted'].includes(l.status))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10); // Show top 10

  if (actionLeads.length === 0) {
    return (
      <div className="bg-white border border-slate-100 rounded-[4px] p-8 text-center flex flex-col items-center">
        <IconCheckCircle className="w-12 h-12 text-emerald-400 mb-4" />
        <h3 className="text-slate-900 font-medium text-[16px]">Queue Cleared!</h3>
        <p className="text-slate-500 text-[14px] mt-1">You reached inbox zero for high-priority leads.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-100 rounded-[4px] shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-medium text-slate-900 text-[16px] flex items-center">
          <IconZap className="w-4 h-4 text-amber-500 mr-2" />
          Rapid Action Queue
        </h3>
        <span className="text-[12px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-[30px]">{actionLeads.length} pending</span>
      </div>
      <div className="divide-y divide-slate-100">
        {actionLeads.map(lead => (
          <div key={lead.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-[14px]">
                {lead.name.charAt(0)}
              </div>
              <div>
                <h4 className="text-slate-900 font-medium text-[14px]">{lead.name}</h4>
                <div className="flex items-center gap-2 mt-0.5 text-[13px] text-slate-500">
                  <span>{lead.status}</span>
                  <span>•</span>
                  <span>{lead.source}</span>
                </div>
              </div>
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => onLogAction(lead)}
                className="bg-slate-900 text-white px-4 py-2 rounded-[4px] text-[13px] font-medium shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:bg-slate-800 transition-colors flex items-center"
              >
                <IconPhone className="w-3.5 h-3.5 mr-1.5" />
                Action
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

*(Note: We will also need to import `IconZap`, `IconPhone` from `../components/Icons` in `CRM.tsx`)*

---

### Task 3: Implement The Control Tower Layout in CRM.tsx

**Files:**
- Modify: `features/CRM.tsx`

**Step 1: Add state for the active view**
We need to toggle between `Tower` and `Pipeline`. 

```tsx
const [activeView, setActiveView] = useState<'Tower' | 'Pipeline' | 'Onboarding' | 'Marketing'>('Tower');
const [dailyMetrics, setDailyMetrics] = useState({ calls: 0, emails: 0, meetings: 0 });

// Add a fetch inside the existing useEffect:
import { getDailyActivityMetrics } from '../lib/api/saas/crm';

useEffect(() => {
  const loadData = async () => {
    // ... existing lead loading
    try {
      const metrics = await getDailyActivityMetrics();
      setDailyMetrics(metrics);
    } catch (e) {
      console.error(e);
    }
  }
  loadData();
}, []);
```

**Step 2: Create the `ControlTowerView` component**
```tsx
const ControlTowerView = () => {
  return (
    <div className="space-y-6">
      {/* Scoreboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-100 rounded-[4px] p-6 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] flex flex-col items-center justify-center text-center">
          <div className="text-slate-500 text-[12px] font-bold tracking-widest uppercase mb-2">Calls Today</div>
          <div className="text-[52px] font-heading font-medium tracking-tight text-slate-900 leading-none">
            {dailyMetrics.calls} <span className="text-[20px] text-slate-400 font-normal">/ 50</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden">
            <div className="bg-blue-600 h-full rounded-full transition-all" style={{ width: `${Math.min((dailyMetrics.calls / 50) * 100, 100)}%` }} />
          </div>
        </div>
        <div className="bg-white border border-slate-100 rounded-[4px] p-6 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] flex flex-col items-center justify-center text-center">
          <div className="text-slate-500 text-[12px] font-bold tracking-widest uppercase mb-2">Demos Booked</div>
          <div className="text-[52px] font-heading font-medium tracking-tight text-slate-900 leading-none">
            {dailyMetrics.meetings} <span className="text-[20px] text-slate-400 font-normal">/ 3</span>
          </div>
           <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${Math.min((dailyMetrics.meetings / 3) * 100, 100)}%` }} />
          </div>
        </div>
        <div className="bg-white border border-slate-100 rounded-[4px] p-6 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] flex flex-col items-center justify-center text-center">
          <div className="text-slate-500 text-[12px] font-bold tracking-widest uppercase mb-2">Emails Sent</div>
          <div className="text-[52px] font-heading font-medium tracking-tight text-slate-900 leading-none">
            {dailyMetrics.emails}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ActionQueue leads={filteredProspects} onLogAction={(lead) => setSelectedProspect(lead)} />
        </div>
        <div className="space-y-6">
           {/* Placeholder for Leaderboard or Next Followups if team expands */}
           <div className="bg-white border border-slate-100 rounded-[4px] p-6 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)]">
              <h3 className="font-medium text-slate-900 text-[16px] mb-4">Input Philosophy</h3>
              <p className="text-slate-500 text-[14px] leading-relaxed">
                "We don't lack capacity. We lack conviction. The volume of outputs is dictated entirely by the volume of inputs. If you want more revenue, do more inputs."
              </p>
              <div className="mt-4 text-[12px] font-bold text-slate-400 text-right uppercase tracking-wider">— Alex Hormozi</div>
           </div>
        </div>
      </div>
    </div>
  );
};
```

**Step 3: Update `SegmentedTabs` configuration inside `CRM.tsx` rendering**
Ensure the segmented control includes 'Tower'. Update the main `render()` block in `CRM` to show `ControlTowerView` when active.

```tsx
const viewOptions = [
  { id: 'Tower', label: 'Control Tower', icon: IconZap },
  { id: 'Pipeline', label: 'Pipeline', icon: IconBriefcase },
  { id: 'Onboarding', label: 'Onboarding', icon: IconCheckCircle },
  { id: 'Marketing', label: 'Marketing', icon: IconSend },
];
```

**Step 4: Commit**
```bash
git add features/CRM.tsx
git commit -m "feat(crm): implement control tower dashboard and scoreboard"
```

---

### Task 4: Fast Action Slide-Over Modifications

**Files:**
- Modify: `features/CRM.tsx`

**Step 1: Enhance `SlideOver` Quick Actions**
In the Lead detail slide-over (when clicking a lead), add "Quick Action" buttons at the very top so the Super Admin can instantly log a call without scrolling.

```tsx
// Inside the SlideOver for selectedProspect
<div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
  <div>
    <h3 className="text-[12px] font-bold tracking-widest text-slate-400 uppercase mb-2">Rapid Logging</h3>
    <div className="flex gap-2">
      <button onClick={() => logRapidAction('call')} className="btn-secondary text-[13px] py-1.5 px-3">
        <IconPhone className="w-3.5 h-3.5 mr-1.5" /> Log Call
      </button>
      <button onClick={() => logRapidAction('email')} className="btn-secondary text-[13px] py-1.5 px-3">
        <IconMail className="w-3.5 h-3.5 mr-1.5" /> Log Email
      </button>
      <button onClick={() => logRapidAction('meeting')} className="bg-emerald-500 text-white hover:bg-emerald-600 rounded-[4px] px-3 py-1.5 text-[13px] font-medium shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex items-center transition-colors">
        <IconCalendar className="w-3.5 h-3.5 mr-1.5" /> Book Demo
      </button>
    </div>
  </div>
</div>
```

**Step 2: Define `logRapidAction`**
```tsx
const logRapidAction = async (type: 'call'|'email'|'meeting') => {
  if (!selectedProspect) return;
  try {
    // 1. Log activity
    await addActivity({
      leadId: selectedProspect.id,
      type,
      description: `Rapid action logged: ${type}`,
    });
    
    // 2. Advance status if needed
    if (type === 'call' && selectedProspect.status === 'New') {
       await updateLeadStatus(selectedProspect.id, 'Contacted');
    } else if (type === 'meeting' && ['New', 'Contacted'].includes(selectedProspect.status)) {
       await updateLeadStatus(selectedProspect.id, 'Demo');
    }

    // 3. Update local state metrics instantly
    setDailyMetrics(prev => ({
       ...prev,
       [type === 'call' ? 'calls' : type === 'email' ? 'emails' : 'meetings']: prev[type === 'call' ? 'calls' : type === 'email' ? 'emails' : 'meetings'] + 1
    }));
    
    // Toast notification
    showToast(`Logged ${type} successfully`, 'success');
    
    // Refresh leads
    loadData(); // Re-fetch all leads
    setSelectedProspect(null); // Close sidebar for speed
  } catch (error) {
    console.error(error);
    showToast('Failed to log action', 'error');
  }
};
```

**Step 3: Run the build to verify no type errors**
```bash
npm run build
```

**Step 4: Commit**
```bash
git add features/CRM.tsx
git commit -m "feat(crm): add rapid action logging in side panel"
```
