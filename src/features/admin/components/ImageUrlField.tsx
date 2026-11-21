"use client";

import { useRef, useState } from "react";
import { Upload, Link2, CheckCircle2, ImageIcon, X } from "lucide-react";
import { MEDIA_URLS } from "@/lib/media";

const BUILTIN_GALLERY = [
  { label: "Calabresa / Combo", url: MEDIA_URLS.comboPizzaria },
  { label: "2 Queijos", url: MEDIA_URLS.pizza2Queijos },
  { label: "Margherita", url: MEDIA_URLS.margherita960 },
  { label: "Pepperoni", url: MEDIA_URLS.pepperoni960 },
  { label: "Forno pedra", url: MEDIA_URLS.fornoPedra960 },
  { label: "Chocolate / Brigadeiro", url: MEDIA_URLS.pizzaDoceChocolate },
  { label: "Banana / Choconita", url: MEDIA_URLS.pizzaDoceBanana },
  { label: "Romeu & Julieta", url: MEDIA_URLS.pizzaDoceRomeuJulieta },
];

interface ImageUrlFieldProps {
  id: string;
  label?: string;
  value: string;
  onChange: (nextUrl: string) => void;
  cloudinaryConfigured: boolean;
  showGallery?: boolean;
}

export function ImageUrlField({
  id,
  label = "Foto do produto (URL / Cloudinary)",
  value,
  onChange,
  cloudinaryConfigured,
  showGallery = true,
}: ImageUrlFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setUploadSuccess(false);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.url) {
        setUploadError(
          data?.error || "Não foi possível enviar a foto para o Cloudinary."
        );
        return;
      }
      onChange(String(data.url));
      setUploadSuccess(true);
    } catch {
      setUploadError("Falha de conexão ao enviar imagem.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2.5 rounded-xl border border-border bg-secondary/40 p-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={id} className="text-xs font-bold text-foreground">
          {label}
        </label>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
            cloudinaryConfigured
              ? "bg-status-open/10 text-status-open"
              : "bg-accent-gold-soft text-accent-gold-ink"
          }`}
        >
          {cloudinaryConfigured
            ? "Cloudinary conectado"
            : "Cole uma URL ou configure Cloudinary"}
        </span>
      </div>

      <div className="flex items-start gap-3">
        <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-card">
          {value ? (
            <img
              src={value}
              alt="Pré-visualização do produto"
              className="size-full object-cover"
            />
          ) : (
            <ImageIcon
              className="size-6 text-muted-foreground"
              aria-hidden="true"
            />
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="relative">
            <Link2
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              id={id}
              type="text"
              value={value}
              onChange={(e) => {
                onChange(e.target.value);
                setUploadError(null);
                setUploadSuccess(false);
              }}
              placeholder="https://res.cloudinary.com/..."
              className="min-h-10 w-full rounded-xl border border-input bg-card pl-9 pr-9 text-xs text-foreground placeholder:text-muted-foreground"
            />
            {value && (
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setUploadSuccess(false);
                }}
                aria-label="Limpar URL da imagem"
                className="absolute right-1 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
            >
              <Upload className="size-3.5" aria-hidden="true" />
              {uploading ? "Enviando…" : "Enviar para Cloudinary"}
            </button>
            {uploadSuccess && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-status-open">
                <CheckCircle2 className="size-3.5" aria-hidden="true" />
                URL salva!
              </span>
            )}
          </div>
        </div>
      </div>

      {uploadError && (
        <p
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive"
        >
          {uploadError}
        </p>
      )}

      {showGallery && (
        <div className="space-y-1.5 pt-1">
          <p className="text-[11px] font-semibold text-muted-foreground">
            Ou escolha uma foto pronta da galeria:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {BUILTIN_GALLERY.map((item) => {
              const active = value === item.url;
              return (
                <button
                  key={item.url}
                  type="button"
                  onClick={() => {
                    onChange(item.url);
                    setUploadError(null);
                    setUploadSuccess(false);
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] font-semibold transition-colors ${
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <img
                    src={item.url}
                    alt=""
                    className="size-5 rounded object-cover"
                    aria-hidden="true"
                  />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
