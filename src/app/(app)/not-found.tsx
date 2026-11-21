import Link from "next/link";
import { BrandMark } from "@/components/brand/BrandMark";

export default function AppNotFound() {
  return (
    <main
      id="main-content"
      className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-start justify-center gap-5 px-6 py-20"
    >
      <BrandMark subtitle="Pizzaria Delivery" size="lg" />
      <p className="text-xs font-bold uppercase tracking-widest text-primary">
        Página não encontrada
      </p>
      <h1 className="font-serif text-4xl font-extrabold tracking-tight text-foreground">
        Este endereço não existe no cardápio.
      </h1>
      <p className="text-base text-muted-foreground">
        Volte para a página da pizzaria ou abra diretamente os sabores
        disponíveis para entrega hoje.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center rounded-xl border border-border bg-card px-5 text-sm font-bold text-foreground transition-colors hover:border-primary/40 hover:bg-secondary"
        >
          Página inicial
        </Link>
        <Link
          href="/cardapio"
          className="inline-flex min-h-11 items-center rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-hover"
        >
          Ver cardápio completo
        </Link>
      </div>
    </main>
  );
}
