import Link from "next/link";
import {
  STORE_HOURS_LABEL,
  STORE_NAME,
  STORE_OVEN_LABEL,
  STORE_PICKUP_ADDRESS,
  STORE_WHATSAPP_DISPLAY,
  STORE_WHATSAPP_NUMBER,
} from "@/lib/store-config";

export function MenuFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-secondary px-4 py-10 sm:px-6">
      <div className="mx-auto grid max-w-6xl gap-8 sm:grid-cols-3">
        <div className="space-y-2">
          <p className="font-serif text-lg text-foreground">{STORE_NAME}</p>
          <p className="text-sm text-muted-foreground">
            {STORE_OVEN_LABEL} · {STORE_HOURS_LABEL}
          </p>
        </div>

        <div className="space-y-1 text-sm">
          <p className="font-semibold text-foreground">Balcão para retirada</p>
          <p className="text-muted-foreground">{STORE_PICKUP_ADDRESS}</p>
          <p>
            <a
              href={`https://wa.me/${STORE_WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-foreground underline underline-offset-4"
            >
              WhatsApp: {STORE_WHATSAPP_DISPLAY}
            </a>
          </p>
        </div>

        <div className="space-y-2 text-sm sm:text-right">
          <p>
            <Link
              href="/"
              className="font-semibold text-foreground underline underline-offset-4"
            >
              Voltar para a página inicial
            </Link>
          </p>
          <p className="text-xs text-muted-foreground">
            <a href="/credits.html" className="underline underline-offset-2">
              Créditos das fotografias
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
