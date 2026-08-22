import { Link, createFileRoute } from "@tanstack/react-router";
import { BookOpen, ExternalLink, MessageCircle } from "lucide-react";

import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import {
  SUPPORT_PHONE,
  SUPPORT_PHONE_DISPLAY,
  SUPPORT_WHATSAPP_URL,
} from "@/lib/zerafeed/contact";

export const Route = createFileRoute("/_authenticated/tutorial")({
  head: () => ({
    meta: [
      { title: "Tutorial — Conectar Página · ZeraFeed" },
      {
        name: "description",
        content:
          "Passo a passo oficial para obter o ID da Página e o Token permanente da Meta e conectar no ZeraFeed.",
      },
    ],
  }),
  component: TutorialPage,
});

function TutorialPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Guia de conexão"
        description="Como obter o ID da Página e o Token permanente — com prints das telas da Meta."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <a href="/tutorial.html" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" /> Abrir em tela cheia
              </a>
            </Button>
            <Button asChild>
              <a href={SUPPORT_WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4" /> WhatsApp {SUPPORT_PHONE_DISPLAY}
              </a>
            </Button>
          </div>
        }
      />

      <div className="panel overflow-hidden p-0">
        <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-2.5 text-xs text-muted-foreground">
          <BookOpen className="h-3.5 w-3.5" />
          Documentação v3 · Conectar Página com fotos · Contato {SUPPORT_PHONE}
        </div>
        <iframe
          title="Tutorial ZeraFeed — Conectar Página"
          src="/tutorial.html"
          className="h-[min(78vh,900px)] w-full border-0 bg-background"
        />
      </div>

      <p className="text-sm text-muted-foreground">
        Depois de gerar o token, volte para{" "}
        <Link to="/connections" className="font-medium text-primary hover:underline">
          Conexões
        </Link>{" "}
        e cole o ID + Token permanente.
      </p>
    </div>
  );
}
