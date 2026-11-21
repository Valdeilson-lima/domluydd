"use client";

import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function InstallAppButton({ compact = false }: { compact?: boolean }) {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [isInstalled, setIsInstalled] = useState(true);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const nav = window.navigator as Navigator & { standalone?: boolean };
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      nav.standalone === true;
    setIsInstalled(standalone);

    const ua = window.navigator.userAgent;
    const iosDevice =
      /iPad|iPhone|iPod/.test(ua) &&
      !("MSStream" in window) &&
      /Safari/i.test(ua) &&
      !/CriOS|FxiOS|OPiOS/i.test(ua);
    setIsIos(iosDevice);

    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };
    const handleInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowIosGuide(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  if (isInstalled || (!deferredPrompt && !isIos)) {
    return null;
  }

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
      return;
    }
    if (isIos) {
      setShowIosGuide((prev) => !prev);
    }
  };

  return (
    <div className="inline-flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={handleInstallClick}
        className={`inline-flex min-h-11 items-center gap-2 border border-border bg-card font-semibold text-foreground transition-colors hover:border-primary hover:text-primary ${
          compact ? "px-3 text-xs" : "px-4 text-sm"
        }`}
        style={{ borderRadius: "2px" }}
      >
        {isIos && !deferredPrompt ? (
          <Share className="size-4 shrink-0" aria-hidden="true" />
        ) : (
          <Download className="size-4 shrink-0" aria-hidden="true" />
        )}
        <span>Instalar app</span>
      </button>

      {showIosGuide && (
        <div
          role="region"
          aria-label="Como instalar o aplicativo no iPhone"
          className="relative max-w-xs border border-border bg-card p-3.5 pr-9 text-xs leading-relaxed text-muted-foreground"
          style={{ borderRadius: "2px" }}
        >
          <button
            type="button"
            onClick={() => setShowIosGuide(false)}
            className="absolute right-1.5 top-1.5 flex size-7 items-center justify-center text-muted-foreground hover:text-foreground"
            aria-label="Fechar instrução"
          >
            <X className="size-3.5" aria-hidden="true" />
          </button>
          <p className="font-semibold text-foreground">
            Instalar no iPhone/iPad
          </p>
          <p className="mt-1">
            Toque em <strong>Compartilhar</strong> na barra do Safari e depois
            em <strong>Adicionar à Tela de Início</strong>.
          </p>
        </div>
      )}
    </div>
  );
}
