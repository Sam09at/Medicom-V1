# 2026-02-24 CRM Control Tower Design

## Context
The Super Admin needs a Hormozi-style "Control Tower" CRM. The philosophy shifts from a passive contact list to an input-driven revenue engine focusing on high-velocity actions (Calls, Demos, Follow-ups). The primary user is the Solo Operator (Super Admin) executing the sales process.

## 1. Architecture & Data Flow
**Current Data:** 
- Leads (`lib/api/saas/crm.ts` -> `getLeads()`, `createLead()`, `updateLeadStatus()`)
- Lead Activities (`getLeadActivities()`, `addActivity()`)

**New Requirement / Missing Data (Inputs):**
- We need to track actual *daily inputs* (goals). The database currently tracks `lead_activities` (calls, emails, meetings, notes).
- We can aggregate today's `lead_activities` for the current user to display current progress against daily goals.

## 2. Approach: The "Hormozi" Control Tower
The new CRM will drop the traditional passive Kanban as the *primary* view in favor of an **Active Command Center**.

**Key Sections in the UI:**
1. **The Scoreboard (Daily Inputs):** 
   - Big, bold numbers at the top. 
   - Example metrics: "Calls Made Today" (target: 50), "Demos Booked" (target: 3), "Follow-ups Sent".
   - Powered by aggregating `lead_activities` where `created_at` > `start_of_day`.
2. **Next Action Queue (High Velocity):**
   - A prioritized list of exactly *who to call right now*.
   - E.g., "New Leads (Contact within 5 mins)", "Pending Demos", "Stale Deals".
   - Click to open the lead detail slide-over. 
3. **Pipeline View (Secondary):** 
   - The conventional Kanban board (`SalesView` currently handling this) should still exist behind a tab, but it isn't the main focus.
4. **Lead Action Hub (Slide-Over):**
   - Fast data entry. 
   - 1-click logging of outcomes ("Didn't Answer", "Booked Demo", "Not Interested") which immediately creates a `lead_activity` and potentially advances the status. 

## 3. Implementation Steps

1. **Update `lib/api/saas/crm.ts` (API Layer):**
   - Add a function `getDailyActivityMetrics(userId?: string): Promise<{calls: number, emails: number, meetings: number}>`
   - *Alternative*: Just fetch today's activities and calculate on the frontend for simplicity right now.

2. **Refactor `features/CRM.tsx` (UI Layer):**
   - Change the layout. Instead of defaulting to Kanban, default to a "Control Tower" dashboard.
   - **Scoreboard Component:** Implement the top stats row using the Attio style (clean white cards, subtle border, primary text focus).
   - **Action Queue Component:** A tight, dense list of leads sorted by urgency (Newest first, or Follow-up Due).
   - Create a `logRapidAction()` handler that updates the backend and refreshes the scoreboard instantly.
   
3. **Update Lead Statuses:**
   Ensure statuses align with a high-velocity workflow: `New`, `Attempted Contact`, `Demo Scheduled`, `Demo Completed`, `Proposal Sent`, `Won`, `Lost`. (Current is: `new`, `contacted`, `demo`, `proposal`, `won`, `lost`). We will stick to the current DB schema enum to avoid DB migrations unless necessary, so we will map: 
   - `new` = New
   - `contacted` = Attempted/In-progress
   - `demo` = Demo Scheduled/Completed
   - `proposal` = Proposal Sent
   - `won` = Closed Won
   - `lost` = Closed Lost

## 4. Design Sign-off & Next Steps
We will proceed to implement the `CRM.tsx` refactor to introduce the Control Tower UI, using the existing Supabase backend but presenting the data in an input-focused manner.
