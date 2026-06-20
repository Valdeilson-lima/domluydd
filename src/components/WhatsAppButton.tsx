import { MessageCircle, Zap } from "lucide-react";

const WHATSAPP_MSG = encodeURIComponent(
  "Olá! Gostaria de mais informações sobre o cardápio."
);

export function WhatsAppButton() {
  return (
    <div className="fixed bottom-6 right-4 z-[400] sm:bottom-8 sm:right-8">
      <a
        href={`https://wa.me/5511999999999?text=${WHATSAPP_MSG}`}
        target="_blank"
        className="group flex items-center gap-3 rounded-2xl bg-gradient-to-br from-[#25d366] to-[#128C7E] pl-4 pr-5 py-3.5 text-sm font-bold text-white shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-[0_8px_30px_rgba(37,211,102,0.35)] active:scale-95 animate-[float_3s_ease-in-out_infinite] sm:pl-5 sm:pr-6 sm:py-4 sm:text-base"
      >
        <span className="relative flex shrink-0 items-center justify-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-white/30" />
          <MessageCircle className="relative size-5 sm:size-6" />
        </span>
        <span className="flex flex-col leading-tight">
          <span className="text-[0.55rem] font-normal uppercase tracking-wide opacity-80 sm:text-[0.6rem]">
            Dúvida?
          </span>
          <span>Falar no WhatsApp</span>
        </span>
        <Zap className="size-3.5 shrink-0 text-yellow-300 sm:size-4" />
      </a>
    </div>
  );
}
