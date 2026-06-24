import { MessageCircle } from "lucide-react";

const WHATSAPP_MSG = encodeURIComponent(
  "Olá! Vi o cardápio digital e gostaria de tirar uma dúvida."
);

interface WhatsAppButtonProps {
  cartHasItems?: boolean;
  hidden?: boolean;
}

export function WhatsAppButton({
  cartHasItems = false,
  hidden = false,
}: WhatsAppButtonProps) {
  if (hidden) return null;

  return (
    <div
      className={`fixed right-4 z-400 transition-[bottom] duration-300 ${
        cartHasItems ? "bottom-20 sm:bottom-8" : "bottom-6 sm:bottom-8"
      }`}
    >
      <a
        href={`https://wa.me/5583993740352?text=${WHATSAPP_MSG}`}
        target="_blank"
        rel="noreferrer"
        className="flex flex-col items-center gap-0.5 rounded-full bg-linear-to-br from-[#25d366] to-[#128C7E] p-2.5 text-white shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-[0_8px_30px_rgba(37,211,102,0.35)] active:scale-95 animate-[float_3s_ease-in-out_infinite] sm:flex-row sm:gap-2 sm:rounded-2xl sm:pl-5 sm:pr-6 sm:py-3.5"
        aria-label="Falar no WhatsApp"
      >
        <span className="relative flex shrink-0 items-center justify-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-white/30" />
          <MessageCircle className="relative size-5 sm:size-6" />
        </span>
        <span className="text-[0.45rem] font-bold uppercase leading-tight tracking-wide sm:hidden">
          Dúvida?
        </span>
        <span className="hidden sm:flex sm:flex-col sm:leading-tight">
          <span className="text-[0.6rem] font-normal uppercase tracking-wide opacity-80">
            Dúvida?
          </span>
          <span className="text-sm font-bold">Falar no WhatsApp</span>
        </span>
      </a>
    </div>
  );
}
