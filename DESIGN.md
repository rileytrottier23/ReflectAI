---
version: alpha
name: ReflectAI Journal
description: A calm, private journal. Sage green on cool grey, with serif type that reads like a notebook.
colors:
  primary: "#7A9F60"
  primary-ink: "#496039"
  primary-hover: "#62804D"
  primary-ink-hover: "#314026"
  primary-soft: "#E0E5DC"
  primary-wash: "#F2F4F0"
  secondary: "#4B5563"
  tertiary: "#A57850"
  neutral: "#E0E0E0"
  surface: "#FFFFFF"
  surface-sunken: "#F5F5F5"
  border: "#D1D1D1"
  on-surface: "#000000"
  on-primary: "#FFFFFF"
  error: "#DC2626"
typography:
  display:
    fontFamily: Playfair Display
    fontSize: 48px
    fontWeight: 700
    lineHeight: 1
  headline-lg:
    fontFamily: Playfair Display
    fontSize: 36px
    fontWeight: 700
    lineHeight: 1.1
  headline-md:
    fontFamily: Playfair Display
    fontSize: 30px
    fontWeight: 700
    lineHeight: 1.2
  headline-sm:
    fontFamily: Playfair Display
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.33
  title:
    fontFamily: Playfair Display
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1
  body-lg:
    fontFamily: Lora
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.625
  body-md:
    fontFamily: Lora
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: Lora
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.43
  label-md:
    fontFamily: Lora
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.43
  label-sm:
    fontFamily: Lora
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.33
  code:
    fontFamily: ui-monospace
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  section: 64px
  container: 1280px
  reading: 672px
  header-height: 80px
rounded:
  sm: 8px
  md: 10px
  lg: 12px
  xl: 12px
  full: 9999px
components:
  app-header:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    height: 80px
  button-primary:
    backgroundColor: "{colors.primary-ink}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    height: 40px
    padding: 16px
  button-primary-hover:
    backgroundColor: "{colors.primary-ink-hover}"
  button-on-header:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary-ink}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    height: 40px
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    height: 40px
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.lg}"
    padding: 24px
  card-title:
    textColor: "{colors.on-surface}"
    typography: "{typography.title}"
  page:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-md}"
  helper-text:
    textColor: "{colors.secondary}"
    typography: "{typography.body-sm}"
  status-positive:
    backgroundColor: "{colors.primary-soft}"
    textColor: "{colors.primary-ink}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    height: 40px
  entry-textarea:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-lg}"
    rounded: "{rounded.md}"
    padding: 16px
  mood-slider-thumb:
    backgroundColor: "{colors.tertiary}"
    size: 20px
    rounded: "{rounded.full}"
  inset-panel:
    backgroundColor: "{colors.surface-sunken}"
    textColor: "{colors.on-surface}"
    typography: "{typography.code}"
    rounded: "{rounded.sm}"
    padding: 12px
  hairline:
    backgroundColor: "{colors.border}"
    height: 1px
  soft-section:
    backgroundColor: "{colors.primary-wash}"
    textColor: "{colors.on-surface}"
  icon-accent:
    textColor: "{colors.primary-hover}"
    size: 32px
  error-text:
    textColor: "{colors.error}"
    typography: "{typography.body-sm}"
---

# ReflectAI: design system

Values come from `client/src/index.css` (CSS variables), `tailwind.config.ts` and the shadcn/ui components in `client/src/components/ui/`. If this file and the code disagree, the code wins: fix this file in the same change, and list the mismatch in your reply.

## Overview

ReflectAI is a private journal. People write about their day, rate their mood, and get monthly and annual reports from Claude. The screen people spend most time on is the entry form, so the whole app should feel like a quiet notebook: unhurried, warm in its type, and plain in its chrome. Nothing should compete with what the person is writing.

The look is sage green on cool grey, with white cards for content and serif type throughout. Green means "this is ReflectAI" (the header, the sprout mark) and "do this" (the main action). Everything else is black, grey or white.

The app is light only. `index.css` has a `.dark` block, but it is unused shadcn default values and nothing turns it on. Don't build on it. If dark mode is wanted later, design it as a real pair for each token first.

## Colors

Two core colours (sage and cool grey) and black text. Leather brown is a held-back third.

- **Sage (#7A9F60, `sage-600`):** the brand fill. The app header, the sprout mark, large icons. Only 3.0:1 against white, so it is for fills and graphics, not for small text.
- **Deep sage (#496039, `sage-800`):** the text-safe green. Use it for green text on light backgrounds (5.3:1 on the grey page, 7.0:1 on white) and as the fill for primary buttons with white text (7.0:1).
- **Mid sage (#62804D, `sage-700`):** hover for sage fills and accent icons. 4.45:1 on white, so it falls just short of AA for body text. Use it for icons and large text only.
- **Sage tints (#E0E5DC `sage-100`, #F2F4F0 `sage-50`):** quiet positive backgrounds such as status chips and soft sections.
- **Cool grey (#E0E0E0, `beige-200` / `--background`):** the page. The `beige-*` utilities are named beige but hold neutral greys. Treat them as greys.
- **White (#FFFFFF):** cards, inputs, popovers.
- **Light grey (#F5F5F5 `beige-50`, #D1D1D1 `beige-300`):** sunken panels and all borders.
- **Black (#000000) and grey-600 (#4B5563):** body text and secondary text. Grey-600 passes AA on every surface here (5.7:1 on the page).
- **Leather (#A57850, `leather-500` / `--primary`):** shadcn's `--primary` and focus ring, and the mood-slider thumb. Keep it for those. Don't introduce it elsewhere without a reason, since the app's visible brand is sage.
- **Red (#DC2626):** errors and destructive actions only.

## Typography

Two serifs, one job each:

- **Playfair Display** for headings, the wordmark and card titles (`font-display`, and every `h1` to `h6` by default). Weights 600 and 700.
- **Lora** for everything else, body text, labels and buttons included (set on `body`). Weights 400 and 500.

Inter is loaded in `index.html` and set as Tailwind's `font-sans`, but no screen uses it. Don't start using it. Monospace only appears for setup keys and recovery codes on the security page.

Journal text (the entry textarea and any place an entry is shown back) is Lora 18px at 1.625, so long entries stay comfortable. Reading widths cap at 672px (`max-w-2xl`). Use sentence case everywhere and no all-caps labels.

## Layout

Pages sit in a centred 1280px container (`max-w-7xl`) with 16 / 24 / 32px side padding at mobile, tablet and desktop. Text-heavy pages (security, privacy, contact) narrow to 672 to 896px. Spacing follows Tailwind's 4px scale; cards pad at 24px and stack with 24px gaps; page sections separate at 48 to 64px.

The header is 80px tall and full-width sage. On desktop it holds the sprout mark, wordmark and tabs: Journal, Counselor Reports (a dropdown with Monthly and Annual) and Security. Below 768px the tabs move to a second sage bar of icon-and-label buttons. The current tab is black text on a 20% white wash.

## Elevation & Depth

Mostly flat with one soft lift. Cards are white on the grey page with a 1px light-grey border and `shadow-sm`; the colour step between page and card does most of the work. Only floating things (dropdowns, popovers, dialogs) get `shadow-lg`. Don't use larger shadows, glows or glass.

## Shapes

Gently rounded, which fits a notebook. Cards use 12px (`rounded-lg`), buttons and inputs 10px (`rounded-md`), small chips and code panels 8px. Fully round is for icons in circles, avatars and the slider thumb. Keep that order: containers rounder than the controls inside them.

## Components

All UI comes from shadcn/ui ("new-york" style) in `components/ui/`. Restyle with Tailwind classes at the call site using the tokens above, and don't fork the components.

- **Primary button:** deep sage fill (darker `sage-900` #314026 on hover), white text, 40px tall, Lora 14px medium. One per screen: "Save entry", "Generate report", "Start journaling".
- **Button on the header:** white fill with deep sage text (the "Register" pattern on the landing page).
- **Secondary button:** white with a light-grey border and black text.
- **Card:** white, 12px radius, light-grey border, `shadow-sm`, 24px padding, Playfair title.
- **Entry form:** a textarea with spell check, a 1 to 10 mood slider whose value shows as deep sage text, and one primary save button.
- **Report status:** plain sentences ("Report can be generated") in deep sage; errors say what failed and what to do next.
- **Icons:** Lucide at 16 to 32px. Accent icons sage, others inherit text colour. The sprout is the brand mark; don't add sparkles or other "AI" glyphs.

## Do's and Don'ts

- Do keep green for the brand and the one main action on each screen.
- Do use deep sage (#496039) whenever green carries text, and check 4.5:1 for any new text pairing.
- Do keep the entry text the largest, calmest thing on the journal screen.
- Do write empty and error states in plain words that say what to do next.
- Don't put small white text on `sage-600` or `sage-700`; it fails contrast.
- Don't add new hues, gradient backgrounds or the stock blue/indigo palette.
- Don't use Inter, emoji, all-caps labels or "AI-powered" badges.
- Don't show anyone's journal text in mockups, screenshots or seed data; use clearly fake placeholder text.

## Known gaps

The code doesn't follow all of this yet. These are the places it differs, so an agent doesn't copy them:

| Where | What it does now | What this file says |
|---|---|---|
| Primary buttons (`bg-sage-600 … text-white`) | White on sage-600, 3.0:1 | Deep sage fill, 7.0:1 |
| Header nav text | White on sage-600 at 14 to 18px, 3.0:1 | Needs a darker header or larger text |
| Status lines (`text-sage-600`) | 3.0:1 on white | Deep sage |
| `pages/contact.tsx` | Blue-to-indigo gradient, glass card, its own dark mode | Grey page, white card, sage |
| `pages/auth.tsx` | 27 hard-coded hexes: its own green (#4A6741, close to deep sage), terracotta links (#C2703D), 44px inputs, coloured button shadow | Use the tokens here; links in deep sage |
| `pages/privacy-policy.tsx` | Beige-to-sage gradient background | Flat grey page |
| `index.css` comments | Say "beige" and list hexes that don't match the HSL values | Greys; hexes in this file are computed from the HSL |
