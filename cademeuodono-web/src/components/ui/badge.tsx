import React from 'react'
import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'lost' | 'found' | 'success' | 'warning' | 'info' | 'danger'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const variants: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-700',
  lost:    'bg-rose-100 text-rose-700',
  found:   'bg-emerald-100 text-emerald-700',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  info:    'bg-sky-100 text-sky-700',
  danger:  'bg-rose-100 text-rose-700',
}

export function Badge({ variant = 'default', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}
