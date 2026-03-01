# Medicom Design Guide
> **Version:** 1.0 — Last Updated: 2026-02-28
> **Authority:** This document is the single source of truth for all UI work on Medicom. Any rebranding, new feature, or UI edit must follow these guidelines without exception.

---

## Table of Contents
1. [Brand Identity](#1-brand-identity)
2. [Design Philosophy](#2-design-philosophy)
3. [Color System](#3-color-system)
4. [Typography](#4-typography)
5. [Spacing & Layout](#5-spacing--layout)
6. [Shapes & Geometry](#6-shapes--geometry)
7. [Elevation & Depth](#7-elevation--depth)
8. [Component Library](#8-component-library)
9. [Page Layout Architecture](#9-page-layout-architecture)
10. [Data Display Patterns](#10-data-display-patterns)
11. [Voice & Copy Guidelines](#11-voice--copy-guidelines)
12. [Rules of Engagement](#12-rules-of-engagement)

---

## 1. Brand Identity

| Field | Value |
|---|---|
| **Brand Name** | Medicom |
| **Tagline** | Gestion de Cabinet Médical |
| **Logo** | `/public/logo.png` — used at `w-8 h-8` in sidebar |
| **Primary Market** | Medical & Dental Clinics in Morocco |
| **Primary Language** | French (`fr`) |
| **App Domain** | Clinical SaaS — Doctor, Staff, Clinic Admin, Super Admin |

### Brand Personality
- **Professional but approachable** — We are clinical, not cold.
- **Direct and efficient** — Never verbose; doctors are busy.
- **Tech-savvy but jargon-free** — Smart UI that doesn't need a manual.
- **Empathetic** — We understand the medical context and the stakes.

---

## 2. Design Philosophy

> **"Endless Paper"** — The app should feel like a clean, infinite white page. Every element earns its place. Nothing is decorative by default.

| Principle | Rule |
|---|---|
| **Style Inspiration** | Linear.app / Attio — Ultra-minimalist SaaS |
| **Surface** | Flat. White cards on a white/off-white canvas. |
| **Borders** | Hairline only. Always `border-slate-200/60` or `border-slate-100`. |
| **Shadows** | Ultra-soft (max `0.03` opacity). Never dramatic drop shadows. |
| **Gradients** | ❌ Forbidden. No background gradients on any surface. |
| **Animations** | Micro only. Short (150–250ms), purposeful transitions. Avoid bouncy or elastic animations. |
| **Information Density** | High. Use micro-typography to pack information without clutter. |

---

## 3. Color System

### 3.1 Core Palette

| Token | Hex | Tailwind Equivalent | Usage |
|---|---|---|---|
| **Brand Blue** | `#136cfb` | `text-[#136cfb]` / `bg-[#136cfb]` | Primary buttons, active states, accents, links |
| **Brand Blue Hover** | `#0d5ee8` | — | Primary button hover |
| **Brand Blue Active** | `#0a4fc4` | — | Primary button pressed |
| **Canvas** | `#FFFFFF` | `bg-white` | Main content area, cards |
| **App Background** | `#FAFAFA` | `bg-[#FAFAFA]` | Sidebar, outer shell background |
| **Wash / Hover** | `#F8FAFC` / `#F1F5F9` | `bg-slate-50` / `bg-slate-100` | Row hovers, subtle section backgrounds |
| **Border Default** | `#E2E8F0` | `border-slate-200/60` | Standard borders on cards, inputs |
| **Border Hairline** | `#F1F5F9` | `border-slate-100` | Table dividers, timeline rows |

### 3.2 Text Colors

| Token | Hex | Tailwind | Usage |
|---|---|---|---|
| **Primary Text** | `#111827` | `text-slate-900` | Headings, main content |
| **Secondary Text** | `#64748B` | `text-slate-500` | Descriptions, metadata |
| **Tertiary / Label** | `#94A3B8` | `text-slate-400` | Section labels, timestamps, units |
| **Disabled** | `#CBD5E1` | `text-slate-300` | Placeholder and inactive states |
| **Brand Accent** | `#136cfb` | `text-[#136cfb]` | Links, active nav items |

### 3.3 Semantic / Status Colors

| Status | Background | Text | Border | Badge Class |
|---|---|---|---|---|
| **Success / Confirmed** | `bg-emerald-50` | `text-emerald-700` | `border-emerald-100/50` | `.badge-green` |
| **Warning / Pending** | `bg-orange-50` | `text-orange-700` | `border-orange-100/50` | `.badge-orange` |
| **Error / Cancelled** | `bg-rose-50` | `text-rose-700` | `border-rose-100/50` | `.badge-red` |
| **Info / In Progress** | `bg-blue-50` | `text-blue-700` | `border-blue-100/50` | `.badge-blue` |
| **Neutral** | `bg-slate-50` | `text-slate-600` | `border-slate-200/60` | `.badge-gray` |

> **Rule:** All status badges use `mix-blend-multiply` for subtle color blending on white backgrounds.

---

## 4. Typography

### 4.1 Font Stack (Defined in `globals.css`)

| Role | Font | CSS Variable | Weight |
|---|---|---|---|
| **Body / UI** | Inter | `var(--font-sans)` | 400, 500, 600, 700 |
| **Headings** | Aspekta (→ falls back to Inter) | `var(--font-heading)` | 400 |
| **Monospace / Data** | Geist Mono | `var(--font-mono)` | 400, 500, 600 |

### 4.2 Type Scale (Actual Implementation)

| Level | Size | Weight | Class Example | Usage |
|---|---|---|---|---|
| **H1 — Page Hero** | 48px | 400 | `h1` tag | Marketing / landing only |
| **H2 — Section Header** | 32px | 400 | `h2` tag | Major page sections |
| **Page Title** | 22px | 600 (`semibold`) | `text-[22px] font-semibold tracking-tight` | In-app module titles |
| **Section Title** | 15–18px | 600 | `text-[15px] font-semibold` | Card headers, sub-sections |
| **Body** | 13–14px | 500 | `text-[13px] font-medium` | Table rows, list items, form inputs |
| **Body Regular** | 13px | 400 | `text-[13px]` | Descriptions, secondary info |
| **Micro Label** | 10–11px | 700 | `text-[11px] font-bold uppercase tracking-widest text-slate-400` | Section eyebrows, table column headers |
| **Caption** | 11px | 600 | `text-[11px] font-semibold` | Status pills, compact key-value pairs |

### 4.3 Letter Spacing Rules

- **Body:** `letter-spacing: -0.01em` (set globally in `body` styles)
- **Headings:** `letter-spacing: -0.02em` (set globally in `h1`, `h2`)
- **Micro Labels:** `tracking-widest` (positive tracking for ALL-CAPS labels)

---

## 5. Spacing & Layout

### 5.1 Base Grid
- **Base unit:** 4px (`1` in Tailwind = 4px)
- **Content max width:** `max-w-[1700px] mx-auto`
- **Main content padding:** `p-10` (40px) — from `Layout.tsx`

### 5.2 Common Spacing Patterns

| Context | Value | Tailwind |
|---|---|---|
| Section gaps (vertical) | 24px | `gap-6` / `space-y-6` |
| Card internal padding | 20–24px | `p-5` or `p-6` |
| Table row vertical padding | 12–14px | `py-3` or `py-3.5` |
| Sidebar nav item padding | 8px top/bottom | `py-2 px-3` |
| Header height | 56px | `h-14` |
| Sidebar width (expanded) | 240px | `w-[240px]` |
| Sidebar width (collapsed) | 72px | `w-[72px]` |

---

## 6. Shapes & Geometry

### 6.1 Border Radius System

| Element | Radius | Tailwind / CSS |
|---|---|---|
| **Cards / Panels** | 12px | `rounded-[12px]` (via `.card`) |
| **Modals / Dropdowns** | 8px | `rounded-[8px]` |
| **Buttons (all types)** | 6px | `rounded-[6px]` (via `.btn-*`) |
| **Inputs / Selects** | 6px | `rounded-[6px]` (via `.input`) |
| **Status Badges (square)** | 4px | `rounded-[4px]` (via `.badge`) |
| **Status Badges (pill)** | 30px | `rounded-[30px]` |
| **Avatars** | Full circle | `rounded-full` |
| **Search / Command Bar** | 6px | `rounded-[6px]` |

> **Key rule:** Never use `rounded-3xl` (48px) or `rounded-2xl` (24px) on interactive UI elements. These are reserved for decorative purposes only.

### 6.2 Avatar Conventions
- Always `rounded-full`
- Size: `w-8 h-8` (32px) for compact rows; `w-9 h-9` or `w-10 h-10` for cards
- Initials avatars: tinted with Brand Blue (`bg-blue-50 text-[#136cfb]`), `text-[11px] font-semibold`

---

## 7. Elevation & Depth

Medicom uses a **minimal shadow vocabulary**. Shadow conveys only the most essential depth.

| Level | Value | Tailwind `shadow-*` equivalent | Usage |
|---|---|---|---|
| **0 — Flat** | `none` | `shadow-none` | Base canvas, sidebar |
| **1 — Card** | `0 1px 3px rgba(0,0,0,0.02)` | via `.card` class | Standard cards and panels |
| **2 — Elevated** | `0 2px 12px -4px rgba(0,0,0,0.04)` | `shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)]` | Active nav items, dropdowns |
| **3 — Float** | `0 8px 30px rgba(0,0,0,0.08)` | `shadow-[0_8px_30px_rgb(0,0,0,0.08)]` | Notification popovers, menus |
| **4 — Modal** | `0 24px 64px rgba(0,0,0,0.12)` | — | Full-screen modals |

> **Forbidden:** `shadow-lg`, `shadow-xl`, `shadow-2xl` from Tailwind's direct preset as they are too heavy for this aesthetic.

---

## 8. Component Library

All utilities below are defined in `styles/globals.css`.

### 8.1 Buttons

```css
/* Primary Action */
.btn-primary {
  px-4 py-2 | text-[13px] font-medium | rounded-[6px] | text-white;
  background-color: #136cfb;
  transition: 0.25s background-color, 0.2s transform;
}
/* Hover: background → #0d5ee8 */
/* Active: background → #0a4fc4, scale(0.985) */

/* Secondary / Outline */
.btn-secondary {
  px-4 py-2 | text-[13px] font-medium | rounded-[6px] | bg-white text-gray-700;
  border: 1px solid rgba(226,232,240,0.6) (border-slate-200/60);
  box-shadow: 0 1px 2px rgba(0,0,0,0.02);
}

/* Ghost / Tertiary */
.btn-ghost {
  px-4 py-2 | text-[13px] font-medium | rounded-[6px];
  color: #6b7280 (text-gray-500);
  hover: bg-slate-50, text-gray-900;
}
```

**Usage Guide:**
- Use `.btn-primary` for the single most important action on a page/card.
- Use `.btn-secondary` for supporting actions (export, filter, cancel).
- Use `.btn-ghost` for icon-only toolbar buttons or destructive actions (styled separately).

### 8.2 Badges & Status Pills

```css
/* Base badge — 4px radius (square) */
.badge { text-[11px] font-medium | px-2 py-0.5 | rounded-[4px] | mix-blend-multiply }

/* Available variants */
.badge-blue   /* blue-50 / blue-700 / blue-100/50 */
.badge-green  /* emerald-50 / emerald-700 / emerald-100/50 */
.badge-orange /* orange-50 / orange-700 / orange-100/50 */
.badge-red    /* rose-50 / rose-700 / rose-100/50 */
.badge-gray   /* slate-50 / slate-600 / slate-200/60 */
```

**Attio-style Pill (30px radius):**
```
text-[11px] font-semibold | px-2.5 py-0.5 | rounded-[30px] | border
bg-X-50/80 + border-X-100/60
```

### 8.3 Form Inputs

```css
.input {
  w-full | text-[13px] font-medium | rounded-[6px] | px-3 py-2;
  bg-white | border border-slate-200/60 | text-gray-900;
  placeholder: text-gray-400 font-normal;
  focus: ring-1 ring-gray-300 border-gray-300;
  box-shadow: 0 1px 2px rgba(0,0,0,0.02);
}
```

**Label:** `text-[14px] font-medium text-slate-700 mb-1.5`

### 8.4 Cards

```css
.card {
  bg-white | border border-slate-200/60 | rounded-[12px];
  box-shadow: 0 1px 3px rgba(0,0,0,0.02);
  transition: all 200ms;
}
```

**Usage:** Wrap any distinct content block in `.card`. Add `p-5` or `p-6` for internal padding.

### 8.5 Table / List Rows

```
/* Header row */
bg-white | text-[12px] font-bold uppercase tracking-widest text-slate-400 | py-4 border-b border-slate-100

/* Data row */
bg-white | text-[14px] text-slate-900 | border-b border-slate-100 | hover:bg-slate-50 transition-colors
```

### 8.6 Chart Tooltips

All chart tooltips should use the **BlueTooltip** pattern:
```
bg-[#136cfb] | text-white | rounded-[30px] | px-4 py-2 | text-[12px] font-medium
```

---

## 9. Page Layout Architecture

### 9.1 Shell Structure (from `Layout.tsx`)

```
[bg-[#FAFAFA] flex h-screen overflow-hidden]
│
├── <aside> Sidebar
│   ├── Width: 240px expanded / 72px collapsed
│   ├── Background: #FAFAFA (matches canvas)
│   ├── Border: border-r border-slate-200/60
│   ├── Logo: /logo.png at w-8 h-8
│   ├── Nav Items: rounded-[6px], active state → bg-white + border + shadow
│   └── User Card: avatar + name + clinic at bottom
│
└── <main> Content Area
    ├── Background: bg-white (creates depth against sidebar)
    ├── Border: border-l border-t border-slate-200/60
    ├── Shadow: shadow-[-4px_0_24px_rgba(0,0,0,0.02)]
    ├── Border Radius (top-left corner): rounded-tl-[12px]
    │
    ├── <header> Topbar (h-14 = 56px, sticky)
    │   ├── Hamburger toggle (collapsed sidebar)
    │   ├── Search bar (max-w-sm)
    │   ├── "Nouveau Patient" primary button (for non-admins)
    │   ├── Notifications bell
    │   └── Logout button
    │
    └── <div> Page Content
        ├── Padding: p-10 (40px)
        ├── Max width: max-w-[1700px] mx-auto
        └── Entrance animation: animate-in fade-in duration-300
```

### 9.2 Standard Page Header Pattern

Every feature page should start with this header:
```tsx
<div className="flex items-center justify-between mb-6">
  <div>
    <h1 className="text-[22px] font-semibold text-slate-900 tracking-tight">
      Page Title
    </h1>
    <p className="text-[13px] text-slate-500 mt-0.5">
      Short description of this module.
    </p>
  </div>
  <div className="flex items-center gap-2">
    {/* Action buttons */}
  </div>
</div>
```

### 9.3 Grid & Column Patterns

| Layout | Tailwind |
|---|---|
| KPI Stats Row (4 cards) | `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4` |
| Two-column content (60/40) | `grid grid-cols-3 gap-6` (left=`col-span-2`, right=`col-span-1`) |
| Three-column equal | `grid grid-cols-3 gap-6` |
| Full width content | `w-full` card |

---

## 10. Data Display Patterns

### 10.1 Linear Schedule (Programme du Jour)
Used in Dashboard for daily appointment list.
```
Row structure: [hairline border-b] [time] [3px status bar] [avatar circle] [name + act] [status pill]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
09:00  │▌  KB  Karim Benali / Détartrage ·········· Confirmé
09:45  │▌  SE  Sara El Fassi / Consultation ········ En attente
```
- **Status bar:** `w-[3px] h-8 rounded-full` in status color
- **Row:** `border-b border-slate-100 py-3 px-5`
- **Avatar:** `w-8 h-8 rounded-full bg-blue-50 text-[#136cfb] text-[11px] font-semibold`

### 10.2 Vertical Timeline (Dossier / Medical Records)
Used for patient history events.
```
[icon block] ────────────────────────────
              Date & time (micro label)
              Title (body medium)
              Description (secondary text)
[hairline divider]
```
- Each row uses `border-b border-slate-100 py-4 flex gap-3`
- Icon block: `w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center`

### 10.3 KPI Stat Card
Used for dashboard metrics.
```
.card p-5
├── [micro label uppercase] RDV AUJOURD'HUI
├── [text-[28px] font-bold] 8
└── [badge-green] +2 vs hier
```

### 10.4 Donut / Chart Section
- Chart container: `.card p-6`
- Chart tooltip: BlueTooltip (see 8.6)
- Legend: Custom progress-bar list (NOT recharts `<Legend>` component)
  ```
  [colored dot] Label ············ [value] [progress bar]
  ```

---

## 11. Voice & Copy Guidelines

### 11.1 Language Rules
- **Primary Language:** French (`fr`)
- **Avoid:** Anglicisms where French equivalents exist (use "Médecin" not "Doctor")
- **Exception:** Technical terms (e.g., "Dashboard", "KPI") are acceptable in French medical SaaS context

### 11.2 Tone in the UI

| Context | Tone | Example |
|---|---|---|
| Page titles | Neutral, direct | "Tableau de bord", "Patients" |
| Empty states | Encouraging, brief | "Aucun patient en attente" |
| Success toasts | Warm, concise | "Patient enregistré" |
| Error messages | Clear, non-blaming | "Impossible de charger les données" |
| Confirm dialogs | Direct | "Voulez-vous vraiment supprimer ?" |
| CTA buttons | Imperative, short | "Enregistrer", "Importer", "Nouveau Patient" |

### 11.3 Capitalization
- Feature names: Title Case ("Tableau de bord", "Ordres Labo")
- Section labels / table headers: ALL CAPS (`UPPERCASE tracking-widest`)
- Button labels: Title Case first word only ("Nouveau patient", "Voir calendrier")

---

## 12. Rules of Engagement

> These are the **hard rules** that must not be violated during any UI edit, rebranding, or new feature build.

### ✅ ALWAYS DO

1. **Use the `.card` utility** for any distinct, contained block of information.
2. **Use `border-slate-200/60` or `border-slate-100`** for all borders — never `border-gray-300` or darker.
3. **Use hairline dividers (`border-b border-slate-100`)** inside lists, tables, and timelines.
4. **Run the build (`npm run build`)** before committing any UI changes to verify zero TypeScript errors.
5. **Use `rounded-[6px]` for buttons and inputs**, `rounded-[12px]` for cards, `rounded-full` for avatars.
6. **Use Brand Blue `#136cfb`** for primary buttons, active states, accent text, and key indicators.
7. **Use Inter (`font-sans`)** for all body and UI text. Only use `font-heading` for true heading elements.
8. **Add page entrance animation** `animate-in fade-in duration-300` to the root element of every new page.

### ❌ NEVER DO

1. ❌ **No gradients** on any surface, card, or button (background or border).
2. ❌ **No `shadow-lg` / `shadow-xl` / `shadow-2xl`** — too heavy for Medicom's aesthetic.
3. ❌ **No `rounded-3xl` or `rounded-2xl`** on interactive UI elements.
4. ❌ **No heavy colored backgrounds** on page sections (no `bg-blue-600` on a `div` wrapper).
5. ❌ **No floating action buttons** — actions must live in the page header or card header.
6. ❌ **No bold (700) in main body text** — use `font-medium` (500) for data rows, `font-semibold` (600) for titles.
7. ❌ **No inline `style={{ color: '...' }}`** for anything covered by the design token system.
8. ❌ **No new fonts** — Inter, Aspekta, and Geist Mono are the only permitted typefaces.

### 🔄 FOR NEW FEATURES

When adding a new page or module, follow this order:
1. Read this document (MEDICOM_DESIGN_GUIDE.md).
2. Read `MEDICOM_STATE.md` to understand where the new feature fits.
3. Copy the **Page Header Pattern** (Section 9.2) for your page title.
4. Use an existing module (e.g., `Dashboard.tsx`, `PatientList.tsx`) as a structural reference.
5. Use only `.card`, `.btn-primary`, `.btn-secondary`, `.badge-*`, `.input` utilities from `globals.css`.
6. Run `npm run build` to validate no TypeScript or CSS errors.
7. Update `MEDICOM_STATE.md` with the new feature's status.

### 🔄 FOR REBRANDING

If the brand color or visual identity changes:
1. Update `#136cfb` in `globals.css` (`.btn-primary`, `.badge-blue` references).
2. Update the token in this file (Section 3.1).
3. Update `design-tokens.json` in `.agent/skills/brand-identity/resources/`.
4. Search for all hardcoded `#136cfb` occurrences in `*.tsx` files and update.
5. Update `MEDICOM_UI.md` to reflect new values.

---

*This guide supersedes any conflicting information in `MEDICOM_UI.md`. When in doubt, this document is authoritative.*

---

## 13. Super Admin Shell Design System

> **Reference implementation:** `features/Cabinets.tsx` — this page is the gold standard for every Super Admin module.
> Last Updated: 2026-03-01

The Super Admin shell (routes under `/admin/*`) has its own focused design language. It is **more linear, denser, and more operational** than the clinic view. Think *Vercel / Linear dashboard*, not a medical record.

### 13.1 Typography — Super Admin

| Element | Tag | Class | Notes |
|---|---|---|---|
| **Page Title** | `h1` | `text-[22px] font-semibold text-slate-900 tracking-tight` | Inter Semibold. Same size as clinic view but scoped to Inter via `.sa-shell`. |
| **Page Subtitle** | `p` | `text-[13px] text-slate-500 mt-0.5` | One line. No uppercase, no bold. |
| **Section / Card Title** | `h4` / `div` | `text-[13px] font-bold text-slate-900` | Used inside cards and table headers below the page title. |
| **Micro Label** | `div` | `text-[11px] font-bold text-slate-400 uppercase tracking-widest` | KPI card labels, table column headers. |
| **KPI Value** | `div` | `text-[26px] font-semibold text-slate-900 tracking-tight leading-none` | Large metric number. |
| **Body rows** | `td` / `div` | `text-[13px] font-medium text-slate-900` | Table data. |
| **Meta / secondary** | `span` / `div` | `text-[12px] text-slate-500` | Timestamps, secondary IDs, sub-labels. |
| **Mono ID** | `span` | `font-mono text-[10px] text-slate-400` | Ticket IDs, plan codes, version hashes. |

> ❌ **Never** use `text-[2rem]` or `text-[18px]` for page titles in the Super Admin shell.

---

### 13.2 Page Header Pattern — Super Admin (Canonical)

Copy this exact pattern for **every** Super Admin module page:

```tsx
{/* ✅ CANONICAL Super Admin Page Header */}
<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
  <div>
    <h1 className="text-[22px] font-semibold text-slate-900 tracking-tight">
      Page Title
    </h1>
    <p className="text-[13px] text-slate-500 mt-0.5">
      One-line operational description.
    </p>
  </div>
  <div className="flex items-center gap-3">
    {/* Optional: filter/search input or secondary action */}
    <button className="sa-btn">
      <IconPlus className="w-4 h-4" /> Primary Action
    </button>
  </div>
</div>
```

**Key rules:**
- `sm:flex-row sm:items-center` — stacks on mobile, inline on desktop.
- `gap-4` — breathing room between title block and action block.
- No bottom border (`border-b`). White canvas with natural spacing.

---

### 13.3 Buttons — Super Admin

All Super Admin CTAs use the `.sa-btn` / `.sa-btn-ghost` / `.sa-btn-danger` CSS classes defined in `globals.css` under `.sa-shell`. **Never override padding** on these classes with `px-N py-N` utilities.

| Class | Appearance | Use Case |
|---|---|---|
| `.sa-btn` | Near-black (`#0f0f10`), pill (30px radius), white text | Primary CTA (create, provision, save) |
| `.sa-btn-ghost` | White bg, thin slate border, slate-700 text | Secondary action (navigate, filter, export) |
| `.sa-btn-danger` | Rose-50 bg, rose-700 text, rose border | Destructive action (suspend, delete) |

```css
/* Defined in globals.css — DO NOT duplicate inline */
.sa-btn          → bg #0f0f10, rounded-[30px], padding 10px 24px
.sa-btn-ghost    → bg white, border rgba(0,0,0,0.08), rounded-[30px]
.sa-btn-danger   → bg rose-50, text rose-700, border rose, rounded-[30px]
```

---

### 13.4 KPI Cards — Super Admin

Each KPI card uses the same structure. Place in a `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6` wrapper.

```tsx
{/* ✅ CANONICAL KPI Card */}
<div className="card p-5 h-full flex flex-col justify-between group">
  {/* Top row: icon + optional trend badge */}
  <div className="flex items-start justify-between mb-4">
    <div className="w-10 h-10 rounded-[14px] bg-slate-50 border border-slate-100
                    flex items-center justify-center text-slate-500
                    group-hover:bg-slate-100 transition-colors duration-300 ease-in-out">
      <IconSomething className="w-5 h-5" />
    </div>
    {/* Optional trend badge */}
    <div className="badge badge-green gap-1 font-semibold rounded-[30px] px-2.5 py-1">
      <IconTrendingUp className="w-3.5 h-3.5" />
      <span>+12%</span>
    </div>
  </div>
  {/* Bottom: label + value */}
  <div>
    <div className="text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-widest">
      METRIC LABEL
    </div>
    <div className="text-[26px] font-semibold text-slate-900 tracking-tight leading-none">
      1,234
    </div>
    {/* Optional caption */}
    <div className="text-[11px] font-medium text-slate-400 mt-2">Optional caption</div>
  </div>
</div>
```

**Icon container radius:** `rounded-[14px]` (slightly softer than card's 12px).
**Trend badge:** Use `.badge-green` (up), `.badge-red` (down), or omit if not applicable.

---

### 13.5 Data Tables — Super Admin

```tsx
{/* ✅ CANONICAL Table Structure */}
<div className="card overflow-hidden">
  {/* Optional filter/tab bar */}
  <div className="px-6 py-4 flex items-center gap-2 border-b border-slate-100 bg-[#FAFAFA]">
    {/* Segment tabs or search */}
  </div>

  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-slate-100">
      <thead className="bg-[#FAFAFA]">
        <tr>
          <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            Column
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 bg-white">
        <tr className="hover:bg-slate-50/50 transition-colors cursor-pointer group">
          <td className="px-6 py-4 text-[13px] font-medium text-slate-900">…</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

**Divider color:** `divide-slate-100` (not `divide-gray-200`).
**Header background:** `bg-[#FAFAFA]` (same as sidebar).
**Row hover:** `hover:bg-slate-50/50` (half-transparent for a subtle lift).

---

### 13.6 Form Fields — Super Admin (inline/modal)

Use the global `.input` class. Labels follow the micro-label pattern:

```tsx
<div>
  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
    Field Label
  </label>
  <input
    type="text"
    className="input"
    placeholder="Placeholder..."
  />
  {/* Error */}
  <p className="mt-1 text-[11px] font-semibold text-rose-500">Error message</p>
</div>
```

For **modal/slide-over footers**:
```tsx
<div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
  <button onClick={onClose} className="sa-btn-ghost">Annuler</button>
  <button type="submit" className="sa-btn">Enregistrer</button>
</div>
```

---

### 13.7 Module-by-Module Checklist

| Module | Page Header | KPI Grid | Table | Status |
|---|---|---|---|---|
| **Dashboard** (`SuperAdminDashboard.tsx`) | ✅ `h1 22px` | ✅ 4-col | ✅ | ✅ Done |
| **Cabinets** (`Cabinets.tsx`) | ✅ `h1 22px` | ✅ 4-col | ✅ | ✅ Reference |
| **CRM Growth** (`CRM.tsx`) | ✅ `h1 22px` | ✅ Contextual | ✅ | ✅ Done |
| **Intelligence** (`Reports.tsx`) | ✅ `h1 22px` | ✅ 4-col | ✅ | ✅ Done |
| **Support** (`Support.tsx`) | ✅ `h1 22px` | ✅ 4-col | ✅ | ✅ Done |
| **Administration** (`SaaSAdministration.tsx`) | 🔄 In progress | — | ✅ | 🔄 In progress |

---
