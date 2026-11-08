import type { Metadata, Viewport } from "next";
import { Inter, Fraunces } from "next/font/google";
import "@/index.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://donluydd.com.br"),
  title: "Don Luydd Pizzaria — Cardápio Digital",
  description:
    "Cardápio Digital da Don Luydd Pizzaria. Peça sua pizza artesanal de fermentação natural favorita pelo WhatsApp com entrega rápida!",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "Don Luydd Pizzaria — Cardápio Digital Interativo",
    description:
      "Navegue pelas melhores pizzas artesanais, monte sua pizza meio a meio e peça diretamente pelo WhatsApp!",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "Don Luydd Pizzaria",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Don Luydd Pizzaria — Cardápio Digital",
    description: "Pizzas artesanais com massa de fermentação natural de 48h.",
    images: ["/logo.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#591212",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="antialiased min-h-screen bg-background text-foreground">
        <div id="root">{children}</div>
      </body>
    </html>
  );
}
