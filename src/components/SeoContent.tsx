import { allPizzas } from "@/data/pizzas";

const siteUrl = "https://donluydd.com.br";

const faq = [
  {
    question: "Qual é o horário de funcionamento da Don Luydd?",
    answer:
      "A Don Luydd Pizzaria funciona de terça-feira a domingo, das 18h às 22h. O status de atendimento é atualizado no cardápio digital. Quando a loja está aberta, você pode escolher pizzas, bebidas ou combos, personalizar o pedido e enviá-lo diretamente pelo WhatsApp para confirmação.",
  },
  {
    question: "Quais tamanhos de pizza a Don Luydd oferece?",
    answer:
      "A Don Luydd oferece pizzas pequenas com 4 fatias, médias com 6 fatias e grandes com 8 fatias. O tamanho médio atende aproximadamente duas a três pessoas, enquanto o grande atende três a quatro. Os preços variam conforme o sabor e são exibidos na página de cada pizza.",
  },
  {
    question: "A Don Luydd faz pizza meio a meio?",
    answer:
      "Sim. No cardápio da Don Luydd, a pizza média ou grande pode ser montada com até dois sabores, permitindo combinar opções salgadas ou doces conforme a categoria escolhida. Basta abrir o sabor desejado, ativar a opção meio a meio, escolher a segunda metade e adicionar a personalização ao carrinho.",
  },
  {
    question: "Como pedir pizza na Don Luydd?",
    answer:
      "Para pedir, escolha os sabores no cardápio digital, selecione tamanho, borda e adicionais, revise a sacola e informe os dados de entrega ou retirada. No checkout, selecione a forma de pagamento e envie o resumo pelo WhatsApp. A pizzaria confirma a disponibilidade, o endereço e o prazo do pedido.",
  },
];

export function SeoContent() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };

  const businessSchema = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: "Don Luydd Pizzaria",
    url: siteUrl,
    image: `${siteUrl}/logo.png`,
    servesCuisine: "Pizza",
    priceRange: "$$",
    telephone: "+55 83 99374-0352",
    openingHours: "Tu-Su 18:00-22:00",
    sameAs: ["https://www.instagram.com/pizzariadonluydd/"],
    hasMenu: `${siteUrl}/llms.txt`,
    areaServed: [
      "Centro",
      "Jardim América",
      "Vila Nova",
      "São José",
      "Boa Vista",
      "Industrial",
      "Santa Luzia",
      "Morada do Sol",
      "Parque Verde",
      "Cidade Jardim",
      "Residencial Lago",
      "Vila Esperança",
    ],
  };

  const menuSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Cardápio de pizzas da Don Luydd",
    itemListElement: allPizzas.map((pizza, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${siteUrl}/pizza/${pizza.slug}`,
      item: {
        "@type": "Product",
        name: pizza.name,
        description: pizza.desc,
        image: `${siteUrl}/Pizza%202%20Queijos.png`,
        offers: {
          "@type": "Offer",
          priceCurrency: "BRL",
          lowPrice: pizza.p,
          highPrice: pizza.g,
          availability: "https://schema.org/InStock",
          url: `${siteUrl}/pizza/${pizza.slug}`,
        },
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(businessSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(menuSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <section
        aria-labelledby="sobre-a-don-luydd"
        className="mx-auto max-w-280 px-4 pb-10 sm:px-6"
      >
        <h2
          id="sobre-a-don-luydd"
          className="font-display text-2xl font-bold italic text-cream sm:text-3xl"
        >
          Como funciona a Don Luydd Pizzaria?
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-cream-dim">
          A Don Luydd é uma pizzaria artesanal com massa de fermentação natural
          de 48 horas, sabores salgados e doces, bebidas e combos. O cardápio
          mostra tamanhos, ingredientes e preços; você personaliza a pizza,
          escolhe entrega ou retirada e envia o pedido pelo WhatsApp.
        </p>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {faq.map((item) => (
            <article key={item.question}>
              <h3 className="font-display text-lg font-semibold text-cream">
                {item.question}
              </h3>
              <p className="mt-2 text-sm leading-7 text-cream-dim">
                {item.answer}
              </p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
