# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**CatCarWash** - Car wash coin operated service (ล้างรถหยอดเหรียญ)

This is a Nuxt 3 frontend application for a coin-operated car wash service with Vue 3, Vuetify 3, and TypeScript. The application targets Thai users and requires all UI text to be in Thai.

## Development Commands

**Package manager**: pnpm (required)

```bash
# Install dependencies
pnpm install

# Development server (http://localhost:3000)
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Linting and fixing
pnpm lint
pnpm lint:fix
```

## Tech Stack & Architecture

- **Framework**: Nuxt 3 with Vue 3 Composition API
- **UI Library**: Vuetify 3 (with Material Design Icons)
- **Charts**: Chart.js with vue-chartjs
- **Language**: TypeScript only (`<script setup lang="ts">`)
- **State Management**: Pinia (via @pinia/nuxt)
- **Linting**: Nuxt ESLint Module (flat config)
- **Formatting**: Prettier

### Project Structure

- `pages/` — File-based routing
- `layouts/` — Shared page layouts
- `components/` — reusable presentational and small logic components
- `stores/` — Pinia stores
- `composables/` — reusable Composition API utilities (UI-independent)
- `plugins/vuetify.ts` — Vuetify configuration and theming
- `public/` — Static assets (logos, character images)
  - `Logo/` — Brand logos
  - `Character/` — Cat character illustrations
- `styles/` — global styles or tokens if absolutely necessary (keep minimal with Vuetify)
- `utils/` — pure helpers (no Vue imports)
- `types/` — shared TypeScript types/interfaces

## Critical Requirements

### Thai Language Policy

**ALL user-facing text MUST be in Thai** - this is non-negotiable:

- All headings, buttons, labels, placeholders
- All form validation messages and error messages
- All navigation, notifications, and modal content
- Use proper Thai grammar and formal tone for professional contexts

**Exceptions**: Developer comments, variable names, console logs can remain in English.

### Vue Component Conventions

**Strict attribute order** must be followed (enforced by ESLint):

1. DEFINITION (`is`)
2. LIST_RENDERING (`v-for`)
3. CONDITIONALS (`v-if`, `v-else-if`, `v-else`, `v-show`, `v-cloak`)
4. RENDER_MODIFIERS (`v-once`, `v-pre`)
5. GLOBAL ATTRIBUTES (`id`)
6. UNIQUE ATTRIBUTES (`ref`, `key`, `v-slot`, `slot`)
7. TWO_WAY_BINDING (`v-model`)
8. OTHER_DIRECTIVES (`v-*`)
9. OTHER_ATTR (props, `class`, `type`)
10. EVENTS (`@click`)
11. CONTENT (`v-text`, `v-html`)

### Styling Approach (Vuetify-first)

**Order of preference**:

1. Vuetify component props (`color`, `variant`, `rounded`, `elevation`, `density`, `size`, etc.)
2. Vuetify utility classes (`pa-*`, `ma-*`, `d-flex`, `align-*`, `justify-*`, typography classes like `text-h6`, sizing like `w-100`, grid via `VContainer`/`VRow`/`VCol`)
3. Conditional class bindings for state
4. Minimal scoped CSS or inline styles only if absolutely necessary

- Use Vuetify layout and structure primitives first: `VContainer`, `VRow`, `VCol`, `VSpacer`, `VDivider`, `VSheet`, `VCard`.
- Maintain a clean, modern aesthetic: generous whitespace, clear hierarchy, consistent spacing (`pa-*` / `ma-*`), modest rounded corners, controlled elevation, and accessible color contrast.
- Reference: [Vuetify Components & Utilities](https://vuetifyjs.com/en/components/all/#containment)

### Theming

- **All colors are defined in `plugins/vuetify.ts`** - reference this file for available theme colors
- Current available colors: `primary` (#f57f2a), `primary-darken-1` (#e56b1a), `secondary` (#ff9800), `secondary-darken-1` (#f57c00), `accent` (#ffc107), `error`, `warning`, `info`, `success`, and surface variants
- Support both dark (default) and light themes
- **NEVER hallucinate theme color names** - only use colors defined in the Vuetify config
- If additional colors are needed, add them to the `plugins/vuetify.ts` theme configuration first
- Use theme tokens (e.g., `color="primary"`) not hardcoded hex values

## Limitations

- **No data fetching**: Do not use `useFetch`/`$fetch` or API calls
- **No SEO work**: Internal website only
- **TypeScript strict**: No `any` types, properly type props and emits

## Dashboard Design System & Patterns

### Layout Structure

**Dashboard Container**

- Max-width: 1400px with auto centering
- Responsive padding: 24px (desktop) → 16px (tablet) → 12px (mobile)

**Section Hierarchy**

1. **Header Section** (`mb-8`): Page title + action buttons (date picker, filter, export)
2. **KPI Cards Section** (`mb-8`): Three-column grid for metrics with charts
3. **Data Table Section**: Card container with filters and table

### Component Patterns

**Filter System Architecture**

- **Temporary State Pattern**: All filters use temp variables until "ยืนยันตัวกรอง" (Confirm) is clicked
- **Filter Row Layout**: 3-column grid (search | time range | service type)
- **Filter Actions**: Right-aligned with 6-unit top margin (`mt-6`) for proper spacing
- **Consistent Field Props**: `variant="outlined"`, `density="compact"`, `hide-details`

**Data Table Enhancements**

- Custom slot templates for all columns
- Money formatting: `text-success` class with Thai locale
- Chips in table use `variant="tonal"` vs `variant="flat"` in filters
- Consistent typography: `text-body-2` with `font-weight-medium` for emphasis

### Spacing & Typography Scale

**Consistent Margin Classes**

- Section separation: `mb-8` (32px)
- Filter actions: `mt-6` (24px)
- Card content: `pa-6` (24px for card titles)
- Form field gaps: `ga-2` or `ga-3`

**Typography Hierarchy**

- Page titles: `text-h4 font-weight-bold`
- Card titles: `text-h5 font-weight-bold`
- Subtitles: `text-subtitle-2`
- Table content: `text-body-2`

### Responsive Behavior

**Breakpoint Strategy**

- Desktop: Full 3-column layout
- Tablet (≤960px): Maintained layout with reduced padding
- Mobile (≤600px): Stacked filters, minimal spacing

### State Management Patterns

**Filter Workflow**

1. All user inputs modify temporary variables (`temp*`)
2. Only "ยืนยันตัวกรอง" applies temp values to actual filter state
3. "ล้างตัวกรอง" clears both temp and actual values
4. `onMounted()` initializes temp values from actual state

**Color Semantic System**

```javascript
const getServiceTypeColor = (serviceType: string) => {
  switch (serviceType) {
    case "เบสิก":
      return "primary";
    case "ดีลักซ์":
      return "secondary";
    case "พรีเมียม":
      return "success";
    case "จักรยานยนต์":
      return "info";
    default:
      return "primary";
  }
};
```

### Critical Design Rules

1. **Always use temporary state for filters** - never directly modify filter state
2. **Maintain chip color consistency** - same colors across filter and table
3. **Follow spacing scale** - use Vuetify's spacing units (`pa-*`, `ma-*`, `ga-*`)
4. **Preserve Thai text formatting** - proper locale for numbers and dates
5. **Keep responsive scaling** - test all breakpoints for filter usability

## After Making Changes

Always run linting after modifications:

```bash
pnpm lint:fix
```

If lint error after running command attempt to fix it.
