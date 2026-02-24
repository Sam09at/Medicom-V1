# Medicom UI Design System
> **Style Inspiration:** Linear / Attio
> **Core Ethos:** Ultra-clean, hyper-minimalist SaaS. More white space, little edges on corners, very subtle linear borders, crisp micro-typography, high information density without clutter.

## 1. Typography & Scale
*   **Fonts:**
    *   **Primary (Body):** Inter (`font-sans`)
    *   **Heading:** Aspekta 400 (`font-heading`)
    *   **Monospace:** Geist Mono (`font-mono`)
*   **Font Sizes (Specific Requirements):**
    *   **h1:** 76px (`text-[76px]`)
    *   **h2:** 52px (`text-[52px]`)
    *   **body:** 16px (`text-[16px]`) base unit
*   **Text Colors:**
    *   **Primary:** `#111827` (`text-slate-900`) - Used for pure high contrast.
    *   **Secondary:** `#64748B` (`text-slate-500`) - Used for softer data points.
    *   **Tertiary/Labels:** `#94A3B8` (`text-slate-400`), uppercase, tracking-widest (`text-[11px] font-bold`).
*   **Layout Tracking:**
    *   Body text should use slight negative tracking: `letter-spacing: -0.01em;`
    *   Headings should use `letter-spacing: -0.02em;`

## 2. Spacing
*   **Base Unit:** 4px
*   Following Tailwind's default spacing scale (`p-4` = 16px, `mt-8` = 32px, etc).

## 3. Shapes & Geometry (Border Radius)
*   **Border Radius:** 4px (`rounded-[4px]` or `rounded-md`/`rounded`) for almost all major interactive elements.
    *   Cards, Containers, Primary Buttons, and Inputs all share the strict `4px` aesthetic.
    *   **Sub Buttons & Badges:** Use `30px` (`rounded-[30px]`) for specific ghost/secondary buttons, pill badges, and smaller interactive elements to create contrast.

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
*   **Primary:** `#0F0F0F` background, white text. `rounded-[4px]`, `px-5 py-2.5`, `text-[14px] font-medium`, inner top white highlight `box-shadow`.
*   **Secondary/Sub-buttons:** White background, `border-slate-200`. `rounded-[30px]`, `shadow-sm`, subtle gray hover (`hover:bg-slate-50`).
*   **Ghost/Tertiary:** `text-slate-500 hover:text-slate-900 hover:bg-slate-50`, no border, `rounded-[30px]`.

### Badges / Status Pills
*   *Format:* `inline-flex text-[12px] font-medium px-2.5 py-1 rounded-[30px]`. Mix-blend multiply for beautiful color bleeding.
*   *Neutral:* `bg-slate-100 text-slate-700 border border-slate-200/50`
*   *Success:* `bg-emerald-50 text-emerald-700 border border-emerald-100/50`

### Table / List Rows
*   **Header:** `bg-white`. `text-[12px] font-bold uppercase tracking-widest text-slate-400`, `py-4 border-b border-slate-100`.
*   **Row:** `bg-white text-[14px] text-slate-900 border-b border-slate-100 hover:bg-slate-50 transition-colors`.

### Form Inputs
*   Label: `text-[14px] font-medium text-slate-700 mb-1.5`.
*   Input: `bg-white border border-slate-200 rounded-[4px] py-2.5 px-4 text-[14px] shadow-[0_1px_2px_rgba(0,0,0,0.02)] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all`.
