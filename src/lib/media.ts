/**
 * URLs oficiais das imagens hospedadas no Cloudinary (pasta donluydd/produtos).
 */
export const MEDIA_URLS = {
  pizza2Queijos:
    "https://res.cloudinary.com/derudojcn/image/upload/f_auto,q_auto,w_960,c_limit/v1795294567/donluydd/produtos/pizza-2-queijos.jpg",
  pizzaDoceChocolate:
    "https://res.cloudinary.com/derudojcn/image/upload/f_auto,q_auto,w_960,c_limit/v1795294568/donluydd/produtos/pizza-doce-chocolate.jpg",
  pizzaDoceBanana:
    "https://res.cloudinary.com/derudojcn/image/upload/f_auto,q_auto,w_960,c_limit/v1795294569/donluydd/produtos/pizza-doce-banana.jpg",
  pizzaDoceRomeuJulieta:
    "https://res.cloudinary.com/derudojcn/image/upload/f_auto,q_auto,w_960,c_limit/v1795294569/donluydd/produtos/pizza-doce-romeu-julieta.jpg",
  comboPizzaria:
    "https://res.cloudinary.com/derudojcn/image/upload/f_auto,q_auto,w_960,c_limit/v1795294570/donluydd/produtos/combo-pizzaria.jpg",
  fornoMassaBancada:
    "https://res.cloudinary.com/derudojcn/image/upload/f_auto,q_auto,w_960,c_limit/v1795294570/donluydd/produtos/forno-massa-bancada.jpg",
  heroMargherita1280:
    "https://res.cloudinary.com/derudojcn/image/upload/f_auto,q_auto,w_1280,c_limit/v1795294571/donluydd/produtos/photo-f159446387-1280.jpg",
  margherita960:
    "https://res.cloudinary.com/derudojcn/image/upload/f_auto,q_auto,w_960,c_limit/v1795294572/donluydd/produtos/photo-f159446387-960.jpg",
  pepperoni960:
    "https://res.cloudinary.com/derudojcn/image/upload/f_auto,q_auto,w_960,c_limit/v1795294573/donluydd/produtos/photo-f192755848-960.jpg",
  pizza290:
    "https://res.cloudinary.com/derudojcn/image/upload/f_auto,q_auto,w_960,c_limit/v1795294573/donluydd/produtos/photo-f29093071-960.jpg",
  fornoPedra960:
    "https://res.cloudinary.com/derudojcn/image/upload/f_auto,q_auto,w_960,c_limit/v1795294574/donluydd/produtos/photo-f41882039-960.jpg",
  pizza100:
    "https://res.cloudinary.com/derudojcn/image/upload/f_auto,q_auto,w_960,c_limit/v1795294574/donluydd/produtos/photo-f100303227-960.jpg",
  margheritaPrato960:
    "https://res.cloudinary.com/derudojcn/image/upload/f_auto,q_auto,w_960,c_limit/v1795294575/donluydd/produtos/photo-f154799608-960.jpg",
  caixaTermica960:
    "https://res.cloudinary.com/derudojcn/image/upload/f_auto,q_auto,w_960,c_limit/v1795294575/donluydd/produtos/photo-f70250769-960.jpg",
  pizza875:
    "https://res.cloudinary.com/derudojcn/image/upload/f_auto,q_auto,w_960,c_limit/v1795294576/donluydd/produtos/photo-f87508732-500.jpg",
  pizza797:
    "https://res.cloudinary.com/derudojcn/image/upload/f_auto,q_auto,w_960,c_limit/v1795294577/donluydd/produtos/photo-f79703781-500.jpg",
} as const;

export const PIZZA_IMAGES = [
  MEDIA_URLS.pizza2Queijos,
  MEDIA_URLS.margherita960,
  MEDIA_URLS.pepperoni960,
  MEDIA_URLS.pizza290,
  MEDIA_URLS.fornoPedra960,
  MEDIA_URLS.pizza100,
  MEDIA_URLS.margheritaPrato960,
  MEDIA_URLS.pizza875,
  MEDIA_URLS.pizza797,
];

export function getPizzaImageSrc(
  imgIdx: number,
  explicitImage?: string
): string {
  if (explicitImage) return explicitImage;
  return PIZZA_IMAGES[imgIdx % PIZZA_IMAGES.length] || PIZZA_IMAGES[1];
}
