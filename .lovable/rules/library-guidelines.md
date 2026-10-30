# Whisly — Guidelines

## Components

The design system exports these components — import them from `@ws-df3b7922922c396ba326/b44532a3-67c4-449f-8613-3f6b7bfbe43a` and compose them before building anything from scratch:

`AdSlot`, `AudioPlayer`, `Badge`, `BottomNav`, `Constants`, `CountrySelect`, `DialogClose`, `DialogContent`, `DialogDescription`, `DialogFooter`, `DialogHeader`, `DialogOverlay`, `DialogPortal`, `DialogTitle`, `DialogTrigger`, `Dialog`, `DropdownMenuCheckboxItem`, `DropdownMenuContent`, `DropdownMenuGroup`, `DropdownMenuItem`, `DropdownMenuLabel`, `DropdownMenuPortal`, `DropdownMenuRadioGroup`, `DropdownMenuRadioItem`, `DropdownMenuSeparator`, `DropdownMenuShortcut`, `DropdownMenuSubContent`, `DropdownMenuSubTrigger`, `DropdownMenuSub`, `DropdownMenuTrigger`, `DropdownMenu`, `Field`, `GoogleIcon`, `GooglePayButton`, `GradientButton`, `I18nProvider`, `LanguageSwitcher`, `LogoMark`, `Logo`, `PayPalCheckout`, `StoryCard`, `SupportDialog`, `WaveFooter`

Per-component details (import stanzas, props, variants, examples) live in `.lovable/rules/libraries/{slug}/components.md` — on disk, not auto-loaded. Read that file or the component source when the name alone isn't enough.

## Theme Files

The design system's theme is delivered through the following files. The author's original source files carry the full wiring the design system needs — variable declarations, framework-specific directives, provider objects, etc. — and are the canonical import target.

- `@ws-df3b7922922c396ba326/b44532a3-67c4-449f-8613-3f6b7bfbe43a/styles.css` (source — preferred import)
- `@ws-df3b7922922c396ba326/b44532a3-67c4-449f-8613-3f6b7bfbe43a/dist/tokens.css` (auto-generated flat list of CSS custom properties — a raw-values fallback only; does NOT carry framework-specific wiring that the source files above provide)

