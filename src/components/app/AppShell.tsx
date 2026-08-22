import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  BadgeDollarSign,
  BookOpen,
  Eraser,
  History,
  LayoutDashboard,
  LifeBuoy,
  Link2,
  LogOut,
  Menu,
  Settings,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { BRL } from "@/lib/zerafeed/format";
import { LOCAL_MODE } from "@/lib/zerafeed/local-config";

const NAV_CLOUD = [
  { to: "/dashboard", label: "Visão geral", icon: LayoutDashboard },
  { to: "/cleaner", label: "Limpeza", icon: Eraser },
  { to: "/history", label: "Histórico", icon: History },
  { to: "/connections", label: "Conexões", icon: Link2 },
  { to: "/tutorial", label: "Tutorial", icon: BookOpen },
  { to: "/billing", label: "Assinatura", icon: BadgeDollarSign },
  { to: "/settings", label: "Configurações", icon: Settings },
  { to: "/support", label: "Suporte", icon: LifeBuoy },
] as const;

const NAV_LOCAL = [
  { to: "/cleaner", label: "Limpeza", icon: Eraser },
  { to: "/dashboard", label: "Visão geral", icon: LayoutDashboard },
  { to: "/connections", label: "Conexão", icon: Link2 },
  { to: "/tutorial", label: "Tutorial", icon: BookOpen },
  { to: "/support", label: "Suporte", icon: LifeBuoy },
] as const;

const NAV = LOCAL_MODE ? NAV_LOCAL : NAV_CLOUD;

interface ShellUser {
  name: string;
  email: string;
  planLabel: string;
  planStatus: string;
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="flex flex-col gap-0.5">
      {NAV.map((item) => {
        const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150",
              active
                ? "bg-primary-soft text-primary"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <item.icon className="h-[18px] w-[18px] shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function UserFooter({ user }: { user: ShellUser }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    if (LOCAL_MODE) {
      navigate({ to: "/cleaner", replace: true });
      return;
    }
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  }

  const initials = user.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  return (
    <div className="border-t border-sidebar-border p-3">
      <div className="rounded-lg border border-border bg-muted/60 p-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            {initials || "ZF"}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-border pt-2.5">
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-foreground">{user.planLabel}</p>
            <p className="truncate text-[11px] text-muted-foreground">
              {LOCAL_MODE
                ? user.planStatus
                : user.planLabel === "Teste grátis"
                  ? user.planStatus
                  : `${BRL.format(20)}/mês · ${user.planStatus}`}
            </p>
          </div>
          <button
            type="button"
            onClick={signOut}
            aria-label="Sair"
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function AppShell({ user, children }: { user: ShellUser; children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar fixa a partir de md — evita sumir em notebooks */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[240px] flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <div className="flex h-16 shrink-0 items-center border-b border-sidebar-border px-4">
          <Link to={LOCAL_MODE ? "/cleaner" : "/dashboard"} className="min-w-0">
            <Logo compact className="gap-0" />
            <span className="sr-only">ZeraFeed</span>
          </Link>
          <Link
            to={LOCAL_MODE ? "/cleaner" : "/dashboard"}
            className="ml-2 truncate text-sm font-semibold text-foreground"
          >
            ZeraFeed
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <NavList />
        </div>
        <UserFooter user={user} />
      </aside>

      <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-surface/95 px-3 backdrop-blur md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Abrir menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex w-[min(100vw-3rem,280px)] flex-col p-0">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <div className="flex h-14 shrink-0 items-center border-b border-sidebar-border px-4">
              <Logo compact />
              <span className="ml-2 text-sm font-semibold">ZeraFeed</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <NavList onNavigate={() => setOpen(false)} />
            </div>
            <UserFooter user={user} />
          </SheetContent>
        </Sheet>
        <Logo compact />
        <span className="truncate text-sm font-semibold">ZeraFeed</span>
      </header>

      <main className="md:pl-[240px]">
        <div className="mx-auto w-full max-w-[1280px] px-3 py-4 sm:px-5 sm:py-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
