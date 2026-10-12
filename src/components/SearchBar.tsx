import { useEffect, useRef } from "react";
import { Search, X, Sparkles } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  resultsCount?: number;
  total?: number;
  tags?: string[];
  activeTag?: string;
  onTagSelect?: (tag: string) => void;
}

export function SearchBar({
  value,
  onChange,
  resultsCount,
  total,
  tags = [],
  activeTag = "Todas",
  onTagSelect,
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hasValue = value.length > 0;
  const showingFiltered =
    (hasValue || activeTag !== "Todas") &&
    resultsCount !== undefined &&
    total !== undefined;

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
    <div className="space-y-3">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-muted/70 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Buscar pizza pelo sabor, queijo ou ingrediente favorito..."
          aria-label="Buscar no cardápio"
          className="w-full rounded-2xl border border-white/10 bg-linear-to-b from-[#1c191a] to-[#141213] pl-11 pr-11 py-3.5 font-body text-sm text-cream outline-none transition-all duration-200 placeholder:text-muted/60 focus:border-yellow/70 focus:bg-[#201d1e] focus:ring-2 focus:ring-yellow/20 shadow-inner sm:py-4 sm:text-base"
        />

        {hasValue ? (
          <button
            onClick={() => onChange("")}
            aria-label="Limpar busca"
            className="absolute right-3 top-1/2 flex size-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/8 text-muted transition-colors duration-200 hover:bg-red-primary/20 hover:text-red-light"
          >
            <X className="size-4" />
          </button>
        ) : (
          <kbd className="pointer-events-none absolute right-3.5 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-lg border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[0.62rem] font-semibold text-muted/70 sm:flex">
            /
          </kbd>
        )}
      </div>

      {/* Quick Filter Pills */}
      {tags.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {tags.map((tag) => {
            const isSelected = activeTag === tag;
            return (
              <button
                key={tag}
                type="button"
                onClick={() => onTagSelect?.(tag)}
                className={`flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 font-mono text-xs font-semibold transition-all duration-200 ${
                  isSelected
                    ? "bg-yellow text-black shadow-[0_2px_12px_rgba(242,183,5,0.35)] scale-[1.02]"
                    : "border border-white/8 bg-white/3 text-muted hover:border-white/20 hover:text-cream"
                }`}
              >
                {tag === "Mais Pedidas" && (
                  <Sparkles className="size-3 text-red-dark" />
                )}
                {tag}
              </button>
            );
          })}
        </div>
      )}

      {/* Filter status text */}
      {showingFiltered && (
        <div className="flex items-center justify-between px-1">
          <p className="font-mono text-[0.65rem] uppercase tracking-wider text-muted">
            {resultsCount === 0
              ? "Nenhum sabor encontrado"
              : `Exibindo ${resultsCount} de ${total} ${total === 1 ? "opção" : "opções"}`}
          </p>
          {(hasValue || activeTag !== "Todas") && (
            <button
              type="button"
              onClick={() => {
                onChange("");
                onTagSelect?.("Todas");
              }}
              className="font-mono text-[0.65rem] font-semibold text-yellow hover:underline cursor-pointer"
            >
              Limpar filtros
            </button>
          )}
        </div>
      )}
    </div>
  );
}
