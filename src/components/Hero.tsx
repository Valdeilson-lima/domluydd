import { Clock, Bike, Flame } from "lucide-react";

function getOpenState() {
  const now = new Date();
  const day = now.getDay();
  const totalMinutes = now.getHours() * 60 + now.getMinutes();
  const isOpenToday =
    day !== 1 && totalMinutes >= 18 * 60 && totalMinutes < 22 * 60;

  let nextLabel: string;
  if (isOpenToday) {
    nextLabel = "Pedidos até 22h";
  } else if (day === 1) {
    nextLabel = "Abrimos terça às 18h";
  } else if (totalMinutes < 18 * 60) {
    nextLabel = "Abrimos hoje às 18h";
  } else if (day === 0) {
    nextLabel = "Abrimos terça às 18h";
  } else {
    nextLabel = day === 6 ? "Abrimos domingo às 18h" : "Abrimos amanhã às 18h";
  }

  return { open: isOpenToday, nextLabel };
}

export function Hero() {
  const { open, nextLabel } = getOpenState();

  return (
    <section className="relative overflow-hidden bg-linear-to-br from-[#1a120b] via-[#241810] to-[#3a2014]">
      <div
        className="absolute inset-0 opacity-30 bg-cover bg-center"
        style={{
          backgroundImage:
            "url(https://cdn.pixabay.com/photo/2017/12/09/08/18/pizza-3007395_960_720.jpg)",
        }}
      />
      <div className="absolute inset-0 bg-linear-to-b from-black/40 via-black/50 to-black/70" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_40%,rgba(232,154,69,0.18),transparent_60%)]" />

      <div className="relative mx-auto flex max-w-280 flex-col items-start gap-5 px-5 py-9 sm:items-center sm:px-7 sm:py-14 sm:text-center md:py-20">
        <div className="flex flex-1 flex-col items-start gap-5 sm:items-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-yellow/30 bg-black/40 px-3 py-1 font-mono text-[0.6rem] font-semibold uppercase tracking-[0.25em] text-yellow/90 backdrop-blur-sm">
            <Flame className="size-3" />
            Pizzaria Artesanal
          </span>

          <div>
            <h1 className="font-display text-[clamp(2.6rem,11vw,5.5rem)] font-semibold italic leading-[0.9] tracking-[-0.03em] text-cream [font-variation-settings:'opsz'_144,'SOFT'_50] [text-shadow:0_4px_30px_rgba(0,0,0,0.5)]">
              Don Luydd
            </h1>
            <p className="mt-3 max-w-md font-display text-base font-normal italic leading-snug text-cream-dim [font-variation-settings:'opsz'_72] sm:text-lg sm:mx-auto">
              Massa de fermentação natural, forno elétrico, ingredientes na
              hora.
            </p>
          </div>

          {/* Status — the thesis */}
          <div
            className={`mt-1 flex items-center gap-3 rounded-[14px] border px-4 py-3 backdrop-blur-md ${
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
      </div>
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
