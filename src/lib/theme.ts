// Dealt via design-taste-frontend start.mjs:
// Palette: oxblood-grey (stone ground #e2e2e2, surface #d6d6d6, oxblood ink & accent #7d0c14)
// Type: lora (Lora display 400 + Nunito Sans text 400/500)
// Structural deal (place / restaurant):
//   nav: nav-split | footer: footer-visit | close: colour-band (.ground-brand) + close-photo
//   buttons: block | mark: ring | offer: tall-small | place: trio | type-moment: address
//   moment: photo-chapters

export const THEME_PALETTE = {
  bg: "#e2e2e2",
  surface: "#d6d6d6",
  ink: "#7d0c14",
  muted: "#7a4a4e",
  accent: "#7d0c14",
  accentInk: "#e2e2e2",
  action: "#7d0c14",
  actionInk: "#e2e2e2",
  invBg: "#7d0c14",
  invSurface: "#862323",
  invInk: "#e2e2e2",
  invMuted: "#d0b3af",
  invAccent: "#e2e2e2",
  invAccentInk: "#7d0c14",
  invAction: "#e2e2e2",
  invActionInk: "#7d0c14",
} as const;

export const THEME_FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=Lora:wght@400..600&family=Nunito+Sans:wght@400..600&display=swap";

export const THEME_ROOT_CSS = `:root {
  --p-bg: #e2e2e2; --p-surface: #d6d6d6; --p-ink: #7d0c14; --p-muted: #7a4a4e;
  --p-accent: #7d0c14; --p-accent-ink: #e2e2e2; --p-action: #7d0c14; --p-action-ink: #e2e2e2;
  --p-inv-bg: #7d0c14; --p-inv-surface: #862323; --p-inv-ink: #e2e2e2; --p-inv-muted: #d0b3af;
  --p-inv-accent: #e2e2e2; --p-inv-accent-ink: #7d0c14; --p-inv-action: #e2e2e2; --p-inv-action-ink: #7d0c14;
  --font-display: "Lora", Georgia, serif;
  --font-text: "Nunito Sans", system-ui, sans-serif;
  --display-weight: 400;
  --display-tracking: -0.015em;
}`;
