-- Segurança: as tabelas do CRM ficam fora da API pública do Supabase (Data API).
-- O app fala com o banco direto, pelo servidor, usando o usuário greencrm_app,
-- que só enxerga estas tabelas.

alter table public.contacts enable row level security;
alter table public.stages enable row level security;
alter table public.deals enable row level security;

revoke all on table public.contacts, public.stages, public.deals from anon, authenticated;
revoke all on sequence public.contacts_id_seq, public.stages_id_seq, public.deals_id_seq from anon, authenticated;

-- Usuário de banco do app. A senha não fica nas migrações: é definida à parte e vive só no .env.local.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'greencrm_app') then
    create role greencrm_app with login noinherit;
  end if;
end
$$;

grant usage on schema public to greencrm_app;
grant select, insert, update, delete on table public.contacts, public.stages, public.deals to greencrm_app;
grant usage, select on sequence public.contacts_id_seq, public.stages_id_seq, public.deals_id_seq to greencrm_app;

create policy "greencrm_app acessa contatos" on public.contacts
  for all to greencrm_app using (true) with check (true);
create policy "greencrm_app acessa etapas" on public.stages
  for all to greencrm_app using (true) with check (true);
create policy "greencrm_app acessa negocios" on public.deals
  for all to greencrm_app using (true) with check (true);

-- Etapas iniciais do funil de atendimento e vendas, da oportunidade ao fechamento.
insert into public.stages (name, description, position, kind) values
  ('Oportunidade', 'Lead identificado, ainda sem contato.', 0, 'open'),
  ('Em atendimento', 'Primeiro contato feito, entendendo a necessidade.', 1, 'open'),
  ('Qualificado', 'Necessidade, orçamento e decisor confirmados.', 2, 'open'),
  ('Proposta enviada', 'Proposta comercial nas mãos do cliente.', 3, 'open'),
  ('Negociação', 'Ajustando condições, prazos e valores.', 4, 'open'),
  ('Ganho', 'Venda fechada.', 5, 'won'),
  ('Perdido', 'O cliente não seguiu com a compra.', 6, 'lost');
