'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { petsApi } from '@/lib/api'
import { Spinner } from '@/components/ui/spinner'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/status-badge'
import { calculatePetAge, SPECIES_LABEL, SIZE_LABEL, SEX_LABEL } from '@/lib/utils'
import type { Pet } from '@/types'

const SPECIES_EMOJI: Record<string, string> = { DOG: '🐕', CAT: '🐈', OTHER: '🐾' }

function PetMatchCard({ pet }: { pet: Pet }) {
  const photo = pet.profilePhotoUrl ?? pet.media?.[0]?.url
  const phone = (pet as any).owner?.phonePrimary ?? ''

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col">
      <div className="relative h-44 bg-gradient-to-br from-purple-50 to-violet-100">
        {photo ? (
          <Image src={photo} alt={pet.name} fill className="object-cover" unoptimized />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl">{SPECIES_EMOJI[pet.species] ?? '🐾'}</span>
          </div>
        )}
        <div className="absolute top-2 right-2">
          <StatusBadge status="petmatch" />
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col gap-3">
        <div>
          <h3 className="font-semibold text-gray-900">{pet.name}</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {SPECIES_LABEL[pet.species]}
            {pet.breed ? ` · ${pet.breed}` : ''}
          </p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {pet.size && (
              <Badge variant="default" className="text-[10px]">{SIZE_LABEL[pet.size]}</Badge>
            )}
            {pet.sex && (
              <Badge variant="info" className="text-[10px]">{SEX_LABEL[pet.sex]}</Badge>
            )}
            {pet.isCastrated && (
              <Badge variant="success" className="text-[10px]">Castrado</Badge>
            )}
            {pet.acceptsCrossbreeding && (
              <Badge variant="warning" className="text-[10px]">Aceita cruzamento</Badge>
            )}
          </div>
          {pet.birthDate && (
            <p className="text-xs text-gray-400 mt-1">{calculatePetAge(pet.birthDate)}</p>
          )}
          {(pet as any).owner?.city && (
            <p className="text-xs text-gray-400">
              📍 {(pet as any).owner.city}
              {(pet as any).owner.state ? `/${(pet as any).owner.state}` : ''}
            </p>
          )}
        </div>

        {pet.petMatchObjective && (
          <p className="text-xs text-gray-600 line-clamp-2">{pet.petMatchObjective}</p>
        )}

        {pet.petMatchPreferences && (
          <div className="text-xs text-gray-500 bg-purple-50 rounded-lg px-2 py-1.5">
            <span className="font-medium">Preferências: </span>{pet.petMatchPreferences}
          </div>
        )}

        <div className="mt-auto pt-2">
          {phone && (
            <a
              href={`https://wa.me/55${phone.replace(/\D/g, '')}?text=Ol%C3%A1%21+Vi+o+${encodeURIComponent(pet.name)}+no+PetMatch+do+Cadê+Meu+Dono+e+gostaria+de+conversar+sobre+um+possível+encontro.`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium transition-colors"
            >
              💬 Entrar em contato
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

export default function PetMatchPage() {
  const [pets, setPets] = useState<Pet[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    petsApi.findForPetMatch()
      .then(setPets)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">💘 PetMatch</h1>
        <p className="text-sm text-gray-500 mt-1">Conexões responsáveis entre pets</p>
      </div>

      <div className="bg-purple-50 border border-purple-200 rounded-2xl px-4 py-3 mb-6 text-sm text-purple-700">
        O PetMatch tem como objetivo promover conexões responsáveis entre pets. Recomendamos que todos os encontros sejam supervisionados e que a saúde e o bem-estar dos animais sejam sempre prioridade.
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : pets.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-4">💘</p>
          <p className="font-medium text-gray-600">Nenhum pet no PetMatch no momento</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pets.map((p) => (
            <PetMatchCard key={p.id} pet={p} />
          ))}
        </div>
      )}
    </div>
  )
}
