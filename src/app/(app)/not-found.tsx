import Link from "next/link";

export default function AppNotFound() {
  return (
    <main
      id="conteudo-principal"
      className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-start justify-center gap-5 px-6 py-20"
    >
      <div
        className="h-14 w-14 rounded-full border-[5px] border-primary"
        aria-hidden="true"
      />
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Página não encontrada
      </p>
      <h1 className="font-serif text-4xl font-medium tracking-tight text-foreground">
        Este endereço não existe no cardápio.
      </h1>
      <p className="text-base text-muted-foreground">
        Volte para a página da pizzaria ou abra diretamente os sabores
        disponíveis para entrega hoje.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/"
          className="inline-flex h-11 items-center border border-border bg-secondary px-5 text-sm font-semibold text-foreground transition-colors hover:bg-foreground hover:text-background"
        >
          Página inicial
        </Link>
        <Link
          href="/cardapio"
          className="inline-flex h-11 items-center bg-primary px-5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Ver cardápio completo
        </Link>
      </div>
    </main>
  );
}
