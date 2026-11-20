import type { Metadata } from "next";
import { THEME_FONTS_HREF } from "@/lib/theme";
import { SITE_URL, STORE_NAME } from "@/lib/store-config";
import "./app.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `Cardápio e Pedido Online — ${STORE_NAME}`,
    template: `%s — ${STORE_NAME}`,
  },
  description:
    "Escolha entre 38 sabores de pizzas salgadas e doces, monte meio a meio, adicione bordas e acompanhe seu pedido na Don Luydd Pizzaria.",
};

export default function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="stylesheet" href={THEME_FONTS_HREF} />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <a
          href="#conteudo-principal"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[999] focus:bg-primary focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-primary-foreground"
        >
          Ir para o conteúdo principal
        </a>
        {children}
      </body>
    </html>
  );
}
