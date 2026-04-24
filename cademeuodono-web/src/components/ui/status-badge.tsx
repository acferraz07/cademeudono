import { cn } from '@/lib/utils'

export type PetStatus =
  | 'lost'
  | 'found'
  | 'returned'
  | 'for_adoption'
  | 'adopted'
  | 'petmatch'
  | 'foster_urgent'

const STATUS_CONFIG: Record<PetStatus, { label: string; className: string }> = {
  lost:          { label: '🚨 Esse pet está perdido',                              className: 'bg-rose-100 text-rose-700' },
  found:         { label: '📢 Esse pet foi encontrado (procura-se tutor)',          className: 'bg-amber-100 text-amber-700' },
  returned:      { label: '🌟 Esse pet foi devolvido ao tutor',                    className: 'bg-emerald-100 text-emerald-700' },
  for_adoption:  { label: '🏡 Esse pet está disponível para adoção responsável',   className: 'bg-pink-100 text-pink-700' },
  adopted:       { label: '❤️ Esse pet teve a adoção realizada',                   className: 'bg-emerald-100 text-emerald-700' },
  petmatch:      { label: '💘 Esse pet está disponível no PetMatch',               className: 'bg-purple-100 text-purple-700' },
  foster_urgent: { label: '⚠️ Urgente: em busca de lar temporário',               className: 'bg-orange-100 text-orange-700' },
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

export function petStatusFromPet(pet: {
  isLost?: boolean
  isFound?: boolean
  isReturned?: boolean
  isForAdoption?: boolean
  isAdopted?: boolean
  isForPetMatch?: boolean
  isUrgentFoster?: boolean
}): PetStatus | null {
  if (pet.isReturned) return 'returned'
  if (pet.isAdopted) return 'adopted'
  if (pet.isLost) return 'lost'
  if (pet.isFound) return 'found'
  if (pet.isUrgentFoster) return 'foster_urgent'
  if (pet.isForAdoption) return 'for_adoption'
  if (pet.isForPetMatch) return 'petmatch'
  return null
}
