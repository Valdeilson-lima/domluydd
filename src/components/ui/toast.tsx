import { useEffect } from "react";
import { createPortal } from "react-dom";
import { CheckCircle, ShoppingBag } from "lucide-react";

interface ToastProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message: string;
  duration?: number;
}

export function Toast({
  open,
  onOpenChange,
  message,
  duration = 2600,
}: ToastProps) {
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => onOpenChange(false), duration);
    return () => clearTimeout(timer);
  }, [open, onOpenChange, duration]);

  if (!open) return null;

  const isAdded = message.includes("adicionada");

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-24 right-4 left-4 z-[500] animate-[toastIn_0.4s_cubic-bezier(0.22,1,0.36,1)] sm:bottom-8 sm:right-8 sm:left-auto flex items-center gap-3 rounded-[14px] bg-gradient-to-r from-yellow to-yellow-light px-5 py-3.5 text-sm font-bold text-black shadow-2xl"
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-black/10">
        {isAdded ? (
          <CheckCircle className="size-5 text-green-800" />
        ) : (
          <ShoppingBag className="size-4" />
        )}
      </span>
      <span>{message}</span>
    </div>,
    document.body
  );
}
