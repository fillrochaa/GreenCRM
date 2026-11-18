# GreenCRM

O cliente no centro, o pipeline em dia.

## Rodando

```bash
npm install
cp .env.example .env.local   # e preencha (veja abaixo)
npm run dev                  # http://localhost:3000
```

Sem login, qualquer página leva para `/login`. Não há cadastro público: os usuários são criados pelo administrador no Supabase (Authentication → Users). Quem é criado com `user_metadata.must_change_password = true` é obrigado a trocar a senha no primeiro acesso.

| Script | O que faz |
| --- | --- |
| `npm run db:generate` | Gera uma migração em `supabase/migrations` depois de alterar `src/db/schema.ts` |
| `npm run db:push` | Aplica as migrações pendentes no projeto Supabase vinculado |
| `npm run db:studio` | Abre o Drizzle Studio para inspecionar os dados |
| `npm run typecheck` | Checagem de tipos |

## Banco de dados (Supabase)

O banco é o Postgres do projeto **GreenCRM** no Supabase (`wjuivvtyikrvgdisrljj`), já vinculado com `supabase link`.

- **Acesso do app**: o servidor do Next fala direto com o Postgres pelo pooler (porta 6543, modo transação) com o usuário de banco `greencrm_app`, que só tem acesso às tabelas do CRM. A senha dele fica apenas no `.env.local`.
- **API pública fechada**: as tabelas têm RLS ligado e nenhuma permissão para `anon`/`authenticated`, então a Data API do Supabase não expõe nada.
- **Migrações**: `src/db/schema.ts` é a fonte da verdade. `npm run db:generate` gera o SQL (com o prefixo de data do Supabase) e `npm run db:push` aplica. SQL escrito à mão (permissões, dados iniciais) vai em migrações criadas com `npx drizzle-kit generate --custom --name=<nome>`.
- **Configuração do Auth**: `supabase/config.toml` espelha o projeto remoto. Rode `supabase config diff` antes de qualquer `supabase config push`.

### Variáveis (`.env.local`)

| Variável | De onde vem |
| --- | --- |
| `DATABASE_URL` | `postgresql://greencrm_app.<ref>:<senha>@<host-do-pooler>:6543/postgres?sslmode=require` |
| `SUPABASE_URL` | `https://<ref>.supabase.co` |
| `SUPABASE_PUBLISHABLE_KEY` | Project Settings → API Keys (chave `sb_publishable_…`) |

O Supabase Auth roda só no servidor (Server Actions, páginas e `src/proxy.ts`), por isso nenhuma variável usa o prefixo `NEXT_PUBLIC_`.

## Stack

- **Next.js (App Router) + TypeScript**: páginas renderizadas no servidor; gravações via Server Actions (`src/lib/actions`), todas protegidas por `requireUser()`.
- **Supabase**: Postgres + Auth (login por e-mail e senha, com `@supabase/ssr`).
- **Drizzle ORM** com o driver `postgres`: schema, consultas e migrações.
- **Tailwind v4**: os tokens de `design/greencrm-identidade.html` estão em `src/app/globals.css` e viram utilitários (`bg-surface`, `text-ink`, `text-brand`…), trocando sozinhos entre tema claro e escuro.
- **dnd-kit**: arrastar e soltar do Funil (mouse, toque e teclado).

## Estrutura

```
src/
  proxy.ts        Renova a sessão e manda quem não está logado para /login
  app/
    (app)/        Área logada (sidebar): funil/, contatos/
    (auth)/       Telas de acesso: login/, trocar-senha/
  components/
    sidebar.tsx   Navegação colapsada que expande em hover
    auth/         Formulários de login e troca de senha
    funil/        Board, cards, modal de negócio, seletor de contato
    contacts/     Lista e modal de contato
  db/             Schema (Drizzle) e conexão
  lib/
    auth.ts       getCurrentUser() e requireUser()
    supabase/     Cliente do Supabase Auth no servidor
    actions/      Server Actions (login, contatos, negócios)
    queries.ts    Leituras do banco
supabase/
  migrations/     Migrações SQL aplicadas no Supabase
  config.toml     Configuração do projeto (espelha o remoto)
design/           Identidade visual (fonte de verdade dos tokens)
```

## Funil

Etapas padrão: Oportunidade → Em atendimento → Qualificado → Proposta enviada → Negociação → Ganho / Perdido.
Ficam na tabela `stages` (com `kind` = `open`, `won` ou `lost`), criadas pela migração inicial e prontas para serem editáveis no futuro.

Cada negócio pertence a um contato. Valores são guardados em centavos (`bigint`). O card mostra a previsão de fechamento (destacada quando atrasada) e há quantos dias o negócio está na etapa.
