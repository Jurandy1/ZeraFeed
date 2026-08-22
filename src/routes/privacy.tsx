import { createFileRoute } from "@tanstack/react-router";

import { LegalShell } from "./terms";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Política de Privacidade — ZeraFeed" },
      { name: "description", content: "Como o ZeraFeed coleta, armazena e protege os dados da sua conta e das Páginas conectadas." },
      { property: "og:title", content: "Política de Privacidade — ZeraFeed" },
      { property: "og:description", content: "Transparência sobre tratamento de dados e credenciais no ZeraFeed." },
    ],
  }),
  component: PrivacyPage,
});

const SECTIONS = [
  {
    title: "1. Dados coletados",
    body: "Coletamos nome, e-mail e dados de assinatura da sua conta, além de identificadores públicos das Páginas conectadas (ID, nome, usuário e foto) e metadados das publicações processadas.",
  },
  {
    title: "2. Credenciais de acesso",
    body: "Os tokens de acesso das Páginas são armazenados em uma tabela isolada, acessível apenas pelo servidor. Eles nunca são enviados ao navegador, exibidos na interface ou compartilhados com terceiros.",
  },
  {
    title: "3. Finalidade do tratamento",
    body: "Os dados são usados exclusivamente para operar o serviço: listar publicações, aplicar regras de proteção, executar exclusões solicitadas e manter o histórico de operações da sua conta.",
  },
  {
    title: "4. Backups",
    body: "Antes de cada exclusão geramos um arquivo JSON com o conteúdo selecionado. O backup fica vinculado à sua conta e pode ser baixado ou solicitado para remoção a qualquer momento.",
  },
  {
    title: "5. Isolamento e segurança",
    body: "Todo acesso ao banco de dados é protegido por políticas de segurança em nível de linha, garantindo que cada usuário leia e altere apenas os próprios registros.",
  },
  {
    title: "6. Retenção e exclusão",
    body: "Você pode desconectar uma Página a qualquer momento, o que remove as credenciais associadas. A exclusão da conta remove os dados pessoais e o histórico vinculado.",
  },
  {
    title: "7. Seus direitos",
    body: "Nos termos da LGPD, você pode solicitar acesso, correção, portabilidade ou exclusão dos seus dados pelo canal de suporte informado no aplicativo.",
  },
];

function PrivacyPage() {
  return (
    <LegalShell title="Política de Privacidade" updatedAt="Atualizada em janeiro de 2026">
      {SECTIONS.map((section) => (
        <section key={section.title}>
          <h2 className="text-base font-semibold text-foreground">{section.title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{section.body}</p>
        </section>
      ))}
    </LegalShell>
  );
}
