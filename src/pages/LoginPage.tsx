import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { BrandLogo } from '../components/BrandLogo'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input, Label } from '../components/ui/Input'
import { FullPageSpinner } from '../components/ui/Spinner'

function formatAuthError(err: unknown): string {
  if (!(err instanceof Error)) return 'Algo deu errado. Tente novamente.'
  const msg = err.message.toLowerCase()
  if (msg.includes('invalid login')) return 'E-mail ou senha incorretos.'
  if (msg.includes('password')) return 'A senha precisa ter pelo menos 6 caracteres.'
  return err.message
}

export function LoginPage() {
  const {
    session,
    isAdmin,
    loading,
    signIn,
    authError,
    clearAuthError,
  } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (loading) {
    return <FullPageSpinner />
  }

  if (session && isAdmin) {
    return <Navigate to="/" replace />
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    clearAuthError()
    setSubmitting(true)
    try {
      await signIn(email.trim(), password)
    } catch (err) {
      setError(formatAuthError(err))
    } finally {
      setSubmitting(false)
    }
  }

  const displayError = error ?? authError

  return (
    <div className="flex min-h-screen max-w-full items-center justify-center overflow-x-hidden px-4 py-10">
      <div className="w-full min-w-0 max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 w-fit">
            <BrandLogo size={80} className="shadow-lg ring-4 ring-white/70" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-ink">
            GlicoDose Admin
          </h1>
          <p className="mt-2 text-sm text-muted">
            Painel interno de métricas do app
          </p>
        </div>

        <Card className="sm:p-8">
          {displayError ? (
            <Alert
              variant="error"
              className="mb-4"
              onDismiss={() => {
                setError(null)
                clearAuthError()
              }}
            >
              {displayError}
            </Alert>
          ) : null}

          <form className="space-y-4" onSubmit={(e) => void onSubmit(e)}>
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={submitting}
            >
              {submitting ? 'Entrando…' : 'Entrar'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
