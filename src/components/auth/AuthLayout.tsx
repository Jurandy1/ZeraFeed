import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { Logo } from "@/components/brand/Logo";

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      <div className="flex flex-col justify-center px-5 py-12 sm:px-10 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          <Link to="/">
            <Logo />
          </Link>
          <h1 className="mt-10 text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-6 text-sm text-muted-foreground">{footer}</div>}
        </div>
      </div>

      <aside className="hidden border-l border-border bg-surface p-16 lg:flex lg:flex-col lg:justify-center">
        <div className="max-w-md">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Controle suas publicações. Sem complicação.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Busca por período, filtros avançados, proteção de conteúdos, backup automático e
            exclusão em lote com acompanhamento em tempo real.
          </p>
          <dl className="mt-10 grid grid-cols-2 gap-5">
            {[
              ["Filtros", "Período, tipo, texto e engajamento"],
              ["Proteção", "Capa, recentes e alto engajamento"],
              ["Backup", "Cópia JSON antes de excluir"],
              ["Histórico", "Cada operação registrada"],
            ].map(([term, desc]) => (
              <div key={term}>
                <dt className="text-sm font-semibold text-foreground">{term}</dt>
                <dd className="mt-1 text-xs text-muted-foreground">{desc}</dd>
              </div>
            ))}
          </dl>
        </div>
      </aside>
    </div>
  );
}
