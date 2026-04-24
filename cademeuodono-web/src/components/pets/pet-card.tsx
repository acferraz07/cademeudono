import Image from 'next/image'
import Link from 'next/link'
import { PawPrint, Edit, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SPECIES_LABEL, SIZE_LABEL, SEX_LABEL, calculatePetAge } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import type { Pet } from '@/types'

const SPECIES_EMOJI: Record<string, string> = {
  DOG: '🐕',
  CAT: '🐈',
  OTHER: '🐾',
}

interface PetCardProps {
  pet: Pet
  onDelete?: (id: string) => void
}

export function PetCard({ pet, onDelete }: PetCardProps) {
  const hasTag = pet.smartTags?.some((t) => t.status === 'ACTIVE')

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
      {/* Photo */}
      <div className="relative h-40 bg-gradient-to-br from-brand-50 to-amber-100">
        {pet.profilePhotoUrl || pet.media?.[0]?.url ? (
          <Image
            src={(pet.profilePhotoUrl ?? pet.media?.[0]?.url) as string}
            alt={pet.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl">{SPECIES_EMOJI[pet.species] ?? '🐾'}</span>
          </div>
        )}

        <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
          {pet.isLost && (
            <Badge variant="danger" className="text-[10px]">
              🚨 Perdido
            </Badge>
          )}
          {pet.isUrgent && !pet.isLost && (
            <Badge variant="danger" className="text-[10px]">
              ⚠️ Urgente
            </Badge>
          )}
          {hasTag && (
            <Badge variant="success" className="text-[10px]">
              🏷 Tag ativa
            </Badge>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{pet.name}</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {SPECIES_LABEL[pet.species]}
              {pet.breed ? ` · ${pet.breed}` : ''}
            </p>
            {pet.birthDate && (
              <p className="text-xs text-gray-400 mt-0.5">{calculatePetAge(pet.birthDate)}</p>
            )}
            {!pet.birthDate && pet.ageEstimate && (
              <p className="text-xs text-gray-400 mt-0.5">{pet.ageEstimate}</p>
            )}
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <Link
              href={`/pets/${pet.id}/edit`}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700"
            >
              <Edit size={14} />
            </Link>
            {onDelete && (
              <button
                onClick={() => onDelete(pet.id)}
                className="p-1.5 rounded-lg hover:bg-rose-50 text-gray-400 hover:text-rose-600"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-3">
          {pet.size && (
            <Badge variant="default" className="text-[11px]">
              {SIZE_LABEL[pet.size]}
            </Badge>
          )}
          {pet.sex && (
            <Badge variant="info" className="text-[11px]">
              {SEX_LABEL[pet.sex]}
            </Badge>
          )}
          {pet.isCastrated && (
            <Badge variant="success" className="text-[11px]">
              Castrado
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
}
