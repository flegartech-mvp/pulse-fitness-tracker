import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'danger-soft'
type Size = 'sm' | 'md' | 'lg'

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-accent text-on-accent font-semibold hover:bg-accent-strong active:scale-[0.98] shadow-card',
  secondary:
    'border border-edge bg-raised text-ink hover:border-edge-strong hover:bg-surface active:scale-[0.98]',
  ghost: 'text-soft hover:bg-raised hover:text-ink active:scale-[0.98]',
  danger: 'bg-danger font-semibold text-white hover:opacity-90 active:scale-[0.98]',
  'danger-soft':
    'border border-danger/30 text-danger hover:bg-danger/10 active:scale-[0.98]',
}

const SIZES: Record<Size, string> = {
  sm: 'h-8 gap-1.5 rounded-lg px-3 text-xs',
  md: 'h-10 gap-2 rounded-xl px-4 text-sm',
  lg: 'h-12 gap-2 rounded-xl px-5 text-base',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  children?: ReactNode
}

export function Button({ variant = 'secondary', size = 'md', className = '', type = 'button', ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex shrink-0 items-center justify-center font-medium transition disabled:pointer-events-none disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...rest}
    />
  )
}

/** Square icon-only button; always give it an aria-label. */
export function IconButton({
  size = 'md',
  variant = 'ghost',
  className = '',
  ...rest
}: ButtonProps & { 'aria-label': string }) {
  const square = size === 'sm' ? 'w-8 px-0' : size === 'lg' ? 'w-12 px-0' : 'w-10 px-0'
  return <Button size={size} variant={variant} className={`${square} ${className}`} {...rest} />
}
