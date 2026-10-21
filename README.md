# GreenCRM

O cliente no centro, o pipeline em dia.

## Rodando

```bash
npm install
npm run dev            # http://localhost:3000
```

O banco SQLite é criado sozinho em `data/greencrm.db` na primeira requisição, já com as etapas do funil.

| Script | O que faz |
| --- | --- |
| `npm run db:seed-demo` | Cria contatos e negócios fictícios (só se o banco não tiver contatos) |
| `npm run db:reset` | Apaga o banco local (com o servidor parado) |
| `npm run db:generate` | Gera uma migração depois de alterar `src/db/schema.ts` |
| `npm run db:studio` | Abre o Drizzle Studio para inspecionar os dados |
| `npm run typecheck` | Checagem de tipos |

## Stack

- **Next.js (App Router) + TypeScript**: páginas renderizadas no servidor; gravações via Server Actions (`src/lib/actions`).
- **SQLite + Drizzle ORM**: banco em arquivo, sem servidor. Para ir para Postgres, troque o driver em `src/db/index.ts` e o `dialect` em `drizzle.config.ts`.
- **Tailwind v4**: os tokens de `design/greencrm-identidade.html` estão em `src/app/globals.css` e viram utilitários (`bg-surface`, `text-ink`, `text-brand`…), trocando sozinhos entre tema claro e escuro.
- **dnd-kit**: arrastar e soltar do Funil (mouse, toque e teclado).

## Estrutura

```
src/
  app/
    funil/        Kanban de negócios
    contatos/     Cadastro de contatos
  components/
    sidebar.tsx   Navegação colapsada que expande em hover
    funil/        Board, cards, modal de negócio, seletor de contato
    contacts/     Lista e modal de contato
  db/             Schema, conexão, etapas padrão
  lib/
    actions/      Server Actions (criar, editar, mover, excluir)
    queries.ts    Leituras do banco
drizzle/          Migrações SQL
design/           Identidade visual (fonte de verdade dos tokens)
```

## Funil

Etapas padrão: Oportunidade → Em atendimento → Qualificado → Proposta enviada → Negociação → Ganho / Perdido.
Ficam na tabela `stages` (com `kind` = `open`, `won` ou `lost`), prontas para serem editáveis no futuro.

Cada negócio pertence a um contato. Valores são guardados em centavos. O card mostra a previsão de fechamento (destacada quando atrasada) e há quantos dias o negócio está na etapa.
