#!/usr/bin/env node
/**
 * One-shot: espelha assinaturas Stripe do site (metadata.source=marketing-site)
 * em public.public_supporters.
 *
 * Uso:
 *   SUPABASE_URL=... \
 *   SUPABASE_SERVICE_ROLE_KEY=... \
 *   STRIPE_SECRET_KEY=... \
 *   node scripts/backfill-public-supporters.mjs
 *
 * Opcionais (para mapear price id → plan quando metadata.support_plan ausente):
 *   STRIPE_PRICE_SUPPORT_10 / _20 / _50 / _100
 */

import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const stripeKey = process.env.STRIPE_SECRET_KEY

if (!url || !serviceKey) {
  console.error(
    'Defina SUPABASE_URL (ou VITE_SUPABASE_URL) e SUPABASE_SERVICE_ROLE_KEY.',
  )
  process.exit(1)
}

if (!stripeKey) {
  console.error('Defina STRIPE_SECRET_KEY.')
  process.exit(1)
}

const PLAN_KEYS = new Set([
  'support_10',
  'support_20',
  'support_50',
  'support_100',
])

const priceToPlan = new Map(
  [
    [process.env.STRIPE_PRICE_SUPPORT_10, 'support_10'],
    [process.env.STRIPE_PRICE_SUPPORT_20, 'support_20'],
    [process.env.STRIPE_PRICE_SUPPORT_50, 'support_50'],
    [process.env.STRIPE_PRICE_SUPPORT_100, 'support_100'],
  ].filter(([priceId]) => Boolean(priceId)),
)

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

function statusFromStripe(status) {
  switch (status) {
    case 'active':
    case 'trialing':
      return 'active'
    case 'past_due':
    case 'unpaid':
      return 'grace'
    case 'canceled':
      return 'canceled'
    case 'incomplete_expired':
      return 'expired'
    default:
      return 'active'
  }
}

function planFromSubscription(sub) {
  const fromMeta = sub.metadata?.support_plan
  if (fromMeta && PLAN_KEYS.has(fromMeta)) return fromMeta
  const priceId = sub.items?.data?.[0]?.price?.id
  if (priceId && priceToPlan.has(priceId)) return priceToPlan.get(priceId)
  return null
}

async function stripeGet(path) {
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    headers: {
      Authorization: `Bearer ${stripeKey}`,
    },
  })
  const body = await res.json()
  if (!res.ok) {
    throw new Error(
      body?.error?.message || `Stripe GET ${path} failed (${res.status})`,
    )
  }
  return body
}

async function listMarketingSubscriptions() {
  const out = []
  let startingAfter = null
  for (;;) {
    const params = new URLSearchParams({
      limit: '100',
      status: 'all',
      'expand[]': 'data.customer',
    })
    if (startingAfter) params.set('starting_after', startingAfter)
    const page = await stripeGet(`/subscriptions?${params}`)
    for (const sub of page.data ?? []) {
      if (sub.metadata?.source === 'marketing-site') {
        out.push(sub)
      }
    }
    if (!page.has_more || !page.data?.length) break
    startingAfter = page.data[page.data.length - 1].id
  }
  return out
}

function customerFields(customer) {
  if (!customer || typeof customer === 'string') {
    return { id: customer ?? null, email: null, full_name: null }
  }
  if (customer.deleted) {
    return { id: customer.id, email: null, full_name: null }
  }
  return {
    id: customer.id,
    email: customer.email ?? null,
    full_name: customer.name ?? null,
  }
}

async function main() {
  const subscriptions = await listMarketingSubscriptions()
  console.log(
    `Encontradas ${subscriptions.length} assinatura(s) marketing-site.`,
  )

  let upserted = 0
  let skipped = 0

  for (const sub of subscriptions) {
    const customer = customerFields(sub.customer)
    if (!customer.id) {
      console.warn(`Skip ${sub.id}: sem customer`)
      skipped += 1
      continue
    }

    // Only mirror statuses that admin cares about + canceled/expired for accuracy
    const supporterStatus =
      sub.status === 'canceled' || sub.ended_at
        ? 'expired'
        : statusFromStripe(sub.status)

    const row = {
      stripe_customer_id: customer.id,
      stripe_subscription_id: sub.id,
      email: customer.email,
      full_name: customer.full_name,
      supporter_product_id: planFromSubscription(sub),
      supporter_status: supporterStatus,
      supporter_store: 'stripe',
      supporter_expires_at: sub.current_period_end
        ? new Date(sub.current_period_end * 1000).toISOString()
        : null,
      supporter_updated_at: new Date().toISOString(),
    }

    const { error } = await admin
      .from('public_supporters')
      .upsert(row, { onConflict: 'stripe_customer_id' })

    if (error) {
      console.error(`Falha upsert ${sub.id} (${customer.id}):`, error.message)
      skipped += 1
      continue
    }

    upserted += 1
    console.log(
      `OK ${sub.id} → ${customer.email ?? customer.id} [${supporterStatus}] ${row.supporter_product_id ?? '—'}`,
    )
  }

  console.log(`Concluído: ${upserted} upsert(s), ${skipped} skip(s).`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
