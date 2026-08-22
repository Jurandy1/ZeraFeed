import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, LifeBuoy, Mail } from "lucide-react";

import { PageHeader } from "@/components/app/PageHeader";

export const Route = createFileRoute("/_authenticated/support")({
  head: () => ({
    meta: [
      { title: "Suporte — ZeraFeed" },
      { name: "description", content: "Tire dúvidas sobre conexão de Páginas, permissões da Meta e operações de limpeza." },
      { property: "og:title", content: "Suporte — ZeraFeed" },
      { property: "og:description", content: "Canais de atendimento e respostas rápidas do ZeraFeed." },
    ],
  }),
  component: SupportPage,
});

const FAQ = [
  {
    question: "Quais permissões preciso conceder?",
    answer:
      "As permissões oficiais pages_show_list, pages_read_engagement e pages_manage_posts. Elas permitem listar, ler e excluir publicações da Página administrada por você.",
  },
  {
    question: "A exclusão pode ser desfeita?",
    answer:
      "Não. A exclusão é definitiva no Facebook. Por isso o ZeraFeed sempre gera um backup em JSON com o conteúdo antes de executar a operação.",
  },
  {
    question: "Por que algumas publicações não podem ser excluídas?",
    answer:
      "Fotos de capa e de perfil, além de itens protegidos pelas suas regras, ficam bloqueados. A Meta também impede a exclusão de alguns conteúdos publicados por terceiros.",
  },
  {
    question: "Existe limite de publicações por operação?",
    answer:
      "Não há limite fixo. As exclusões são processadas em lotes com controle de ritmo para respeitar os limites da Graph API.",
  },
];

function SupportPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Suporte"
        description="Respostas rápidas e canais de atendimento para sua conta."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: Mail, title: "E-mail", text: "suporte@zerafeed.com.br", hint: "Resposta em até 1 dia útil" },
          { icon: LifeBuoy, title: "Atendimento", text: "Seg a sex, 9h às 18h", hint: "Horário de Brasília" },
          { icon: BookOpen, title: "Documentação", text: "Guias de conexão", hint: "Passo a passo com a Meta" },
        ].map((item) => (
          <div key={item.title} className="panel p-5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary">
              <item.icon className="h-4 w-4" />
            </span>
            <p className="mt-3 text-sm font-semibold text-foreground">{item.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{item.text}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{item.hint}</p>
          </div>
        ))}
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
