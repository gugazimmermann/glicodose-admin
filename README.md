# GlicoDose Admin

Painel interno (React + Tailwind) com login para métricas do mesmo projeto Supabase dos apps `diabetes` (Flutter) e `diabetes-medicos` (portal).

## O que mostra

- **Visão geral (`/`):** médicos, pacientes, pacientes por médico
- **Doações (`/doacoes`):** MRR estimado
  - Médicos: assinaturas Stripe ativas/grace
  - Pacientes: apoiadores RevenueCat (espelhados em `profiles`)
  - Total: soma dos dois
- **Uso de IA (`/ia`):** chamadas, erros, tokens, latência e custo estimado OpenAI (`ai_usage_logs`, últimos 7/30/90 dias)

## Setup

1. Copie o `.env`:

```bash
cp .env.example .env
```

Preencha com o mesmo `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` dos outros projetos.

2. Aplique as migrations no app paciente (`/diabetes`):

```bash
cd ../diabetes
# … até 012_rx_ai_ops.sql (inclui get_admin_donation_stats atualizado + get_admin_ai_stats)
supabase db query --linked -f supabase/migrations/010_admin_dashboard.sql
supabase db query --linked -f supabase/migrations/011_admin_donations.sql
supabase db query --linked -f supabase/migrations/012_rx_ai_ops.sql
```

Isso cria `admin_users`, `is_admin()`, `get_admin_dashboard_stats()`, `get_admin_donation_stats()` e `get_admin_ai_stats()`.

3. Crie o usuário admin (service role — **nunca** no Vite):

```bash
cd ../diabetes-admin
SUPABASE_URL="$VITE_SUPABASE_URL" \
SUPABASE_SERVICE_ROLE_KEY="sua_service_role_key" \
node scripts/bootstrap-admin.mjs
```

Sobrescreva defaults com `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

4. Rode o app:

```bash
npm install
npm run dev
```

Abre em `http://localhost:5174`.

## Auth

- Somente login (sem signup no UI)
- Após autenticar, exige linha em `admin_users`; senão faz logout

## Projetos irmãos

| Repo | Papel |
| --- | --- |
| `diabetes` | App paciente + migrations canônicas |
| `diabetes-medicos` | Portal médico |
| `diabetes-site` | Landing |
