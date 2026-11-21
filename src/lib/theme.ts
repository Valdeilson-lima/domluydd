// Palette: chalk-tomato (AAA-tuned for restaurant readability)
//   warm ivory ground #f8f5ef, warm linen surface #ede7dc, deep espresso ink #1f1b18 (15.7:1),
//   warm umber muted #534b43 (7.86:1), roasted tomato accent #962413 (8.21:1 with #ffffff, 7.54:1 with #f8f5ef)
// Type: Roboto (400..700 variable sans-serif for display and body text)
// Structural deal (place / restaurant):
//   nav: nav-split | footer: footer-visit | close: colour-band (.ground-brand) + close-photo
//   buttons: block | mark: ring | offer: tall-small | place: trio | type-moment: address
//   moment: photo-chapters

export const THEME_PALETTE = {
  bg: "#f8f5ef",
  surface: "#ede7dc",
  ink: "#1f1b18",
  muted: "#534b43",
  accent: "#962413",
  accentInk: "#ffffff",
  action: "#962413",
  actionInk: "#ffffff",
  invBg: "#1f1b18",
  invSurface: "#2c2724",
  invInk: "#f8f5ef",
  invMuted: "#c9c2b8",
  invAccent: "#f8f5ef",
  invAccentInk: "#1f1b18",
  invAction: "#f8f5ef",
  invActionInk: "#1f1b18",
} as const;

export const THEME_FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,400..700;1,400..700&display=swap";

export const THEME_ROOT_CSS = `:root {
  --p-bg: #f8f5ef; --p-surface: #ede7dc; --p-ink: #1f1b18; --p-muted: #534b43;
  --p-accent: #962413; --p-accent-ink: #ffffff; --p-action: #962413; --p-action-ink: #ffffff;
  --p-inv-bg: #1f1b18; --p-inv-surface: #2c2724; --p-inv-ink: #f8f5ef; --p-inv-muted: #c9c2b8;
  --p-inv-accent: #f8f5ef; --p-inv-accent-ink: #1f1b18; --p-inv-action: #f8f5ef; --p-inv-action-ink: #1f1b18;
  --font-display: "Roboto", system-ui, sans-serif;
  --font-text: "Roboto", system-ui, sans-serif;
  --display-weight: 500;
  --display-tracking: -0.02em;
}`;
