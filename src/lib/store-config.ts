export const STORE_NAME = "Don Luydd Pizzaria";
export const STORE_SHORT_NAME = "Don Luydd";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://pizzariadonluydd.valdeilsonlima.com.br";

export const STORE_TIMEZONE = "America/Fortaleza";

// Street & district only (no house number, postcode, coordinates or phone on storefront /)
export const STORE_STREET_DISTRICT = "Av. Epitácio Pessoa, Centro";
export const STORE_CITY = "João Pessoa";
export const STORE_MAP_URL =
  "https://www.openstreetmap.org/search?query=Av.%20Epitacio%20Pessoa%20Centro%20Joao%20Pessoa";

// Operational pickup address, WhatsApp & PIX used strictly in ordering flow, tracking & kitchen receipts
export const STORE_PICKUP_ADDRESS =
  process.env.NEXT_PUBLIC_PICKUP_ADDRESS ||
  "Av. Epitácio Pessoa, 1200 - Centro";

export const STORE_WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "5583993740352";

export const STORE_WHATSAPP_DISPLAY = "(83) 99374-0352";
export const STORE_PIX_KEY = process.env.NEXT_PUBLIC_PIX_KEY || "83993740352";
export const STORE_PIX_KEY_FORMATTED = "(83) 99374-0352";

export const STORE_INSTAGRAM_URL =
  "https://www.instagram.com/pizzariadonluydd/";

export const STORE_OVEN_LABEL = "Forno elétrico";
export const STORE_HOURS_LABEL = "Terça a domingo, 18h às 22h";
export const STORE_HOURS_SHORT = "Ter–Dom · 18h às 22h";
