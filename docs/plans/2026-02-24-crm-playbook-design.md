# 2026-02-24 CRM Guided Sales Playbook & Communication System

## Context
Following the successful implementation of the Hormozi-style Control Tower, we need to take the system further by reducing friction to near-zero for the operator. The goal is to eliminate "thinking" from the execution process and enable 1-click execution for high-velocity outbound.

## 1. Features to Implement
We will add two core features to the CRM:

### A. Seamless Communication Links (Zero-Friction Outbound)
Currently, `logRapidAction` only logs that an action happened. We need to actually trigger the action.
- When clicking "Log Call", trigger a `tel:` link to open the dialer.
- When clicking "Log Email", trigger a `mailto:` link with a pre-filled subject and body context.

### B. Guided Objection Handling Scripts (SlideOver Playbook)
Provide on-screen scripts right inside the prospect's detail modal, ensuring the operator always knows exactly what to say based on the scenario.

## 2. Architecture & Approach
We will continue working within `features/CRM.tsx` without needing new backend routes if we mock the templates.

**SlideOver Additions:**
1. Change the `<SlideOver>` body to include a Tab or Accordion section for "Sales Scripts".
2. Create standard scripts: "Elevator Pitch", "Not Interested / Busy", "Price Objection".

**Action Modifications:**
1. Upgrade `logRapidAction` to not only update Supabase but also trigger `window.location.href = 'tel:...'` or `window.open('mailto:...', '_blank')`.
2. Ensure we have mock phone numbers or emails falling back gracefully if the lead data doesn't contain them.

## 3. Implementation Steps

1. **Update Types & Mock Data (if needed):**
   Ensure `Prospect` has `phone` and `email` properties (already partially defined, but we'll ensure safety).

2. **Enhance Rapid Logging Actions:**
   Update `logRapidAction` in `features/CRM.tsx`:
   - If `type === 'call'`, call `window.open('tel:' + lead.phone)`.
   - If `type === 'email'`, call `window.open('mailto:' + lead.email + '?subject=' + encodeURIComponent('Medicom...'))`.

3. **Build Script Playbook UI:**
   In the `SlideOver` content for `selectedProspect`, add a small section below Rapid Logging called "Playbook Scripts". We can use a simple state to toggle between 3-4 standard scripts to save vertical space.

4. **Integration & Build Test:**
   Run `npm run build` after changes to ensure no TypeScript compilation errors.
