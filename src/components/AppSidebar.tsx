import { NavLink, useLocation } from "react-router-dom";
import {
  PlusCircle,
  ListChecks,
  ShieldAlert,
  BarChart3,
  Settings,
  Box,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

const items = [
  { to: "/registrar", label: "Registrar", icon: PlusCircle, kbd: "R" },
  { to: "/fila", label: "Fila do Dia", icon: ListChecks, kbd: "F" },
  { to: "/disputas", label: "Disputas", icon: ShieldAlert, kbd: "D" },
  { to: "/dashboard", label: "Dashboard", icon: BarChart3, kbd: "B" },
];

export function AppSidebar() {
  const location = useLocation();
  const devolucoes = useStore((s) => s.devolucoes);
  const disputaCount = useMemo(
    () => devolucoes.filter((d) => d.status === "dispute").length,
    [devolucoes],
  );

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 px-4 border-b border-sidebar-border">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm">
          <Box className="h-4 w-4" strokeWidth={2.5} />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold leading-tight text-sidebar-foreground">
            Devoluções Pro
          </div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Controle E-commerce
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3">
        <p className="mb-1.5 px-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Operação
        </p>
        <ul className="space-y-0.5">
          {items.map((item) => {
            const active = location.pathname === item.to;
            const Icon = item.icon;
            const showBadge = item.to === "/disputas" && disputaCount > 0;
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={cn(
                    "group flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/60",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      active ? "text-primary" : "text-muted-foreground",
                    )}
                  />
                  <span className="flex-1 truncate">{item.label}</span>
                  {showBadge && (
                    <span className="rounded-full bg-warning-soft px-1.5 py-0.5 text-[10px] font-medium text-warning-soft-foreground tabular">
                      {disputaCount}
                    </span>
                  )}
                  <span className="kbd opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.kbd}
                  </span>
                </NavLink>
              </li>
            );
          })}
        </ul>

        <p className="mt-5 mb-1.5 px-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Sistema
        </p>
        <ul className="space-y-0.5">
          <li>
            <NavLink
              to="/configuracoes"
              className={({ isActive }) =>
                cn(
                  "group flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/60",
                )
              }
            >
              <Settings className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="flex-1">Configurações</span>
            </NavLink>
          </li>
        </ul>
      </nav>

      {/* Footer info */}
      <div className="border-t border-sidebar-border px-4 py-3">
        <p className="text-[10px] text-muted-foreground">
          Demo local · {devolucoes.length} registros
        </p>
        <p className="mt-0.5 text-[10px] text-muted-foreground">
          Pressione <span className="kbd">?</span> para atalhos
        </p>
      </div>
    </aside>
  );
}
