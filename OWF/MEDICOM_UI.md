# Medicom UI Design System
> **Style Inspiration:** Linear / Attio
> **Core Ethos:** Ultra-clean, hyper-minimalist SaaS. More white space, flat surfaces with hairline borders (`border-slate-100`), crisp micro-typography, high information density. Avoid gradients and heavy shadows.

## 1. Typography & Scale
*   **Fonts:**
    *   **Primary (Body):** Inter (`font-sans`) - Loaded via Google Fonts.
    *   **Heading:** Aspekta (`font-heading`) - Local font, falls back to Inter.
    *   **Monospace:** Geist Mono (`font-mono`) - Loaded via Google Fonts.
*   **Font Sizes (Actual Implementation):**
    *   **h1 (Page Hero):** 48px (`text-[48px]` or `h1` tag)
    *   **h2 (Major Header):** 32px (`text-[32px]` or `h2` tag)
    *   **Page Title (App):** 22px (`text-[22px] font-semibold tracking-tight`)
    *   **Section Title:** 15px/18px (`text-[15px] font-semibold`)
    *   **Body Text:** 16px base (`text-[16px]`), often 13px/14px in data tables.
    *   **Micro Labels:** 10px/11px (`text-[11px] font-bold uppercase tracking-widest`)
*   **Text Colors:**
    *   **Brand Blue:** `#136cfb` (Primary accent color for text, borders, and buttons).
*   **Primary Text:** `#111827` (`text-slate-900`) - Pure high contrast.
*   **Secondary Text:** `#64748B` (`text-slate-500`) - Data points.
*   **Tertiary/Labels:** `#94A3B8` (`text-slate-400`), uppercase, tracking-widest (`text-[11px] font-bold`).
*   **Layout Tracking:**
    *   Body text should use slight negative tracking: `letter-spacing: -0.01em;`
    *   Headings should use `letter-spacing: -0.02em;`

## 2. Spacing
*   **Base Unit:** 4px
*   Following Tailwind's default spacing scale (`p-4` = 16px, `mt-8` = 32px, etc).

## 3. Shapes & Geometry (Border Radius)
*   **Border Radius (Standardized):**
    *   **Cards:** 12px (`rounded-[12px]` via `.card` utility).
    *   **General UI (Buttons/Inputs):** 6px to 8px (`rounded-[6px]` or `rounded-md`).
    *   **Status Pills:** 4px (`rounded-[4px]` via `.badge`) for standard status, or 30px (`rounded-[30px]`) for "Attio-style" pill variants.
    *   **Avatars:** Always circular (`rounded-full`).

## 4. Color & Surface
*   **Backgrounds:**
    *   **Canvas/App Background:** Pure White (`#FFFFFF`) to mimic endless paper. 
    *   **Cards/Panels:** Pure White (`bg-white`).
    *   **Wash/Hover states:** Very light gray (`bg-slate-50` or `bg-slate-100/50`).
*   **Borders:**
    *   Extremely subtle linear borders: `border-[#F1F5F9]` (`border-slate-100`) everywhere. Avoid harsh gray-200 or gray-300 borders.
*   **Shadows:**
    *   Cards: `shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)]` (Very soft and elegant).
    *   Inputs/Buttons: `shadow-[0_1px_2px_rgba(0,0,0,0.02)]`.

## 5. Standard Component Patterns

### Buttons
*   **Primary (`.btn-primary`):** `#136cfb` background, white text. `rounded-[6px]`, `px-4 py-2`, `text-[13px] font-medium`. Transitions: `0.2s transform active:scale-98`.
*   **Secondary (`.btn-secondary`):** White background, `border-slate-200/60`. `rounded-[6px]`, `px-4 py-2`, `text-[13px] font-medium`, `shadow-sm (0.02)`.
*   **Ghost (`.btn-ghost`):** `text-slate-500 hover:text-slate-900 hover:bg-slate-50`, `rounded-[6px]`.

### Badges / Status Pills
*   *Format:* `inline-flex text-[12px] font-medium px-2.5 py-1 rounded-[30px]`. Mix-blend multiply for beautiful color bleeding.
*   *Neutral:* `bg-slate-100 text-slate-700 border border-slate-200/50`
*   *Success:* `bg-emerald-50 text-emerald-700 border border-emerald-100/50`

### Table / List Rows
*   **Header:** `bg-white`. `text-[12px] font-bold uppercase tracking-widest text-slate-400`, `py-4 border-b border-slate-100`.
*   **Row:** `bg-white text-[14px] text-slate-900 border-b border-slate-100 hover:bg-slate-50 transition-colors`.

### Form Inputs (`.input`)
*   Label: `text-[14px] font-medium text-slate-700 mb-1.5`.
*   Input Field: `bg-white border border-slate-200/60 rounded-[6px] py-2 px-3 text-[13px] font-medium shadow-sm (0.02) focus:ring-1 focus:ring-slate-300 focus:border-slate-300 transition-all`.

### New Linear Patterns (Attio Style)
*   **Linear Schedule:** Hairline divided rows (`border-b border-slate-100`), vertical status accent bar (3px wide), circular tinted avatar, minimal outlined status pill.
*   **Vertical Timeline:** Continuous vertical line represented by hairline row dividers, with icon blocks on the left and content justified.
*   **Outlined Status Pills:** `text-[11px] font-semibold px-2.5 py-0.5 rounded-[30px] border`. Use transparent background with 80% opacity (`bg-X-50/80`) and subtle border (`border-X-100/60`).
*   **Card Definition (`.card`):** `bg-white border border-slate-200/60 rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.02)]`.
*   **Chart Tooltips:** Use `BlueTooltip` utilities (`bg-[#136cfb] text-white rounded-[30px] px-4 py-2`).
