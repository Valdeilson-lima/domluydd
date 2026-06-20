import { Search } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Buscar no cardápio..."
        aria-label="Buscar pizzas"
        className="w-full rounded-[12px] border border-white/10 bg-black-light/80 pl-10 pr-4 py-2.5 font-body text-sm text-white outline-none transition-all duration-200 placeholder:text-muted/60 focus:border-red-primary focus:bg-black-light focus:shadow-[0_0_0_3px_rgba(196,30,36,0.15)] sm:py-3 sm:rounded-[14px]"
      />
    </div>
  );
}
