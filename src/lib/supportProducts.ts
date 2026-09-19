export const SUPPORT_PLAN_KEYS = [
  'support_10',
  'support_20',
  'support_50',
  'support_100',
] as const

export type SupportPlanKey = (typeof SUPPORT_PLAN_KEYS)[number]

export const FALLBACK_MONTHLY_BRL: Record<SupportPlanKey, number> = {
  support_10: 10,
  support_20: 20,
  support_50: 50,
  support_100: 100,
}

export const SUPPORT_PLAN_LABELS: Record<SupportPlanKey, string> = {
  support_10: 'GlicoDose 10',
  support_20: 'GlicoDose 20',
  support_50: 'GlicoDose 50',
  support_100: 'GlicoDose 100',
}

export function isSupportPlanKey(value: string): value is SupportPlanKey {
  return (SUPPORT_PLAN_KEYS as readonly string[]).includes(value)
}

export function displayPlanName(productId: string | null | undefined): string {
  if (!productId || !isSupportPlanKey(productId)) {
    return productId ?? '—'
  }
  return SUPPORT_PLAN_LABELS[productId]
}

export function formatMonthlyBrl(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function statusLabel(status: string): string {
  switch (status) {
    case 'active':
      return 'Ativo'
    case 'grace':
      return 'Em carência'
    case 'canceled':
      return 'Cancelado'
    case 'expired':
      return 'Expirado'
    default:
      return status
  }
}
