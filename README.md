# GlicoDose Admin

Painel interno (React + Tailwind) com login único para ver métricas do mesmo projeto Supabase dos apps `diabetes` (Flutter) e `diabetes-medicos` (portal).

## O que mostra

- Quantidade de médicos cadastrados (`doctors`)
- Quantidade total de pacientes no app (`profiles`, excluindo médicos e admins)
- Pacientes vinculados por médico (`doctor_patients`)
- Doações (`/doacoes`): MRR estimado das assinaturas Stripe ativas de médicos (abas Total / Médicos / Pacientes)

## Setup

1. Copie o `.env`:

```bash
cp .env.example .env
```

Preencha com o mesmo `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` dos outros projetos.

2. Aplique a migration compartilhada [`../diabetes/supabase/migrations/010_admin_dashboard.sql`](../diabetes/supabase/migrations/010_admin_dashboard.sql) (a partir de `/diabetes`):

```bash
cd ../diabetes
supabase db query --linked -f supabase/migrations/010_admin_dashboard.sql
supabase db query --linked -f supabase/migrations/011_admin_donations.sql
```

Isso cria `admin_users`, `is_admin()`, `get_admin_dashboard_stats()` e `get_admin_donation_stats()`.

3. Crie o usuário admin e conceda permissão (service role — **nunca** no Vite):

```bash
cd ../diabetes-admin
SUPABASE_URL="$VITE_SUPABASE_URL" \
SUPABASE_SERVICE_ROLE_KEY="sua_service_role_key" \
node scripts/bootstrap-admin.mjs
```

Defaults do script: `gugazimmermann+admin@gmail.com` / `1234567890` (sobrescreva com `ADMIN_EMAIL` / `ADMIN_PASSWORD` se quiser).

4. Rode o app:

```bash
npm install
npm run dev
```

Abre em `http://localhost:5174`.

## Auth

- Somente login (sem criar conta no UI)
- Após autenticar, o app exige linha em `admin_users`; caso contrário faz logout
