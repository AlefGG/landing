# Colours and tokens

This project uses Tailwind 4's `@theme` block in `src/index.css` as the
single source of truth for colours, fonts, breakpoints, and spacing
tokens.

## How to add a colour

1. Add a CSS custom property to the `@theme` block in `src/index.css`,
   e.g. `--color-surface-warm: #FFF3D8;`.
2. Use it via the auto-generated utility class:
   `<div className="bg-surface-warm" />`.
3. Never inline hex literals as Tailwind arbitrary values
   (e.g. `bg-[#fff3d8]`). The ESLint rule `no-restricted-syntax` will
   catch this at lint time and the `check:tokens` script will catch
   typos.

## Why

Inline `[#hex]` utilities bypass the palette boundary. The brand greens
were re-darkened once for WCAG 2.1 AA contrast; without a token
boundary, every similar future change leaves drift across pages. See
`docs/superpowers/specs/2026-05-05-fe-ux-004-sec-002-tokens-and-csp-design.md`.
