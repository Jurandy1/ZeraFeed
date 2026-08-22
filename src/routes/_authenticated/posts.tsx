import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/posts")({
  beforeLoad: () => {
    throw redirect({ to: "/cleaner", replace: true });
  },
});
