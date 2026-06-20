import { useEffect } from "react";
import { createPortal } from "react-dom";
import { CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

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

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed bottom-7 right-7 left-7 md:left-auto z-[500] flex items-center gap-3 rounded-[8px] bg-yellow px-5 py-3.5 text-sm font-bold text-black shadow-md transition-all duration-350",
        open ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"
      )}
    >
      <CheckCircle className="h-5 w-5 shrink-0" />
      <span>{message}</span>
    </div>,
    document.body
  );
}
