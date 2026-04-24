import { forwardRef } from 'react'
import React from 'react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
type Size = 'sm' | 'md' | 'lg'

const variantStyles: Record<Variant, string> = {
  primary:
    'bg-brand-500 text-white hover:bg-brand-600 focus-visible:ring-brand-500 shadow-sm',
  secondary:
    'bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:ring-gray-400',
  ghost:
    'bg-transparent text-gray-600 hover:bg-gray-100 focus-visible:ring-gray-400',
  danger:
    'bg-rose-500 text-white hover:bg-rose-600 focus-visible:ring-rose-500 shadow-sm',
  outline:
    'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus-visible:ring-gray-400',
}

const sizeStyles: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm rounded-lg gap-1.5',
  md: 'h-10 px-4 text-sm rounded-xl gap-2',
  lg: 'h-12 px-6 text-base rounded-xl gap-2',
}

export function buttonVariants({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
}: {
  variant?: Variant
  size?: Size
  fullWidth?: boolean
  className?: string
} = {}) {
  return cn(
    'inline-flex items-center justify-center font-medium transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    variantStyles[variant],
    sizeStyles[size],
    fullWidth && 'w-full',
    className,
  )
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  fullWidth?: boolean
  /** Passa os estilos do botão para o filho direto (útil com Link do Next.js) */
  asChild?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      asChild = false,
      className,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const classes = buttonVariants({ variant, size, fullWidth, className })

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<React.HTMLAttributes<HTMLElement>>, {
        className: cn(classes, (children.props as React.HTMLAttributes<HTMLElement>).className),
      })
    }

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={classes}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        )}
        {children}
      </button>
    )
  },
)
Button.displayName = 'Button'
