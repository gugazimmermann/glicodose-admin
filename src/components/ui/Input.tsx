import type { InputHTMLAttributes, ReactNode } from 'react'

export const controlClass =
  'box-border w-full min-w-0 max-w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:opacity-60'

type LabelProps = {
  children: ReactNode
  htmlFor?: string
  hint?: string
  className?: string
}

export function Label({
  children,
  htmlFor,
  hint,
  className = '',
}: LabelProps) {
  return (
    <label htmlFor={htmlFor} className={`block ${className}`.trim()}>
      <span className="mb-1.5 block text-sm font-medium text-ink">
        {children}
        {hint ? (
          <span className="ml-1 font-normal text-muted">({hint})</span>
        ) : null}
      </span>
    </label>
  )
}

type InputProps = InputHTMLAttributes<HTMLInputElement>

export function Input({ className = '', ...props }: InputProps) {
  return (
    <input
      className={[controlClass, className].filter(Boolean).join(' ')}
      {...props}
    />
  )
}
