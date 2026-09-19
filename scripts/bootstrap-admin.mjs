#!/usr/bin/env node
/**
 * Cria (ou atualiza) o usuário admin no Auth e garante a linha em admin_users.
 *
 * Uso:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/bootstrap-admin.mjs
 *
 * Opcionais:
 *   ADMIN_EMAIL (default: gugazimmermann+admin@gmail.com)
 *   ADMIN_PASSWORD (default: 1234567890)
 */

import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const email =
  process.env.ADMIN_EMAIL || 'gugazimmermann+admin@gmail.com'
const password = process.env.ADMIN_PASSWORD || '1234567890'

if (!url || !serviceKey) {
  console.error(
    'Defina SUPABASE_URL (ou VITE_SUPABASE_URL) e SUPABASE_SERVICE_ROLE_KEY.',
  )
  process.exit(1)
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function findUserByEmail(targetEmail) {
  let page = 1
  const perPage = 200
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error) throw error
    const found = data.users.find(
      (u) => u.email?.toLowerCase() === targetEmail.toLowerCase(),
    )
    if (found) return found
    if (data.users.length < perPage) return null
    page += 1
  }
}

async function main() {
  let user = await findUserByEmail(email)

  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    if (error) throw error
    user = data.user
    console.log(`Usuário criado: ${user.id} (${email})`)
  } else {
    const { data, error } = await admin.auth.admin.updateUserById(user.id, {
      password,
      email_confirm: true,
    })
    if (error) throw error
    user = data.user
    console.log(`Usuário já existia; senha atualizada: ${user.id} (${email})`)
  }

  const { error: upsertError } = await admin.from('admin_users').upsert({
    id: user.id,
  })
  if (upsertError) throw upsertError

  console.log(`Permissão admin_users ok para ${user.id}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
