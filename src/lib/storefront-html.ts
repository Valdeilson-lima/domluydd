import {
  SITE_URL,
  STORE_CITY,
  STORE_INSTAGRAM_URL,
  STORE_MAP_URL,
  STORE_NAME,
  STORE_SHORT_NAME,
  STORE_STREET_DISTRICT,
} from "@/lib/store-config";
import { THEME_FONTS_HREF, THEME_ROOT_CSS } from "@/lib/theme";
import type { StoreStatusData } from "@/types/store";

const PAGE_STYLE = `${THEME_ROOT_CSS}
html {
  scroll-behavior: smooth;
}
body {
  line-height: 1.6;
}
::selection {
  background: #962413;
  color: #ffffff;
}
.nav__logo {
  font-family: var(--font-display);
  font-weight: 500;
  letter-spacing: -0.02em;
}
.nav {
  background: #f8f5ef !important;
  color: #1f1b18 !important;
  border-bottom: 1px solid rgba(31, 27, 24, 0.14) !important;
}
.nav__logo,
.nav__link,
.nav__actions .nav__link,
.nav__toggle {
  color: #1f1b18 !important;
}
.nav__link:hover,
.nav__link:focus-visible {
  color: #962413 !important;
}
.nav__logo .mark {
  background: #962413 !important;
  box-shadow: 0 0 0 3px var(--p-bg), 0 0 0 4px rgba(150, 36, 19, 0.28);
}
.ground-brand {
  background: #962413 !important;
  color: #ffffff !important;
}
.ground-brand :is(h1, h2, h3, p, address, dt, dd, span, .section-head, .footer__address) {
  color: #f8f5ef !important;
}
.ground-brand a {
  color: #ffffff !important;
}
.ground-brand a:hover,
.ground-brand a:focus-visible {
  color: #ffffff !important;
  text-decoration-thickness: 2px !important;
}
.ground-brand .btn--primary {
  background: #f8f5ef !important;
  color: #962413 !important;
  border-color: #f8f5ef !important;
  font-weight: 600;
}
.ground-brand .btn--primary:hover {
  background: #ffffff !important;
  color: #7d1c0e !important;
}
.ground-brand :focus-visible {
  outline-color: #ffffff;
}
.ground-brand .footer__legal,
.ground-brand .closing__links h3,
.ground-brand .closing__links p,
.ground-brand .closing__links dd {
  color: #f8f5ef !important;
  opacity: 1 !important;
}
.hero__text h1 {
  max-width: 13ch;
  text-wrap: balance;
}
.hero__lead {
  max-width: 35rem;
  color: var(--p-ink);
  text-wrap: pretty;
}
.section-head h2,
.mo-ph__head h2,
.closing h2 {
  text-wrap: balance;
}
.section-head p,
.mo-ph__head p {
  color: var(--p-muted);
}
.rows li,
.mo-ph__ch,
.visit__address {
  transition: border-color 180ms ease, color 180ms ease;
}
.rows li:hover {
  border-color: var(--p-accent);
}
.rows__name {
  font-weight: 600;
  color: var(--p-ink);
}
.rows__value {
  font-weight: 600;
  color: var(--p-ink);
}
.btn,
.nav__link,
.link {
  transition-duration: 180ms;
  transition-timing-function: ease-out;
}
.btn--primary {
  font-weight: 600;
}
.link {
  color: var(--p-ink);
  text-decoration-color: rgba(150, 36, 19, 0.45);
}
.link:hover {
  color: var(--p-accent);
  text-decoration-color: var(--p-accent);
}
:focus-visible {
  outline: 2px solid #962413;
  outline-offset: 3px;
}
@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }
  *,
  *::before,
  *::after {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
  }
}
.rows .rows__name small {
  display: block;
  margin-top: 2px;
  font-weight: 400;
  color: var(--p-muted);
  font-size: 15px;
  line-height: 1.45;
}
.visit__address {
  font-family: var(--font-display);
  font-weight: var(--display-weight, 400);
  font-size: var(--t-h2);
  line-height: 1.12;
  letter-spacing: var(--display-tracking, -0.02em);
  margin: 0;
}
.visit__status {
  font-size: 15px;
  font-weight: 500;
  color: var(--p-muted);
  margin: 0;
}
.closing__band {
  width: 100%;
}
.closing__cta-col {
  display: grid;
  gap: var(--s-5);
  align-content: start;
  justify-items: start;
}
.closing .btn--xl {
  min-width: 0;
}
.footer .link-icon {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.footer .closing__links h3 {
  font-family: var(--font-text);
  font-size: var(--t-label);
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--inv-muted, var(--muted));
  margin: 0;
}
@media (min-width: 1024px) {
  .closing.footer--visit {
    height: 100svh;
    min-height: 100svh;
    display: flex;
    align-items: stretch;
  }
  .closing.footer--visit > .wrap {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
}
@media (min-width: 1024px) and (max-width: 1279px) {
  #visita .pl-photo {
    --pl-r: 0.92 !important;
  }
  #cardapio .pl-photo {
    --pl-r: 1.1 !important;
  }
  footer#contato.closing {
    --padt: 64px;
    --padb: 48px;
  }
}
@media (max-width: 1023px) {
  .grid > .span-6 + .pl-photo,
  .grid > .span-6 + figure {
    margin-top: 32px;
  }
  #visita.section,
  #cardapio.section {
    min-height: 100svh;
  }
  #visita .pl-photo {
    --pl-r: 1.95 !important;
  }
  #cardapio {
    --padt: 76px;
    --padb: 40px;
  }
  #cardapio .section-head {
    margin-bottom: 16px;
  }
  #cardapio .pl-photo {
    margin-top: 28px;
    --pl-r: 2.15 !important;
  }
  #cardapio .rows li {
    padding-block: 7px;
  }
  footer#contato.closing {
    --padt: 36px;
    --padb: 32px;
  }
  footer#contato .section-head {
    margin-bottom: 12px;
  }
  footer#contato .closing__photo-wrap {
    margin-top: 20px;
    --pl-r: 3.1 !important;
  }
  footer#contato .closing__links {
    margin-top: 18px;
    padding-top: 16px;
  }
}
@media (min-width: 768px) and (max-width: 1023px) {
  #forno {
    min-height: 100svh;
  }
  #forno .mo-ph__pic img {
    aspect-ratio: 4 / 5;
  }
  footer#contato.closing {
    min-height: 100svh;
  }
}
@media (max-width: 767px) {
  #visita .hours {
    gap: 6px 12px;
  }
  #cardapio {
    --padt: 64px;
    --padb: 28px;
  }
  #cardapio .rows .rows__name small {
    font-size: 14px;
  }
  #cardapio .pl-photo {
    margin-top: 24px;
    --pl-r: 2.1 !important;
  }
  #forno {
    min-height: 200svh;
  }
  #forno .mo-ph__list {
    gap: 20px;
  }
  #forno .mo-ph__pic img {
    aspect-ratio: 4 / 3;
  }
  footer#contato.closing {
    min-height: 100svh;
    --padt: 32px;
    --padb: 28px;
  }
  footer#contato .closing__photo-wrap {
    display: none;
  }
}
@media (max-width: 360px) {
  .nav:not(.is-open) .nav__actions .btn {
    padding-inline: 10px;
    font-size: 13px;
  }
}
`;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderStorefrontHtml(status: StoreStatusData): string {
  const statusText = status.isOpen
    ? /^aberto/i.test(status.nextLabel)
      ? status.nextLabel
      : `Aberto agora: ${status.nextLabel}`
    : status.customMessage
      ? `Fechado agora: ${status.customMessage}`
      : /^fechado/i.test(status.nextLabel)
        ? status.nextLabel
        : `Fechado agora: ${status.nextLabel}`;

  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: STORE_NAME,
    url: SITE_URL,
    servesCuisine: "Pizza",
    priceRange: "R$ 25 - R$ 110",
    openingHours: "Tu-Su 18:00-22:00",
    address: {
      "@type": "PostalAddress",
      streetAddress: STORE_STREET_DISTRICT,
      addressLocality: STORE_CITY,
      addressRegion: "PB",
      addressCountry: "BR",
    },
  });

  const pageTitle = `${STORE_NAME}: pizza fresca no Centro de João Pessoa`;
  const pageDesc =
    "Trinta e oito sabores salgados e doces assados na hora em forno elétrico no Centro de João Pessoa, de terça a domingo, 18h às 22h. Pequena a partir de R$ 25.";

  return `<!doctype html>
<html lang="pt-BR" data-type="place" data-radius="sharp" data-buttons="block" data-motion>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${escapeHtml(pageTitle)}</title>
<meta name="description" content="${escapeHtml(pageDesc)}">
<meta property="og:type" content="website">
<meta property="og:locale" content="pt_BR">
<meta property="og:site_name" content="${escapeHtml(STORE_NAME)}">
<meta property="og:title" content="${escapeHtml(pageTitle)}">
<meta property="og:description" content="${escapeHtml(pageDesc)}">
<meta property="og:url" content="${escapeHtml(SITE_URL)}/">
<meta property="og:image" content="${escapeHtml(SITE_URL)}/share.jpg">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<meta name="theme-color" content="#f8f5ef">
<link rel="canonical" href="${escapeHtml(SITE_URL)}/">
<meta name="site-kind" content="other">
<meta name="page-type" content="place">
<meta name="page-kind" content="place">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${THEME_FONTS_HREF}">
<link rel="stylesheet" href="/assets/system.css">
<link rel="stylesheet" href="/assets/ui/cards.css">
<link rel="stylesheet" href="/assets/motion/motion.css">
<link rel="stylesheet" href="/assets/layout/layout.css">
<link rel="stylesheet" href="/assets/icons/icon.css">
<style>
${PAGE_STYLE}
</style>
<script>document.documentElement.classList.add('m-enter');setTimeout(()=>document.documentElement.classList.add('m-enter-done'),700)</script>
<script>document.documentElement.classList.add('mo-js');setTimeout(()=>document.documentElement.classList.add('mo-safe'),2500)</script>
<link rel="modulepreload" href="/assets/moments/moments.js">
<link rel="modulepreload" href="/assets/moments/lib.js">
<link rel="modulepreload" href="/assets/moments/photo-chapters/moment.js">
<script type="application/ld+json">${jsonLd}</script>
</head>
<body>
<header class="nav nav--split">
  <div class="wrap nav__bar">
    <a class="skip-link" href="#top">Pular para o conteúdo</a>
    <a class="nav__logo" href="#top" translate="no"><span class="mark" data-mark="ring" aria-hidden="true"></span>${escapeHtml(STORE_SHORT_NAME)}</a>
    <nav class="nav__links" aria-label="Navegação principal">
      <div class="nav__item"><a class="nav__link" href="#visita">Horário da pizzaria</a></div>
      <div class="nav__item"><a class="nav__link" href="#cardapio">Cardápio da pizzaria</a></div>
      <div class="nav__item"><a class="nav__link" href="#forno">Forno da pizzaria</a></div>
    </nav>
    <div class="nav__actions">
      <a class="btn btn--primary" href="/cardapio">Ver cardápio</a>
    </div>
    <button class="nav__toggle" type="button" aria-expanded="false" aria-label="Menu">
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M2 5h14M2 13h14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
    </button>
  </div>
</header>

<main id="top">
  <section class="hero hero--place" data-enter aria-labelledby="hero-h">
    <picture class="hero__bg" data-phone-fill>
      <source media="(max-width: 767px)" srcset="/assets/img/photo-f79703781-500.jpg">
      <img src="/assets/img/photo-f159446387-1280.jpg" srcset="/assets/img/photo-f159446387-960.jpg 960w, /assets/img/photo-f159446387-1280.jpg 1280w" sizes="100vw" width="1280" height="960" alt="Pizza assada com mussarela fresca e folhas de manjericão" fetchpriority="high" decoding="async" data-source="stand-in" data-subject="stand-in" style="--ly-pos: 50% 55%">
    </picture>
    <div class="wrap">
      <div class="hero-text">
        <div class="hero__text">
          <h1 id="hero-h">Don Luydd: pizzaria no Centro</h1>
          <p class="hero__lead">Trinta e oito sabores entre salgadas e doces no forno elétrico, opção meio a meio e entrega em doze bairros a partir de R$ 25.</p>
          <div class="btn-row"><a class="btn btn--primary" href="#cardapio">Ver sabores de pizza</a></div>
        </div>
      </div>
    </div>
  </section>

  <section class="section visit" id="visita" aria-labelledby="visita-h">
    <div class="wrap grid grid--top">
      <div class="span-6 stack-4">
        <div class="section-head">
          <h2 id="visita-h">Horário da pizzaria</h2>
          <p class="visit__address">${escapeHtml(STORE_STREET_DISTRICT)}, ${escapeHtml(STORE_CITY)}</p>
        </div>
        <p class="visit__status">${escapeHtml(statusText)}</p>
        <dl class="hours" data-tz="America/Fortaleza">
          <dt>Terça a domingo</dt><dd>18h às 22h</dd>
          <dt>Segunda-feira</dt><dd>Fechado</dd>
          <dt>Tamanhos</dt><dd>P (4), M (6) e G (8 fatias)</dd>
          <dt>Atendimento</dt><dd>Entrega em 12 bairros ou balcão</dd>
        </dl>
        <p><a class="link" href="${escapeHtml(STORE_MAP_URL)}" target="_blank" rel="noopener noreferrer">Ver mapa do bairro</a></p>
      </div>
      <figure class="pl-photo pl-photo--end span-6 inset-s-7" style="--pl-r: 1.05">
        <img src="/assets/img/photo-f154799608-960.jpg" srcset="/assets/img/photo-f154799608-500.jpg 500w, /assets/img/photo-f154799608-960.jpg 960w" sizes="(max-width: 1023px) 100vw, 50vw" width="960" height="720" alt="Pizza margherita servida inteira em prato de cerâmica" loading="lazy" decoding="async" data-source="stand-in" data-subject="stand-in">
      </figure>
    </div>
  </section>

  <section class="section" id="cardapio" aria-labelledby="cardapio-h">
    <div class="wrap grid grid--top">
      <div class="span-6 stack-4">
        <div class="section-head">
          <h2 id="cardapio-h">Cardápio da pizzaria</h2>
          <p>Trinta e duas salgadas, seis doces, quatro combos e bebidas geladas.</p>
        </div>
        <ul class="rows">
          <li><span class="rows__name">Calabresa<small>Mussarela, calabresa fatiada e cebola</small></span><span class="rows__value">R$ 30–40</span></li>
          <li><span class="rows__name">Marguerita<small>Mussarela, manjericão fresco e tomate</small></span><span class="rows__value">R$ 30–40</span></li>
          <li><span class="rows__name">4 Queijos<small>Mussarela, catupiry, parmesão e provolone</small></span><span class="rows__value">R$ 35–45</span></li>
          <li><span class="rows__name">Carne de Sol ou Chocolate<small>Clássica nordestina ou sobremesa assada na hora</small></span><span class="rows__value">R$ 25–45</span></li>
        </ul>
        <p><a class="link" href="/cardapio">Ver todos os 38 sabores no cardápio</a></p>
      </div>
      <figure class="pl-photo pl-photo--end span-6 inset-s-7" style="--pl-r: 1.15">
        <img src="/assets/img/photo-f106092414-960.jpg" srcset="/assets/img/photo-f106092414-500.jpg 500w, /assets/img/photo-f106092414-960.jpg 960w" sizes="(max-width: 1023px) 100vw, 48vw" width="960" height="761" alt="Pizza assada com queijo derretido e vegetais frescos em prato" loading="lazy" decoding="async" data-source="stand-in" data-subject="stand-in">
      </figure>
    </div>
  </section>

  <section class="section" id="forno" data-moment="photo-chapters" aria-labelledby="forno-h">
    <div class="wrap mo-ph">
      <div class="mo-ph__head">
        <h2 id="forno-h">Forno da pizzaria</h2>
        <p>Massa descansada vinte e quatro horas, assada na pedra e entregue em doze bairros.</p>
      </div>
      <ol class="mo-ph__list">
        <li class="mo-ph__ch">
          <figure class="mo-ph__pic"><img src="/assets/img/photo-f138018810-960.jpg" srcset="/assets/img/photo-f138018810-500.jpg 500w, /assets/img/photo-f138018810-960.jpg 960w" sizes="(max-width: 1023px) 100vw, 48vw" width="960" height="720" alt="Disco de massa aberto na bancada recebendo molho de tomate e cobertura fresca" loading="lazy" decoding="async" data-source="stand-in" data-subject="stand-in"></figure>
          <h3>Massa da pizzaria na bancada</h3>
          <p>Cada disco sai nos tamanhos de quatro, seis ou oito fatias, com dois sabores na média e na grande.</p>
        </li>
        <li class="mo-ph__ch">
          <figure class="mo-ph__pic"><img src="/assets/img/photo-f41882039-960.jpg" srcset="/assets/img/photo-f41882039-500.jpg 500w, /assets/img/photo-f41882039-960.jpg 960w" sizes="(max-width: 1023px) 100vw, 48vw" width="960" height="720" alt="Pizza assada por igual com borda firme e queijo derretido sobre madeira" loading="lazy" decoding="async" data-source="stand-in" data-subject="stand-in"></figure>
          <h3>Forno elétrico da pizzaria</h3>
          <p>Calor uniforme por cima e por baixo na pedra deixa o fundo crocante sem ressecar o queijo.</p>
        </li>
        <li class="mo-ph__ch">
          <figure class="mo-ph__pic"><img src="/assets/img/photo-f70250769-960.jpg" srcset="/assets/img/photo-f70250769-500.jpg 500w, /assets/img/photo-f70250769-960.jpg 960w" sizes="(max-width: 1023px) 100vw, 48vw" width="960" height="720" alt="Pizza margherita fatiada acomodada na caixa térmica para entrega" loading="lazy" decoding="async" data-source="stand-in" data-subject="stand-in"></figure>
          <h3>Caixa térmica da pizzaria</h3>
          <p>Vai direto da pá para a entrega em doze bairros ou retirada rápida no balcão do Centro.</p>
        </li>
      </ol>
    </div>
  </section>
</main>

<footer class="footer closing footer--visit ground-brand" id="contato" aria-labelledby="close-h">
  <div class="wrap">
    <div class="grid grid--top closing__band">
      <div class="span-6 closing__cta-col">
        <div class="section-head">
          <h2 id="close-h">Pedir pizza online</h2>
          <p class="t-lead">Escolha inteira ou meio a meio, borda e pagamento.</p>
        </div>
        <div class="btn-row">
          <a class="btn btn--primary" href="/cardapio">Ver cardápio<svg class="m-arrow" viewBox="0 0 12 12" aria-hidden="true"><path class="m-arrow__stem" d="M1 6h8"/><path class="m-arrow__head" d="M4.5 2.5 8 6l-3.5 3.5"/></svg></a>
        </div>
      </div>
      <figure class="pl-photo pl-photo--end span-6 inset-s-7 closing__photo-wrap" style="--pl-r: 1.5">
        <img src="/assets/img/photo-f100303227-960.jpg" srcset="/assets/img/photo-f100303227-500.jpg 500w, /assets/img/photo-f100303227-960.jpg 960w" sizes="(max-width: 1023px) 100vw, 48vw" width="960" height="720" alt="Fatias de pizza margherita assadas servidas em prato" loading="lazy" decoding="async" data-source="stand-in" data-subject="stand-in">
      </figure>
    </div>

    <div class="closing__links">
      <div class="grid">
        <div class="span-6 stack-4">
          <address class="footer__address">${escapeHtml(STORE_STREET_DISTRICT)}, ${escapeHtml(STORE_CITY)}</address>
          <p><a class="link" href="${escapeHtml(STORE_MAP_URL)}" target="_blank" rel="noopener noreferrer">Ver mapa do bairro</a></p>
          <p><a class="link link-icon" href="${escapeHtml(STORE_INSTAGRAM_URL)}" target="_blank" rel="noopener noreferrer"><img class="icon-mono" src="/assets/icons/instagram.svg" width="16" height="16" alt="" loading="lazy" aria-hidden="true">Instagram</a></p>
        </div>
        <div class="span-6 inset-s-7 stack-4">
          <h3>Horário da pizzaria</h3>
          <dl class="hours">
            <dt>Terça a domingo</dt><dd>18h às 22h</dd>
            <dt>Segunda-feira</dt><dd>Fechado</dd>
            <dt>Sabores</dt><dd><a class="link" href="/cardapio">38 sabores no cardápio</a></dd>
          </dl>
        </div>
      </div>
      <div class="footer__legal">
        <span>© 2026 ${escapeHtml(STORE_NAME)}</span>
        <a href="/credits.html">Créditos das fotografias</a>
      </div>
    </div>
  </div>
</footer>

<script type="module" src="/assets/system.js"></script>
<script type="module" src="/assets/motion/motion.js"></script>
<script type="module" src="/assets/layout/layout.js"></script>
</body>
</html>`;
}
