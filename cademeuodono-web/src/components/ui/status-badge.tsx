import { cn } from '@/lib/utils'

export type PetStatus =
  | 'lost'
  | 'found'
  | 'returned'
  | 'for_adoption'
  | 'adopted'
  | 'petmatch'
  | 'foster_urgent'

const STATUS_CONFIG: Record<
  PetStatus,
  { label: string; className: string }
> = {
  lost:         { label: '🚨 Pet está perdido',              className: 'bg-blue-100 text-blue-700' },
  found:        { label: '📢 Pet encontrado',                className: 'bg-amber-100 text-amber-700' },
  returned:     { label: '🌟 Pet devolvido ao tutor ✅',     className: 'bg-emerald-100 text-emerald-700' },
  for_adoption: { label: '🏡 Disponível para adoção',        className: 'bg-pink-100 text-pink-700' },
  adopted:      { label: '🏡 Adoção realizada ❤️',          className: 'bg-emerald-100 text-emerald-700' },
  petmatch:     { label: '💘 Disponível no PetMatch',        className: 'bg-purple-100 text-purple-700' },
  foster_urgent:{ label: '⚠️ Em busca de lar temporário',    className: 'bg-orange-100 text-orange-700' },
}

interface StatusBadgeProps {
  status: PetStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  )
}
