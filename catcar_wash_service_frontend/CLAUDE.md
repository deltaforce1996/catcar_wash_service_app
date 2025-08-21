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
- **Language**: TypeScript only (`<script setup lang="ts">`)
- **State Management**: Pinia (via @pinia/nuxt)
- **Linting**: Nuxt ESLint Module (flat config)

### Project Structure

- `pages/` — File-based routing
- `layouts/` — Shared page layouts
- `plugins/vuetify.ts` — Vuetify configuration and theming
- `public/` — Static assets (logos, character images)
  - `Logo/` — Brand logos
  - `Character/` — Cat character illustrations

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
1. Vuetify component props (`color`, `variant`, `elevation`, etc.)
2. Vuetify utility classes (`pa-*`, `ma-*`, `d-flex`, `text-h6`, etc.)
3. Conditional class bindings for state
4. Minimal scoped CSS only if absolutely necessary
5. Avoid inline styles

### Theming

- Define colors centrally in `plugins/vuetify.ts`
- **Required colors**: Orange and yellow primary colors
- Support both light (default) and dark themes
- Use theme tokens, not hardcoded colors

## Limitations

- **No data fetching**: Do not use `useFetch`/`$fetch` or API calls
- **No SEO work**: Internal website only
- **TypeScript strict**: No `any` types, properly type props and emits

## After Making Changes

Always run linting after modifications:
```bash
pnpm lint:fix
```