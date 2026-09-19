import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { BrandLogo } from './BrandLogo'
import { Button } from './ui/Button'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'rounded-lg px-3 py-1.5 text-sm font-medium no-underline transition',
    isActive
      ? 'bg-brand-soft text-brand-dark'
      : 'text-muted hover:bg-card hover:text-ink',
  ].join(' ')

function MainNav({ className = '' }: { className?: string }) {
  return (
    <nav
      className={`flex flex-wrap gap-1 ${className}`.trim()}
      aria-label="Principal"
    >
      <NavLink to="/" end className={navLinkClass}>
        Visão geral
      </NavLink>
      <NavLink to="/doacoes" className={navLinkClass}>
        Doações
      </NavLink>
    </nav>
  )
}

export function AppHeader() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-card/90 backdrop-blur-md">
      <div className="mx-auto w-full max-w-6xl px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <Link
            to="/"
            className="group flex min-w-0 flex-1 items-center gap-3 no-underline lg:flex-none lg:max-w-xs"
          >
            <BrandLogo size={40} className="shrink-0 shadow-sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight text-ink group-hover:text-brand-dark sm:text-base">
                GlicoDose Admin
              </p>
              <p className="truncate text-xs text-muted">{user?.email}</p>
            </div>
          </Link>

          <MainNav className="hidden lg:flex" />

          <Button
            variant="secondary"
            size="sm"
            className="shrink-0"
            onClick={() => void handleSignOut()}
          >
            Sair
          </Button>
        </div>

        <MainNav className="mt-3 lg:hidden" />
      </div>
    </header>
  )
}
