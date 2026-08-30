import { useEffect, useState } from "react";
import { Clock, Bike, Flame, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { getStoreStatus } from "@/lib/utils";
import { PIZZA_IMAGES } from "@/data/pizzas";
import { PizzaImage } from "./PizzaImage";

const SLIDE_MS = 5000;

export function Hero() {
  const { open, nextLabel } = getStoreStatus();
  const [slide, setSlide] = useState(0);
  const [paused, setPaused] = useState(false);

  // Carrossel automático de pizzas
  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      setSlide((s) => (s + 1) % PIZZA_IMAGES.length);
    }, SLIDE_MS);
    return () => window.clearInterval(id);
  }, [paused]);

  return (
    <section
      className="relative flex min-h-svh flex-col overflow-hidden bg-linear-to-br from-[#141213] via-[#1f1c1d] to-[#3a1418]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label="Don Luydd Pizzaria"
    >
      {/* Slideshow de pizzas */}
      <div className="absolute inset-0" aria-hidden="true">
        {PIZZA_IMAGES.map((src, i) => (
          <PizzaImage
            key={src}
            src={src}
            className={cn(
              "absolute inset-0 transition-opacity duration-1200 ease-out",
              i === slide ? "opacity-100" : "opacity-0"
            )}
            imgClassName={
              i === slide
                ? "animate-[kenburns_9s_ease-out_forwards]"
                : undefined
            }
          />
        ))}
      </div>

      {/* Overlays para legibilidade */}
      <div className="absolute inset-0 bg-linear-to-b from-black/50 via-black/55 to-black/75" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_40%,rgba(242,135,5,0.16),transparent_60%)]" />

      {/* Conteúdo centralizado */}
      <div className="relative mx-auto flex w-full max-w-280 flex-1 flex-col items-center justify-center gap-6 px-5 py-16 text-center sm:px-7">
        <span className="inline-flex items-center gap-2 rounded-full border border-yellow/30 bg-black/40 px-3 py-1 font-mono text-[0.6rem] font-semibold uppercase tracking-[0.25em] text-yellow/90 backdrop-blur-sm">
          <Flame className="size-3" />
          Pizzaria Artesanal
        </span>

        <div>
          <h1 className="font-display text-[clamp(2.6rem,11vw,5.5rem)] font-semibold italic leading-[0.9] tracking-[-0.03em] text-cream [font-variation-settings:'opsz'_144,'SOFT'_50] [text-shadow:0_4px_30px_rgba(0,0,0,0.5)]">
            Don Luydd
          </h1>
          <p className="mx-auto mt-3 max-w-md font-display text-base font-normal italic leading-snug text-cream-dim [font-variation-settings:'opsz'_72] sm:text-lg">
            Massa de fermentação natural, forno elétrico, ingredientes na hora.
          </p>
        </div>

        {/* Status — the thesis */}
        <div
          className={`mt-1 flex items-center gap-3 rounded-md border px-4 py-3 backdrop-blur-md ${
            open
              ? "border-basil/40 bg-basil/12"
              : "border-red-primary/40 bg-red-primary/12"
          }`}
        >
          <span
            className={`relative flex size-3 shrink-0 rounded-full ${
              open ? "bg-basil" : "bg-red-primary"
            }`}
            style={open ? { animation: "pulseRing 2s infinite" } : undefined}
          />
          <div className="text-left">
            <p
              className={`font-display text-lg font-bold leading-none sm:text-xl ${
                open ? "text-basil" : "text-red-light"
              }`}
            >
              {open ? "Aberto agora" : "Fechado"}
            </p>
            <p className="mt-0.5 font-mono text-[0.65rem] uppercase tracking-wider text-cream-dim">
              {nextLabel}
            </p>
          </div>
        </div>
      </div>

      {/* Indicadores do carrossel */}
      <div className="relative flex items-center justify-center gap-2 pb-6">
        {PIZZA_IMAGES.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setSlide(i)}
            aria-label={`Ver foto ${i + 1} de ${PIZZA_IMAGES.length}`}
            aria-current={i === slide}
            className={cn(
              "h-1.5 cursor-pointer rounded-full transition-all duration-300",
              i === slide
                ? "w-6 bg-yellow"
                : "w-1.5 bg-white/30 hover:bg-white/60"
            )}
          />
        ))}
      </div>

      {/* Dica de rolagem */}
      <a
        href="#main-content"
        className="relative mb-4 flex justify-center text-cream-dim/70 transition-colors duration-200 hover:text-yellow"
        aria-label="Rolar para o cardápio"
      >
        <ChevronDown className="size-5 animate-[float_2.5s_ease-in-out_infinite]" />
      </a>
    </section>
  );
}

export function InfoStrip() {
  const items = [
    {
      icon: Clock,
      label: "Horário",
      value: "Ter–Dom · 18h–22h",
    },
    {
      icon: Bike,
      label: "Entrega",
      value: "A partir de R$ 5",
    },
    {
      icon: Flame,
      label: "Forno",
      value: "Elétrico, na hora",
    },
  ];

  return (
    <div className="border-b border-yellow/15 bg-linear-to-b from-black to-black-light/60">
      <div className="mx-auto grid max-w-280 grid-cols-3 divide-x divide-white/6">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex flex-col items-center justify-center gap-1 px-1.5 py-2.5 text-center sm:flex-row sm:gap-2.5 sm:px-4 sm:py-3 sm:text-left"
          >
            <item.icon className="size-3.5 shrink-0 text-yellow sm:size-4" />
            <div className="min-w-0">
              <p className="hidden font-mono text-[0.55rem] uppercase tracking-[0.18em] text-muted sm:block">
                {item.label}
              </p>
              <p className="text-[0.6rem] font-semibold leading-tight text-cream-dim sm:text-xs sm:font-normal">
                {item.value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
