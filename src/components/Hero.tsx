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
  return (
    <section className="relative flex h-[200px] items-center justify-center overflow-hidden sm:h-[300px] md:h-[420px]">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url(https://cdn.pixabay.com/photo/2017/12/09/08/18/pizza-3007395_960_720.jpg)",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-black/75 to-black/40" />

      <div className="relative z-2 px-5 text-center text-white">
        <h1 className="font-display text-[clamp(1.8rem,6vw,5.5rem)] font-extrabold leading-none -tracking-[0.03em] text-red-primary drop-shadow-[0_2px_20px_rgba(0,0,0,0.5)] mb-1.5 sm:mb-3">
          Don Luydd
        </h1>
        <p className="mb-2 text-xs font-light opacity-95 leading-relaxed sm:text-base sm:mb-6">
          A melhor pizza artesanal da cidade.
        </p>
      </div>
    </section>
  );
}

export function InfoStrip() {
  const open = isOpen();

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b border-white/6 bg-black-light/80 px-3 py-2 text-[0.65rem] text-white/80 backdrop-blur sm:gap-x-6 sm:gap-y-0 sm:px-4 sm:py-2.5 sm:text-sm">
      <span
        className={`flex items-center gap-1 font-semibold ${open ? "text-green-400" : "text-red-400"}`}
      >
        <span
          className={`size-1.5 rounded-full sm:size-2 ${open ? "bg-green-400" : "bg-red-400"}`}
        />
        {open ? "Aberto agora" : "Fechado"}
      </span>
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
