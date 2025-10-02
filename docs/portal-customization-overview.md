# Portal Customization Architecture

## Overview
This document explains how the portal supports per-user customization for language, theme, and monitoring routes, alongside the settings page that exposes these options.

## Global Providers
`web/app/providers.tsx` wraps the entire Next.js app in the language and portal configuration contexts so every page can read or mutate user preferences without prop drilling.【F:web/app/providers.tsx†L1-L14】

## Localization System
The `LanguageProvider` owns the current locale, loads the English and Korean JSON dictionaries, and exposes a `t()` helper for nested key lookups with interpolation and an English fallback.【F:web/app/_i18n/LanguageProvider.tsx†L1-L143】 Translation strings live in `web/app/_i18n/translations/*.json`; they group copy by feature (e.g., `monitoring`, `wol`, `settings`) so UI components can request phrases like `t('settings.appearance.title')`.【F:web/app/_i18n/translations/en.json†L1-L36】 The provider persists the selection to `localStorage` and syncs the document language attribute for accessibility.【F:web/app/_i18n/LanguageProvider.tsx†L72-L112】

## Portal Route Configuration
`PortalConfigProvider` resolves monitoring URLs by merging build-time defaults, environment-driven overrides, and any user-specified replacements stored in `localStorage`.【F:web/app/_settings/PortalConfigProvider.tsx†L1-L82】 Environment defaults are declared in `web/app/(portal)/monitoring/constants.ts` with matching `NEXT_PUBLIC_*` keys so the frontend mirrors `.env.example` values.【F:web/app/(portal)/monitoring/constants.ts†L1-L41】【F:.env.example†L1-L21】

## Settings Page
The `/settings` route consumes both providers to render radio groups for theme and language, editable monitoring URLs with reset support, and a quick Wake-on-LAN target form that reuses the existing API client for submissions.【F:web/app/settings/page.tsx†L1-L260】 Hint text surfaces the associated environment key for each monitoring field so operators know which variables feed the defaults.【F:web/app/settings/page.tsx†L186-L206】 Successful submissions reset the form and show localized status messages, while errors bubble request details where available.【F:web/app/settings/page.tsx†L209-L257】

## Environment Variables
`.env.example` ships with representative backend and frontend defaults, ensuring new deployments understand which variables control API hosts and monitoring dashboards.【F:.env.example†L1-L21】
