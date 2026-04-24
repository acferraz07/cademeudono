'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { petsApi } from '@/lib/api'
import { Spinner } from '@/components/ui/spinner'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/status-badge'
import { calculatePetAge, SPECIES_LABEL, SIZE_LABEL } from '@/lib/utils'
import type { Pet } from '@/types'

const SPECIES_EMOJI: Record<string, string> = { DOG: '🐕', CAT: '🐈', OTHER: '🐾' }

function AdoptionCard({ pet }: { pet: Pet }) {
  const photo = pet.profilePhotoUrl ?? pet.media?.[0]?.url
  const phone = (pet as any).owner?.phonePrimary ?? ''

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col">
      <div className="relative h-44 bg-gradient-to-br from-pink-50 to-rose-100">
        {photo ? (
          <Image src={photo} alt={pet.name} fill className="object-cover" unoptimized />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl">{SPECIES_EMOJI[pet.species] ?? '🐾'}</span>
          </div>
        )}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {pet.isOng && (
            <Badge variant="success" className="text-[10px]">🟢 ONG</Badge>
          )}
          {pet.adoptionUrgency === 'urgent' && (
            <Badge variant="danger" className="text-[10px]">⚠️ Urgente</Badge>
          )}
          {pet.isInFosterHome && (
            <Badge variant="warning" className="text-[10px]">🏠 Lar temp.</Badge>
          )}
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col gap-3">
        <div>
          <h3 className="font-semibold text-gray-900">{pet.name}</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {SPECIES_LABEL[pet.species]}
            {pet.breed ? ` · ${pet.breed}` : ''}
            {pet.size ? ` · ${SIZE_LABEL[pet.size]}` : ''}
          </p>
          {pet.birthDate && (
            <p className="text-xs text-gray-400 mt-0.5">{calculatePetAge(pet.birthDate)}</p>
          )}
          {(pet as any).owner?.city && (
            <p className="text-xs text-gray-400 mt-0.5">
              📍 {(pet as any).owner.city}
              {(pet as any).owner.state ? `/${(pet as any).owner.state}` : ''}
            </p>
          )}
        </div>

        {pet.adoptionStory && (
          <p className="text-xs text-gray-600 line-clamp-2">{pet.adoptionStory}</p>
        )}

        {pet.adoptionRequirements && (
          <div className="text-xs text-gray-500 bg-gray-50 rounded-lg px-2 py-1.5">
            <span className="font-medium">Requisitos: </span>{pet.adoptionRequirements}
          </div>
        )}

        <div className="mt-auto pt-2">
          <StatusBadge status="for_adoption" className="mb-3 w-full justify-center" />
          {phone && (
            <a
              href={`https://wa.me/55${phone.replace(/\D/g, '')}?text=Ol%C3%A1%21+Vi+o+${encodeURIComponent(pet.name)}+disponível+para+adoção+no+Cadê+Meu+Dono+e+gostaria+de+saber+mais.`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition-colors"
            >
              💬 Entrar em contato
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AdocaoPage() {
  const [pets, setPets] = useState<Pet[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    petsApi.findForAdoption()
      .then(setPets)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🏡 Adoção responsável</h1>
          <p className="text-sm text-gray-500 mt-1">Pets esperando por um lar cheio de amor</p>
        </div>
        <Link
          href="/adocao/adotados"
          className="text-sm text-brand-600 hover:underline font-medium"
        >
          Ver adotados →
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : pets.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-4">🏡</p>
          <p className="font-medium text-gray-600">Nenhum pet disponível para adoção no momento</p>
          <p className="text-sm mt-2">
            Tem um pet para adotar?{' '}
            <Link href="/pets" className="text-brand-600 hover:underline">
              Cadastre em Meus Pets
            </Link>
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pets.map((p) => (
            <AdoptionCard key={p.id} pet={p} />
          ))}
        </div>
      )}
    </div>
  )
}
