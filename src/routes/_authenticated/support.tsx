import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, ExternalLink, LifeBuoy, MessageCircle } from "lucide-react";

import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import {
  SUPPORT_PHONE,
  SUPPORT_PHONE_DISPLAY,
  SUPPORT_WHATSAPP_URL,
} from "@/lib/zerafeed/contact";

export const Route = createFileRoute("/_authenticated/support")({
  head: () => ({
    meta: [
      { title: "Suporte — ZeraFeed" },
      {
        name: "description",
        content: "Tire dúvidas sobre conexão de Páginas, permissões da Meta e operações de limpeza.",
      },
      { property: "og:title", content: "Suporte — ZeraFeed" },
      { property: "og:description", content: "Canais de atendimento e respostas rápidas do ZeraFeed." },
    ],
  }),
  component: SupportPage,
});

const FAQ = [
  {
    question: "Quais dados do Facebook eu preciso?",
    answer:
      "Apenas o ID da Página e o Token permanente da Página (com pages_manage_posts, pages_read_engagement e, de preferência, pages_manage_engagement). Não cole App ID nem App Secret no ZeraFeed.",
  },
  {
    question: "Onde vejo o passo a passo?",
    answer:
      "Abra o Tutorial no menu ou em /tutorial. O guia mostra como criar o app na Meta, achar o ID da Página e gerar o token permanente.",
  },
  {
    question: "A exclusão pode ser desfeita?",
    answer:
      "Não. A exclusão é definitiva no Facebook. Por isso o ZeraFeed sempre gera um backup em JSON antes de executar a operação.",
  },
  {
    question: "Por que algumas publicações não podem ser excluídas?",
    answer:
      "Fotos de capa e de perfil, além de itens protegidos pelas suas regras, ficam bloqueados. A Meta também impede a exclusão de alguns conteúdos publicados por terceiros.",
  },
];

function SupportPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Suporte"
        description="Respostas rápidas e atendimento direto pelo WhatsApp."
        actions={
          <Button asChild>
            <a href={SUPPORT_WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4" /> Falar no WhatsApp
            </a>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <a
          href={SUPPORT_WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="panel block p-5 transition-colors hover:border-primary/40"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary">
            <MessageCircle className="h-4 w-4" />
          </span>
          <p className="mt-3 text-sm font-semibold text-foreground">WhatsApp</p>
          <p className="mt-1 text-sm text-muted-foreground">{SUPPORT_PHONE_DISPLAY}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Número {SUPPORT_PHONE}</p>
        </a>
        <div className="panel p-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary">
            <LifeBuoy className="h-4 w-4" />
          </span>
          <p className="mt-3 text-sm font-semibold text-foreground">Atendimento</p>
          <p className="mt-1 text-sm text-muted-foreground">Seg a sex, 9h às 18h</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Horário de Brasília</p>
        </div>
        <a href="/tutorial.html" target="_blank" rel="noopener noreferrer" className="panel block p-5 transition-colors hover:border-primary/40">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary">
            <BookOpen className="h-4 w-4" />
          </span>
          <p className="mt-3 text-sm font-semibold text-foreground">Tutorial</p>
          <p className="mt-1 text-sm text-muted-foreground">Como obter ID e Token</p>
          <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-primary">
            Abrir guia <ExternalLink className="h-3 w-3" />
          </p>
        </a>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Perguntas frequentes</h2>
        {FAQ.map((item) => (
          <div key={item.question} className="panel p-5">
            <p className="text-sm font-semibold text-foreground">{item.question}</p>
            <p className="mt-1.5 text-sm text-muted-foreground">{item.answer}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
