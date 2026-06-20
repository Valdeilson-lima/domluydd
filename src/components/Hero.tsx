import { Clock, Bike } from "lucide-react";

function isOpen() {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const totalMinutes = hour * 60 + minute;
  const openMinutes = 18 * 60;
  const closeMinutes = 23 * 60;
  return totalMinutes >= openMinutes && totalMinutes < closeMinutes;
}

export function Hero() {
  const open = isOpen();

  return (
    <section className="relative flex h-55 items-center justify-center overflow-hidden sm:h-75 md:h-105">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url(https://cdn.pixabay.com/photo/2017/12/09/08/18/pizza-3007395_960_720.jpg)",
        }}
      />
      <div className="absolute inset-0 bg-linear-to-br from-black/80 via-black/60 to-black/30" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,black/40_100%)]" />

      <div className="relative z-2 flex flex-col items-center gap-4 px-5 text-center text-white sm:gap-5">
        <div>
          <h1 className="font-display text-[clamp(2rem,7vw,5.5rem)] font-extrabold leading-none tracking-[-0.03em] text-red-primary drop-shadow-[0_4px_30px_rgba(0,0,0,0.6)] [text-shadow:0_2px_4px_rgba(0,0,0,0.5)] mb-2 sm:mb-3">
            Don Luydd
          </h1>
          <p className="text-sm font-bold leading-relaxed text-white/90 drop-shadow-[0_2px_15px_rgba(0,0,0,0.6)] [text-shadow:0_1px_3px_rgba(0,0,0,0.5)] sm:text-lg">
            A melhor pizza artesanal da cidade.
          </p>
        </div>

        <span
          className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider shadow-lg sm:text-sm sm:px-5 sm:py-2 ${
            open
              ? "bg-green-500/20 text-green-300 ring-1 ring-green-500/40"
              : "bg-red-500/20 text-red-300 ring-1 ring-red-500/40"
          }`}
        >
          <span
            className={`size-2 rounded-full sm:size-2.5 ${open ? "bg-green-400 animate-pulse" : "bg-red-400"}`}
          />
          {open ? "Aberto agora" : "Fechado"}
        </span>
      </div>
    </section>
  );
}

export function InfoStrip() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b border-white/6 bg-black-light/80 px-3 py-2 text-[0.65rem] text-white/80 backdrop-blur sm:gap-x-6 sm:gap-y-0 sm:px-4 sm:py-2.5 sm:text-sm">
      <span className="flex items-center gap-1">
        <Clock className="size-3 text-yellow-light sm:size-4" />
        Seg–Dom 18h–23h
      </span>
      <span className="flex items-center gap-1">
        <Bike className="size-3 text-yellow-light sm:size-4" />
        Taxa de entrega a partir de R$ 5
      </span>
      <span className="hidden items-center gap-1 sm:flex">
        <span className="text-yellow-light font-bold">★</span>
        Quente, fresca, feita na hora
      </span>
    </div>
  );
}
