import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Plus_Jakarta_Sans } from "next/font/google";
import { PwaRegistrar } from "@/components/pwa/PwaRegistrar";
import { MEDIA_URLS } from "@/lib/media";
import { SITE_URL, STORE_NAME, STORE_SHORT_NAME } from "@/lib/store-config";
import "./app.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-bricolage",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jakarta",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#c81e1e",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${STORE_NAME} | Pizza quentinha no Centro de João Pessoa`,
    template: `%s | ${STORE_NAME}`,
  },
  description:
    "38 sabores de pizzas salgadas e doces assadas em forno elétrico de pedra, meio a meio nos tamanhos M e G, bordas recheadas e entrega em 12 bairros de João Pessoa.",
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: STORE_NAME,
    title: `${STORE_NAME} | Pizza quentinha no Centro de João Pessoa`,
    description:
      "38 sabores salgados e doces, combos com refrigerante e acompanhamento ao vivo na Don Luydd Pizzaria.",
    images: [{ url: MEDIA_URLS.comboPizzaria, width: 1200, height: 900 }],
  },
  twitter: {
    card: "summary_large_image",
  },
  appleWebApp: {
    capable: true,
    title: STORE_SHORT_NAME,
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={`${bricolage.variable} ${plusJakarta.variable}`}
    >
      <body className="min-h-dvh bg-background text-foreground antialiased selection:bg-primary selection:text-primary-foreground">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:inline-flex focus:min-h-11 focus:items-center focus:rounded-lg focus:bg-primary focus:px-4 focus:text-sm focus:font-bold focus:text-primary-foreground focus:shadow-lg focus:outline-2 focus:outline-offset-2 focus:outline-foreground"
        >
          Pular para o conteúdo principal
        </a>
        <PwaRegistrar />
        {children}
      </body>
    </html>
  );
}
