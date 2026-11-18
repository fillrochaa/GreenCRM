import { LogoNegative } from "@/components/logo";

/** Moldura das telas de acesso: painel da marca à esquerda, formulário à direita. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh grid-rows-[auto_1fr] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:grid-rows-1">
      <aside className="relative flex flex-col justify-between overflow-hidden bg-abyss px-6 py-6 text-mint lg:px-14 lg:py-12">
        <LogoNegative className="relative z-10 h-9 w-auto self-start lg:h-11" />

        <div className="relative z-10 hidden lg:block">
          <p className="max-w-md font-display text-display font-semibold tracking-[-0.02em]">
            O cliente no centro, o pipeline em dia.
          </p>
          <p className="mt-5 max-w-sm text-title text-sage">
            Seus contatos e negócios organizados num funil só, do primeiro contato ao fechamento.
          </p>
        </div>

        <p className="relative z-10 hidden text-caption text-sage/80 lg:block">GreenCRM</p>

        {/* O símbolo da marca, grande e discreto, ao fundo do painel. */}
        <svg
          aria-hidden
          viewBox="0 0 120 120"
          className="pointer-events-none absolute -right-24 -bottom-28 hidden h-[520px] w-[520px] opacity-[0.07] lg:block"
        >
          <path
            d="M84.04 35.96 A34.0 34.0 0 1 0 94.00 60.00"
            fill="none"
            stroke="#DAF1DE"
            strokeWidth="16"
            strokeLinecap="round"
          />
          <circle cx="64.08" cy="60" r="10" fill="#8EB69B" />
        </svg>
      </aside>

      <main className="flex items-start justify-center px-4 py-10 sm:items-center sm:py-16">
        <div className="w-full max-w-[380px]">{children}</div>
      </main>
    </div>
  );
}
