import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { AdminAiStats } from '../types/database'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'
import { Skeleton } from '../components/ui/Spinner'
import { StatTile } from '../components/ui/StatTile'
import { controlClass } from '../components/ui/Input'

function formatUsd(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(value)
}

export function AiUsagePage() {
  const [days, setDays] = useState(30)
  const [stats, setStats] = useState<AdminAiStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: rpcError } = await supabase.rpc('get_admin_ai_stats', {
        days,
      })
      if (rpcError) throw rpcError
      setStats(data as AdminAiStats)
    } catch (err) {
      setStats(null)
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível carregar métricas de IA.',
      )
    } finally {
      setLoading(false)
    }
  }, [days])

  useEffect(() => {
    void load()
  }, [load])

  const totals = stats?.totals

  return (
    <div className="space-y-6">
      <PageHeader
        title="Uso de IA"
        description="Chamadas OpenAI, erros, latência e custo estimado (observabilidade)."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={String(days)}
              onChange={(e) => setDays(Number(e.target.value))}
              className={`${controlClass} w-auto py-2`}
            >
              <option value="7">7 dias</option>
              <option value="30">30 dias</option>
              <option value="90">90 dias</option>
            </select>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void load()}
              disabled={loading}
            >
              Atualizar
            </Button>
          </div>
        }
      />

      {error ? (
        <Alert variant="error" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      ) : null}

      {loading && !stats ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : totals ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="Chamadas" value={String(totals.calls)} />
          <StatTile label="Erros" value={String(totals.errors)} />
          <StatTile
            label="Tokens"
            value={String(totals.total_tokens)}
            hint={`${totals.prompt_tokens} in · ${totals.completion_tokens} out`}
          />
          <StatTile
            label="Custo estimado"
            value={formatUsd(Number(totals.estimated_cost_usd) || 0)}
            hint={
              totals.avg_latency_ms != null
                ? `Latência média ${totals.avg_latency_ms} ms`
                : undefined
            }
          />
        </div>
      ) : null}

      <Card padded={false}>
        <div className="border-b border-line px-5 py-4 sm:px-6">
          <h2 className="text-base font-semibold text-ink">Por função</h2>
          <p className="mt-0.5 text-sm text-muted">
            recommend-insulin, analyze-patient-history, etc.
          </p>
        </div>
        {loading && !stats ? (
          <div className="space-y-3 p-5 sm:p-6">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        ) : !stats || stats.by_function.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted sm:px-6">
            Nenhum log de IA no período. Rode as Edge Functions após aplicar a
            migration 012.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-brand-softer/40 text-xs font-semibold uppercase tracking-wide text-muted">
                  <th className="px-5 py-3 sm:px-6">Função</th>
                  <th className="px-3 py-3 text-right">Chamadas</th>
                  <th className="px-3 py-3 text-right">Erros</th>
                  <th className="px-3 py-3 text-right">Tokens</th>
                  <th className="px-3 py-3 text-right">Custo</th>
                  <th className="px-5 py-3 text-right sm:px-6">Latência</th>
                </tr>
              </thead>
              <tbody>
                {stats.by_function.map((row) => (
                  <tr
                    key={row.function_name}
                    className="border-b border-line/70 last:border-0"
                  >
                    <td className="px-5 py-3 font-medium text-ink sm:px-6">
                      {row.function_name}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      {row.calls}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      {row.errors}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      {row.total_tokens}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      {formatUsd(Number(row.estimated_cost_usd) || 0)}
                    </td>
                    <td className="px-5 py-3 text-right text-muted sm:px-6">
                      {row.avg_latency_ms != null
                        ? `${row.avg_latency_ms} ms`
                        : '—'}
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
