"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Kanban, Users, type LucideIcon } from "lucide-react";
import { LogoNegative } from "./logo";
import { ThemeToggle } from "./theme-toggle";

const NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/funil", label: "Funil", icon: Kanban },
  { href: "/contatos", label: "Contatos", icon: Users },
];

/**
 * Colapsada por padrão (72px, só ícones). Expande sobre o conteúdo em hover
 * — ou quando um item recebe foco pelo teclado (:focus-visible) — sem empurrar a página.
 */
export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      aria-label="Navegação principal"
      className="group/sidebar fixed inset-y-0 left-0 z-40 flex w-[72px] flex-col overflow-hidden border-r border-pine bg-forest text-sage transition-[width,box-shadow] duration-200 ease-out hover:w-60 hover:shadow-pop hover:delay-100 has-[:focus-visible]:w-60 has-[:focus-visible]:shadow-pop"
    >
      <Link href="/funil" className="flex h-[72px] shrink-0 items-center pl-4" aria-label="GreenCRM — início">
        {/* Recorta só o símbolo; a palavra aparece quando a sidebar expande. */}
        <span className="w-10 overflow-hidden transition-[width] duration-200 group-hover/sidebar:w-[152px] group-hover/sidebar:delay-100 group-has-[:focus-visible]/sidebar:w-[152px]">
          <LogoNegative className="h-10 w-auto max-w-none" />
        </span>
      </Link>

      <nav className="mt-2 flex flex-1 flex-col gap-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`relative mx-3 flex h-11 items-center rounded-md text-label transition-colors ${
                active ? "bg-pine text-mint" : "hover:bg-pine/60 hover:text-mint"
              }`}
            >
              {active && <span aria-hidden className="absolute -left-3 h-6 w-1 rounded-r-full bg-sage" />}
              <span className="flex w-12 shrink-0 justify-center">
                <Icon size={20} strokeWidth={1.75} aria-hidden />
              </span>
              <SidebarLabel>{label}</SidebarLabel>
            </Link>
          );
        })}
      </nav>

      <div className="mb-4 flex flex-col gap-1">
        <ThemeToggle labelClassName={labelClassName} />
      </div>
    </aside>
  );
}

const labelClassName =
  "whitespace-nowrap opacity-0 transition-opacity duration-150 group-hover/sidebar:opacity-100 group-hover/sidebar:delay-150 group-has-[:focus-visible]/sidebar:opacity-100";

function SidebarLabel({ children }: { children: React.ReactNode }) {
  return <span className={labelClassName}>{children}</span>;
}
