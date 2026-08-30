import { useEffect, useRef } from "react";
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
  const inputRef = useRef<HTMLInputElement>(null);
  const hasValue = value.length > 0;
  const showingFiltered =
    hasValue && resultsCount !== undefined && total !== undefined;

  // Atalho "/" foca a busca e "Esc" limpa/sai dela
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.matches("input, textarea, select")) return;
      if (e.key === "/") {
        e.preventDefault();
        inputRef.current?.focus();
      } else if (e.key === "Escape") {
        inputRef.current?.blur();
        if (hasValue) onChange("");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onChange, hasValue]);

  return (
    <div className="space-y-1.5">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Buscar por sabor ou ingrediente..."
          aria-label="Buscar no cardápio"
          className="w-full rounded-md border border-white/10 bg-black-light/80 pl-10 pr-10 py-3 font-body text-sm text-cream outline-none transition-all duration-200 placeholder:text-muted/70 focus:border-yellow/60 focus:bg-black-light focus:shadow-[0_0_0_3px_rgba(242,183,5,0.12)] sm:py-3.5"
        />
        {hasValue ? (
          <button
            onClick={() => onChange("")}
            aria-label="Limpar busca"
            className="absolute right-2.5 top-1/2 flex size-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/8 text-muted transition-colors duration-200 hover:bg-red-primary/20 hover:text-red-light"
          >
            <X className="size-3.5" />
          </button>
        ) : (
          <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[0.6rem] font-semibold text-muted sm:flex">
            /
          </kbd>
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
