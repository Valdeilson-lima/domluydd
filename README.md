<div align="center">
  <br />
  <h1>🍕 Don Luydd Pizzaria</h1>
  <p><strong>Cardápio Digital</strong></p>
  <p>Catálogo interativo de pizzas artesanais com pedidos via WhatsApp</p>
  <br />
</div>

## Sobre

O **Don Luydd Pizzaria — Cardápio Digital** é uma aplicação web single-page desenvolvida para servir como cardápio digital interativo de uma pizzaria artesanal brasileira. Os clientes podem navegar por pizzas salgadas, pizzas doces e bebidas, personalizar pizzas meio a meio, montar um carrinho e enviar o pedido diretamente pelo WhatsApp — tudo sem backend, sem autenticação e sem banco de dados.

## Funcionalidades

- **Cardápio completo** em 3 abas: Salgadas (32 sabores), Doces (6 sabores) e Bebidas
- **Busca em tempo real** por nome ou descrição
- **Personalização de pizzas**: seleção de tamanho (P/M/G) e opção meio a meio com dois sabores
- **Visualizador de pizza**: representação visual das metades escolhidas
- **Carrinho de compras** com barra flutuante e gaveta lateral
- **Finalização via WhatsApp**: seleção de bairro (com cálculo de frete), endereço, forma de pagamento e troco
- **Notificações toast** para feedback de ações
- **Design responsivo e mobile-first**
- **Tema escuro** com identidade visual de pizzaria
- **Acessível**: navegação por teclado, atributos ARIA, link "pular para conteúdo"

## Tecnologias

|                                            |                                                             |
| ------------------------------------------ | ----------------------------------------------------------- |
| **Next.js 16 (App Router)**                | Framework React com Turbopack e SSR/SSG                     |
| **React 19**                               | Interface de usuário                                        |
| **Supabase (PostgreSQL + Realtime)**       | Banco de dados na nuvem e streaming de pedidos ao vivo      |
| **TypeScript**                             | Tipagem estática                                            |
| **Tailwind CSS 4**                         | Estilização utilitária com PostCSS                          |
| **Radix UI**                               | Componentes headless acessíveis (Dialog, Select, Tabs, etc) |
| **Lucide React**                           | Ícones                                                      |
| **class-variance-authority**               | Variantes de componentes                                    |
| **ESLint + Prettier + Husky + commitlint** | Qualidade e padronização de código                          |

## Como usar

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente do Supabase (opcional para modo local)
cp .env.example .env.local

# 3. Iniciar servidor de desenvolvimento (Next.js Turbopack)
npm run dev

# 4. Build de produção
npm run build

# 5. Iniciar servidor de produção
npm run start
```

## Painel da Cozinha & Gestão (`/admin`)

- Acesse `http://localhost:3000/admin`
- **PIN Padrão:** `1234`
- Acompanhamento em tempo real de novos pedidos com alerta sonoro
- Atualização de status: _Pendente_ ➔ _No Forno_ ➔ _A Caminho/Pronto_ ➔ _Concluído_
- Botão para imprimir comanda térmica de produção
- Notificação de status direto no WhatsApp do cliente

## Configuração do Supabase

1. Crie um projeto gratuito em [supabase.com](https://supabase.com).
2. No painel do Supabase, abra o **SQL Editor** e execute o script `supabase/schema.sql`.
3. Copie a **URL do Projeto** e a **Anon Key** para o seu arquivo `.env.local`.

## Como funciona

1. O cliente abre o cardápio no navegador
2. Navega pelas abas de pizzas salgadas, doces ou bebidas
3. Pesquisa por nome ou descrição (opcional)
4. Clica em uma pizza para abrir o modal de detalhes
5. Escolhe tamanho, ativa meio a meio (opcional) e seleciona os sabores
6. Adiciona ao carrinho
7. Revisa os itens no carrinho e clica em "Finalizar Pedido"
8. Preenche bairro, endereço e forma de pagamento
9. O pedido é enviado via WhatsApp para a pizzaria

## Estrutura

```
src/
├── App.tsx                  # Componente raiz
├── main.tsx                 # Entry point
├── index.css                # Estilos globais e tema
├── types/index.ts           # Interfaces TypeScript
├── data/
│   ├── pizzas.ts            # Catálogo de pizzas
│   ├── drinks.ts            # Catálogo de bebidas
│   └── bairros.ts           # Bairros com taxa de entrega
├── hooks/
│   └── useCart.ts           # Estado do carrinho
├── lib/
│   └── utils.ts             # Utilitários (cn, formatPrice)
└── components/
    ├── Header.tsx           # Cabeçalho com abas de navegação
    ├── Hero.tsx             # Banner principal
    ├── SearchBar.tsx        # Campo de busca
    ├── PizzaCard.tsx        # Card de pizza na listagem
    ├── PizzaGrid.tsx        # Grade de pizzas
    ├── DrinkCard.tsx        # Card de bebida na listagem
    ├── DrinkGrid.tsx        # Grade de bebidas
    ├── DetailModal.tsx      # Modal de detalhes e personalização
    ├── PizzaVisualizer.tsx  # Visualizador de pizza meio a meio
    ├── CartBar.tsx          # Barra flutuante do carrinho
    ├── CartSheet.tsx        # Gaveta lateral do carrinho
    ├── CheckoutModal.tsx    # Formulário de finalização
    ├── Footer.tsx           # Rodapé
    └── ui/                  # Wrappers dos componentes Radix UI
```

## Deploy

O build gera uma pasta `dist/` com arquivos estáticos. Pode ser hospedado em qualquer servidor estático:

```bash
npm run build
```

## Licença

MIT
