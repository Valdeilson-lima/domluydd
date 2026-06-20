import { MessageCircle } from "lucide-react";

export function WhatsAppButton() {
  return (
    <a
      href="https://wa.me/5511999999999"
      target="_blank"
      className="group fixed bottom-24 right-4 z-[400] flex items-center gap-2 rounded-full bg-[#25d366] pl-3 pr-4 py-3 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:bg-[#1da851] hover:scale-105 active:scale-95 sm:bottom-8 sm:right-6"
    >
      <MessageCircle className="size-5 shrink-0" />
      <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 group-hover:max-w-[200px] group-hover:opacity-100 sm:group-hover:max-w-[200px] sm:group-hover:opacity-100">
        Dúvida? Falar no WhatsApp
      </span>
    </a>
  );
}
