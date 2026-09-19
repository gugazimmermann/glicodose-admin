import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { AdminDashboardStats } from '../types/database'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'
import { Skeleton } from '../components/ui/Spinner'
import { StatTile } from '../components/ui/StatTile'

function formatCrm(crm: string | null, crmUf: string | null): string {
  if (!crm) return '—'
  return crmUf ? `${crm}/${crmUf}` : crm
}

export function DashboardPage() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: rpcError } = await supabase.rpc(
        'get_admin_dashboard_stats',
      )
      if (rpcError) throw rpcError
      setStats(data as AdminDashboardStats)
    } catch (err) {
      setStats(null)
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível carregar as estatísticas.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Visão geral"
        description="Médicos cadastrados, pacientes no app e vínculos por médico."
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
      ) : stats ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <StatTile
            label="Médicos cadastrados"
            value={String(stats.doctors_count)}
          />
          <StatTile
            label="Pacientes no app"
            value={String(stats.patients_count)}
            hint="Perfis de pacientes (excluindo médicos e admins)"
          />
        </div>
      ) : null}

      <Card padded={false}>
        <div className="border-b border-line px-5 py-4 sm:px-6">
          <h2 className="text-base font-semibold text-ink">
            Pacientes por médico
          </h2>
          <p className="mt-0.5 text-sm text-muted">
            Quantidade de pacientes vinculados a cada médico
          </p>
        </div>

        {loading && !stats ? (
          <div className="space-y-3 p-5 sm:p-6">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        ) : !stats || stats.doctors.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted sm:px-6">
            Nenhum médico cadastrado ainda.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-brand-softer/40 text-xs font-semibold uppercase tracking-wide text-muted">
                  <th className="px-5 py-3 sm:px-6">Médico</th>
                  <th className="px-3 py-3">CRM</th>
                  <th className="px-5 py-3 text-right sm:px-6">Pacientes</th>
                </tr>
              </thead>
              <tbody>
                {stats.doctors.map((doctor) => (
                  <tr
                    key={doctor.id}
                    className="border-b border-line/70 last:border-0"
                  >
                    <td className="px-5 py-3 font-medium text-ink sm:px-6">
                      {doctor.full_name || '—'}
                    </td>
                    <td className="px-3 py-3 text-muted">
                      {formatCrm(doctor.crm, doctor.crm_uf)}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold tabular-nums text-ink sm:px-6">
                      {doctor.patient_count}
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
