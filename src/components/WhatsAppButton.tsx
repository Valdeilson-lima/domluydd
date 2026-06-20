import { MessageCircle } from "lucide-react";

const WHATSAPP_MSG = encodeURIComponent(
  "Olá! Gostaria de mais informações sobre o cardápio."
);

export function WhatsAppButton() {
  return (
    <div className="fixed bottom-6 right-4 z-[400] sm:bottom-8 sm:right-8">
      <a
        href={`https://wa.me/5511999999999?text=${WHATSAPP_MSG}`}
        target="_blank"
        className="flex flex-col items-center gap-0.5 rounded-full bg-gradient-to-br from-[#25d366] to-[#128C7E] p-2.5 text-white shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-[0_8px_30px_rgba(37,211,102,0.35)] active:scale-95 animate-[float_3s_ease-in-out_infinite] sm:flex-row sm:gap-2 sm:rounded-2xl sm:pl-5 sm:pr-6 sm:py-3.5"
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
