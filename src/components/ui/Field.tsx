import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'

const FIELD_CLASS =
  'w-full rounded-xl border border-edge bg-raised px-3.5 text-sm text-ink placeholder:text-faint transition focus:border-accent focus:outline-none disabled:opacity-50'

interface FieldShellProps {
  label?: string
  error?: string | null
  hint?: string
  /** Unit or other suffix rendered inside the input on the right. */
  suffix?: ReactNode
  children: (id: string, invalid: boolean) => ReactNode
}

function FieldShell({ label, error, hint, suffix, children }: FieldShellProps) {
  const id = useId()
  const invalid = Boolean(error)
  return (
    <div className="min-w-0">
      {label ? (
        <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-soft">
          {label}
        </label>
      ) : null}
      <div className="relative">
        {children(id, invalid)}
        {suffix ? (
          <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-xs font-medium text-faint">
            {suffix}
          </span>
        ) : null}
      </div>
      {error ? (
        <p className="mt-1.5 text-xs text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-faint">{hint}</p>
      ) : null}
    </div>
  )
}

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string | null
  hint?: string
  suffix?: ReactNode
}

export function TextField({ label, error, hint, suffix, className = '', ...rest }: TextFieldProps) {
  return (
    <FieldShell label={label} error={error} hint={hint} suffix={suffix}>
      {(id, invalid) => (
        <input
          id={id}
          aria-invalid={invalid || undefined}
          className={`${FIELD_CLASS} h-10 ${invalid ? 'border-danger' : ''} ${suffix ? 'pr-12' : ''} ${className}`}
          {...rest}
        />
      )}
    </FieldShell>
  )
}

export interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string | null
  hint?: string
}

export function SelectField({ label, error, hint, className = '', children, ...rest }: SelectFieldProps) {
  return (
    <FieldShell label={label} error={error} hint={hint}>
      {(id, invalid) => (
        <select
          id={id}
          aria-invalid={invalid || undefined}
          className={`${FIELD_CLASS} h-10 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23889%22%20stroke-width%3D%222.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22/%3E%3C/svg%3E')] bg-[length:12px] bg-[position:right_0.875rem_center] bg-no-repeat pr-9 ${invalid ? 'border-danger' : ''} ${className}`}
          {...rest}
        >
          {children}
        </select>
      )}
    </FieldShell>
  )
}

export interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string | null
  hint?: string
}

export function TextAreaField({ label, error, hint, className = '', ...rest }: TextAreaFieldProps) {
  return (
    <FieldShell label={label} error={error} hint={hint}>
      {(id, invalid) => (
        <textarea
          id={id}
          aria-invalid={invalid || undefined}
          className={`${FIELD_CLASS} min-h-20 py-2.5 ${invalid ? 'border-danger' : ''} ${className}`}
          {...rest}
        />
      )}
    </FieldShell>
  )
}
