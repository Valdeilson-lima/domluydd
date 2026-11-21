<div align="center">
  <br />
  <h1>Don Luydd Pizzaria</h1>
  <p><strong>Vitrine, Cardápio Digital, Rastreio ao Vivo & Painel Admin/KDS</strong></p>
  <p>Plataforma completa de pedidos online de pizzaria artesanal em João Pessoa (PB) com Next.js 16, Supabase (PostgreSQL + Auth + Realtime), Cloudinary, PWA e notificações no WhatsApp.</p>
  <br />
</div>

## Visão Geral

A aplicação **Don Luydd Pizzaria** reúne em um único projeto Next.js (App Router):

- **Vitrine (`/`)**: página inicial dinâmica com status de abertura em tempo real, destaques do forno, combos, horários configuráveis e bairros atendidos.
- **Cardápio Digital (`/cardapio`)**: pizzas salgadas e doces, combos personalizáveis (sabores + refrigerantes) e bebidas geladas com busca, filtros e atualização em tempo real via Supabase Realtime.
- **Páginas por sabor (`/pizza/[slug]`)**: páginas dinâmicas otimizadas para SEO (`sitemap.ts`, `robots.ts`, `llms.txt`) com configurador de tamanho (P/M/G), meio a meio, bordas recheadas, adicionais e retiradas configuráveis.
- **Acompanhamento de pedido (`/pedido/[id]`)**: linha do tempo atualizada automaticamente em cada etapa do preparo e entrega, com atalho direto para o WhatsApp.
- **Painel Admin & KDS (`/admin`)**:
  - **Autenticação via Supabase Auth** com perfis **Dono (`owner`)** e **Cozinha (`kitchen`)** em cookies `HttpOnly`.
  - **Pedidos (KDS)**: Kanban/Grade com alertas sonoros, controle de SLA (`>= 35 min`), resumo de forno, botão rápido de **Estoque** e fechamento de caixa (Dono).
  - **Produtos (Dono)**: CRUD completo de Pizzas, Bebidas, Combos, Bordas/Adicionais e Bairros/Taxas com upload direto de fotos para o **Cloudinary**.
  - **Configurações**: Loja Aberta/Fechada/Automático, dados de contato, chave PIX, grade semanal de horários, retiradas rápidas, **Impressora Térmica USB (ESC/POS 80mm)** e gestão de equipe.
- **PWA instalável**: `manifest.webmanifest`, service worker ([public/sw.js](public/sw.js)) e página offline ([public/offline.html](public/offline.html)).

## Tecnologias

| Tecnologia                                  | Uso                                                                                                                    |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Next.js 16 (App Router)**                 | Renderização dinâmica SSR, API Routes e otimização de fontes (`Bricolage Grotesque` + `Plus Jakarta Sans`)             |
| **React 19 + TypeScript 6**                 | Interface tipada e componentes interativos                                                                             |
| **Tailwind CSS 4**                          | Design System unificado (_Forno Quente & Delivery Contemporâneo_)                                                      |
| **Radix UI Dialog + Lucide React**          | Modais/gavetas acessíveis e iconografia                                                                                |
| **Supabase (PostgreSQL + Auth + Realtime)** | Pedidos, catálogo dinâmico, configurações da loja, autenticação com perfis (`owner`/`kitchen`) e sincronização ao vivo |
| **Cloudinary**                              | Hospedagem e otimização (`f_auto,q_auto`) de fotos de produtos (apenas a URL é salva no Supabase)                      |
| **Evolution API**                           | Disparo automático de atualizações de status via WhatsApp                                                              |
| **ESLint + Prettier + Husky + commitlint**  | Padronização e qualidade de código                                                                                     |

## Como executar localmente

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env.local

# 3. Iniciar servidor de desenvolvimento
npm run dev

# 4. Verificar tipos, lint e build de produção
npx tsc --noEmit && npm run lint && npm run build

# 5. Iniciar em produção
npm run start
```

## Configuração do Supabase + Cloudinary

1. Crie um projeto em [supabase.com](https://supabase.com).
2. No **SQL Editor**, execute [`supabase/schema.sql`](supabase/schema.sql) para criar as tabelas (`orders`, `store_settings`, `admin_users`, `pizzas`, `drinks`, `combos`, `crust_options`, `extra_ingredients`, `delivery_neighborhoods`), políticas RLS e publicação Realtime.
3. Configure as variáveis no `.env.local` (ou no provedor de hospedagem):
   - `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (**somente servidor**, nunca com prefixo `NEXT_PUBLIC_`)
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` e `CLOUDINARY_API_SECRET` (ou `CLOUDINARY_UPLOAD_PRESET`)
   - `NEXT_PUBLIC_SITE_URL` e variáveis da `EVOLUTION_*` (opcional para WhatsApp automático)
4. Acesse `/admin` para criar a primeira conta de **Dono** (Supabase Auth) e gerenciar o catálogo e configurações diretamente no banco.

## Estrutura Principal

```text
src/
├── app/
│   ├── (app)/
│   │   ├── layout.tsx               # Layout raiz com Bricolage Grotesque + Plus Jakarta Sans
│   │   ├── app.css                  # Tokens visuais e estilos globais Tailwind v4
│   │   ├── page.tsx                 # Vitrine inicial (/)
│   │   ├── cardapio/page.tsx        # Cardápio interativo (/cardapio)
│   │   ├── pizza/[slug]/            # Página dinâmica de cada sabor
│   │   ├── pedido/[id]/             # Rastreamento do pedido em tempo real
│   │   └── admin/                   # Painel Admin/KDS + /admin/reset-password
│   ├── api/                         # API Routes (catalog, orders, stock, store-status, admin/*)
│   ├── manifest.ts                  # Web App Manifest (PWA)
│   └── robots.ts / sitemap.ts       # SEO
├── components/                      # BrandMark, PWA e Dialog/Drawer (Radix UI)
├── features/
│   ├── menu/                        # Cardápio, configurador pizza/combo, sacola e checkout
│   └── admin/                       # KDS, Produtos, Configurações/PIX/Equipe, Estoque e ESC/POS
├── hooks/                           # useCart, useCatalog (Realtime), useStock, useStoreStatus
└── lib/                             # Supabase server/public, auth RBAC, precificação, Cloudinary media, WhatsApp
```

## Licença

MIT
