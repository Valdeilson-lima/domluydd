import type { Metadata, Viewport } from "next";
import { Roboto } from "next/font/google";
import { SITE_URL, STORE_NAME } from "@/lib/store-config";
import "./app.css";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-roboto",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#f8f5ef",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `Cardápio e Pedido Online | ${STORE_NAME}`,
    template: `%s | ${STORE_NAME}`,
  },
  description:
    "Escolha entre 38 sabores de pizzas salgadas e doces, monte meio a meio, adicione bordas e acompanhe seu pedido na Don Luydd Pizzaria.",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
};

export default function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={roboto.variable}>
      <body className="min-h-dvh bg-background text-foreground antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:inline-flex focus:min-h-11 focus:items-center focus:bg-primary focus:px-4 focus:text-sm focus:font-semibold focus:text-primary-foreground focus:outline-2 focus:outline-offset-2 focus:outline-foreground"
        >
          Pular para o conteúdo principal
        </a>
        {children}
      </body>
    </html>
  );
}
