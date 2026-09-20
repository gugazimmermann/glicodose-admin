import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  displayPlanName,
  formatMonthlyBrl,
  statusLabel,
} from '../lib/supportProducts'
import type { AdminDonationStats } from '../types/database'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'
import { SegmentedControl } from '../components/ui/SegmentedControl'
import { Skeleton } from '../components/ui/Spinner'
import { StatTile } from '../components/ui/StatTile'

type Tab = 'total' | 'doctors' | 'patients'

function formatUpdatedAt(value: string | null): string {
  if (!value) return '—'
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(value))
  } catch {
    return '—'
  }
}

export function DonationsPage() {
  const [tab, setTab] = useState<Tab>('total')
  const [stats, setStats] = useState<AdminDonationStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: rpcError } = await supabase.rpc(
        'get_admin_donation_stats',
      )
      if (rpcError) throw rpcError
      setStats(data as AdminDonationStats)
    } catch (err) {
      setStats(null)
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível carregar as doações.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const summary = useMemo(() => {
    if (!stats) return null
    if (tab === 'doctors') return stats.doctors
    if (tab === 'patients') return stats.patients
    return {
      active_count: stats.total.active_count,
      monthly_brl: stats.total.monthly_brl,
      supporters: [
        ...stats.doctors.supporters,
        ...stats.patients.supporters,
      ],
    }
  }, [stats, tab])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Doações"
        description="Assinaturas ativas de apoio: Stripe (médicos) e RevenueCat (pacientes)."
        action={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void load()}
            disabled={loading}
          >
            Atualizar
          </Button>
        }
      />

      <SegmentedControl
        variant="pills"
        ariaLabel="Segmento de doações"
        value={tab}
        onChange={setTab}
        items={[
          { value: 'total', label: 'Total' },
          { value: 'doctors', label: 'Médicos' },
          { value: 'patients', label: 'Pacientes' },
        ]}
      />

      {error ? (
        <Alert variant="error" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      ) : null}

      {loading && !stats ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : summary ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <StatTile
            label="Apoiadores ativos"
            value={String(summary.active_count)}
          />
          <StatTile
            label="MRR estimado"
            value={formatMonthlyBrl(summary.monthly_brl)}
            hint="Soma mensal dos planos ativos"
          />
        </div>
      ) : null}

      {tab === 'total' ? (
        <Alert variant="info">
          O total soma apoiadores médicos (Stripe) e pacientes (RevenueCat /
          lojas).
        </Alert>
      ) : null}

      <Card padded={false}>
        <div className="border-b border-line px-5 py-4 sm:px-6">
          <h2 className="text-base font-semibold text-ink">
            {tab === 'patients'
              ? 'Apoiadores pacientes'
              : tab === 'doctors'
                ? 'Apoiadores médicos'
                : 'Apoiadores (todos)'}
          </h2>
          <p className="mt-0.5 text-sm text-muted">
            {tab === 'patients'
              ? 'Planos ativos ou em carência via RevenueCat'
              : tab === 'doctors'
                ? 'Planos Stripe ativos ou em carência'
                : 'Médicos (Stripe) e pacientes (RevenueCat)'}
          </p>
        </div>

        {loading && !stats ? (
          <div className="space-y-3 p-5 sm:p-6">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        ) : !summary || summary.supporters.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted sm:px-6">
            Nenhum apoiador ativo no momento.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-brand-softer/40 text-xs font-semibold uppercase tracking-wide text-muted">
                  <th className="px-5 py-3 sm:px-6">Nome</th>
                  <th className="px-3 py-3">Plano</th>
                  <th className="px-3 py-3 text-right">R$/mês</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-5 py-3 text-right sm:px-6">Atualizado</th>
                </tr>
              </thead>
              <tbody>
                {summary.supporters.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-line/70 last:border-0"
                  >
                    <td className="px-5 py-3 font-medium text-ink sm:px-6">
                      {row.full_name || '—'}
                    </td>
                    <td className="px-3 py-3 text-muted">
                      {displayPlanName(row.product_id)}
                    </td>
                    <td className="px-3 py-3 text-right font-semibold tabular-nums text-ink">
                      {formatMonthlyBrl(row.monthly_brl)}
                    </td>
                    <td className="px-3 py-3 text-muted">
                      {statusLabel(row.status)}
                    </td>
                    <td className="px-5 py-3 text-right text-muted sm:px-6">
                      {formatUpdatedAt(row.updated_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
