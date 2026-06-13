import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { CheckCircle2, Info, AlertTriangle, Trophy, X } from 'lucide-react'

export type ToastTone = 'success' | 'info' | 'warning' | 'record'

export interface ToastInput {
  title: string
  description?: string
  tone?: ToastTone
}

interface Toast extends ToastInput {
  id: number
  leaving?: boolean
}

interface ToastApi {
  toast: (input: ToastInput) => void
}

const ToastContext = createContext<ToastApi | null>(null)

const TONE_ICON: Record<ToastTone, typeof Info> = {
  success: CheckCircle2,
  info: Info,
  warning: AlertTriangle,
  record: Trophy,
}

const TONE_CLASS: Record<ToastTone, string> = {
  success: 'text-success',
  info: 'text-sky',
  warning: 'text-warning',
  record: 'text-accent',
}

const AUTO_DISMISS_MS = 4200

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(1)

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.map((t) => (t.id === id ? { ...t, leaving: true } : t)))
    window.setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 200)
  }, [])

  const toast = useCallback(
    (input: ToastInput) => {
      const id = nextId.current++
      setToasts((list) => [...list.slice(-3), { ...input, id }])
      window.setTimeout(() => dismiss(id), AUTO_DISMISS_MS)
    },
    [dismiss],
  )

  const api = useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-20 z-60 flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:items-end sm:px-6"
      >
        {toasts.map((t) => {
          const Icon = TONE_ICON[t.tone ?? 'info']
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-edge bg-raised/95 p-3.5 shadow-pop backdrop-blur transition-all duration-200 ${
                t.leaving ? 'translate-y-1 opacity-0' : 'animate-toast-in'
              }`}
            >
              <Icon className={`mt-0.5 size-5 shrink-0 ${TONE_CLASS[t.tone ?? 'info']}`} aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">{t.title}</p>
                {t.description ? <p className="mt-0.5 text-sm text-soft">{t.description}</p> : null}
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="rounded-md p-1 text-faint transition hover:text-ink"
                aria-label="Dismiss notification"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}
