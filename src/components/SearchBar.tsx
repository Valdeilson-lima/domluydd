import { Search, X } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  resultsCount?: number;
  total?: number;
}

export function SearchBar({
  value,
  onChange,
  resultsCount,
  total,
}: SearchBarProps) {
  const hasValue = value.length > 0;
  const showingFiltered =
    hasValue && resultsCount !== undefined && total !== undefined;

  return (
    <div className="space-y-1.5">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted pointer-events-none" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Buscar por sabor ou ingrediente..."
          aria-label="Buscar no cardápio"
          className="w-full rounded-[14px] border border-white/10 bg-black-light/80 pl-10 pr-10 py-3 font-body text-sm text-cream outline-none transition-all duration-200 placeholder:text-muted/70 focus:border-yellow/60 focus:bg-black-light focus:shadow-[0_0_0_3px_rgba(242,183,5,0.12)] sm:py-3.5"
        />
        {hasValue && (
          <button
            onClick={() => onChange("")}
            aria-label="Limpar busca"
            className="absolute right-2.5 top-1/2 flex size-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/8 text-muted transition-colors duration-200 hover:bg-red-primary/20 hover:text-red-light"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>
      {showingFiltered && (
        <p className="px-1 font-mono text-[0.62rem] uppercase tracking-wider text-muted">
          {resultsCount === 0
            ? "Nenhum resultado"
            : `${resultsCount} de ${total} ${total === 1 ? "item" : "itens"}`}
        </p>
      )}
    </div>
  );
}
