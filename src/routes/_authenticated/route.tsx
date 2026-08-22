import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { AuthedLayout } from "@/components/app/AuthedLayout";
import { supabase } from "@/integrations/supabase/client";
import { LOCAL_MODE } from "@/lib/zerafeed/local-config";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    if (LOCAL_MODE) {
      return {
        user: {
          id: "local-user",
          email: "local@exladrao",
        },
      };
    }
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/login" });
    return { user: data.user };
  },
  component: () => (
    <AuthedLayout>
      <Outlet />
    </AuthedLayout>
  ),
});
