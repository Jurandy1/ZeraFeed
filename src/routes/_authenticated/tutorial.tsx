import { createFileRoute } from "@tanstack/react-router";

import { TutorialGuide } from "@/components/tutorial/TutorialGuide";

export const Route = createFileRoute("/_authenticated/tutorial")({
  head: () => ({
    meta: [
      { title: "Tutorial — Conectar Página · ZeraFeed" },
      {
        name: "description",
        content:
          "Passo a passo para obter o ID da Página e o Token permanente da Meta e conectar no ZeraFeed.",
      },
    ],
  }),
  component: TutorialPage,
});

function TutorialPage() {
  return (
    <div className="pb-8">
      <TutorialGuide />
    </div>
  );
}
