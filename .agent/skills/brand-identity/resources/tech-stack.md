# Preferred Tech Stack & Implementation Rules

When generating code or UI components for this brand, you **MUST** strictly adhere to the following technology choices.

## Core Stack
* **Framework:** React (TypeScript preferred)
* **Styling Engine:** Tailwind CSS (Mandatory. Do not use plain CSS or styled-components unless explicitly asked.)
* **Icons:** Lucide React

## Implementation Guidelines

### 1. Tailwind Usage
* Use utility classes directly in JSX.
* Utilize the color tokens defined in `design-tokens.json` (e.g., use `bg-blue-600 text-white` adhering to the Medicom design).
* **Animations:** Use `animate-in`, `fade-in`, and Tailwind transition classes.

### 2. Component Patterns
* **Buttons:** Primary actions must use the solid Primary color (`bg-blue-600 text-white`). 
* **Forms:** Labels must always be placed *above* input fields. Use standard Tailwind spacing (e.g., `space-y-4` or `gap-4`).
* **Layout:** Use Flexbox and CSS Grid via Tailwind utilities for all layout structures. Rely on `max-w-7xl mx-auto` for main content areas.

### 3. Forbidden Patterns
* Do NOT use jQuery.
* Do NOT use Bootstrap classes.
* Do NOT create new CSS files; keep styles located within component files via Tailwind, unless modifying `globals.css` for base styles.
